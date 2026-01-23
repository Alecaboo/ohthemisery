import LZString from 'lz-string';

const { compressToEncodedURIComponent, decompressFromEncodedURIComponent } = LZString;

const LEGACY_COMPRESSED_PREFIX = 'z:';
const BINARY_V1_PREFIX = 'b1_';

function isLegacyBuildString(value) {
  // Current legacy format is a querystring-like payload containing keys like m=, o=, ...
  return typeof value === 'string' && value.includes('=') && value.includes('&');
}

function fnv1a32(str) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function writeVarint(num) {
  let n = num >>> 0;
  const bytes = [];
  while (n >= 0x80) {
    bytes.push((n & 0x7f) | 0x80);
    n >>>= 7;
  }
  bytes.push(n);
  return Uint8Array.from(bytes);
}

function readVarint(buf, offset) {
  let result = 0;
  let shift = 0;
  let pos = offset;
  while (pos < buf.length) {
    const b = buf[pos++];
    result |= (b & 0x7f) << shift;
    if ((b & 0x80) === 0) break;
    shift += 7;
  }
  return { value: result >>> 0, offset: pos };
}

function concatBytes(...parts) {
  const total = parts.reduce((sum, p) => sum + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

function toBase64Url(bytes) {
  // Browser + Node compatible base64url
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  }
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  // eslint-disable-next-line no-undef
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(str) {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(str.length / 4) * 4, '=');
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(base64, 'base64'));
  }
  // eslint-disable-next-line no-undef
  const binary = atob(base64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

function getTextCodec() {
  const encoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;
  const decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder() : null;
  if (!encoder || !decoder) {
    throw new Error('TextEncoder/TextDecoder not available');
  }
  return { encoder, decoder };
}

function buildHashLookup(itemData) {
  const map = new Map();
  if (!itemData) return map;
  for (const key of Object.keys(itemData)) {
    const h = fnv1a32(key);
    if (!map.has(h)) map.set(h, key);
  }
  return map;
}

export function normalizeBuildParam(build) {
  if (!build) return null;
  return Array.isArray(build) ? build[0] : build;
}

export function decodeBuildName(build) {
  const normalized = normalizeBuildParam(build);
  if (!normalized) return null;

  // Legacy formats: try to read name=... from the string directly.
  if (isLegacyBuildString(normalized)) {
    const part = normalized.split('&').find((p) => p.startsWith('name='));
    return part ? decodeURIComponent(part.slice('name='.length)) : null;
  }

  if (normalized.startsWith(LEGACY_COMPRESSED_PREFIX)) {
    const payload = normalized.slice(LEGACY_COMPRESSED_PREFIX.length);
    const decompressed = decompressFromEncodedURIComponent(payload);
    if (!decompressed) return null;
    const part = decompressed.split('&').find((p) => p.startsWith('name='));
    return part ? decodeURIComponent(part.slice('name='.length)) : null;
  }

  if (normalized.startsWith(BINARY_V1_PREFIX)) {
    try {
      const { decoder } = getTextCodec();
      const bytes = fromBase64Url(normalized.slice(BINARY_V1_PREFIX.length));
      if (bytes.length < 1 + 6 * 4) return null;
      let offset = 1 + 6 * 4;
      const charmLen = readVarint(bytes, offset);
      offset = charmLen.offset + charmLen.value;
      const nameLen = readVarint(bytes, offset);
      offset = nameLen.offset;
      if (nameLen.value === 0) return null;
      const nameBytes = bytes.slice(offset, offset + nameLen.value);
      return decoder.decode(nameBytes);
    } catch (e) {
      return null;
    }
  }

  return null;
}

export function decodeBuildParam(build, itemData) {
  const normalized = normalizeBuildParam(build);
  if (!normalized) return null;

  // Already legacy.
  if (isLegacyBuildString(normalized)) {
    return normalized;
  }

  // Existing compressed legacy format.
  if (normalized.startsWith(LEGACY_COMPRESSED_PREFIX)) {
    const payload = normalized.slice(LEGACY_COMPRESSED_PREFIX.length);
    const decompressed = decompressFromEncodedURIComponent(payload);
    return decompressed || null;
  }

  // New compact binary format.
  if (normalized.startsWith(BINARY_V1_PREFIX)) {
    if (!itemData) return null;
    const lookup = buildHashLookup(itemData);
    const { decoder } = getTextCodec();
    const bytes = fromBase64Url(normalized.slice(BINARY_V1_PREFIX.length));
    if (bytes.length < 1 + 6 * 4) return null;

    const version = bytes[0];
    if (version !== 1) return null;

    const readU32 = (off) =>
      (bytes[off] | (bytes[off + 1] << 8) | (bytes[off + 2] << 16) | (bytes[off + 3] << 24)) >>> 0;

    const hashes = [];
    for (let i = 0; i < 6; i++) {
      hashes.push(readU32(1 + i * 4));
    }

    let offset = 1 + 6 * 4;
    const charmLen = readVarint(bytes, offset);
    offset = charmLen.offset;
    const charm = charmLen.value ? decoder.decode(bytes.slice(offset, offset + charmLen.value)) : 'None';
    offset += charmLen.value;

    const nameLen = readVarint(bytes, offset);
    offset = nameLen.offset;
    const name = nameLen.value ? decoder.decode(bytes.slice(offset, offset + nameLen.value)) : null;

    const keys = ['mainhand', 'offhand', 'helmet', 'chestplate', 'leggings', 'boots'];
    let legacy = '';
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const h = hashes[i];
      const itemKey = h === 0 ? 'None' : lookup.get(h) || 'None';
      legacy += `${key[0]}=${encodeURIComponent(itemKey)}&`;
    }

    legacy += `charm=${encodeURIComponent(charm || 'None')}`;
    if (name) legacy += `&name=${encodeURIComponent(name)}`;
    return legacy;
  }

  // Unknown token; treat as legacy-ish (best effort).
  return normalized;
}

export function encodeBuildParamLegacyCompressed(legacyBuildString) {
  if (!legacyBuildString) return null;
  return LEGACY_COMPRESSED_PREFIX + compressToEncodedURIComponent(legacyBuildString);
}

export function encodeBuildParam(legacyBuildString) {
  if (!legacyBuildString) return null;

  // If we were already given an encoded token, pass it through.
  if (typeof legacyBuildString === 'string') {
    if (legacyBuildString.startsWith(BINARY_V1_PREFIX) || legacyBuildString.startsWith(LEGACY_COMPRESSED_PREFIX)) {
      return legacyBuildString;
    }
  }

  // Prefer the compact binary token. If anything fails (older browser, etc), fall back to legacy compression.
  try {
    const params = new URLSearchParams(legacyBuildString);
    const itemKeys = [
      params.get('m') || 'None',
      params.get('o') || 'None',
      params.get('h') || 'None',
      params.get('c') || 'None',
      params.get('l') || 'None',
      params.get('b') || 'None',
    ];
    const charm = params.get('charm') || 'None';
    const name = params.get('name') || null;
    return encodeBuildParamBinaryV1({ itemKeys, charm, name });
  } catch (e) {
    return encodeBuildParamLegacyCompressed(legacyBuildString);
  }
}

export function encodeBuildParamBinaryV1({
  itemKeys,
  charm,
  name,
}) {
  const { encoder } = getTextCodec();
  const keys = itemKeys || [];
  const hashes = new Uint8Array(6 * 4);

  for (let i = 0; i < 6; i++) {
    const value = keys[i];
    const h = !value || value === 'None' ? 0 : fnv1a32(String(value));
    hashes[i * 4] = h & 0xff;
    hashes[i * 4 + 1] = (h >>> 8) & 0xff;
    hashes[i * 4 + 2] = (h >>> 16) & 0xff;
    hashes[i * 4 + 3] = (h >>> 24) & 0xff;
  }

  const charmStr = charm && charm !== 'None' ? String(charm) : '';
  const charmBytes = charmStr ? encoder.encode(charmStr) : new Uint8Array(0);
  const charmLen = writeVarint(charmBytes.length);

  const nameStr = name ? String(name) : '';
  const nameBytes = nameStr ? encoder.encode(nameStr) : new Uint8Array(0);
  const nameLen = writeVarint(nameBytes.length);

  const version = Uint8Array.from([1]);
  const packed = concatBytes(version, hashes, charmLen, charmBytes, nameLen, nameBytes);
  return BINARY_V1_PREFIX + toBase64Url(packed);
}
