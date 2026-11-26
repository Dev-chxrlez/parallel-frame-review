import { useEffect, useRef, useState } from 'react';
import { CircleAlert, LoaderCircle, Pause, Play, Trash2 } from 'lucide-react';
import { formatDuration, type VideoEntry } from './videos';
import type { PreviewControls } from './usePreview';

interface Props {
  entry: VideoEntry;
  duration: number | null;
  hidden: boolean;
  preview: PreviewControls;
  onDuration: (url: string, duration: number | null) => void;
  onRemove: (url: string) => void;
}

export function VideoCard({ entry, duration, hidden, preview, onDuration, onRemove }: Props) {
  const player = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'slow' | 'unavailable'>('loading');
  const [playbackError, setPlaybackError] = useState(false);
  const active = preview.active !== null && preview.active === player.current;
  const { stop } = preview;

  useEffect(() => {
    const video = player.current;
    return () => {
      if (video) stop(video);
    };
  }, [stop]);

  useEffect(() => {
    if (hidden && player.current) stop(player.current);
  }, [hidden, stop]);

  useEffect(() => {
    if (status !== 'loading') return;
    const timeout = window.setTimeout(() => setStatus('slow'), 15000);
    return () => window.clearTimeout(timeout);
  }, [status]);

  function readDuration(video: HTMLVideoElement) {
    const value = video.duration;
    onDuration(entry.url, Number.isFinite(value) && value >= 0 ? value : null);
  }

  function unavailable(video: HTMLVideoElement) {
    stop(video);
    onDuration(entry.url, null);
    setStatus('unavailable');
  }

  return (
    <article
      className="video-card"
      hidden={hidden}
      onPointerEnter={(event) => {
        if (event.pointerType !== 'mouse' || !player.current || status === 'unavailable') return;
        setPlaybackError(false);
        preview.start(player.current, 'hover', () => setPlaybackError(true));
      }}
      onPointerLeave={() => {
        if (player.current) stop(player.current, 'hover');
      }}
    >
      <div className="media">
        <video
          ref={player}
          src={entry.url}
          muted
          playsInline
          preload="metadata"
          aria-hidden="true"
          onLoadedMetadata={(event) => {
            const video = event.currentTarget;
            if (!video.videoWidth) {
              unavailable(video);
              return;
            }
            setStatus('ready');
            readDuration(video);
          }}
          onDurationChange={(event) => {
            if (event.currentTarget.videoWidth) readDuration(event.currentTarget);
          }}
          onError={(event) => unavailable(event.currentTarget)}
          onPlaying={(event) => preview.guardPlayback(event.currentTarget)}
        />
        {active && <span className="speed-badge">2× preview</span>}
        {duration !== null && <span className="duration-badge">{formatDuration(duration)}</span>}
        {status !== 'ready' && (
          <div className="media-message" role={hidden ? undefined : 'status'}>
            {status === 'loading' ? <LoaderCircle className="spinner" size={18} /> : <CircleAlert size={18} />}
            {status === 'loading' && 'Loading video'}
            {status === 'slow' && 'Video is taking longer to load'}
            {status === 'unavailable' && 'Video unavailable or unsupported'}
          </div>
        )}
        {status !== 'unavailable' && (
          <button
            className="preview-button"
            type="button"
            aria-label={`${active ? 'Pause' : 'Preview'} ${entry.name}${active ? '' : ' at 2× speed'}`}
            onClick={() => {
              if (!player.current) return;
              setPlaybackError(false);
              preview.toggle(player.current, () => setPlaybackError(true));
            }}
          >
            {active ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}
          </button>
        )}
      </div>
      <div className="video-details">
        <div className="video-info">
          <h3 title={entry.name}>{entry.name}</h3>
          <div className="video-source" title={entry.source}>{entry.source}</div>
        </div>
        <button type="button" className="icon-button" aria-label={`Remove ${entry.name}`} title="Remove video" onClick={() => onRemove(entry.url)}>
          <Trash2 size={17} />
        </button>
      </div>
      {playbackError && status !== 'unavailable' && (
        <p className="playback-error" role="status">Preview couldn’t start. Press Play to retry.</p>
      )}
    </article>
  );
}
