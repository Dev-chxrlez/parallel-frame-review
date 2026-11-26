import { useCallback, useState, type FormEvent } from 'react';
import {
  ChevronDown, CircleAlert, Clapperboard, Film, Link2, ListVideo, MousePointer2, Play, Upload,
} from 'lucide-react';
import { VideoCard } from './VideoCard';
import { demoVideos } from './demoVideos';
import { usePreview } from './usePreview';
import { matchesDuration, parseVideos, type DurationFilter, type VideoEntry } from './videos';

export default function App() {
  const [entries, setEntries] = useState<VideoEntry[]>([]);
  const [durations, setDurations] = useState<Record<string, number | null>>({});
  const [filter, setFilter] = useState<DurationFilter>('all');
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState({ added: 0, issues: [] as string[] });
  const preview = usePreview();
  const visibleCount = entries.filter(({ url }) => matchesDuration(filter, durations[url] ?? null)).length;

  const updateDuration = useCallback((url: string, duration: number | null) => {
    setDurations((previous) => (previous[url] ?? null) === duration ? previous : { ...previous, [url]: duration });
  }, []);

  function importVideos(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { videos, issues } = parseVideos(input, entries);
    setEntries([...entries, ...videos]);
    setFeedback({ added: videos.length, issues });
    if (videos.length) setInput('');
  }

  function loadDemo() {
    const sources = new Map(demoVideos.map(({ file, name }) => [
      new URL(`${import.meta.env.BASE_URL}demo/${file}`, window.location.origin).href, name,
    ]));
    const { videos } = parseVideos([...sources.keys()].join('\n'), entries);
    const demos = videos.map((video) => ({
      ...video,
      name: sources.get(video.url) ?? video.name,
      source: 'Blender Foundation · Demo',
    }));
    setEntries([...entries, ...demos]);
    setFilter('all');
    setFeedback({ added: videos.length, issues: videos.length ? [] : ['The demo videos are already in your library.'] });
  }

  function removeVideo(url: string) {
    if (preview.active?.getAttribute('src') === url) preview.stop();
    setEntries((previous) => previous.filter((entry) => entry.url !== url));
    setDurations(({ [url]: removed, ...remaining }) => remaining);
    setFeedback({ added: 0, issues: [] });
  }

  return (
    <>
      <header className="site-header">
        <div className="shell header-content">
          <div className="brand"><span className="brand-icon"><Clapperboard size={19} strokeWidth={2.2} /></span>Frame</div>
          <span className="workspace-label">Creative Review Workspace</span>
        </div>
      </header>
      <main className="shell">
        <section className="intro" aria-labelledby="page-title">
          <h1 id="page-title">Review creatives <span>faster.</span></h1>
          <p>Import, browse, and preview your video creatives in one workspace.</p>
        </section>

        <form className="import-panel" onSubmit={importVideos}>
          <div className="section-heading">
            <span className="section-icon"><Link2 size={20} /></span>
            <div>
              <h2><label htmlFor="video-links">Import video links</label></h2>
              <p>Paste one video URL per line.</p>
            </div>
          </div>
          <textarea
            id="video-links"
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              if (feedback.issues.length || feedback.added) setFeedback({ added: 0, issues: [] });
            }}
            placeholder={'https://example.com/creative-01.mp4\nhttps://example.com/creative-02.webm'}
            rows={3}
            spellCheck={false}
            aria-describedby="format-hint"
          />
          <div className="import-actions">
            <div className="buttons">
              <button className="button primary" type="submit"><Upload size={16} />Import Videos</button>
              <button className="button secondary" type="button" onClick={loadDemo}><Play size={15} />Load Demo Videos</button>
            </div>
            <p className="hint" id="format-hint">Use direct video links such as MP4 or WebM.<br />YouTube, TikTok, Instagram, and Facebook pages are unsupported.</p>
          </div>
          <div className="feedback" role="status">
            {feedback.added > 0 && <p className="success">Imported {feedback.added} {feedback.added === 1 ? 'video' : 'videos'}.</p>}
            {feedback.issues.length > 0 && (
              <ul>{feedback.issues.map((issue) => <li key={issue}><CircleAlert size={15} />{issue}</li>)}</ul>
            )}
          </div>
        </form>

        <section className="library" aria-labelledby="library-title">
          <div className="library-toolbar">
            <div className="library-title">
              <ListVideo size={22} />
              <h2 id="library-title">Video Library</h2>
              <span className="count" aria-live="polite">{filter === 'all' ? entries.length : `${visibleCount} of ${entries.length}`} {entries.length === 1 ? 'video' : 'videos'}</span>
            </div>
            <div className="filter">
              <label htmlFor="duration-filter">Duration</label>
              <div className="select-wrap">
                <select id="duration-filter" value={filter} onChange={(event) => {
                  preview.stop();
                  setFilter(event.target.value as DurationFilter);
                }}>
                  <option value="all">All videos</option>
                  <option value="short">Short · 30s or less</option>
                  <option value="long">Long · Over 30s</option>
                </select>
                <ChevronDown size={15} aria-hidden="true" />
              </div>
            </div>
          </div>

          <div className="video-grid">
            {entries.map((entry) => {
              const duration = durations[entry.url] ?? null;
              return <VideoCard key={entry.url} entry={entry} duration={duration} hidden={!matchesDuration(filter, duration)} preview={preview} onDuration={updateDuration} onRemove={removeVideo} />;
            })}
          </div>
          {visibleCount === 0 && (
            <div className="empty">
              <span className="empty-icon"><Film size={25} strokeWidth={1.65} /></span>
              <h3>{entries.length ? 'No videos match this filter' : 'Your library is empty'}</h3>
              <p>{entries.length ? 'Choose All videos to see every import, including videos still loading.' : 'Paste a video link above or load the demo videos to get started.'}</p>
            </div>
          )}
        </section>

        <footer className="footer">
          <MousePointer2 size={16} aria-hidden="true" />
          <p><strong>Hover to preview at 2× speed.</strong> Tap Play or focus it and press Enter to preview without a mouse.</p>
        </footer>
      </main>
    </>
  );
}
