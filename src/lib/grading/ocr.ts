import type { OcrLine, OcrPage } from './types';

const JOB_URL = 'https://paddleocr.aistudio-app.com/api/v2/ocr/jobs';
const MODEL = 'PP-OCRv6';
const POLL_INTERVAL_MS = 5000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

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
  ocrConfidence: number | null;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** PaddleX's per-page OCR result nests recognized lines under prunedResult: rec_texts[i] is
 *  the text of line i, rec_boxes[i] is its [x1,y1,x2,y2] pixel box on the page image at
 *  inputImage - confirmed against a live response, not just inferred. */
function extractPageLines(ocrResult: unknown): { lines: OcrLine[]; imageUrl: string | null; scores: number[] } | null {
  if (!ocrResult || typeof ocrResult !== 'object') return null;
  const record = ocrResult as Record<string, unknown>;
  const pruned = record.prunedResult;
  if (!pruned || typeof pruned !== 'object') return null;
  const prunedRecord = pruned as Record<string, unknown>;
  const recTexts = prunedRecord.rec_texts;
  const recBoxes = prunedRecord.rec_boxes;
  const recScores = prunedRecord.rec_scores;
  if (!Array.isArray(recTexts) || !Array.isArray(recBoxes)) return null;

  const lines: OcrLine[] = [];
  const scores: number[] = [];
  for (let i = 0; i < recTexts.length; i++) {
    const text = recTexts[i];
    const box = recBoxes[i];
    if (typeof text !== 'string' || !text.length) continue;
    if (!Array.isArray(box) || box.length !== 4 || box.some(n => typeof n !== 'number')) continue;
    lines.push({ text, box: box as [number, number, number, number] });
    const score = Array.isArray(recScores) ? recScores[i] : undefined;
    if (typeof score === 'number') scores.push(score);
  }
  if (lines.length === 0) return null;

  const imageUrl = typeof record.inputImage === 'string' ? record.inputImage : null;
  return { lines, imageUrl, scores };
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

/** Submits a scanned PDF to PaddleOCR, polls until done, and returns every page's extracted
 *  text/line-boxes plus a rendered image per page. Throws a plain Error with a message safe to
 *  show a teacher on any failure - callers decide how to surface/log it (e.g. writing it to
 *  AIGradingSubmission.errorMessage). */
export async function runOcr(pdfBuffer: Buffer): Promise<OcrResult> {
  const token = process.env.PADDLEOCR_ACCESS_TOKEN;
  if (!token) throw new Error('Server is missing PADDLEOCR_ACCESS_TOKEN');

  const authHeader = { Authorization: `bearer ${token}` };

  const form = new FormData();
  form.append('model', MODEL);
  form.append(
    'optionalPayload',
    JSON.stringify({ useDocOrientationClassify: false, useDocUnwarping: false, useTextlineOrientation: false })
  );
  form.append('file', new Blob([new Uint8Array(pdfBuffer)], { type: 'application/pdf' }), 'sheet.pdf');

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

  while (Date.now() < deadline) {
    let pollResp: Response;
    try {
      pollResp = await fetch(`${JOB_URL}/${jobId}`, { headers: authHeader });
    } catch (err) {
      throw new Error(`Could not poll PaddleOCR job: ${(err as Error).message}`);
    }

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
  const pageResults: { lines: OcrLine[]; imageUrl: string | null; scores: number[] }[] = [];

  for (const line of jsonlText.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      continue;
    }
    const ocrResults = (parsed as { result?: { ocrResults?: unknown[] } })?.result?.ocrResults;
    if (!Array.isArray(ocrResults)) continue;
    for (const res of ocrResults) {
      const pageData = extractPageLines(res);
      if (pageData) pageResults.push(pageData);
    }
  }

  if (pageResults.length === 0) {
    throw new Error('PaddleOCR job completed but no recognized text was found in the result.');
  }

  const pages: OcrPage[] = [];
  const allScores: number[] = [];
  for (const { lines, imageUrl, scores } of pageResults) {
    const imageDataUrl = imageUrl ? await fetchAsDataUrl(imageUrl) : null;
    pages.push({ imageDataUrl: imageDataUrl ?? '', lines });
    allScores.push(...scores);
  }
  const ocrConfidence = allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : null;

  const text = pages.map(p => p.lines.map(l => l.text).join('\n')).join('\n\n---\n\n');
  if (!text) throw new Error('PaddleOCR extracted pages but no line text was present');

  return { text, pages, ocrConfidence };
}
