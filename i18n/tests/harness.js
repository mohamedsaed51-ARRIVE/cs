// أدوات اختبار cs: الصفحة الأصلية والنسخة المبنية بنفس البيانات الاصطناعية (تُستبدل COMPACT وFEEDBACK_DATA)، بلا شبكة.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const { build } = require('../build');
const ROOT = path.join(__dirname, '..', '..');
const ORIG_HTML = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let seed = 4242; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
// قواميس الفئات: مفردات تشغيلية عامة (لا أسماء عملاء)
const V = {
  gov: ['ضواحي القاهرة والجيزة', 'الاسكندريه', 'المدن الجديده', 'مدن الدلتا 2', 'القاهره', 'الصعيد 2', 'الجيزه', 'مناطق النائيه 1', 'Remote area', 'فري', null, 'محافظة تجريبية غير معرّفة'],
  branch: ['فرع المعادي', 'فرع الاسكندرية', 'فرع اكتوبر', 'فرع كفر الشيخ', 'فرع الهرم', 'فرع الشروق', 'فرع حدائق القبه', 'فرع طنطا', 'فرع مدينة نصر', 'فرع رئيسي', null],
  service_type: ['تسليم و تحصيل', 'استبدال', 'جلب مرتجع', null, 'تسليم بريدي', 'تسليم نفس اليوم', 'توقيع و استلام مستند'],
  ship_status: ['تسليم ناجح', 'قيد التوصيل', 'تم التسليم', 'مرتجعات الى الفروع', 'مشكلة في التسليم', 'المحاولة الاولي', 'تم الارتجاع للراسل', 'تم التعويض'],
  final_status: [null, 'تسليم ناجح', 'مشكلة في التسليم', 'رفض الاستلام و رفض والدفع', 'تسليم جزئي', 'تهرب بعد الوصول و التنسيق'],
  status: ['delivered', 'returned', 'inprogress', 'return', 'compensated'],
  city_group: ['Cairo&Giza', 'Alex', 'Delta', 'Upper eg', 'Canal', 'out zones', null],
  branch_type: ['فرع', 'وكيل', '#N/A'],
  status_reason: [null, 'شحنة مرتجع', '-عنوان غير واضح', 'العميل لا يرد', 'رقم خاطئ', 'جودة المنتج غير مقبولة', 'سبب تجريبي غير معرّف'],
  area: ['مدينة نصر', 'المعادي', 'الهرم', 'المنصورة', 'منطقة تجريبية'],
};
function makeData(N) {
  const dicts = {}, cols = {};
  const senders = []; for (let i = 0; i < 60; i++) senders.push(i % 3 ? 'متجر اختبار ' + i : 'Test Store ' + i + ' - متجر ' + i);
  const ams = ['Manager One', 'Manager Two', 'مدير اختبار', 'Manager Four', null];
  dicts.sender = senders; dicts.account_manager = ams; dicts.admin = ['admin 1', 'admin 2'];
  dicts.pickup_date = []; for (let d = 1; d <= 14; d++) dicts.pickup_date.push('2026-08-' + String(d).padStart(2, '0'));
  Object.keys(V).forEach((k) => { dicts[k] = V[k]; });
  const keys = Object.keys(dicts); keys.forEach((k) => { cols[k] = new Array(N); });
  cols.id = new Array(N); cols.ship_cost = new Array(N); cols.collect_amt = new Array(N); cols.age = new Array(N);
  for (let i = 0; i < N; i++) {
    keys.forEach((k) => { cols[k][i] = ri(0, dicts[k].length - 1); });
    cols.id[i] = 'AV' + (100000 + (i % (N - 25)));   // بعض المكرر
    cols.ship_cost[i] = rnd() < .05 ? null : ri(40, 120); cols.collect_amt[i] = rnd() < .3 ? null : ri(0, 1500); cols.age[i] = rnd() < .04 ? null : ri(0, 12);
    if (i % 400 === 0) cols.ship_cost[i] = -5;
  }
  return { dicts, cols, n: N };
}
const COMPACT = makeData(3000);
const FEEDBACK = [{ date: '2026-08-10', account_manager: 'Manager One', sender: 'متجر اختبار 1', feedback: 'ملاحظة اختبارية بالعربية' }, { date: '2026-08-11', account_manager: 'Manager Two', sender: 'Test Store 3', feedback: 'English test note' }, { date: '2026-08-12', account_manager: 'Manager One', sender: 'متجر اختبار 2', feedback: '' }];
function withData(html, compact, fb) {
  let out = html.replace(/const COMPACT = \{[^\n]*\};?\r?\n/, () => 'const COMPACT = ' + JSON.stringify(compact || COMPACT) + ';\n');
  out = out.replace(/const FEEDBACK_DATA = \[[^\n]*\];?\r?\n/, () => 'const FEEDBACK_DATA = ' + JSON.stringify(fb || FEEDBACK) + ';\n');
  if (!out.includes('3000') && !compact) throw new Error('data substitution failed');
  return out;
}
const ORIG = (o) => withData(ORIG_HTML, o && o.compact, o && o.fb), BI = (o) => withData(build(ORIG_HTML), o && o.compact, o && o.fb);
async function launch() { return chromium.launch({ args: ['--no-sandbox'] }); }
// live: 'abort' | 'ok' | 'badjson' | 'error'
async function open(b, html, o) {
  o = o || {};
  const pg = await b.newPage({ viewport: { width: o.width || 1440, height: o.height || 900 } });
  pg.__errs = []; pg.on('pageerror', (e) => pg.__errs.push(String(e).slice(0, 160)));
  await pg.addInitScript(() => { window.__blobs = []; const oc = URL.createObjectURL; URL.createObjectURL = (x) => { window.__blobs.push(x); return oc.call(URL, x); }; });
  if (o.storage) await pg.addInitScript((v) => { try { localStorage.setItem('arrive_lang', v); } catch (e) {} }, o.storage);
  await pg.route('**/*', (r) => {
    const u = r.request().url();
    if (u.startsWith('https://cs.test/')) return r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html });
    if (u.includes('script.google.com')) {
      const mode = o.live || 'abort', h = { 'access-control-allow-origin': '*' };
      if (mode === 'abort') return r.abort();
      if (mode === 'badjson') return r.fulfill({ status: 200, contentType: 'text/html', headers: h, body: '<html>login</html>' });
      if (mode === 'error') return r.fulfill({ status: 200, contentType: 'application/json', headers: h, body: JSON.stringify({ success: false, error: 'خطأ اختباري من الخادم' }) });
      const recs = []; const C = COMPACT; for (let i = 0; i < 500; i++) { const g = (k) => C.dicts[k][C.cols[k][i]]; recs.push({ id: 'L' + i, sender: g('sender'), gov: g('gov'), branch: g('branch'), service_type: g('service_type'), admin: g('admin'), pickup_date: g('pickup_date'), ship_status: g('ship_status'), final_status: g('final_status'), status: g('status'), city_group: g('city_group'), account_manager: g('account_manager'), branch_type: g('branch_type'), area: g('area'), status_reason: g('status_reason'), ship_cost: C.cols.ship_cost[i], collect_amt: C.cols.collect_amt[i], age: C.cols.age[i] }); }
      return r.fulfill({ status: 200, contentType: 'application/json', headers: h, body: JSON.stringify({ success: true, data: recs, hasMore: false, nextOffset: null, totalRows: 500, sheetName: 'Source' }) });
    }
    return r.abort();
  });
  await pg.goto('https://cs.test/index.html' + (o.query || ''), { waitUntil: 'domcontentloaded' });
  await pg.waitForFunction(() => { const l = document.getElementById('loadingScreen'); return l && l.style.display === 'none'; }, null, { timeout: 30000 }).catch(() => {});
  await pg.waitForTimeout(o.wait || 1500);
  return pg;
}
const norm = (s) => s.replace(/\s+/g, ' ').trim();
const text = (pg) => pg.evaluate(() => { const t = document.getElementById('langToggle'); const p = t && t.style.display; if (t) t.style.display = 'none'; const s = document.body.innerText; if (t) t.style.display = p || ''; return s; }).then(norm);
const charts = (pg) => pg.evaluate(() => JSON.stringify(Object.keys(charts).sort().map((id) => ({ id, labels: charts[id].data.labels, ds: charts[id].data.datasets.map((d) => ({ l: d.label, d: d.data })) }))));
const csv = async (pg) => { await pg.evaluate("document.getElementById('btnExport').click()"); await pg.waitForTimeout(400); return pg.evaluate(async () => (window.__blobs.length ? await window.__blobs[window.__blobs.length - 1].text() : '')); };
const ev = (pg, code) => pg.evaluate(code);
async function scenario(pg, snap) {
  const out = {}; const step = async (name, code, wait) => { await pg.evaluate(code); await pg.waitForTimeout(wait || 500); out[name] = await snap(pg, name); };
  const pick = (id, vals) => `(function(){var s=document.getElementById('${id}');[...s.options].forEach(function(o){o.selected=${JSON.stringify(vals)}.includes(o.value)});s.dispatchEvent(new Event('change'));})()`;
  await step('01-initial', '0');
  await step('02-filter-gov', pick('f_gov', ['الاسكندريه', 'القاهره']));
  await step('03-filter-branch-status', pick('f_branch', ['فرع الهرم', 'فرع طنطا']) + ';' + pick('f_status', ['delivered', 'returned']));
  await step('04-filter-final', pick('f_final_status', ['تسليم ناجح', 'مشكلة في التسليم']));
  await step('05-search', "(function(){var q=document.getElementById('f_search');q.value='AV1000';q.dispatchEvent(new Event('input'));})()", 900);
  await step('06-table-sort', "document.querySelector('#dataTable thead th[data-key=age], table thead th[data-key=age]').click()");
  await step('07-table-page', "document.getElementById('pgNext').click()");
  await step('08-seg-search-sort', "(function(){var q=document.getElementById('segSearch');q.value='متجر';q.dispatchEvent(new Event('input'));document.querySelector('#segTable thead th[data-key=rate]').click()})()", 900);
  await step('09-seg-page', "document.getElementById('segPgNext').click()");
  await step('10-empty', "(function(){var q=document.getElementById('f_search');q.value='لا يوجد شيء هنا';q.dispatchEvent(new Event('input'));})()", 900);
  await step('11-reset', "document.getElementById('btnReset').click()", 900);
  await step('12-ms-open', "document.querySelector('#f_gov_ms .ms-control, .ms-control').click()");
  return out;
}
module.exports = { launch, open, text, charts, csv, scenario, norm, ORIG, BI, COMPACT, V };
