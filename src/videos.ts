export interface VideoEntry {
  url: string;
  name: string;
  source: string;
}

export type DurationFilter = 'all' | 'short' | 'long';

const socialHosts = [
  'youtube.com', 'youtu.be', 'tiktok.com', 'instagram.com', 'facebook.com', 'fb.watch',
];

function videoName(url: URL) {
  const segment = url.pathname.split('/').filter(Boolean).at(-1);
  if (!segment) return 'Untitled video';
  let name = segment;
  try {
    name = decodeURIComponent(segment);
  } catch {
    // Retain the original segment when it contains malformed escaping.
  }
  return name
    .replace(/\.[a-z0-9]{1,5}$/i, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim() || 'Untitled video';
}

export function parseVideos(input: string, entries: VideoEntry[]) {
  const knownUrls = new Set(entries.map(({ url }) => url));
  const videos: VideoEntry[] = [];
  const issues: string[] = [];
  const lines = input.split('\n');

  lines.forEach((line, index) => {
    const value = line.trim();
    if (!value) return;
    const number = index + 1;
    let parsed: URL;
    try {
      parsed = new URL(value);
    } catch {
      issues.push(`Line ${number}: Enter a valid HTTP or HTTPS URL.`);
      return;
    }

    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
      issues.push(`Line ${number}: Use an HTTP or HTTPS URL without embedded credentials.`);
      return;
    }

    const host = parsed.hostname.toLowerCase().replace(/\.$/, '');
    if (socialHosts.some((social) => host === social || host.endsWith(`.${social}`))) {
      issues.push(`Line ${number}: Social video pages are unsupported. Use a direct video link.`);
      return;
    }

    // A fragment does not distinguish library entries pointing to the same media.
    parsed.hash = '';
    if (knownUrls.has(parsed.href)) {
      issues.push(`Line ${number}: This video is already in the library.`);
      return;
    }

    knownUrls.add(parsed.href);
    videos.push({ url: parsed.href, name: videoName(parsed), source: host });
  });

  if (!input.trim()) issues.push('Paste at least one video URL to import.');
  return { videos, issues };
}

export function matchesDuration(filter: DurationFilter, duration: number | null) {
  if (filter === 'all') return true;
  if (duration === null) return false;
  return filter === 'short' ? duration <= 30 : duration > 30;
}

export function formatDuration(duration: number) {
  const total = Math.floor(duration);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor(total / 60) % 60;
  const seconds = String(total % 60).padStart(2, '0');
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${seconds}` : `${minutes}:${seconds}`;
}
