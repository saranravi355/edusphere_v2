import { Agent, setGlobalDispatcher } from 'undici';
import type { OcrPage } from './types';

const JOB_URL = 'https://paddleocr.aistudio-app.com/api/v2/ocr/jobs';
const MODEL = 'PaddleOCR-VL-1.6';
const POLL_INTERVAL_MS = 5000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

/** PaddleOCR's host takes noticeably longer than most APIs just to establish a connection
 *  (observed 5-11s+ from some networks) - well past undici's default 10s connect timeout,
 *  which made every request here fail with a generic "fetch failed" / ConnectTimeoutError
 *  before the request was ever actually sent, even though the host was reachable.
 *  setGlobalDispatcher is process-wide (every fetch() call, not just this module's), but
 *  raising only the CONNECT-phase timeout is low-risk generally - it can't turn a real hang
 *  into a longer hang, it only gives a slow TLS handshake more room before giving up. */
let dispatcherInstalled = false;
function ensureLongConnectTimeout() {
  if (dispatcherInstalled) return;
  setGlobalDispatcher(new Agent({ connect: { timeout: 30_000 } }));
  dispatcherInstalled = true;
}

interface SubmitJobResponse {
  data?: { jobId?: string };
  message?: string;
  errorMsg?: string;
}

interface JobStatusResponse {
  data?: {
    state?: 'pending' | 'running' | 'done' | 'failed';
    errorMsg?: string;
    resultUrl?: { jsonUrl?: string };
  };
  message?: string;
}

export interface OcrResult {
  text: string;
  pages: OcrPage[];
  /** PaddleOCR-VL-1.6's layout-parsing response carries no per-line confidence score
   *  (unlike the old PP-OCRv6 rec_scores) - always null with this model. */
  ocrConfidence: number | null;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** PaddleOCR-VL-1.6 returns one layoutParsingResults entry per page, each carrying the page's
 *  content as markdown (res.markdown.text) rather than a list of recognized lines with pixel
 *  boxes (that per-line box data is specific to the older PP-OCRv6 model and does not exist in
 *  this response - confirmed against a live response). The markdown is split into non-empty
 *  lines so the rest of the grading pipeline (which numbers lines as [L0], [L1], ... for the
 *  model to reference in annotations) keeps working the same way as before. */
function extractPageLines(ocrResult: unknown): { lines: { text: string }[]; imageUrl: string | null } | null {
  if (!ocrResult || typeof ocrResult !== 'object') return null;
  const record = ocrResult as Record<string, unknown>;
  const markdown = record.markdown;
  if (!markdown || typeof markdown !== 'object') return null;
  const markdownText = (markdown as Record<string, unknown>).text;
  if (typeof markdownText !== 'string' || !markdownText.trim()) return null;

  const lines = markdownText
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map(text => ({ text }));
  if (lines.length === 0) return null;

  // outputImages varies by response (e.g. a rendered/annotated page preview) - take whichever
  // one is offered, purely for display in the "Original file" style preview; it is never used
  // for positioning anything, since there are no pixel boxes to position against.
  const outputImages = record.outputImages;
  let imageUrl: string | null = null;
  if (outputImages && typeof outputImages === 'object') {
    const first = Object.values(outputImages as Record<string, unknown>)[0];
    if (typeof first === 'string') imageUrl = first;
  }

  return { lines, imageUrl };
}

async function fetchAsDataUrl(url: string): Promise<string | null> {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const contentType = resp.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await resp.arrayBuffer());
    return `data:${contentType};base64,${buffer.toString('base64')}`;
  } catch {
    return null;
  }
}

/** Submits a scanned PDF or image to PaddleOCR, polls until done, and returns every page's
 *  extracted text plus (where offered) a rendered preview image per page. Throws a plain Error
 *  with a message safe to show a teacher on any failure - callers decide how to surface/log it
 *  (e.g. writing it to AIGradingSubmission.errorMessage). PaddleOCR-VL-1.6 accepts PDFs and
 *  common image formats through the same "file" field, keyed off the filename/content type. */
export async function runOcr(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<OcrResult> {
  ensureLongConnectTimeout();

  const token = process.env.PADDLEOCR_ACCESS_TOKEN;
  if (!token) throw new Error('Server is missing PADDLEOCR_ACCESS_TOKEN');

  const authHeader = { Authorization: `bearer ${token}` };

  const form = new FormData();
  form.append('model', MODEL);
  form.append(
    'optionalPayload',
    JSON.stringify({ useDocOrientationClassify: false, useDocUnwarping: false, useChartRecognition: false })
  );
  form.append('file', new Blob([new Uint8Array(fileBuffer)], { type: mimeType }), fileName);

  let submitResp: Response;
  try {
    submitResp = await fetch(JOB_URL, { method: 'POST', headers: authHeader, body: form });
  } catch (err) {
    throw new Error(`Could not reach PaddleOCR: ${(err as Error).message}`);
  }

  let submitData: SubmitJobResponse;
  try {
    submitData = await submitResp.json();
  } catch {
    throw new Error('PaddleOCR job submission returned a non-JSON response');
  }

  if (!submitResp.ok) {
    throw new Error(submitData.message || submitData.errorMsg || `PaddleOCR job submission failed (status ${submitResp.status})`);
  }

  const jobId = submitData.data?.jobId;
  if (!jobId) throw new Error('PaddleOCR response did not include a jobId');

  const deadline = Date.now() + POLL_TIMEOUT_MS;
  let resultJsonUrl: string | undefined;
  // A single poll among dozens (one every 5s for up to 5 minutes) hitting a transient network
  // blip shouldn't abort a job that's otherwise on track to finish - only give up after
  // several IN A ROW fail, and reset the count on any successful poll.
  let consecutiveNetworkFailures = 0;
  const MAX_CONSECUTIVE_POLL_FAILURES = 5;

  while (Date.now() < deadline) {
    let pollResp: Response;
    try {
      pollResp = await fetch(`${JOB_URL}/${jobId}`, { headers: authHeader });
    } catch (err) {
      consecutiveNetworkFailures++;
      if (consecutiveNetworkFailures >= MAX_CONSECUTIVE_POLL_FAILURES) {
        throw new Error(`Could not poll PaddleOCR job after ${MAX_CONSECUTIVE_POLL_FAILURES} attempts: ${(err as Error).message}`);
      }
      await sleep(POLL_INTERVAL_MS);
      continue;
    }
    consecutiveNetworkFailures = 0;

    let pollData: JobStatusResponse;
    try {
      pollData = await pollResp.json();
    } catch {
      throw new Error('PaddleOCR job status returned a non-JSON response');
    }

    if (!pollResp.ok) {
      throw new Error(pollData.message || `PaddleOCR job status check failed (status ${pollResp.status})`);
    }

    const state = pollData.data?.state;
    if (state === 'done') {
      resultJsonUrl = pollData.data?.resultUrl?.jsonUrl;
      break;
    }
    if (state === 'failed') throw new Error(pollData.data?.errorMsg || 'PaddleOCR job failed');

    await sleep(POLL_INTERVAL_MS);
  }

  if (!resultJsonUrl) throw new Error('Timed out waiting for PaddleOCR job to complete');

  let jsonlResp: Response;
  try {
    jsonlResp = await fetch(resultJsonUrl);
  } catch (err) {
    throw new Error(`Could not fetch PaddleOCR result: ${(err as Error).message}`);
  }
  if (!jsonlResp.ok) throw new Error(`Could not fetch PaddleOCR result (status ${jsonlResp.status})`);

  const jsonlText = await jsonlResp.text();
  const pageResults: { lines: { text: string }[]; imageUrl: string | null }[] = [];

  for (const line of jsonlText.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      continue;
    }
    const layoutParsingResults = (parsed as { result?: { layoutParsingResults?: unknown[] } })?.result?.layoutParsingResults;
    if (!Array.isArray(layoutParsingResults)) continue;
    for (const res of layoutParsingResults) {
      const pageData = extractPageLines(res);
      if (pageData) pageResults.push(pageData);
    }
  }

  if (pageResults.length === 0) {
    throw new Error('PaddleOCR job completed but no recognized text was found in the result.');
  }

  const pages: OcrPage[] = [];
  for (const { lines, imageUrl } of pageResults) {
    const imageDataUrl = imageUrl ? await fetchAsDataUrl(imageUrl) : null;
    pages.push({ imageDataUrl: imageDataUrl ?? '', lines });
  }
  // PaddleOCR-VL-1.6 does not report a per-line/per-page confidence score.
  const ocrConfidence: number | null = null;

  const text = pages.map(p => p.lines.map(l => l.text).join('\n')).join('\n\n---\n\n');
  if (!text) throw new Error('PaddleOCR extracted pages but no line text was present');

  return { text, pages, ocrConfidence };
}
