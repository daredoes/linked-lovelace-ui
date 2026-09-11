import { Page } from '@playwright/test';

// On-screen furniture for the demo recording: a caption bar along the bottom
// and a code panel down the left side. Both are injected into the page itself
// so Playwright's viewport recording picks them up, and both hang off <html>
// rather than <body> so they survive Home Assistant's client-side navigation.

const PANEL_WIDTH = 560;
const CAPTION_HEIGHT = 92;

export async function installOverlay(page: Page): Promise<void> {
  await page.addInitScript(
    ({ panelWidth, captionHeight }) => {
      const install = () => {
        if (document.getElementById('ll-caption')) return;

        const font = '-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif';
        const mono = 'ui-monospace,SFMono-Regular,Menlo,Consolas,monospace';

        const caption = document.createElement('div');
        caption.id = 'll-caption';
        caption.style.cssText = `position:fixed;left:0;right:0;bottom:0;height:${captionHeight}px;box-sizing:border-box;z-index:2147483647;background:rgba(8,12,20,0.92);color:#fff;font:600 23px/1.4 ${font};padding:18px 32px;display:flex;align-items:center;justify-content:center;text-align:center;pointer-events:none;opacity:0;transition:opacity 180ms ease`;

        const panel = document.createElement('div');
        panel.id = 'll-code';
        panel.style.cssText = `position:fixed;left:0;top:0;bottom:${captionHeight}px;width:${panelWidth}px;box-sizing:border-box;z-index:2147483646;background:#0f1420;color:#e6edf3;padding:22px 24px;overflow:hidden;display:flex;flex-direction:column;gap:12px;transform:translateX(-100%);transition:transform 220ms ease;box-shadow:2px 0 18px rgba(0,0,0,0.35);pointer-events:none`;

        const title = document.createElement('div');
        title.id = 'll-code-title';
        title.style.cssText = `font:600 16px/1.3 ${font};color:#7ee0ff;letter-spacing:0.02em`;

        const body = document.createElement('pre');
        body.id = 'll-code-body';
        body.style.cssText = `margin:0;flex:1;overflow:auto;font:14px/1.55 ${mono};white-space:pre-wrap;word-break:break-word;color:#e6edf3`;

        panel.append(title, body);
        document.documentElement.append(panel, caption);

        // While the panel is open, scale Home Assistant down into the space
        // beside it. Scaling rather than resizing keeps HA's own layout intact
        // (its masonry only recalculates on a window resize) and keeps the card
        // under discussion on screen next to the YAML that produced it.
        const shiftHa = (on: boolean) => {
          const ha = document.querySelector('home-assistant') as HTMLElement | null;
          if (!ha) return;
          const scale = (window.innerWidth - panelWidth) / window.innerWidth;
          // <home-assistant> is an unknown element, so it defaults to
          // display:inline and a transform on it would be ignored. Blocking it
          // also makes it the containing block for its fixed children, which is
          // what carries the whole app across.
          ha.style.display = on ? 'block' : '';
          ha.style.transition = 'transform 220ms ease';
          ha.style.transformOrigin = 'top left';
          // translate applies before scale, so the offset is not scaled: use it as is.
          ha.style.transform = on ? `translateX(${panelWidth}px) scale(${scale})` : '';
        };

        const w = window as any;
        w.__llCaption = (text: string) => {
          caption.textContent = text;
          caption.style.opacity = text ? '1' : '0';
        };
        w.__llCode = (t: string, html: string) => {
          title.textContent = t;
          body.innerHTML = html;
          body.scrollTop = 0;
          panel.style.transform = 'translateX(0)';
          shiftHa(true);
        };
        w.__llHideCode = () => {
          panel.style.transform = 'translateX(-100%)';
          shiftHa(false);
        };
      };
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', install);
      } else {
        install();
      }
    },
    { panelWidth: PANEL_WIDTH, captionHeight: CAPTION_HEIGHT },
  );
}

async function ready(page: Page): Promise<void> {
  await page.waitForFunction(() => !!(window as any).__llCaption, null, { timeout: 30_000 });
}

// Hold a caption long enough to read: roughly 14 characters a second, with a
// floor so short lines do not flash past.
const readingTime = (text: string) => Math.max(2200, Math.min(7500, text.length * 72));

export async function say(page: Page, text: string, ms?: number): Promise<void> {
  await ready(page);
  await page.evaluate((t) => (window as any).__llCaption(t), text);
  await page.waitForTimeout(ms ?? readingTime(text));
}

export async function clearCaption(page: Page): Promise<void> {
  await ready(page);
  await page.evaluate(() => (window as any).__llCaption(''));
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
