// اختبارات Regression: لوحة cs الأصلية مقابل النسخة ثنائية اللغة المبنيّة — بيانات اصطناعية، بلا شبكة. التشغيل: node i18n/tests/cs-i18n.test.js
const H = require('./harness');
const { execSync } = require('child_process');
let pass = 0, fail = 0;
const check = (n, c, extra) => { c ? pass++ : fail++; console.log((c ? 'PASS' : 'FAIL') + ' - ' + n + (c || extra === undefined ? '' : ' ' + JSON.stringify(extra).slice(0, 500))); };
const AR = /[؀-ۿ]/;
const ALLOWED_TXT = /متجر اختبار|متجر \d+|مدير اختبار|محافظة تجريبية غير معرّفة|سبب تجريبي غير معرّف|ملاحظة اختبارية بالعربية|منطقة تجريبية|المنصورة|مدينة نصر|المعادي|الهرم|لا يوجد شيء هنا/g;
const isAllowed = (s) => /^js:/.test(s) ? !AR.test(s.replace(ALLOWED_TXT, '')) : !AR.test(s.replace(ALLOWED_TXT, ''));
const num = (t) => { t = t.replace(/6th of October/g, 'اكتوبر'); return (t.match(/\d[\d,.]*/g) || []).map((x) => x.replace(/[.,]+$/, '')).sort().join('|'); };

(async () => {
  const b = await H.launch();
  const snapT = async (pg) => ({ t: await H.text(pg), c: await H.charts(pg) });
  let d = ''; try { d = execSync('git diff --stat ccr-5ac7ae8d-fccgxc -- . ":(exclude)i18n"', { cwd: require('path').join(__dirname, '..', '..') }).toString().trim(); } catch (e) { d = 'ERR'; }
  check('الأصل: لا فرق في أي ملف خارج i18n/ مقارنةً بالفرع الأساس', d === '', d);

  // 1) تكافؤ العربية
  const orig = await H.open(b, H.ORIG(), {}), bi = await H.open(b, H.BI(), { query: '?lang=ar' });
  const so = await H.scenario(orig, snapT), sb = await H.scenario(bi, snapT); const names = Object.keys(so);
  const td = names.filter((n) => so[n].t !== sb[n].t), cd = names.filter((n) => so[n].c !== sb[n].c);
  check('تكافؤ: نص الصفحة العربي متطابق حرفيًا في ' + names.length + ' حالة', td.length === 0, td.map((n) => { const a = so[n].t, c = sb[n].t; let i = 0; while (a[i] === c[i]) i++; return [n, a.slice(Math.max(0, i - 40), i + 60), c.slice(Math.max(0, i - 40), i + 60)]; }).slice(0, 2));
  check('تكافؤ: بيانات الرسوم (تسميات/قيم) متطابقة في كل الحالات', cd.length === 0, cd);
  check('الحالات فعلية: KPI وجداول ورسوم موجودة', names.length === 12 && so['01-initial'].t.length > 5000 && JSON.parse(so['01-initial'].c).length >= 9, [names.length, so['01-initial'].t.length]);
  const csvO = await H.csv(orig), csvB = await H.csv(bi);
  check('تصدير CSV (عربي): مطابق للأصل حرفيًا', csvO.length > 200 && csvO === csvB, [csvO.length, csvB.length]);
  check('لا أخطاء JS (الأصل والنسخة بالعربية)', orig.__errs.length === 0 && bi.__errs.length === 0, [orig.__errs, bi.__errs]);
  const kpiO = await orig.evaluate("[...document.querySelectorAll('.stub, .kpi, [id^=kpi]')].map(e=>e.innerText).join('|')"), kpiB = await bi.evaluate("[...document.querySelectorAll('.stub, .kpi, [id^=kpi]')].map(e=>e.innerText).join('|')");
  check('KPI (بعد آخر حالة): متطابقة مع الأصل', kpiO === kpiB);
  await orig.close(); await bi.close();

  // 2) الإنجليزية
  const en = await H.open(b, H.BI(), { query: '?lang=en' }); const left = {};
  const se = await H.scenario(en, async (p, name) => { (await p.evaluate('ArriveI18n.untranslated()')).forEach((x) => { (left[x] = left[x] || new Set()).add(name.slice(0, 2)); }); return snapT(p); });
  check('الإنجليزية: lang=en dir=ltr', await en.evaluate("document.documentElement.lang==='en'&&document.documentElement.dir==='ltr'"));
  const leftover = Object.keys(left).filter((s) => !isAllowed(s));
  check('الإنجليزية: لا نص عربي ظاهر غير مترجم (عدا قيم المصدر غير المعرّفة) في 12 حالة', leftover.length === 0, leftover);
  console.log('INFO - عربي متبقٍّ مسموح (قيم مصدر: أسماء راسلين/مديرين/مناطق/قيم غير معرّفة):', JSON.stringify(Object.keys(left).filter(isAllowed).filter((s) => !/متجر|Test Store|Manager/.test(s)).slice(0, 12)));
  const nd = names.filter((n) => num(so[n].t) !== num(se[n].t));
  check('الأرقام في الإنجليزية = العربية حرفيًا في كل الحالات (KPI لا تتغير)', nd.length === 0, nd.map((n) => { const a = num(so[n].t).split('|'), c = num(se[n].t).split('|'); const cnt = (arr) => arr.reduce((m, x) => (m[x] = (m[x] || 0) + 1, m), {}); const A = cnt(a), C = cnt(c); return [n, Object.keys(A).filter((k) => A[k] !== C[k]).slice(0, 6), Object.keys(C).filter((k) => A[k] !== C[k]).slice(0, 6)]; }).slice(0, 2));
  const cn = names.filter((n) => JSON.stringify(JSON.parse(so[n].c).map((x) => x.ds.map((d) => d.d))) !== JSON.stringify(JSON.parse(se[n].c).map((x) => x.ds.map((d) => d.d))));
  check('قيم الرسوم (البيانات) في الإنجليزية = العربية', cn.length === 0, cn);
  const chs = JSON.stringify(JSON.parse(se['01-initial'].c).map((x) => [x.labels, x.ds.map((d) => d.l)]));
  check('تسميات الرسوم بالإنجليزية: السلاسل والفئات (حالة/محافظة/خدمة)', /Number of shipments/.test(chs) && /Delivery rate %/.test(chs) && /Delivered/.test(chs) && /Successful delivery/.test(chs) && /Alexandria|Cairo/.test(chs) && /Number of senders/.test(chs), chs.slice(0, 300));
  const csvE = await H.csv(en);
  const rowsO = csvO.split('\r\n'), rowsE = csvE.split('\r\n');
  check('CSV (إنجليزي): الرؤوس بالإنجليزية، وقيم الخلايا الأصلية كما هي (لا تُترجم)', /Waybill number/.test(rowsE[0]) && /Shipping cost/.test(rowsE[0]) && rowsE.length > 10 && rowsE.slice(1, 40).every((r) => r.length > 0) && /[؀-ۿ]/.test(rowsE.slice(1).join('')), rowsE[0]);
  check('قيم CSV: كل صفوف البيانات (بعد الرأس) متطابقة حرفيًا بين الأصل العربي والإنجليزية عند نفس الفلاتر', rowsO.length > 100 && JSON.stringify(rowsO.slice(1)) === JSON.stringify(rowsE.slice(1)), [rowsO.length, rowsE.length]);
  check('لا أخطاء JS في الإنجليزية', en.__errs.length === 0, en.__errs);
  check('أرقام عربية-هندية لا تظهر في الإنجليزية', !/[٠-٩]/.test(Object.values(se).map((x) => x.t).join('')));
  await en.close();

  // 3) الرجوع للعربية + الحفظ
  const o2 = await H.open(b, H.ORIG(), {}), b2 = await H.open(b, H.BI(), { query: '?lang=ar' });
  const prep = "(function(){var s=document.getElementById('f_gov');[...s.options].forEach(function(o){o.selected=['الاسكندريه','القاهره'].includes(o.value)});s.dispatchEvent(new Event('change'));document.querySelector('table thead th[data-key=age]').click();})()";
  await o2.evaluate(prep); await b2.evaluate(prep); await o2.waitForTimeout(800); await b2.waitForTimeout(800);
  await b2.evaluate("document.getElementById('langToggle').click()"); await b2.waitForTimeout(1200);
  const mid = await H.text(b2);
  await b2.evaluate("document.getElementById('langToggle').click()"); await b2.waitForTimeout(1200);
  check('ar→en→ar يعيد الصفحة إلى الأصل حرفيًا (مع فلتر وفرز نشطين)', (await H.text(b2)) === (await H.text(o2)) && /Alexandria/.test(mid), [(await H.text(b2)).length, (await H.text(o2)).length]);
  check('الفلتر النشط ظل نشطًا بعد جولة اللغات (القيم الأصلية في option.value)', await b2.evaluate("[...document.getElementById('f_gov').selectedOptions].map(o=>o.value).sort().join()") === 'الاسكندريه,القاهره');
  await o2.close(); await b2.close();
  let p = await H.open(b, H.BI(), {});
  check('الافتراضي عربي', (await p.evaluate("document.documentElement.lang")) === 'ar');
  await p.evaluate("document.getElementById('langToggle').click()"); await p.waitForTimeout(300);
  await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForFunction(() => document.getElementById('loadingScreen').style.display === 'none', null, { timeout: 30000 }).catch(() => {}); await p.waitForTimeout(1500);
  check('الحفظ: بعد reload تبقى الإنجليزية', await p.evaluate("document.documentElement.lang==='en'&&/total shipments/i.test(document.body.innerText)"));
  await p.close();

  // 4) الاتصال المباشر ورسائل الخطأ
  const live = async (mode, lang) => { const q = await H.open(b, H.BI(), { live: mode, query: '?lang=' + lang, wait: 2500 }); const s = await q.evaluate("document.getElementById('dataSourceStatus').innerText"); const bn = await q.evaluate("document.getElementById('refreshFailBanner').innerText + '|' + document.getElementById('refreshFailBanner').className"); const errs = q.__errs; await q.close(); return { s, bn, errs }; };
  const L = {}; for (const m of ['ok', 'abort', 'badjson', 'error']) for (const l of ['ar', 'en']) L[m + l] = await live(m, l);
  check('اتصال ناجح (en/ar): رسالة الحالة', /Live data loaded: 500 records/.test(L.oken.s) && /sheet "Source"/.test(L.oken.s) && /Live data loaded: 500 records/.test(L.okar.s) && /شيت "Source"/.test(L.okar.s), [L.oken.s, L.okar.s]);
  check('انقطاع الاتصال: en بالإنجليزية وar بالعربية الأصلية', /Could not connect to the live data source/.test(L.aborten.s) && /تعذّر الاتصال بمصدر البيانات المباشر/.test(L.abortar.s), [L.aborten.s, L.abortar.s]);
  check('اللافتة الحمراء: ترجمة كاملة بالإنجليزية والعربية الأصلية', /Could not refresh the data/.test(L.aborten.bn) && /تعذّر تحديث البيانات/.test(L.abortar.bn), [L.aborten.bn, L.abortar.bn]);
  check('رد غير JSON وخطأ خادم: الرسالة الإنجليزية تحوي الشرح وتحافظ على نص الخادم', /not valid JSON/.test(L.badjsonen.s) && /Could not connect/.test(L.erroren.s) && /خطأ اختباري من الخادم/.test(L.erroren.s), [L.badjsonen.s, L.erroren.s]);
  check('لا أخطاء JS في سيناريوهات الاتصال', Object.values(L).every((x) => x.errs.length === 0), Object.values(L).map((x) => x.errs));

  // 5) الاتجاه والتخطيط
  for (const [lang, dir] of [['ar', 'rtl'], ['en', 'ltr']]) for (const w of [1440, 390]) {
    const q = await H.open(b, H.BI(), { query: '?lang=' + lang, width: w, wait: 1500 });
    const ov = await q.evaluate("document.documentElement.scrollWidth<=document.documentElement.clientWidth+1");
    const info = await q.evaluate(() => { const r = document.querySelector('table thead tr').children; const a = r[0].getBoundingClientRect(), z = r[r.length - 1].getBoundingClientRect(); return a.left < z.left ? 'first-left' : 'first-right'; });
    check(`التخطيط ${lang}/${w}px: لا تمرير أفقي للصفحة`, ov, await q.evaluate("document.documentElement.scrollWidth+'/'+document.documentElement.clientWidth"));
    if (w === 1440) check(`الاتجاه ${lang}: أول عمود في الجدول ${dir === 'rtl' ? 'يمينًا' : 'يسارًا'}`, info === (dir === 'rtl' ? 'first-right' : 'first-left'), info);
    await q.close();
  }
  // 6) أمان
  const X = '<img src=x onerror="window.__xss=(window.__xss||0)+1">';
  const evil = JSON.parse(JSON.stringify(H.COMPACT)); evil.dicts.sender[1] = X + 'S'; evil.dicts.gov[0] = X + 'G'; evil.dicts.branch[0] = X + 'B'; evil.dicts.final_status[2] = X + 'F'; evil.dicts.status_reason[2] = X + 'R'; evil.dicts.account_manager[0] = X + 'A';
  for (const lang of ['ar', 'en']) {
    const q = await H.open(b, H.BI({ compact: evil }), { query: '?lang=' + lang, wait: 2000 });
    await q.evaluate("document.getElementById('langToggle').click()"); await q.waitForTimeout(1200); await q.evaluate("document.getElementById('btnExport').click()");
    const n = await q.evaluate('window.__xss||0'), imgs = await q.evaluate("document.querySelectorAll('img[onerror]').length");
    check(`XSS (${lang}→تبديل→تصدير): 0 تنفيذ و0 عنصر img[onerror]`, n === 0 && imgs === 0 && q.__errs.length === 0, [n, imgs, q.__errs]);
    await q.close();
  }
  await b.close();
  console.log(`\n${pass}/${pass + fail} اختبارًا ناجحًا`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('FATAL', e.stack || e.message); process.exit(2); });
