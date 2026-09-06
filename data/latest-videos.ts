import type { LocalizedText, VideoItem } from './site';

export const VIDEO_FEED_URL = 'https://raw.githubusercontent.com/paul010/dalei-youtube/master/latest.json';
const CHANNEL_ID = 'UCk9tu0mFtXj_rOEfIncxuJQ';

// Keep the source wording. Split only clear bilingual suffixes; a Chinese-only
// title stays in Chinese instead of inventing an English translation.
export function videoTitle(title: string): LocalizedText {
  const split = title.match(/^(.*[\u3400-\u9fff？！%])\s*([A-Z][A-Za-z0-9][^\u3400-\u9fff]*)$/);
  // A product name inside a Chinese title is not an English translation.
  // Require multiple English words and keep ambiguous titles intact.
  return split && /[A-Za-z]{2,}\s+[A-Za-z]{2,}/.test(split[2])
    ? { zh: split[1].trim(), en: split[2].trim() }
    : { zh: title, en: title };
}

export function parseLatestVideos(data: unknown, limit = 6): VideoItem[] {
  const feed = data as { schemaVersion?: number; channelId?: string; videos?: unknown[] };
  if (!feed || feed.schemaVersion !== 1 || feed.channelId !== CHANNEL_ID || !Array.isArray(feed.videos)) {
    throw new Error('Invalid video feed');
  }
  const seen = new Set<string>();
  const rows = feed.videos.map((row) => {
    const v = row as Record<string, unknown>;
    if (!v || typeof v.id !== 'string' || !/^[A-Za-z0-9_-]{11}$/.test(v.id) || seen.has(v.id)
      || typeof v.title !== 'string' || !v.title.trim() || v.title.length > 500
      || typeof v.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v.date) || !Number.isFinite(Date.parse(v.date))
      || typeof v.publishedAt !== 'string' || !Number.isFinite(Date.parse(v.publishedAt))
      || Date.parse(v.publishedAt) > Date.now()
      || typeof v.duration !== 'string' || !/^\d{1,3}:\d{2}(:\d{2})?$/.test(v.duration)) {
      throw new Error('Incomplete video metadata');
    }
    seen.add(v.id);
    return { id: v.id, title: videoTitle(v.title.trim()), date: v.date, duration: v.duration, publishedAt: v.publishedAt };
  });
  if (rows.length < limit) throw new Error('Incomplete video feed');
  return rows.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0, limit);
}

export async function fetchLatestVideos(signal?: AbortSignal): Promise<VideoItem[]> {
  const response = await fetch(VIDEO_FEED_URL, { cache: 'no-store', signal });
  if (!response.ok) throw new Error(`Video feed unavailable: ${response.status}`);
  return parseLatestVideos(await response.json());
}
