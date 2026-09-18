import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';

/** Combines several page photos into one multi-page PDF, in the order given, so a single
 *  student's multi-page answer sheet photographed as separate images (one shot per page) can
 *  be graded as ONE submission instead of several. Everything downstream - PaddleOCR, the
 *  grading prompt's page/line numbering, the Annotated-paper view, Retry - already handles a
 *  multi-page PDF exactly like this, since that's just what a scanned multi-page PDF always
 *  looked like; this only fills the gap where a teacher has separate photos instead of a
 *  pre-made PDF.
 *
 *  Every image is re-encoded to PNG via sharp before embedding, rather than branching on the
 *  original format: pdf-lib can only embed PNG or JPEG directly (not WEBP, which these photos
 *  may well be), and re-encoding is cheap enough that a single code path beats juggling three
 *  embed methods. */
export async function combineImagesToPdf(buffers: Buffer[]): Promise<Buffer> {
  const doc = await PDFDocument.create();
  for (const buffer of buffers) {
    const pngBuffer = await sharp(buffer).png().toBuffer();
    const metadata = await sharp(pngBuffer).metadata();
    const width = metadata.width ?? 1000;
    const height = metadata.height ?? 1400;
    const image = await doc.embedPng(pngBuffer);
    const page = doc.addPage([width, height]);
    page.drawImage(image, { x: 0, y: 0, width, height });
  }
  return Buffer.from(await doc.save());
}
