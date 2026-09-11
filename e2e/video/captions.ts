import { Page } from '@playwright/test';

// Caption bar for the demo recording. It is injected into the page itself so
// Playwright's video capture (which records the viewport) picks it up, and it
// hangs off <html> rather than <body> so it survives Home Assistant's
// client-side navigation.
export async function installCaptions(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const install = () => {
      if (document.getElementById('ll-caption')) return;
      const bar = document.createElement('div');
      bar.id = 'll-caption';
      bar.style.cssText = [
        'position:fixed',
        'left:0',
        'right:0',
        'bottom:0',
        'z-index:2147483647',
        'background:rgba(8,12,20,0.9)',
        'color:#fff',
        'font:600 21px/1.45 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif',
        'padding:16px 28px',
        'text-align:center',
        'pointer-events:none',
        'opacity:0',
        'transition:opacity 180ms ease',
      ].join(';');
      document.documentElement.appendChild(bar);
      (window as Record<string, unknown>).__llCaption = (text: string) => {
        bar.textContent = text;
        bar.style.opacity = text ? '1' : '0';
      };
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', install);
    } else {
      install();
    }
  });
}

// Show a caption, then hold it long enough to read (roughly 14 characters per
// second, with a floor so short lines do not flash past).
export async function say(page: Page, text: string, ms?: number): Promise<void> {
  await page.waitForFunction(() => !!(window as Record<string, unknown>).__llCaption, null, {
    timeout: 30_000,
  });
  await page.evaluate((t) => (window as any).__llCaption(t), text);
  await page.waitForTimeout(ms ?? Math.max(2200, Math.min(7000, text.length * 70)));
}

export async function clearCaption(page: Page): Promise<void> {
  await page.evaluate(() => (window as any).__llCaption?.(''));
}
