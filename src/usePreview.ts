import { useCallback, useRef, useState } from 'react';

interface Preview {
  video: HTMLVideoElement;
  mode: 'hover' | 'manual';
}

export function usePreview() {
  const current = useRef<Preview | null>(null);
  const [active, setActive] = useState<HTMLVideoElement | null>(null);

  const stop = useCallback((video?: HTMLVideoElement, mode?: Preview['mode']) => {
    const preview = current.current;
    if (!preview || (video && preview.video !== video) || (mode && preview.mode !== mode)) return;

    current.current = null;
    preview.video.pause();
    if (preview.video.seekable.length > 0) preview.video.currentTime = 0;
    setActive(null);
  }, []);

  function start(video: HTMLVideoElement, mode: Preview['mode'], speed: number, onError: () => void) {
    if (current.current?.video === video) return;
    stop();
    const request = { video, mode };
    current.current = request;
    video.muted = true;
    video.loop = true;
    try {
      video.playbackRate = speed;
    } catch {
      stop(video);
      onError();
      return;
    }
    setActive(video);

    void video.play().catch(() => {
      if (current.current === request) {
        stop(video);
        onError();
      }
    });
  }

  function toggle(video: HTMLVideoElement, speed: number, onError: () => void) {
    if (current.current?.video === video) stop(video);
    else start(video, 'manual', speed, onError);
  }

  function guardPlayback(video: HTMLVideoElement) {
    if (current.current?.video !== video) video.pause();
  }

  return { active, start, stop, toggle, guardPlayback };
}

export type PreviewControls = ReturnType<typeof usePreview>;
