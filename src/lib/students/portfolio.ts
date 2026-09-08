import { put } from '@vercel/blob';

/** Uploads a portfolio file to Vercel Blob and returns its public URL — same URL-only storage pattern as uploadStudentPhoto. */
export async function uploadPortfolioFile(file: Buffer, studentId: string, filename: string, contentType: string): Promise<string> {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const blob = await put(`portfolio/${studentId}-${Date.now()}-${safeName}`, file, {
    access: 'public',
    contentType,
  });
  return blob.url;
}
