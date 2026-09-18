import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';

/** A real phone photo is routinely 3000-4000px on a side - well past what OCR legibility of a
 *  page of text needs. Capped here so a 4-photo submission stays a few MB, not tens of MB. */
const MAX_DIMENSION = 2000;
const JPEG_QUALITY = 85;

/** Combines several page photos into one multi-page PDF, in the order given, so a single
 *  student's multi-page answer sheet photographed as separate images (one shot per page) can
 *  be graded as ONE submission instead of several. Everything downstream - PaddleOCR, the
 *  grading prompt's page/line numbering, the Annotated-paper view, Retry - already handles a
 *  multi-page PDF exactly like this, since that's just what a scanned multi-page PDF always
 *  looked like; this only fills the gap where a teacher has separate photos instead of a
 *  pre-made PDF.
 *
 *  Every image is re-encoded to JPEG (resized, EXIF-oriented) via sharp before embedding, not
 *  left at its original resolution/format: a first version of this re-encoded to PNG at full
 *  size, which is lossless and roughly doubles a photo's size rather than compressing it - a
 *  4-photo submission produced a PDF tens of MB large that PaddleOCR took long enough to churn
 *  through that the request got killed before it ever finished (confirmed live: the submission
 *  sat at OCR_PROCESSING forever, no error, exactly what happens when the platform kills the
 *  function rather than this code's own try/catch ever running). JPEG is what photographic
 *  content actually compresses well as, and resizing first means every page costs the same
 *  regardless of the source camera's resolution. `.rotate()` with no argument bakes in the
 *  photo's EXIF orientation before sharp would otherwise strip it, so a phone photo taken
 *  sideways doesn't end up sideways in the PDF. */
export async function combineImagesToPdf(buffers: Buffer[]): Promise<Buffer> {
  const doc = await PDFDocument.create();
  for (const buffer of buffers) {
    const jpegBuffer = await sharp(buffer)
      .rotate()
      .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer();
    const metadata = await sharp(jpegBuffer).metadata();
    const width = metadata.width ?? 1000;
    const height = metadata.height ?? 1400;
    const image = await doc.embedJpg(jpegBuffer);
    const page = doc.addPage([width, height]);
    page.drawImage(image, { x: 0, y: 0, width, height });
  }
  return Buffer.from(await doc.save());
}
