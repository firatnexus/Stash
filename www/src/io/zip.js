/**
 * Tiny read-only ZIP reader (stored + deflate entries) built on Blob slicing
 * and the platform DecompressionStream. Only the bytes that are needed are
 * read, so large Instagram exports do not have to fit in memory.
 */

const SIG_EOCD = 0x06054b50;
const SIG_CEN = 0x02014b50;
const SIG_LOC = 0x04034b50;

async function bytes(blob, start, end) {
  return new Uint8Array(await blob.slice(start, end).arrayBuffer());
}

function u16(b, o) {
  return b[o] | (b[o + 1] << 8);
}
function u32(b, o) {
  return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;
}

export class ZipError extends Error {}

/** @returns {Promise<Array<{name, method, compSize, size, offset}>>} */
export async function listEntries(blob) {
  if (!(blob instanceof Blob)) blob = new Blob([blob]);
  const tailLen = Math.min(blob.size, 22 + 0xffff);
  const tail = await bytes(blob, blob.size - tailLen, blob.size);
  let eocd = -1;
  for (let i = tail.length - 22; i >= 0; i--) {
    if (u32(tail, i) === SIG_EOCD) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new ZipError('not_zip');
  const count = u16(tail, eocd + 10);
  const cdSize = u32(tail, eocd + 12);
  const cdOffset = u32(tail, eocd + 16);
  if (cdOffset === 0xffffffff || count === 0xffff) throw new ZipError('zip64');
  const cd = await bytes(blob, cdOffset, cdOffset + cdSize);
  const entries = [];
  const dec = new TextDecoder();
  let p = 0;
  for (let i = 0; i < count; i++) {
    if (u32(cd, p) !== SIG_CEN) throw new ZipError('corrupt');
    const method = u16(cd, p + 10);
    const compSize = u32(cd, p + 20);
    const size = u32(cd, p + 24);
    const nameLen = u16(cd, p + 28);
    const extraLen = u16(cd, p + 30);
    const commentLen = u16(cd, p + 32);
    const offset = u32(cd, p + 42);
    const name = dec.decode(cd.subarray(p + 46, p + 46 + nameLen));
    entries.push({ name, method, compSize, size, offset });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

/** Read an entry's uncompressed bytes. */
export async function readEntry(blob, entry) {
  if (!(blob instanceof Blob)) blob = new Blob([blob]);
  const head = await bytes(blob, entry.offset, entry.offset + 30);
  if (u32(head, 0) !== SIG_LOC) throw new ZipError('corrupt');
  const start = entry.offset + 30 + u16(head, 26) + u16(head, 28);
  const data = blob.slice(start, start + entry.compSize);
  if (entry.method === 0) return new Uint8Array(await data.arrayBuffer());
  if (entry.method === 8) {
    if (typeof DecompressionStream === 'undefined') throw new ZipError('no_inflate');
    const stream = data.stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }
  throw new ZipError('unsupported_method');
}

export async function readEntryText(blob, entry) {
  return new TextDecoder('utf-8').decode(await readEntry(blob, entry));
}

export async function isZip(blob) {
  if (blob.size < 4) return false;
  const b = await bytes(blob, 0, 4);
  return u32(b, 0) === SIG_LOC;
}
