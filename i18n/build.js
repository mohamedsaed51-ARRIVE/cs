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
module.exports = { build, PATCHES };
if (require.main === module) {
  const o = process.argv[2] || path.join(__dirname, 'dist', 'index.html');
  fs.mkdirSync(path.dirname(o), { recursive: true });
  fs.writeFileSync(o, build(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')));
  console.log('built', o);
}
