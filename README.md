# Frame

**Review creatives faster.** Frame is a lightweight workspace for importing, browsing, and previewing video creatives, built for the Parallel Distribution frontend assessment.

## Run locally

Use Node.js 22.12+ and npm.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. For a production preview, run `npm run build` followed by `npm run preview`.

## Use Frame

1. Paste public HTTP or HTTPS video URLs, one per line, and select **Import Videos**. Each valid URL is added even if another line has an error. **Load Demo Videos** adds two bundled samples for immediate review.
2. Hover over a card for a muted, looping preview at 2×. Move away to pause and rewind when the video is seekable. On a touchscreen, tap Play or Pause. With a keyboard, use Tab to focus the control and Enter or Space to toggle it.
3. Use **Duration** to see all videos, short videos (up to and including 30 seconds), or long videos (over 30 seconds). Use the trash button to remove an individual video.

## How it works

| File | Responsibility |
| --- | --- |
| `src/App.tsx` | Import form, library state, duration filter, and empty states |
| `src/videos.ts` | URL normalization, duplicate detection, display names, and duration rules |
| `src/VideoCard.tsx` | Native video element, metadata, media errors, and accessible controls |
| `src/usePreview.ts` | Single active player, start/stop logic, and handling of rejected playback |
| `src/demoVideos.ts`, `public/demo/` | Demo catalog and bundled video excerpts |
| `src/styles.css` | Responsive three-, two-, and one-column layouts and interaction states |
| `vercel.json` | Static Vite deployment settings |

React, strict TypeScript, Vite, custom CSS, and Lucide React keep the application client-side. There is no backend, database, authentication, or API key.

A shared preview controller pauses the previous element before calling `play()` on the next one. It sets `muted`, `loop`, and `playbackRate = 2` before playback. Each play request has its own identity so a late rejection can only affect the current request. The video elements use `playsInline` and `preload="metadata"`, and remain paused until the user interacts.

Cards record finite durations from native metadata events. Filtered cards stay mounted and hidden so metadata can arrive even when a duration filter is active. Unknown durations are shown under **All videos** only. Keeping the elements mounted favors smooth filtering for a small review library and can lead to more media requests in very large batches.

## Sources and limitations

- Use public, direct video URLs supported by the browser, including MP4 and WebM. URLs without a file extension are accepted and the browser determines playability.
- YouTube, TikTok, Instagram, and Facebook pages are unsupported. Private links, expired URLs, incompatible codecs, servers that block embedding, and HTTP sources blocked by HTTPS mixed-content policy may fail.
- The library lives in memory and resets on refresh. Preview audio stays muted. Seek behavior and preload timing depend on the browser and media host.
- The demo files are served from the app’s own origin to avoid third-party availability and embedding issues during evaluation. They are trimmed, resized, silent H.264 excerpts at 21 and 44 seconds. Frame reads those durations from the files at runtime.

### Demo credits

- **Big Buck Bunny** © 2008 Blender Foundation / www.bigbuckbunny.org. [Original trailer source](https://media.w3.org/2010/05/bunny/trailer.mp4) · [Attribution and license](https://peach.blender.org/about/)
- **Sintel** © Blender Foundation / www.sintel.org. [Original trailer source](https://media.w3.org/2010/05/sintel/trailer.mp4) · [Attribution and license](https://durian.blender.org/sharing/)

Both excerpts are distributed under [Creative Commons Attribution 3.0](https://creativecommons.org/licenses/by/3.0/).

## Verification

| Check | Result |
| --- | --- |
| `npm run lint` | Passed |
| `npm run typecheck` | Passed |
| `npm run build` | Passed |
| FFprobe | Both bundled files are H.264 MP4, with durations of 21.0 and 44.0 seconds |
| Google Chrome with Playwright against the production build | Passed multi-URL and extensionless import, duplicate and malformed input handling, native metadata while filtered, both duration categories, unavailable media, individual and final removals, empty states, and the demo |
| Native Chrome playback | Passed autoplay-on-hover at exactly 2×, mute and loop, pause and reset, rapid card transitions, keyboard preview and pause, and simulated rejected playback with no unhandled rejections |
| WebM boundary check in Chrome | A 30.000-second WebM played at 2×, appeared under Short, and was excluded from Long |
| Responsive layout | Passed desktop, tablet, and mobile column counts, no horizontal overflow at the tested mobile width, and tap playback with Chrome touch emulation |
| Temporary Vercel deployment smoke test | The CLI reported the deployment ready, but the public endpoint returned HTTP 403 from the test environment. Hosted browser verification is pending. |

The browser run recorded no unexpected JavaScript or console errors. The unavailable-media case intentionally produced a 404. Physical touch hardware, Safari, and Firefox were outside this run.

## Deploy to Vercel

Import this GitHub repository into a Vercel project, keep the **Vite** framework preset, and deploy from `main`. The checked-in configuration builds with `npm run build` and serves `dist`. No environment variables are required. [Vercel deployment documentation](https://vercel.com/docs/deployments)

Alternatively, use the Vercel CLI from the repository root with a signed-in account.

```sh
npx vercel login
npx vercel deploy --prod
```
