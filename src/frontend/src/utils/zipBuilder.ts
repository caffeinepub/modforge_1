// Simple uncompressed (STORED) ZIP file builder
// No external dependencies needed

function crc32(data: Uint8Array): number {
  const table = makeCRCTable();
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeCRCTable(): number[] {
  const table: number[] = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  return table;
}

function uint16LE(n: number): number[] {
  return [n & 0xff, (n >> 8) & 0xff];
}

function uint32LE(n: number): number[] {
  return [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >> 24) & 0xff];
}

interface ZipEntry {
  name: string;
  data: Uint8Array;
}

export function buildZip(entries: ZipEntry[]): Uint8Array {
  const encoder = new TextEncoder();
  const localHeaders: Uint8Array[] = [];
  const centralHeaders: Uint8Array[] = [];
  let offset = 0;
  const offsets: number[] = [];

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const crc = crc32(entry.data);
    const size = entry.data.length;

    // Local file header
    const localHeader = new Uint8Array([
      0x50,
      0x4b,
      0x03,
      0x04, // signature
      ...uint16LE(20), // version needed
      ...uint16LE(0), // general purpose bit flag
      ...uint16LE(0), // compression method (STORED)
      ...uint16LE(0), // last mod time
      ...uint16LE(0), // last mod date
      ...uint32LE(crc), // crc-32
      ...uint32LE(size), // compressed size
      ...uint32LE(size), // uncompressed size
      ...uint16LE(nameBytes.length), // file name length
      ...uint16LE(0), // extra field length
      ...nameBytes,
    ]);

    offsets.push(offset);
    offset += localHeader.length + size;

    localHeaders.push(localHeader);
    localHeaders.push(entry.data);

    // Central directory header
    const centralHeader = new Uint8Array([
      0x50,
      0x4b,
      0x01,
      0x02, // signature
      ...uint16LE(20), // version made by
      ...uint16LE(20), // version needed
      ...uint16LE(0), // bit flag
      ...uint16LE(0), // compression method
      ...uint16LE(0), // last mod time
      ...uint16LE(0), // last mod date
      ...uint32LE(crc), // crc-32
      ...uint32LE(size), // compressed size
      ...uint32LE(size), // uncompressed size
      ...uint16LE(nameBytes.length), // file name length
      ...uint16LE(0), // extra field length
      ...uint16LE(0), // file comment length
      ...uint16LE(0), // disk number start
      ...uint16LE(0), // internal file attributes
      ...uint32LE(0), // external file attributes
      ...uint32LE(offsets[offsets.length - 1]), // relative offset
      ...nameBytes,
    ]);
    centralHeaders.push(centralHeader);
  }

  const centralDirStart = offset;
  let centralDirSize = 0;
  for (const ch of centralHeaders) {
    centralDirSize += ch.length;
  }

  // End of central directory record
  const eocd = new Uint8Array([
    0x50,
    0x4b,
    0x05,
    0x06, // signature
    ...uint16LE(0), // disk number
    ...uint16LE(0), // start disk
    ...uint16LE(entries.length), // entries on disk
    ...uint16LE(entries.length), // total entries
    ...uint32LE(centralDirSize), // central dir size
    ...uint32LE(centralDirStart), // central dir offset
    ...uint16LE(0), // comment length
  ]);

  const all = [...localHeaders, ...centralHeaders, eocd];

  const totalSize = all.reduce((s, a) => s + a.length, 0);
  const result = new Uint8Array(totalSize);
  let pos = 0;
  for (const chunk of all) {
    result.set(chunk, pos);
    pos += chunk.length;
  }
  return result;
}

export function downloadZip(zipData: Uint8Array, filename: string): void {
  const blob = new Blob([new Uint8Array(zipData)], { type: "application/zip" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
