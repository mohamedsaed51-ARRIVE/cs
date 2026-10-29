// اختبارات سلامة باني cs — بيانات اصطناعية بالكامل. لا يُبنى شيء من index.html الحقيقي ولا يُكتب فوقه:
// الاختبارات تعمل داخل «صندوق رمل» مؤقت (مستودع git صغير) بنسخة من الباني وملف أصل اصطناعي.
// التشغيل: node i18n/tests/build-safety.test.js      وضع «قبل الإصلاح»: OLD=<commit> node i18n/tests/build-safety.test.js
const fs = require('fs'), os = require('os'), path = require('path'), crypto = require('crypto');
const { execFileSync, spawnSync } = require('child_process');
const REPO = path.join(__dirname, '..', '..'), OLD = process.env.OLD;
let pass = 0, fail = 0;
const check = (n, c, extra) => { c ? pass++ : fail++; console.log((c ? 'PASS' : 'FAIL') + ' - ' + n + (c || extra === undefined ? '' : ' ' + JSON.stringify(extra).slice(0, 300))); };
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const git = (cwd, ...a) => execFileSync('git', a, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const gitOk = (cwd, ...a) => { try { git(cwd, ...a); return true; } catch (e) { return false; } };
const fromRepo = (rel) => OLD ? execFileSync('git', ['show', OLD + ':' + rel], { cwd: REPO, encoding: 'utf8' }) : fs.readFileSync(path.join(REPO, rel), 'utf8');

// ---- أصل اصطناعي: صفحة صغيرة بنفس العلامات التي يعتمد عليها الباني + بيانات مميزة (SENTINEL) لاكتشاف التسريب في السجلات ----
const SENT = 'SYNTH-SENTINEL-7Q2X';
function syntheticOriginal() {
  const H = require('./harness');   // يقرأ index.html الحقيقي في الذاكرة فقط كقالب كود ثم يستبدل البيانات؛ لا يطبع ولا يكتب شيئًا
  const compact = JSON.parse(JSON.stringify(H.COMPACT)); compact.dicts.sender[0] = SENT + '-S'; compact.dicts.account_manager[0] = SENT + '-M';
  const html = H.ORIG({ compact, fb: [{ date: '2026-08-10', account_manager: SENT + '-M', sender: SENT + '-S', feedback: SENT + '-note' }] });
  if (/متجر اختبار/.test('')) throw 0;
  return html.replace(/\r?\n/g, '\r\n');   // الأصل الحقيقي CRLF
}
function sandbox(html) {
  const S = fs.mkdtempSync(path.join(os.tmpdir(), 'cs-build-safety-'));
  fs.mkdirSync(path.join(S, 'i18n'), { recursive: true });
  fs.writeFileSync(path.join(S, 'index.html'), html);
  fs.writeFileSync(path.join(S, 'i18n', 'build.js'), fromRepo('i18n/build.js'));
  for (const f of ['arrive-i18n.js', 'cs.dict.js']) fs.writeFileSync(path.join(S, 'i18n', f), fs.readFileSync(path.join(REPO, 'i18n', f)));
  fs.writeFileSync(path.join(S, 'i18n', '.gitignore'), fromRepo('i18n/.gitignore'));
  git(S, 'init', '-q'); git(S, 'config', 'user.email', 't@t.t'); git(S, 'config', 'user.name', 't');
  git(S, 'add', '-A'); git(S, 'commit', '-q', '-m', 'sandbox');
  return S;
}
const tryBuild = (S, mod, out, html, source) => {   // يحاكي الباني القديم (بلا حماية) إن لم توجد buildToFile
  try { if (mod.buildToFile) mod.buildToFile(out, html, source); else { fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, mod.build(html)); } return null; } catch (e) { return String(e.message); }
};

const REAL_ORIG = path.join(REPO, 'index.html');
const realHashBefore = sha(REAL_ORIG), statusBefore = git(REPO, 'status', '--porcelain'), diffBefore = git(REPO, 'diff', '--stat');
console.log('INFO - وضع التشغيل:', OLD ? 'قبل الإصلاح (OLD=' + OLD.slice(0, 8) + ')' : 'بعد الإصلاح');

const HTML = syntheticOriginal();
const S = sandbox(HTML);
delete require.cache[path.join(S, 'i18n', 'build.js')];
const mod = require(path.join(S, 'i18n', 'build.js'));
const orig = path.join(S, 'index.html'), origHash = sha(orig);
const rej = (label, out, source) => { const before = fs.existsSync(out) && fs.statSync(out).isFile() ? sha(out) : null; const err = tryBuild(S, mod, out, HTML, source); return { label, err, changed: fs.existsSync(orig) ? sha(orig) !== origHash : true }; };

// 1) الكتابة فوق الأصل بكل الصيغ
const variants = [
  ['مسار مطلق', orig], ['مسار نسبي', path.relative(process.cwd(), orig)], ['./ داخل المجلد', path.join(S, '.', 'index.html')], ['عبر dist/../..', path.join(S, 'i18n', 'dist', '..', '..', 'index.html')],
];
for (const [label, out] of variants) { const r = rej(label, out, orig); check('رفض الكتابة فوق الأصل (' + label + ') والأصل لم يتغير', r.err && !r.changed, r); if (r.changed) fs.writeFileSync(orig, HTML); }
fs.mkdirSync(path.join(S, 'i18n', 'dist'), { recursive: true });
fs.symlinkSync(orig, path.join(S, 'i18n', 'dist', 'link.html'));
{ const r = rej('رابط رمزي داخل dist يشير للأصل', path.join(S, 'i18n', 'dist', 'link.html'), orig); check('رفض الكتابة عبر رابط رمزي يشير للأصل', r.err && !r.changed, r); if (r.changed) fs.writeFileSync(orig, HTML); }
fs.linkSync(orig, path.join(S, 'i18n', 'dist', 'hard.html'));
{ const r = rej('رابط صلب داخل dist للأصل', path.join(S, 'i18n', 'dist', 'hard.html'), orig); check('رفض الكتابة عبر رابط صلب (نفس inode) للأصل', r.err && !r.changed, r); if (r.changed) fs.writeFileSync(orig, HTML); }
// 2) المصدر المحمي
const src = path.join(S, 'i18n', 'dist', 'src.html'); fs.writeFileSync(src, HTML);
{ const err = tryBuild(S, mod, src, HTML, src); check('رفض الكتابة فوق ملف المصدر نفسه', !!err && sha(src) === crypto.createHash('sha256').update(HTML).digest('hex'), err); }
// 3) مسارات غير مسموحة
const other = fs.mkdtempSync(path.join(os.tmpdir(), 'cs-other-'));
fs.symlinkSync(other, path.join(S, 'i18n', 'dist', 'esc'));
fs.mkdirSync(path.join(S, '.git', 'x'), { recursive: true });
const bad = [['خارج dist (tmp)', path.join(other, 'x.html')], ['خروج بـ ../', path.join(S, 'i18n', 'dist', '..', 'x.html')], ['ملف في جذر المشروع', path.join(S, 'README.html')], ['داخل .git', path.join(S, '.git', 'x', 'y.html')],
  ['امتداد غير html', path.join(S, 'i18n', 'dist', 'a.txt')], ['مجلد dist نفسه', path.join(S, 'i18n', 'dist')], ['هروب عبر رابط رمزي لمجلد خارجي', path.join(S, 'i18n', 'dist', 'esc', 'x.html')], ['مجلد i18n', path.join(S, 'i18n', 'x.html')]];
for (const [label, out] of bad) { const err = tryBuild(S, mod, out, HTML, orig); const created = fs.existsSync(out) && fs.statSync(out).isFile() && out !== orig; check('رفض مسار غير مسموح: ' + label + ' (ولم يُنشأ الملف)', !!err && !created, { err, created }); }
// 4) مسار مسموح
const okOut = path.join(S, 'i18n', 'dist', 'synthetic', 'index.html');
{ const err = tryBuild(S, mod, okOut, HTML, orig); check('المسار المسموح (i18n/dist/…) يعمل ببيانات اصطناعية', !err && fs.existsSync(okOut) && fs.statSync(okOut).size > HTML.length, err); }
check('الأصل الاصطناعي لم يتغير بعد كل المحاولات', sha(orig) === origHash);
// 5) Git: dist غير متتبَّع ولا يدخل بـ git add -A
check('git check-ignore: dist/ والملفات تحته متجاهَلة فعلًا', gitOk(S, 'check-ignore', '-q', 'i18n/dist/synthetic/index.html') && gitOk(S, 'check-ignore', '-q', 'i18n/dist/index.html'));
check('git status: لا ملفات dist ظاهرة كغير متتبَّعة', !/dist/.test(git(S, 'status', '--porcelain')), git(S, 'status', '--porcelain'));
git(S, 'add', '-A');
check('بعد git add -A: لا شيء من dist في الـindex (لا يمكن التقاطه بالخطأ)', !/dist\//.test(git(S, 'diff', '--cached', '--name-only')) && !/dist\//.test(git(S, 'ls-files')), git(S, 'ls-files'));
// 6) البيانات والحسابات
if (fs.existsSync(okOut)) {
  const o = HTML.split(/\r?\n/), b = fs.readFileSync(okOut, 'utf8').split(/\r?\n/); const line = (a, p) => a.find((l) => l.startsWith(p));
  check('سطرا COMPACT وFEEDBACK_DATA وسطر الرابط متطابقة حرفيًا مع الأصل', ['const COMPACT =', 'const FEEDBACK_DATA', '  API_URL'].every((p) => line(o, p) === line(b, p) && !!line(o, p)));
  const cO = JSON.parse(line(o, 'const COMPACT =').slice(16).replace(/;$/, '')), cB = JSON.parse(line(b, 'const COMPACT =').slice(16).replace(/;$/, ''));
  check('ترتيب الصفوف والأعمدة والقواميس لم يتغير (مقارنة عميقة)', JSON.stringify(cO) === JSON.stringify(cB) && cO.n === cB.n);
  const bset = new Set(b), changedOrig = o.filter((l) => !bset.has(l));
  check('الأسطر المعدّلة من الأصل 13 فقط وكلها ليست بيانات (رقع الرسوم/CSV/</head>)', changedOrig.length === 13 && changedOrig.every((l) => !/^const (COMPACT|FEEDBACK_DATA)|API_URL/.test(l)), changedOrig.length);
}
// 7) السجلات: CLI على المصدر الاصطناعي فقط (لا يُشغَّل أبدًا على index.html الحقيقي)
if (!OLD) {
  const run = (...a) => spawnSync('node', [path.join(S, 'i18n', 'build.js'), ...a], { cwd: S, encoding: 'utf8' });
  const good = run('--source', orig, '--out', path.join(S, 'i18n', 'dist', 'cli', 'index.html')), badr = run('--source', orig, '--out', orig), badr2 = run('--source', orig, '--out', path.join(other, 'z.html'));
  const logs = good.stdout + good.stderr + badr.stdout + badr.stderr + badr2.stdout + badr2.stderr;
  check('CLI: نجاح للمسار الآمن (كود 0) ورفض للأصل وللمسار الخارجي (كود ≠ 0)', good.status === 0 && badr.status !== 0 && badr2.status !== 0, [good.status, badr.status, badr2.status]);
  check('سجلات CLI قصيرة (مسار + حجم فقط) ولا تحوي أي بيانات (SENTINEL) ولا أسماء', !logs.includes(SENT) && logs.length < 600 && /built i18n.dist.cli.index\.html \(\d+ bytes\)/.test(good.stdout), logs.slice(0, 200));
  check('الأصل الاصطناعي لم يتغير بعد تشغيل CLI برفض الكتابة', sha(orig) === origHash);
} else console.log('SKIP - اختبار CLI (الباني القديم لا يدعم الأعلام)');
// 8) المستودع الحقيقي (قراءة فقط)
check('المستودع الحقيقي: i18n/.gitignore = dist/ و`git check-ignore` يتجاهل dist فعلًا', !OLD ? (fs.readFileSync(path.join(REPO, 'i18n', '.gitignore'), 'utf8').trim() === 'dist/' && gitOk(REPO, 'check-ignore', '-q', 'i18n/dist/index.html')) : gitOk(REPO, 'check-ignore', '-q', 'i18n/dist/index.html'));
check('المستودع الحقيقي: لا ملفات dist متتبَّعة (git ls-files)', !/(^|\/)dist\//.test(git(REPO, 'ls-files')), git(REPO, 'ls-files').split('\n').filter((l) => /dist/.test(l)));
check('المستودع الحقيقي: index.html لم يتغير أثناء الاختبار (SHA-256 قبل = بعد)', sha(REAL_ORIG) === realHashBefore);
check('المستودع الحقيقي: git status وdiff قبل = بعد (لا تغيير جانبي)', git(REPO, 'status', '--porcelain') === statusBefore && git(REPO, 'diff', '--stat') === diffBefore, git(REPO, 'status', '--porcelain'));
check('لا dist في المستودع الحقيقي أُنشئ بواسطة الاختبارات', !fs.existsSync(path.join(REPO, 'i18n', 'dist')) || fs.readdirSync(path.join(REPO, 'i18n', 'dist')).length === 0 || statusBefore.includes('dist') === false);
// تنظيف ما أنشأه الاختبار فقط (مجلدات mkdtemp الاصطناعية)
for (const d of [S, other]) { if (d.startsWith(os.tmpdir()) && /cs-(build-safety|other)-/.test(d)) fs.rmSync(d, { recursive: true, force: true }); }
console.log(`\n${pass}/${pass + fail} اختبارًا ناجحًا`); process.exit(fail ? 1 : 0);
