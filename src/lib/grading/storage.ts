import { put } from '@vercel/blob';

/** Uploads a scanned answer sheet (PDF, image, Word doc, or plain text) to Vercel Blob and
 *  returns its public URL. Only the URL is ever stored on AIGradingSubmission - matches how
 *  Homework.attachmentUrl/HomeworkSubmission.attachmentUrl are modeled elsewhere in this schema
 *  (a URL column, never a binary column). The blob's declared content type must match the real
 *  file (not always PDF now) so the browser handles/previews it correctly. */
export async function uploadAnswerSheet(file: Buffer, fileName: string, contentType: string): Promise<string> {
  const blob = await put(`answer-sheets/${Date.now()}-${fileName}`, file, {
    access: 'public',
    contentType
  });
  return blob.url;
}
