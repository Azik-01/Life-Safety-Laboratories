const PUBLIC_MANUAL_ASSETS_PREFIX = '/assets/manual-imported/';
const SOURCE_ASSETS_PREFIX = '/src/assets/';

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function toPublicAssetPath(fileName: string): string {
  const decoded = safeDecode(fileName).replace(/^\/+/, '');
  return `${PUBLIC_MANUAL_ASSETS_PREFIX}${encodeURIComponent(decoded)}`;
}

/**
 * Resolves JSON-provided asset paths:
 * `/src/assets/*` -> `/assets/manual-imported/*`.
 *
 * This avoids eager-importing every image into the JS graph.
 */
export function resolveAssetPath(path: string | undefined): string | undefined {
  if (!path) return undefined;
  if (!path.startsWith(SOURCE_ASSETS_PREFIX)) return path;

  const requestedFileName = path.slice(SOURCE_ASSETS_PREFIX.length);
  return toPublicAssetPath(requestedFileName);
}
