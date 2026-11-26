import { useCallback, useState, type FormEvent } from 'react';
import {
  ChevronDown, CircleAlert, Clapperboard, Film, MousePointer2, Play, Link2,
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
    if (videos.length) {
      setInput('');
      setFilter('all');
    }
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
        <div className="workspace-intake">
          <section className="intro" aria-labelledby="page-title">
            <h1 id="page-title">Review creatives faster.</h1>
            <p>Import, browse, and preview your video creatives in one workspace.</p>
          </section>

          <form className="import-panel" onSubmit={importVideos}>
            <label className="import-label" htmlFor="video-links">Video links</label>
            <p className="hint" id="format-hint">One direct video link per line, such as MP4 or WebM. Links to social media posts won’t play.</p>
            <textarea
              id="video-links"
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                if (feedback.issues.length || feedback.added) setFeedback({ added: 0, issues: [] });
              }}
              placeholder="https://example.com/clip.mp4"
              rows={3}
              spellCheck={false}
              aria-describedby="format-hint"
            />
            <div className="import-actions">
              <div className="buttons">
                <button className="button primary" type="submit"><Link2 size={16} />Import Videos</button>
                <button className="button secondary" type="button" onClick={loadDemo}><Play size={15} />Load Demo Videos</button>
              </div>
            </div>
            <div className="feedback" role="status">
              {feedback.added > 0 && <p className="success">Imported {feedback.added} {feedback.added === 1 ? 'video' : 'videos'}.</p>}
              {feedback.issues.length > 0 && (
                <ul>{feedback.issues.map((issue) => <li key={issue}><CircleAlert size={15} />{issue}</li>)}</ul>
              )}
            </div>
          </form>
        </div>

        <section className="library" aria-labelledby="library-title">
          <div className="library-toolbar">
            <div className="library-title">
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
              <Film size={24} strokeWidth={1.6} aria-hidden="true" />
              <div>
                <h3>{entries.length ? 'No videos match this filter' : 'Your library is empty'}</h3>
                <p>{entries.length ? 'Choose All videos to see every import, including videos still loading.' : 'Import a video or load the demo clips to start reviewing.'}</p>
              </div>
            </div>
          )}
        </section>

        <footer className="footer">
          <MousePointer2 size={16} aria-hidden="true" />
          <p><strong>Hover to preview at 2× by default.</strong> Use the speed menu on each video to change it.</p>
        </footer>
      </main>
    </>
  );
}
