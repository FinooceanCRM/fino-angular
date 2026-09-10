import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = 'http://localhost:4200';
const API = 'http://127.0.0.1:8000/api/v1';
const OUT = '/private/tmp/claude-501/-Users-user-Desktop-fino-fino-angular/dfdd9da1-25d1-419d-a5a8-228929d9c4bb/scratchpad/shots';
mkdirSync(OUT, { recursive: true });

const VP = { width: 393, height: 852, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const ROUTES = [
  ['sa-dashboard', '/super-admin/dashboard'],
  ['sa-users', '/super-admin/users/managers'],
  ['sa-permissions', '/super-admin/users/permissions'],
  ['sa-matching-engine', '/super-admin/settings/matching-engine'],
  ['sa-audit-logs', '/super-admin/audit-logs'],
  ['sa-reports', '/super-admin/reports/leads'],
  ['sa-approvals', '/super-admin/approvals'],
  ['sa-commissions-payouts', '/super-admin/commissions/payouts'],
  ['leads-list', '/leads'],
  ['lead-detail-new', '/leads/18'],
  ['lead-detail-assigned', '/leads/17'],
  ['tasks', '/tasks'],
  ['banks', '/banks'],
  ['documents', '/documents'],
  ['notifications', '/notifications'],
];

// [name, route, selector-to-click-to-open-a-dialog]
const DIALOGS = [
  ['dlg-bank-criteria', '/banks', 'button.row-action--view'],
  ['dlg-bank-add', '/banks', 'button[page-header-actions]'],
  ['notif-dropdown', '/super-admin/dashboard', 'app-notification-icon button, .topbar app-notification-icon .mat-mdc-icon-button'],
  ['drawer-approval', '/super-admin/approvals', 'button[aria-label="Review"], button.access-request-list__review-pill'],
];

const login = async () => {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email: 'superadmin@finoocean.test', password: '12345678', device_name: 'audit' }),
  });
  const json = await res.json();
  return { token: json.data.token, user: json.data.user };
};

const measure = () =>
  // runs in page context
  (() => {
    const de = document.documentElement;
    const scrollers = [de, document.querySelector('.mat-drawer-content')].filter(Boolean);
    let worst = { over: 0, sw: de.scrollWidth, cw: de.clientWidth, on: 'html' };
    for (const s of scrollers) {
      const over = s.scrollWidth - s.clientWidth;
      if (over > worst.over) worst = { over, sw: s.scrollWidth, cw: s.clientWidth, on: s === de ? 'html' : '.mat-drawer-content' };
    }
    let widest = null;
    if (worst.over > 1) {
      let max = 0;
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect();
        if (r.right > max && r.width > 0 && r.height > 0) {
          max = r.right;
          widest = { tag: el.tagName.toLowerCase(), cls: (el.className?.toString?.() || '').slice(0, 90), right: Math.round(r.right) };
        }
      }
    }
    // dialog check
    const dlg = document.querySelector('.mat-mdc-dialog-container');
    let dialog = null;
    if (dlg) {
      const r = dlg.getBoundingClientRect();
      const title = document.querySelector('.mat-mdc-dialog-title, [mat-dialog-title], h2');
      const tr = title?.getBoundingClientRect();
      dialog = {
        top: Math.round(r.top),
        bottom: Math.round(r.bottom),
        height: Math.round(r.height),
        titleTop: tr ? Math.round(tr.top) : null,
        titleClipped: tr ? tr.top < 8 : null,
        vh: window.innerHeight,
      };
    }
    // slide-in drawer check
    const dr = document.querySelector('.details-drawer');
    let drawer = null;
    if (dr) {
      const r = dr.getBoundingClientRect();
      const acts = document.querySelector('.details-drawer__actions');
      const close = document.querySelector('.details-drawer__close');
      const nav = document.querySelector('.bottom-nav');
      const ar = acts?.getBoundingClientRect();
      const cr = close?.getBoundingClientRect();
      const nr = nav?.getBoundingClientRect();
      // is the drawer painting above the nav? compare topmost element at the
      // nav centre point.
      let navCovered = null;
      if (nr) {
        const el = document.elementFromPoint(nr.left + nr.width / 2, nr.top + nr.height / 2);
        navCovered = el ? el.closest('.details-drawer') != null || el.closest('.details-drawer__backdrop') != null : null;
      }
      drawer = {
        box: { t: Math.round(r.top), b: Math.round(r.bottom), w: Math.round(r.width) },
        actionsBottom: ar ? Math.round(ar.bottom) : null,
        actionsClearOfNav: ar && nr ? ar.bottom <= nr.top + 1 : null,
        closeVisible: cr ? cr.width > 0 && cr.top >= 0 && cr.right <= window.innerWidth + 1 : null,
        navTop: nr ? Math.round(nr.top) : null,
        navCoveredByDrawer: navCovered,
        vh: window.innerHeight,
      };
    }
    return { ...worst, widest, dialog, drawer };
  })();

const run = async () => {
  const { token, user } = await login();
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--hide-scrollbars'] });
  const page = await browser.newPage();
  await page.setViewport(VP);
  await page.evaluateOnNewDocument(
    (t, u) => {
      localStorage.setItem('finoocean.token', t);
      localStorage.setItem('finoocean.user', JSON.stringify(u));
    },
    token,
    user,
  );

  for (const [name, route] of ROUTES) {
    try {
      await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle0', timeout: 30000 });
      await wait(1400);
      const info = await page.evaluate(measure);
      await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
      const flag = info.over > 1 ? `OVERFLOW(${info.on} +${info.over})` : 'ok';
      console.log(`${flag.padEnd(26)} ${name.padEnd(22)} ${route}` + (info.widest ? `  <- ${info.widest.tag}.${info.widest.cls}` : ''));
    } catch (e) {
      console.log(`ERROR    ${name.padEnd(22)} ${route}  ${e.message}`);
    }
  }

  for (const [name, route, sel] of DIALOGS) {
    try {
      await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle0', timeout: 30000 });
      await wait(1400);
      const clicked = await page.evaluate((s) => {
        for (const one of s.split(',').map((x) => x.trim())) {
          const el = document.querySelector(one);
          if (el) {
            el.click();
            return one;
          }
        }
        return null;
      }, sel);
      await wait(1200);
      const info = await page.evaluate(measure);
      await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
      const d = info.dialog
        ? `DLG top=${info.dialog.top} bottom=${info.dialog.bottom} h=${info.dialog.height} vh=${info.dialog.vh} titleClipped=${info.dialog.titleClipped}`
        : '';
      const dw = info.drawer
        ? `DRAWER box=${JSON.stringify(info.drawer.box)} actionsBottom=${info.drawer.actionsBottom} clearOfNav=${info.drawer.actionsClearOfNav} closeVisible=${info.drawer.closeVisible} navCoveredByDrawer=${info.drawer.navCoveredByDrawer}`
        : '';
      console.log(`OVERLAY ${name.padEnd(18)} clicked=${!!clicked}  ${d}${dw}` || `OVERLAY ${name} NOTHING OPENED`);
    } catch (e) {
      console.log(`ERROR    ${name}  ${e.message}`);
    }
  }

  await browser.close();
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
