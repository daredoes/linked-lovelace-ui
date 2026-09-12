import { Page } from '@playwright/test';

// On-screen furniture for the demo recording: a floating caption card, a code
// panel down the left side, and a chapter badge. All three are injected into
// the page itself so Playwright's viewport recording picks them up, and all
// three hang off <html> rather than <body> so they survive Home Assistant's
// client-side navigation.
//
// Home Assistant reloads the page on its own during a walkthrough, for instance
// once a dashboard it did not know about is registered, which tears the overlay
// out of the page. Whatever is on screen is mirrored into sessionStorage so the
// next install puts it straight back.

const PANEL_WIDTH = 560;

// Where a caption sits inside its zone.
export type Anchor =
  | 'top-left'
  | 'top'
  | 'top-right'
  | 'left'
  | 'center'
  | 'right'
  | 'bottom-left'
  | 'bottom'
  | 'bottom-right';

// Which part of the frame the caption is positioned against.
//   stage  the Home Assistant area, which narrows to the right of the code
//          panel while the panel is open
//   panel  the code panel itself, for captions about the YAML on screen
//   below  the empty band under Home Assistant while it is scaled down, which
//          covers nothing at all
//   screen the whole frame
export type Zone = 'stage' | 'panel' | 'below' | 'screen';

export interface SayOptions {
  at?: Anchor;
  zone?: Zone;
  ms?: number;
}

export async function installOverlay(page: Page): Promise<void> {
  await page.addInitScript(
    ({ panelWidth }) => {
      const install = () => {
        if (document.getElementById('ll-caption')) return;

        const font = '-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif';
        const mono = 'ui-monospace,SFMono-Regular,Menlo,Consolas,monospace';
        const ink = '#0b0f18';

        // The caption box is centred inside a frame that covers its zone, so
        // an anchor is just a pair of flexbox alignments and the box keeps its
        // own size.
        const frame = document.createElement('div');
        frame.id = 'll-caption';
        frame.style.cssText =
          'position:fixed;z-index:2147483647;display:flex;box-sizing:border-box;padding:28px;pointer-events:none;left:0;top:0;width:100vw;height:100vh';

        const bubble = document.createElement('div');
        bubble.id = 'll-caption-text';
        bubble.style.cssText = `max-width:min(660px,100%);box-sizing:border-box;padding:15px 22px;border-radius:14px;background:rgba(11,15,24,0.9);-webkit-backdrop-filter:blur(10px) saturate(140%);backdrop-filter:blur(10px) saturate(140%);border:1px solid rgba(126,224,255,0.25);box-shadow:0 16px 44px rgba(0,0,0,0.5);color:#f3f7fc;font:600 22px/1.45 ${font};opacity:0;transform:translateY(10px);transition:opacity 200ms ease,transform 200ms ease`;
        frame.append(bubble);

        const panel = document.createElement('div');
        panel.id = 'll-code';
        panel.style.cssText = `position:fixed;left:0;top:0;bottom:0;width:${panelWidth}px;box-sizing:border-box;z-index:2147483646;background:#0f1420;color:#e6edf3;padding:22px 24px;overflow:hidden;display:flex;flex-direction:column;gap:12px;transform:translateX(-100%);transition:transform 220ms ease;box-shadow:2px 0 18px rgba(0,0,0,0.35);pointer-events:none`;

        const title = document.createElement('div');
        title.id = 'll-code-title';
        title.style.cssText = `font:600 16px/1.3 ${font};color:#7ee0ff;letter-spacing:0.02em`;

        const body = document.createElement('pre');
        body.id = 'll-code-body';
        body.style.cssText = `margin:0;flex:1;overflow:auto;font:14px/1.55 ${mono};white-space:pre-wrap;word-break:break-word;color:#e6edf3`;

        panel.append(title, body);

        const chapter = document.createElement('div');
        chapter.id = 'll-chapter';
        chapter.style.cssText = `position:fixed;right:24px;top:20px;z-index:2147483647;box-sizing:border-box;padding:7px 14px;border-radius:999px;background:rgba(11,15,24,0.82);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.14);color:#9fe6ff;font:600 14px/1.3 ${mono};letter-spacing:0.04em;pointer-events:none;opacity:0;transition:opacity 200ms ease`;

        document.documentElement.append(panel, frame, chapter);

        const STATE_KEY = 'll-overlay-state';
        const readState = () => {
          try {
            return JSON.parse(sessionStorage.getItem(STATE_KEY) || '{}');
          } catch {
            return {};
          }
        };
        const writeState = (patch: Record<string, unknown>) => {
          try {
            sessionStorage.setItem(STATE_KEY, JSON.stringify({ ...readState(), ...patch }));
          } catch {
            // A recording with no storage available just loses the restore.
          }
        };

        const panelOpen = () => panel.dataset.open === '1';

        // Shortest the caption band is allowed to get before it starts eating
        // into the app above it.
        const MIN_BAND = 170;

        // While the panel is open, scale Home Assistant down into the space
        // beside it. Scaling rather than resizing keeps HA's own layout intact
        // (its masonry only recalculates on a window resize) and keeps the card
        // under discussion on screen next to the YAML that produced it.
        const scaleFactor = () => (window.innerWidth - panelWidth) / window.innerWidth;

        const shiftHa = (on: boolean) => {
          // The page background shows through wherever the scaled app no
          // longer reaches, so darken it to match the panel instead of
          // leaving a bright band under the dashboard.
          document.documentElement.style.background = on ? ink : '';
          const ha = document.querySelector('home-assistant') as HTMLElement | null;
          if (!ha) return;
          // <home-assistant> is an unknown element, so it defaults to
          // display:inline and a transform on it would be ignored. Blocking it
          // also makes it the containing block for its fixed children, which is
          // what carries the whole app across.
          ha.style.display = on ? 'block' : '';
          ha.style.transition = 'transform 220ms ease';
          ha.style.transformOrigin = 'top left';
          // translate applies before scale, so the offset is not scaled: use it as is.
          ha.style.transform = on ? `translateX(${panelWidth}px) scale(${scaleFactor()})` : '';
        };

        const zoneRect = (zone: string) => {
          const w = window.innerWidth;
          const h = window.innerHeight;
          const open = panelOpen();
          // How far down the frame the scaled dashboard still reaches. A view
          // with an expanded status card runs past the bottom of the frame, so
          // measure the element and cap it at the frame.
          const ha = document.querySelector('home-assistant') as HTMLElement | null;
          const measured = ha ? ha.getBoundingClientRect().bottom : 0;
          const haBottom = open ? Math.min(Math.max(measured, h * scaleFactor()), h) : h;
          if (zone === 'panel') return { left: 0, top: 0, width: open ? panelWidth : w, height: h };
          if (zone === 'screen') return { left: 0, top: 0, width: w, height: h };
          const left = open ? panelWidth : 0;
          if (zone === 'below') {
            // The band always ends at the bottom of the frame. When the app
            // reaches that far there is no clear space left, so take a strip
            // off its bottom rather than placing the caption off screen.
            const top = Math.min(haBottom, h - MIN_BAND);
            return { left, top, width: w - left, height: h - top };
          }
          return { left, top: 0, width: w - left, height: haBottom };
        };

        const ALIGN: Record<string, [string, string]> = {
          'top-left': ['flex-start', 'flex-start'],
          top: ['center', 'flex-start'],
          'top-right': ['flex-end', 'flex-start'],
          left: ['flex-start', 'center'],
          center: ['center', 'center'],
          right: ['flex-end', 'center'],
          'bottom-left': ['flex-start', 'flex-end'],
          bottom: ['center', 'flex-end'],
          'bottom-right': ['flex-end', 'flex-end'],
        };

        const w = window as any;
        w.__llCaption = (text: string, at: string, zone: string) => {
          writeState({ caption: { text, at, zone } });
          const rect = zoneRect(zone);
          frame.style.left = `${rect.left}px`;
          frame.style.top = `${rect.top}px`;
          frame.style.width = `${rect.width}px`;
          frame.style.height = `${rect.height}px`;
          const [justify, align] = ALIGN[at] || ALIGN.bottom;
          frame.style.justifyContent = justify;
          frame.style.alignItems = align;
          bubble.textContent = text;
          bubble.style.opacity = text ? '1' : '0';
          bubble.style.transform = text ? 'translateY(0)' : 'translateY(10px)';
        };
        w.__llChapter = (text: string) => {
          writeState({ chapter: text });
          chapter.textContent = text;
          chapter.style.opacity = text ? '1' : '0';
        };
        w.__llCode = (t: string, html: string) => {
          writeState({ code: { title: t, html } });
          title.textContent = t;
          body.innerHTML = html;
          body.scrollTop = 0;
          panel.dataset.open = '1';
          panel.style.transform = 'translateX(0)';
          shiftHa(true);
        };
        w.__llHideCode = () => {
          writeState({ code: null });
          delete panel.dataset.open;
          panel.style.transform = 'translateX(-100%)';
          shiftHa(false);
        };

        // Put back whatever was on screen before the reload. The code panel
        // goes first so the caption measures against the right zone, and the
        // app is re-scaled as soon as <home-assistant> exists.
        const restore = () => {
          const state = readState();
          if (state.code) {
            w.__llCode(state.code.title, state.code.html);
            const settle = window.setInterval(() => {
              if (!panelOpen()) return window.clearInterval(settle);
              if (document.querySelector('home-assistant')) {
                shiftHa(true);
                window.clearInterval(settle);
              }
            }, 100);
            window.setTimeout(() => window.clearInterval(settle), 15_000);
          }
          if (state.chapter) w.__llChapter(state.chapter);
          if (state.caption?.text) {
            w.__llCaption(state.caption.text, state.caption.at, state.caption.zone);
          }
        };
        restore();
      };
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', install);
      } else {
        install();
      }
    },
    { panelWidth: PANEL_WIDTH },
  );
}

async function ready(page: Page): Promise<void> {
  await page.waitForFunction(() => !!(window as any).__llCaption, null, { timeout: 30_000 });
}

// Hold a caption long enough to read: roughly 14 characters a second, with a
// floor so short lines do not flash past.
const readingTime = (text: string) => Math.max(2200, Math.min(7500, text.length * 72));

export async function say(page: Page, text: string, options: SayOptions = {}): Promise<void> {
  const { at = 'bottom', zone = 'stage', ms } = options;
  await ready(page);
  await page.evaluate(([t, a, z]) => (window as any).__llCaption(t, a, z), [text, at, zone] as const);
  await page.waitForTimeout(ms ?? readingTime(text));
}

export async function clearCaption(page: Page): Promise<void> {
  await ready(page);
  await page.evaluate(() => {
    (window as any).__llCaption('', 'bottom', 'stage');
    (window as any).__llChapter('');
  });
}

// A small badge in the top right corner naming the act on screen, so a viewer
// joining part way through knows where they are.
export async function chapter(page: Page, index: number, total: number, name: string): Promise<void> {
  await ready(page);
  await page.evaluate(
    ([text]) => (window as any).__llChapter(text),
    [`${index}/${total}  ${name}`] as const,
  );
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Show YAML in the panel, with the keys under discussion picked out.
export async function showCode(
  page: Page,
  title: string,
  yamlText: string,
  highlights: string[] = [],
  ms = 0,
): Promise<void> {
  await ready(page);
  let html = escapeHtml(yamlText.trim());
  for (const h of highlights) {
    html = html.replace(
      new RegExp(escapeRe(escapeHtml(h)), 'g'),
      (m) => `<mark style="background:#264d6b;color:#9fe6ff;border-radius:3px;padding:0 2px">${m}</mark>`,
    );
  }
  await page.evaluate(([t, h]) => (window as any).__llCode(t, h), [title, html] as const);
  if (ms) await page.waitForTimeout(ms);
}

export async function hideCode(page: Page): Promise<void> {
  await ready(page);
  await page.evaluate(() => (window as any).__llHideCode());
}
