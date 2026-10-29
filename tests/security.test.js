// اختبارات أمان cs (بيانات اصطناعية فقط — لا اتصال بأي خدمة حقيقية).
// التشغيل:  node tests/security.test.js     (يحتاج playwright + chromium)
// INDEX=<مسار> لاختبار نسخة أخرى (ضابط سالب على الكود القديم).
const { chromium } = require('playwright');
const path = require('path');
const INDEX = process.env.INDEX || path.join(__dirname, '..', 'index.html');
const X = '<img src=x onerror="window.__xss=(window.__xss||0)+1">';
let pass = 0, fail = 0;
const check = (n, c, extra) => { c ? pass++ : fail++; console.log((c ? 'PASS' : 'FAIL') + ' - ' + n + (c || extra === undefined ? '' : ' ' + JSON.stringify(extra))); };
const rec = (i, o) => Object.assign({ id: 'T' + i, sender: 'راسل ' + i, gov: 'القاهرة', branch: 'فرع ' + i, service_type: 'عادي', admin: 'a', pickup_date: '2026-08-0' + (1 + i % 5), ship_status: 's', final_status: 'تم التسليم', status: 'delivered', city_group: 'c', account_manager: 'AM' + i, branch_type: 'b', area: 'x', status_reason: null, ship_cost: 20 + i, collect_amt: 100 + i, age: 2 }, o || {});

(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const pg = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; pg.on('pageerror', (e) => errs.push(String(e).slice(0, 120)));
  await pg.route('**/*', (r) => r.request().url().startsWith('file:') ? r.continue() : r.abort());
  await pg.addInitScript(() => { window.__blobs = []; const o = URL.createObjectURL; URL.createObjectURL = (b) => { window.__blobs.push(b); return o.call(URL, b); }; });
  await pg.goto('file://' + INDEX, { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(2500);

  // --- 1) بيانات ضارة في كل الحقول النصية تمر عبر مسار التحميل الحقيقي ---
  const recs = [];
  for (let i = 0; i < 8; i++) recs.push(rec(i, { sender: X + i, gov: X, branch: X + i, service_type: X, final_status: X, status: X, account_manager: X + i, id: X + i }));
  recs.push(rec(20, { sender: '=HYPERLINK("http://x","c")', account_manager: '+1+1', branch: '-2+3', gov: '@SUM(1)' }));
  recs.push(rec(21, { sender: 'اسم عادي - A+B' }));
  await pg.evaluate((r) => { setDataset(buildRowsFromLiveRecords(r), {}); }, recs);
  await pg.waitForTimeout(1200);
  // فتح كل خانات الاختيار في فلاتر الاختيار المتعدد (يولّد chips)
  await pg.evaluate(() => { document.querySelectorAll('.ms-option input[type=checkbox]').forEach((cb) => { if (!cb.checked) cb.click(); }); });
  await pg.waitForTimeout(600);
  // تمرير الماوس على كل الرسوم لتوليد التلميحات
  const boxes = await pg.evaluate(() => [...document.querySelectorAll('canvas')].map((c) => { const r = c.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; }).filter((r) => r.w > 20 && r.h > 20));
  for (const bx of boxes.slice(0, 8)) {
    await pg.evaluate(([y]) => window.scrollTo(0, window.scrollY + y - 200), [bx.y]).catch(() => {});
    const bb = await pg.evaluate((i) => { const c = [...document.querySelectorAll('canvas')][i]; const r = c.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; }, boxes.indexOf(bx));
    for (let k = 1; k < 12; k++) { await pg.mouse.move(bb.x + bb.w * k / 12, bb.y + bb.h * 0.6); }
  }
  // ملاحظات العملاء (ثابتة في الكود): نضيف عنصرًا ضارًا ثم نعيد العرض
  await pg.evaluate((x) => { FEEDBACK_DATA.push({ date: x, account_manager: x, sender: x, feedback: x }); renderFeedback(); }, X);
  await pg.waitForTimeout(500);
  // رسالة الخطأ في شريط المصدر
  await pg.evaluate((x) => { setDataSourceStatus('🔴 (' + escHtml(x) + ')'); }, X).catch(() => {});

  check('XSS: لا تنفيذ لأي حمولة (جدول، شرائح، chips، تلميحات، ملاحظات)', (await pg.evaluate('window.__xss||0')) === 0, await pg.evaluate('window.__xss||0'));
  check('XSS: لا عناصر img[onerror] في DOM', (await pg.evaluate("document.querySelectorAll('img[onerror]').length")) === 0);
  check('XSS: النص الضار ظاهر كنص في الجدول (الوظيفة محفوظة)', await pg.evaluate("document.getElementById('tableBody').textContent.includes('<img src=x')"));
  check('لا أخطاء JavaScript أثناء الاختبار', errs.length === 0, errs.slice(0, 2));

  // --- 2) CSV ---
  await pg.evaluate('exportFilteredCSV()');
  await pg.waitForTimeout(400);
  const csv = await pg.evaluate(async () => (window.__blobs.length ? await window.__blobs[window.__blobs.length - 1].text() : ''));
  check('CSV: تم توليد الملف', csv.length > 0);
  const body = csv.replace(/^﻿/, '').split('\r\n').slice(1).join('\n');
  const bad = body.match(/(^|,)"?[=+\-@\t]/gm) || [];
  check('CSV: لا خلية نصية تبدأ بـ = + - @', bad.length === 0, bad.slice(0, 3));
  check("CSV: =HYPERLINK و +1+1 و -2+3 و @SUM سبقها '", csv.includes("'=HYPERLINK(") && csv.includes("'+1+1") && csv.includes("'-2+3") && csv.includes("'@SUM(1)"));
  check('CSV: القيمة العادية (A+B) لم تتغير', csv.includes('اسم عادي - A+B'));
  check('CSV: الأرقام (تكلفة/تحصيل) لم تتأثر', /,2[0-9],1[0-9]{2}(\r|\n|$)/.test(csv));

  await b.close();
  console.log(`\n${pass}/${pass + fail} اختبارًا ناجحًا`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('FATAL', e.message); process.exit(2); });
