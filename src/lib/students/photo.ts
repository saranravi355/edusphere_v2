import { put } from '@vercel/blob';

/** Uploads a student's profile photo to Vercel Blob and returns its public URL. Only the URL
 *  is stored on Student.photoUrl - matches how Homework.attachmentUrl and
 *  AIGradingSubmission.fileUrl are modeled elsewhere in this schema (a URL column, never a
 *  binary column). */
export async function uploadStudentPhoto(file: Buffer, studentId: string, contentType: string): Promise<string> {
  const ext = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg';
  const blob = await put(`student-photos/${studentId}-${Date.now()}.${ext}`, file, {
    access: 'public',
    contentType
  });
  return blob.url;
}
