import { put } from '@vercel/blob';

/** Uploads a scanned answer sheet to Vercel Blob and returns its public URL. Only the URL is
 *  ever stored on AIGradingSubmission - matches how Homework.attachmentUrl/
 *  HomeworkSubmission.attachmentUrl are modeled elsewhere in this schema (a URL column, never
 *  a binary column). */
export async function uploadAnswerSheet(file: Buffer, fileName: string): Promise<string> {
  const blob = await put(`answer-sheets/${Date.now()}-${fileName}`, file, {
    access: 'public',
    contentType: 'application/pdf'
  });
  return blob.url;
}
