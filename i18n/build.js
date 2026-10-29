// يبني نسخة cs ثنائية اللغة من index.html الأصلي بلا تعديله: تطبيق رقع نصية دقيقة (كل رقعة يجب أن تنطبق مرة واحدة بالضبط) + حقن النواة والقاموس.
// الاستخدام: node i18n/build.js [مخرجات=i18n/dist/index.html]   |  require('./build').build(html) للاختبارات
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const PATCHES = [
  // ترجمة تسميات الرسوم والتلميحات (عند العرض فقط؛ القيم الأصلية لا تتغير)
  ["label:'عدد الشحنات'", "label:TR('عدد الشحنات')", 7],
  ["label:'نسبة التسليم %'", "label:TR('نسبة التسليم %')", 1],
  ["label:'عدد الراسلين'", "label:TR('عدد الراسلين')", 1],
  ["ctx.parsed.y===null ? 'لا توجد شحنات'", "ctx.parsed.y===null ? TR('لا توجد شحنات')", 1],
  ["labels: statusKeys.map(k=>statusLabels[k]||k)", "labels: statusKeys.map(k=>TR(statusLabels[k]||k))", 1],
  ["labels: finalKeys,", "labels: finalKeys.map(TR),", 1],
  ["labels: govTop.map(x=>x[0])", "labels: govTop.map(x=>TR(x[0]))", 1],
  ["labels: cityKeys,", "labels: cityKeys.map(TR),", 1],
  ["labels: segOrder,", "labels: segOrder.map(TR),", 1],
  ["labels: amTop.map(x=>x[0])", "labels: amTop.map(x=>TR(x[0]))", 1],
  ["labels: reasonTop.map(x=>x[0])", "labels: reasonTop.map(x=>TR(x[0]))", 1],
  // رؤوس CSV تُترجم حسب اللغة؛ قيم الخلايا تبقى كما في المصدر
  ["EXPORT_COLUMNS.map(c=>csvEscape(c.label)).join(',')", "EXPORT_COLUMNS.map(c=>csvEscape(TR(c.label))).join(',')", 1],
];
const HEAD_BTN = ['<div class="top-meta">', '<div class="top-meta">\n      <button class="btn-reset" id="langToggle" type="button" data-lang-toggle data-no-i18n style="align-self:flex-start;white-space:nowrap">English</button>', 1];
function count(s, sub) { return s.split(sub).length - 1; }
function build(html) {
  let out = html; const NL = html.includes('\r\n') ? '\r\n' : '\n';   // الملف الأصلي CRLF
  for (const [a, b, n] of PATCHES.concat([HEAD_BTN])) {
    const c = count(out, a); if (c !== n) throw new Error(`patch "${a.slice(0, 50)}" matched ${c} times, expected ${n}`);
    out = out.split(a).join(b);
  }
  const core = fs.readFileSync(path.join(__dirname, 'arrive-i18n.js'), 'utf8'), dict = fs.readFileSync(path.join(__dirname, 'cs.dict.js'), 'utf8');
  const inject = '<script>\n' + core + '\n</script>\n<script>\n' + dict + '\n</script>\n<script>\nconst TR = (s) => ArriveI18n.tr(s);\nArriveI18n.init({ dom: true, phrases: CS_I18N.phrases, patterns: CS_I18N.patterns, storageKey: "arrive_lang" });\n</script>\n';
  out = out.replace('</head>', () => '<style>#langToggle{background:rgba(255,255,255,.14);color:#fff;border:1px solid rgba(255,255,255,.55);padding:6px 14px;border-radius:7px;cursor:pointer;font-family:inherit}#langToggle:hover{background:rgba(255,255,255,.25)}</style></head>');
  const marker = '<script>' + NL + 'const COMPACT = ';
  if (count(out, marker) !== 1) throw new Error('COMPACT script marker not found once');
  out = out.replace(marker, () => inject + marker);
  // إعادة العرض عند تبديل اللغة (الرسوم/الجداول/الفلاتر تُبنى من البيانات)
  const tail = 'boot();' + NL + NL + '</script>';
  if (count(out, tail) !== 1) throw new Error('boot tail not found once');
  out = out.replace(tail, () => 'boot();' + NL + 'ArriveI18n.onChange(() => { refreshAll(); renderLiveDataQuality(ROWS); renderFeedback(); renderSegmentLegend(); });' + NL + NL + '</script>');
  return out;
}
// ---------------------------------------------------------------------------
// سلامة الإخراج: الناتج قد يحوي بيانات حقيقية (إن بُني من الأصل) ⇒ يُكتب حصرًا داخل i18n/dist/ (المتجاهَل في Git)،
// ولا يُسمح بالكتابة فوق الأصل ولا فوق ملف المصدر ولا فوق أي ملف مرتبط به (رابط رمزي أو صلب)، ولا خارج dist/.
// ---------------------------------------------------------------------------
const ORIGINAL = path.join(ROOT, 'index.html');
const DIST = path.join(__dirname, 'dist');
function realOrSelf(p) { try { return fs.realpathSync(p); } catch (e) { return path.resolve(p); } }
function sameFile(a, b) {
  try { const x = fs.statSync(a), y = fs.statSync(b); return x.dev === y.dev && x.ino === y.ino; } catch (e) { return false; }
}
function assertSafeOutput(out, source) {
  if (typeof out !== 'string' || !out) throw new Error('مسار الإخراج مطلوب');
  const abs = path.resolve(out);
  const reject = (why) => { throw new Error('رُفض مسار الإخراج: ' + why); };
  if (!/\.html$/i.test(abs)) reject('الامتداد يجب أن يكون .html');
  // 1) لا الأصل ولا المصدر (بالمسار أو بالهوية inode أو عبر الرابط الرمزي)
  for (const protectedFile of [ORIGINAL, source].filter(Boolean)) {
    if (abs === path.resolve(protectedFile) || realOrSelf(abs) === realOrSelf(protectedFile) || sameFile(abs, protectedFile)) reject('يطابق ملفًا محميًا (الأصل أو المصدر)');
  }
  // 2) داخل i18n/dist/ فقط — بعد حل الروابط الرمزية للمجلد الأب (لا هروب عبر symlink أو ..)
  fs.mkdirSync(DIST, { recursive: true });
  const distReal = fs.realpathSync(DIST);
  let parent = path.dirname(abs); while (!fs.existsSync(parent) && parent !== path.dirname(parent)) parent = path.dirname(parent);
  const parentReal = fs.realpathSync(parent), rel = path.relative(distReal, path.join(parentReal, path.relative(parent, path.dirname(abs))));
  if (rel.startsWith('..') || path.isAbsolute(rel)) reject('خارج i18n/dist/');
  if (fs.existsSync(abs) && fs.lstatSync(abs).isDirectory()) reject('المسار مجلد');
  if (fs.existsSync(abs) && fs.lstatSync(abs).isSymbolicLink()) reject('المسار رابط رمزي');
  return abs;
}
function buildToFile(out, html, source) {
  const abs = assertSafeOutput(out, source);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, build(html));
  return abs;
}
module.exports = { build, buildToFile, assertSafeOutput, PATCHES, DIST, ORIGINAL };
if (require.main === module) {
  // الاستخدام: node i18n/build.js [--source <ملف>] [--out <ملف داخل i18n/dist/>]
  const args = process.argv.slice(2); const get = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
  if (args.length && !args.every((a, i) => a === '--source' || a === '--out' || args[i - 1] === '--source' || args[i - 1] === '--out')) { console.error('استخدام: node i18n/build.js [--source <ملف>] [--out <ملف داخل i18n/dist/>]'); process.exit(2); }
  const source = get('--source') ? path.resolve(get('--source')) : ORIGINAL;
  const out = get('--out') || path.join(DIST, 'index.html');
  try {
    const abs = buildToFile(out, fs.readFileSync(source, 'utf8'), source);
    console.log('built', path.relative(ROOT, abs), '(' + fs.statSync(abs).size + ' bytes)');   // المسار والحجم فقط — لا محتوى
  } catch (e) { console.error(String(e.message).slice(0, 200)); process.exit(1); }
}
