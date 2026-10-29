/* cs.dict.js — قاموس الإنجليزية للوحة متابعة حجم الشحنات (cs). نص مصدر عربي ← إنجليزي.
   PHRASES: نص كامل. T(ar,en): قالب {x} و{n:one|other}؛ المتغير المنتهي بـ Raw لا يُترجم؛ بـ List يُقسَّم على «، ».
   قيم الفئات (محافظة/فرع/خدمة/حالات/أسباب) تُترجم للعرض فقط؛ أسماء الراسلين/مديري الحسابات/المناطق تبقى كما هي. الترجمات تحتاج مراجعة بشرية. */
(function () {
  var PH = {}, PATS = [];
  var SUBS = { 'الاستجابة ليست JSON صالح (Invalid JSON response)': 'The response is not valid JSON (Invalid JSON response)', 'فشل غير معروف من الخادم (Unknown backend error)': 'Unknown server failure (Unknown backend error)', 'شكل الاستجابة غير متوقع — لا يوجد مصفوفة data (Unexpected response shape)': 'Unexpected response shape — no data array' };
  function add(o) { for (var k in o) PH[k] = o[k]; }
  var esc = function (s) { return s.replace(/[.*+?^$()|[\]\\]/g, '\\$&'); };
  var tv = function (x) { var r = window.ArriveI18n && ArriveI18n.trText ? ArriveI18n.trText(x) : null; return r == null ? x : r; };
  function T(ar, en) {
    var names = [];
    var re = new RegExp('^' + esc(ar).replace(/\{(\w+)\}/g, function (m, k) { names.push(k); return '(.+?)'; }) + '$');
    PATS.push([re, function (m) {
      var g = {}; names.forEach(function (k, i) { g[k] = m[i + 1]; });
      return en.replace(/\{(\w+)(?::([^|}]*)\|([^}]*))?\}/g, function (all, k, one, other) {
        var v = g[k]; if (v == null) return all;
        if (one != null) return Number(String(v).replace(/,/g, '')) === 1 ? one : other;
        if (/Raw$/.test(k)) return v;
        if (/Sub$/.test(k)) { Object.keys(SUBS).forEach(function (a) { v = v.split(a).join(SUBS[a]); }); return v; }   // عبارات خادم معروفة داخل رسالة خطأ
        if (/List$/.test(k)) return v.split('، ').map(tv).join(', ');
        return tv(v);
      });
    }]);
  }

  /* ---------- واجهة ثابتة ---------- */
  add({
    'ARRIVE | لوحة متابعة حجم الشحنات - أغسطس 2026': 'ARRIVE | Shipment Volume Tracking Dashboard - August 2026',
    'جاري تحميل بيانات الشحنات (69,369 سجل)…': 'Loading shipment data (69,369 records)…',
    'لوحة متابعة حجم الشحنات': 'Shipment Volume Tracking Dashboard',
    'تتبع يومي لحجم الشحنات والتسليم والمرتجعات على مستوى المحافظات والفروع ومديري الحسابات — بيانات أغسطس 2026': 'Daily tracking of shipment volume, deliveries and returns by governorate, branch and account manager — August 2026 data',
    'إجمالي الشحنات': 'Total shipments', 'عدد الأيام المرصودة': 'Days observed', 'الفترة': 'Period', 'آخر تاريخ بيانات': 'Latest data date',
    '📦 بيانات مضمّنة (Embedded snapshot) — لم يتم إعداد رابط Google Sheet مباشر بعد.': '📦 Embedded snapshot — no live Google Sheet link has been set up yet.',
    'تحديث تلقائي كل': 'Auto-refresh every', 'دقائق': 'minutes', '⟳ تحديث البيانات (Refresh)': '⟳ Refresh data', '⟳ جاري التحديث…': '⟳ Refreshing…',
    'اليوم': 'Day', 'المحافظة': 'Governorate', 'المنطقة (Cities)': 'Region (Cities)', 'الفرع': 'Branch', 'نوع الخدمة': 'Service type', 'الحالة': 'Status', 'الحالة النهائية': 'Final status',
    'Status: الحالة التشغيلية الحالية للشحنة (تم التسليم / مرتجعة / قيد التنفيذ / معوّض) — تصنيف عام مبسّط': 'Status: the current operational status of the shipment (Delivered / Returned / In progress / Compensated) — a simplified general classification',
    'Final Status: النتيجة التفصيلية لآخر محاولة تسليم للشحنة (مثال: تسليم ناجح، رفض العميل، لم يتم الرد...) — أدق من الحالة العامة': 'Final Status: the detailed result of the last delivery attempt (e.g. successful delivery, customer refusal, no answer…) — more precise than the general status',
    'مدير الحساب': 'Account manager', 'الراسل (Merchant)': 'Sender (Merchant)', 'بحث (رقم بوليصة / راسل)': 'Search (waybill number / sender)', 'ابحث…': 'Search…',
    'النتائج:': 'Results:', '↺ إعادة تعيين الفلاتر': '↺ Reset filters', '⭳ تصدير البيانات المفلترة (CSV)': '⭳ Export filtered data (CSV)',
    '⚠ لا توجد شحنات مطابقة للفلاتر المحددة حاليًا. جرّب تعديل الفلاتر أو اضغط "إعادة تعيين الفلاتر".': '⚠ No shipments match the current filters. Try adjusting the filters or press “Reset filters”.',
    'الاتجاه اليومي للشحنات': 'Daily shipment trend', 'عدد الشحنات المستلمة يوميًا (تاريخ استلام البيك أب) — أغسطس 2026': 'Shipments received per day (pickup receipt date) — August 2026',
    'اتجاه نسبة التسليم (Delivery Rate Trend)': 'Delivery rate trend', 'نسبة الشحنات المُسلَّمة من إجمالي شحنات نفس اليوم — لقياس جودة الأداء وليس فقط الحجم': 'Share of delivered shipments out of that day’s total — to measure performance quality, not only volume',
    'توزيع الحالة العامة': 'General status distribution', 'Status: الحالة التشغيلية الحالية للشحنة — تصنيف عام مبسّط (5 قيم)': 'Status: the shipment’s current operational status — a simplified general classification (5 values)',
    'Status: تم التسليم / مرتجع / قيد التنفيذ / معوّض': 'Status: Delivered / Returned / In progress / Compensated',
    'الحالة النهائية للشحنة': 'Shipment final status', 'Final Status: النتيجة التفصيلية لآخر محاولة تسليم — أدق من الحالة العامة': 'Final Status: the detailed result of the last delivery attempt — more precise than the general status',
    'نتيجة محاولة التسليم الأخيرة (الحالة النهائية)': 'Result of the last delivery attempt (final status)',
    'الشحنات حسب المحافظة': 'Shipments by governorate', 'أعلى المحافظات من حيث حجم الشحن': 'Top governorates by shipping volume',
    'توزيع الشحنات حسب نوع الخدمة المطلوبة': 'Shipment distribution by requested service type', 'المنطقة (Cities Group)': 'Region (Cities Group)', 'التوزيع الجغرافي المجمّع': 'Aggregated geographic distribution',
    'محفظة العملاء حسب التصنيف': 'Client portfolio by segment', 'عدد الراسلين في كل شريحة (Client Portfolio by Segment)': 'Number of senders in each segment (Client Portfolio by Segment)',
    'أعلى 10 راسلين (Top Senders)': 'Top 10 senders', 'الراسلين الأعلى في عدد الشحنات ضمن الفلاتر الحالية': 'Senders with the most shipments within the current filters',
    'الأداء حسب مدير الحساب': 'Performance by account manager', 'عدد الشحنات المُدارة لكل مدير حساب': 'Number of shipments managed per account manager',
    'أسباب عدم التسليم': 'Reasons for non-delivery', 'أكثر أسباب المشاكل تكرارًا للشحنات غير المسلّمة (سبب الحالة)': 'Most frequent problem reasons for undelivered shipments (status reason)',
    'تصنيف وأداء الراسلين (Client Segmentation)': 'Sender segmentation and performance (Client Segmentation)',
    'مبني على نفس منطق التصنيف المستخدم في شيتات "delivery rate per day" و"ref" — نسبة التسليم × حجم الشحنات': 'Based on the same segmentation logic used in the “delivery rate per day” and “ref” sheets — delivery rate × shipment volume',
    'كل الراسلين (343) — مرتّبين حسب الحجم افتراضيًا، أول صفحة = أعلى 30': 'All senders (343) — sorted by volume by default; first page = top 30',
    'بحث باسم الراسل…': 'Search by sender name…', 'الراسل': 'Sender', 'إجمالي الشحنات': 'Total shipments', 'تم التسليم': 'Delivered', 'نسبة التسليم': 'Delivery rate', 'التصنيف': 'Segment',
    '« الأول': '« First', '‹ السابق': '‹ Previous', 'التالي ›': 'Next ›', 'الأخير »': 'Last »',
    'آخر ملاحظات العملاء': 'Latest client notes', 'من شيت الملاحظات الداخلي (Sheet10) — ملاحظات مسجّلة يدويًا من فريق إدارة الحسابات': 'From the internal notes sheet (Sheet10) — manually recorded by the account management team',
    'دليل التصنيفات': 'Segment guide', 'معنى كل تصنيف حسب تعريف الشركة في شيت "ref"': 'Meaning of each segment per the company definition in the “ref” sheet',
    'سجل الشحنات التفصيلي': 'Detailed shipment log', 'قابل للبحث والفرز — يعرض 50 سجل في كل صفحة': 'Searchable and sortable — 50 records per page', 'اضغط على عنوان أي عمود للفرز': 'Click any column header to sort',
    'بحث سريع داخل الجدول…': 'Quick search in the table…', 'رقم البوليصة': 'Waybill number', 'تاريخ الاستلام': 'Pickup date', 'العمر (يوم)': 'Age (days)', 'تكلفة الشحن': 'Shipping cost', 'مبلغ التحصيل': 'Collection amount',
    'فحص جودة البيانات الحيّة': 'Live data quality check', 'يُحسب مباشرة من البيانات المُحمّلة حاليًا (مضمّنة أو Live) — وليس ثابتًا': 'Calculated directly from the currently loaded data (embedded or live) — not static',
    'ملاحظات جودة البيانات (لقطة البيانات المضمّنة الأصلية)': 'Data quality notes (original embedded snapshot)',
    'ARRIVE Express — لوحة متابعة حجم الشحنات · بيانات ثابتة مضمّنة داخل هذا الملف (بدون اتصال خارجي) · تم الإنشاء بواسطة Claude': 'ARRIVE Express — Shipment Volume Tracking Dashboard · static data embedded in this file (no external connection) · created with Claude',
    'الكل': 'All', 'اكتب للبحث…': 'Type to search…', 'تحديد الكل': 'Select all', 'مسح الكل': 'Clear all', 'لا توجد نتائج': 'No results', 'إزالة': 'Remove', '✕': '✕',
    'غير محدد': 'Not specified', 'لا توجد بيانات محمّلة للفحص.': 'No loaded data to check.',
    'عدد الشحنات': 'Number of shipments', 'نسبة التسليم %': 'Delivery rate %', 'عدد الراسلين': 'Number of senders', 'لا توجد شحنات': 'No shipments',
    'ضمن الفلاتر الحالية': 'Within the current filters', 'تم التسليم ÷ إجمالي الشحنات — يتحدّث مع كل فلتر': 'Delivered ÷ total shipments — updates with every filter',
    'نسبة التسليم (Delivery Rate)': 'Delivery rate', 'مرتجعة': 'Returned', 'قيد التنفيذ': 'In progress', 'قيد الإرجاع': 'Return in progress', 'معوّض': 'Compensated',
    'إجمالي مبلغ التحصيل (ج.م)': 'Total collection amount (EGP)', 'إجمالي تكلفة الشحن (ج.م)': 'Total shipping cost (EGP)', 'متوسط عمر الشحنة (يوم)': 'Average shipment age (days)',
    'إجمالي مبالغ التحصيل عند التسليم': 'Total amounts collected on delivery', 'إجمالي تكلفة الشحن المقدّرة': 'Total estimated shipping cost', 'من تاريخ الاستلام حتى آخر حالة': 'From pickup date to the latest status',
    'لا توجد نتائج مطابقة للفلاتر الحالية': 'No results match the current filters', 'لا توجد ملاحظات مسجّلة': 'No notes recorded',
    'أقل من 40%': 'Below 40%', 'أقل من 150': 'Below 150', 'فوق 5000': 'Above 5000',
    'إجمالي الراسلين النشطين': 'Total active senders', '⭐ عملاء VIP': '⭐ VIP clients', 'عملاء High Risk': 'High Risk clients', 'عملاء Critical': 'Critical clients',
    'أرقام بوليصة مكررة': 'Duplicate waybill numbers', 'راسل غير محدد': 'Sender not specified', 'رقم بوليصة مفقود': 'Missing waybill number', 'تاريخ استلام مفقود': 'Missing pickup date',
    'تكلفة شحن سالبة (قيمة غير منطقية)': 'Negative shipping cost (illogical value)', 'مبلغ تحصيل سالب (قيمة غير منطقية)': 'Negative collection amount (illogical value)',
    'حالة نهائية غير محددة (على الأرجح لا تزال قيد التنفيذ)': 'Final status not specified (probably still in progress)',
    'الاستجابة ليست JSON صالح (Invalid JSON response)': 'The response is not valid JSON (Invalid JSON response)',
    'فشل غير معروف من الخادم (Unknown backend error)': 'Unknown server failure (Unknown backend error)',
    'شكل الاستجابة غير متوقع — لا يوجد مصفوفة data (Unexpected response shape)': 'Unexpected response shape — no data array',
    'يتم عرض آخر نسخة بيانات محمّلة بنجاح.': 'Showing the last successfully loaded data.', 'يتم عرض البيانات المضمّنة كنسخة احتياطية.': 'Showing the embedded data as a fallback.',
    'متاح فقط بعد إعداد LIVE_CONFIG.API_URL': 'Available only after LIVE_CONFIG.API_URL is configured', '⏳ جاري الاتصال بمصدر البيانات المباشر…': '⏳ Connecting to the live data source…',
    '📦 بيانات مضمّنة (Embedded snapshot) — لا يوجد رابط Google Sheet مُعدّ في LIVE_CONFIG.API_URL، فلا يوجد شيء لتحديثه من مصدر خارجي.': '📦 Embedded snapshot — no Google Sheet link is configured in LIVE_CONFIG.API_URL, so there is nothing to refresh from an external source.',
    '📦 بيانات مضمّنة (Embedded snapshot) — لم يتم إعداد رابط Google Sheet مباشر بعد. أضف الرابط في LIVE_CONFIG.API_URL لتفعيل البيانات الحيّة.': '📦 Embedded snapshot — no live Google Sheet link has been set up yet. Add the link in LIVE_CONFIG.API_URL to enable live data.'
  });
  /* دليل التصنيفات */
  add({
    'أهم عملاء الشركة وأولوية قصوى — نسبة تسليم ممتازة مع حجم شحنات ضخم.': 'The company’s most important clients and top priority — excellent delivery rate with a very large shipment volume.',
    'عميل كبير وأداؤه قوي — حجم شحنات كبير ونسبة تسليم مرتفعة، لكنه أقل من VIP.': 'A large client with strong performance — large shipment volume and a high delivery rate, but below VIP.',
    'عميل استراتيجي جيد — حجم أعمال جيد مع أداء جيد.': 'A good strategic client — good business volume with good performance.',
    'عميل مستقر — أداء جيد وحجم أعمال متوسط.': 'A stable client — good performance and medium business volume.',
    'عميل مقبول — بداية جيدة لكنه يحتاج تنمية لزيادة الحجم أو تحسين الأداء.': 'An acceptable client — a good start but needs development to increase volume or improve performance.',
    'عميل واعد — نسبة تسليم ممتازة لكن حجم الشحنات ما زال صغيرًا، لديه فرصة للنمو.': 'A promising client — excellent delivery rate but still a small shipment volume, with room to grow.',
    'يحتاج خطة تحسين — الأداء أو الحجم أقل من المطلوب ويحتاج متابعة.': 'Needs an improvement plan — performance or volume is below what is required and needs follow-up.',
    'يحتاج اهتمام عاجل — توجد مؤشرات سلبية تستوجب المتابعة المستمرة.': 'Needs urgent attention — there are negative indicators that call for ongoing follow-up.',
    'عميل عالي الخطورة — نسبة التسليم منخفضة، وهناك احتمال لفقد العميل إذا لم يتم التدخل.': 'A high-risk client — low delivery rate, and the client may be lost without intervention.',
    'حالة حرجة — أداء ضعيف جدًا، ويحتاج تدخل إداري وخطة إنقاذ فورية.': 'A critical case — very weak performance; needs management intervention and an immediate rescue plan.'
  });
  /* ملاحظات جودة البيانات (لقطة) */
  add({
    'مصدر البيانات:': 'Data source:', 'مراجعة باقي الشيتات في الملف (12 شيت إجمالاً):': 'Review of the other sheets in the file (12 sheets in total):'
  });
  add({
    '⚠ تعذّر تحديث البيانات — يتم عرض آخر نسخة تم تحميلها بنجاح (Unable to refresh data. Showing last successful dataset.)': '⚠ Could not refresh the data — showing the last successfully loaded version (Unable to refresh data. Showing last successful dataset.)',
    'شيت "Source" في ملف': 'The “Source” sheet in the file', '— بيانات خام لكل شحنة على حدة، بدون أي تعديل على القيم الأصلية.': '— raw data for each shipment, with no changes to the original values.',
    'الملف يحتوي على 120,200 صف إجمالاً، منها': 'The file contains 120,200 rows in total, of which', '69,369 سجل فعلي': '69,369 are actual records', 'والباقي صفوف فارغة تم استبعادها من العرض (لم تُحذف من الملف الأصلي).': 'and the rest are empty rows excluded from the display (not deleted from the original file).',
    'عمود "الوزن" غير مكتمل (فارغ في أكثر من 91% من السجلات) ومختلط النوع (نص/رقم) — تم استبعاده من المؤشرات لعدم اكتماله، ويظهر كما هو في البيانات الخام.': 'The “Weight” column is incomplete (empty in more than 91% of records) and of mixed type (text/number) — it was excluded from the indicators because it is incomplete, and appears as-is in the raw data.',
    'تم توحيد قيمة "amany Hassan" مع "Amany Hassan" (نفس الشخص بحرف كبير/صغير مختلف) في طبقة العرض فقط — دون تعديل القيمة الأصلية في الملف.': 'The value “amany Hassan” was unified with “Amany Hassan” (same person, different letter case) in the display layer only — the original value in the file was not modified.',
    'القيمة "#N/A" في أعمدة مثل مدير الحساب/المنطقة تظهر في اللوحة كـ"غير محدد".': 'The value “#N/A” in columns such as account manager/region appears in the dashboard as “Not specified”.',
    'عمود "الحالة النهائية" فارغ في حوالي 8,000 سجل — غالبًا شحنات لا تزال قيد التنفيذ ولم تصل بعد لنتيجة نهائية.': 'The “Final status” column is empty in about 8,000 records — mostly shipments still in progress that have not yet reached a final result.',
    '— تقارير Pivot جاهزة مُشتقة أصلاً من شيت Source نفسه (نفس الأرقام بالضبط عند المطابقة). لم تُستخدم كمصدر بيانات مباشر لتفادي ازدواج العد، لكن تم استخراج منطق التصنيف (Client Segment) من شيت "ref" وإعادة بنائه كطبقة محسوبة حيّة في قسم "تصنيف وأداء الراسلين" أعلاه — يتحدث تلقائيًا مع الفلاتر بدل كونه ثابتًا.': '— ready-made Pivot reports originally derived from the Source sheet itself (exactly the same figures when reconciled). They were not used as a direct data source to avoid double counting, but the segmentation logic (Client Segment) was extracted from the “ref” sheet and rebuilt as a live calculated layer in the “Sender segmentation and performance” section above — it updates automatically with the filters instead of being static.',
    '— شيت مرجعي يحتوي جداول Lookup (محافظة→منطقة، حالة تفصيلية→حالة عامة، فرع→نوع فرع) بالإضافة لمصفوفة تصنيف العملاء (نسبة التسليم × حجم الشحنات → Growth/Silver/Bronze/Recovery/Attention/High Risk/Critical/Gold/Premium/VIP) — تم استخدامها حرفيًا في جدول التصنيف بالأسفل.': '— a reference sheet containing lookup tables (governorate→region, detailed status→general status, branch→branch type) plus the client segmentation matrix (delivery rate × shipment volume → Growth/Silver/Bronze/Recovery/Attention/High Risk/Critical/Gold/Premium/VIP) — used as-is in the segmentation table below.',
    '(مخفي) — سجل ملاحظات نصية يدوية من فريق الحسابات (7 سجلات فقط، 3 منها بها نص فعلي) — تم عرضه في لوحة "آخر ملاحظات العملاء".': '(hidden) — a log of manual text notes from the accounts team (only 7 records, 3 with actual text) — shown in the “Latest client notes” panel.',
    '(مخفي) — عدد الراسلين المختلفين وإجمالي الشحنات لكل مدير حساب؛ نفس الأرقام موجودة بالفعل ضمن رسم "الأداء حسب مدير الحساب" وجدول التصنيف.': '(hidden) — the number of distinct senders and total shipments per account manager; the same figures already appear in the “Performance by account manager” chart and the segmentation table.',
    'Customer report، " customer report" (بمسافة بادئة)، Pivot Table 18، Sheet11': 'Customer report, " customer report" (with a leading space), Pivot Table 18, Sheet11', '— تم فحصها بالكامل وهي': '— were fully checked and are', 'فارغة تمامًا': 'completely empty',
    '(لا بيانات ولا معادلات) أو تحتوي فقط على عنوان قسم بدون بيانات مرتبطة به (" customer report" بها نص "inprogress & return shipments" فقط بدون جدول). لم تُستخدم لعدم وجود بيانات فيها.': '(no data and no formulas) or contain only a section title with no associated data (“ customer report” has only the text “inprogress & return shipments” with no table). They were not used because they hold no data.',
    'لم يتم العثور على أي شيت باسم "Detail22" في الملف المرفوع — الشيتات الموجودة فعليًا هي الـ12 المذكورة أعلاه فقط. لو الشيت ده موجود في نسخة أحدث من الملف، من فضلك ارفعها وسأراجعها.': 'No sheet named “Detail22” was found in the uploaded file — the sheets actually present are only the 12 listed above. If that sheet exists in a newer version of the file, please upload it and it will be reviewed.',
    'لم تتم إعادة بناء عمود "Customer Status" (normal/Low/high/stopped) من شيت "daily pick up" لأنه يعتمد على مقارنة الاتجاه اليومي بمتوسط متحرك لعدة أيام سابقة (قاعدة عمل أكثر تعقيدًا)، ويمكن إضافته لاحقًا إذا رغبت.': 'The “Customer Status” column (normal/Low/high/stopped) from the “daily pick up” sheet was not rebuilt because it depends on comparing the daily trend with a moving average of several previous days (a more complex business rule); it can be added later if desired.'
  });
  /* ---------- قوالب ديناميكية ---------- */
  T('({n} فلتر نشط)', '({n} active {n:filter|filters})');
  T('عرض {a}–{b} من {c} راسل', 'Showing {a}–{b} of {c} senders');
  T('عرض {a}–{b} من {c}', 'Showing {a}–{b} of {c}');
  T('{p} من الإجمالي', '{p} of total');
  T('فحص آلي على {n} سجل محمّل حاليًا:', 'Automatic check on {n} currently loaded records:');
  PATS.push([/^(.+):$/, function (m) { var r = ArriveI18n.trText(m[1]); return r == null ? null : r + ':'; }]);   // «تسمية:»
  T('مدير الحساب: {mRaw}', 'Account manager: {mRaw}');
  T('🟢 Live data loaded: {n} records — شيت "{s}"', '🟢 Live data loaded: {n} records — sheet "{s}"');
  T('— شيت "{s}"', '— sheet "{s}"');
  T('🔴 تعذّر الاتصال بمصدر البيانات المباشر ({eSub}) — {m}', '🔴 Could not connect to the live data source ({eSub}) — {m}');
  T('🔴 تعذّر الاتصال بمصدر البيانات المباشر ({eSub}) — يتم عرض البيانات المضمّنة كنسخة احتياطية.', '🔴 Could not connect to the live data source ({eSub}) — showing the embedded data as a fallback.');
  /* ---------- قيم الفئات (عرض فقط) ---------- */
  add({
    'ضواحي القاهرة والجيزة': 'Cairo & Giza suburbs', 'الاسكندريه': 'Alexandria', 'المدن الجديده': 'New cities', 'مدن الدلتا 2': 'Delta cities 2', 'القاهره': 'Cairo', 'الصعيد 2': 'Upper Egypt 2', 'الجيزه': 'Giza',
    'مناطق النائيه 1': 'Remote areas 1', 'مدن القناه': 'Canal cities', 'مدن الدلتا 1': 'Delta cities 1', 'مناطق النائيه 2': 'Remote areas 2', 'الصعيد 1': 'Upper Egypt 1', 'مناطق غيرمخدومه': 'Unserved areas',
    'الصعيد 3': 'Upper Egypt 3', 'ضواحي الاسكندرية': 'Alexandria suburbs', 'فري': 'Free',
    'فرع المعادي': 'Maadi branch', 'فرع الاسكندرية': 'Alexandria branch', 'فرع اكتوبر': '6th of October branch', 'فرع كفر الشيخ': 'Kafr El Sheikh branch', 'فرع الصعيد': 'Upper Egypt branch', 'فرع الهرم': 'Haram branch',
    'فرع الشروق': 'Shorouk branch', 'فرع حدائق القبه': 'Hadayek El Qobba branch', 'فرع الاسماعيليه': 'Ismailia branch', 'فرع الشرقية': 'Sharqia branch', 'فرع المؤسسه': 'Al Mo’assasa branch', 'فرع العجوزه': 'Agouza branch',
    'فرع طنطا': 'Tanta branch', 'فرع مدينة نصر': 'Nasr City branch', 'فرع المنصوره': 'Mansoura branch', 'فرع المنوفية': 'Menoufia branch', 'فرع الفيوم': 'Fayoum branch', 'فرع البحيرة': 'Beheira branch',
    'فرع القليوبيه': 'Qalyubia branch', 'فرع مصر الجديده': 'Heliopolis (Misr El Gedida) branch', 'فرع رئيسي': 'Main branch', 'فرع': 'Branch', 'وكيل': 'Agent',
    'تسليم و تحصيل': 'Delivery & collection', 'استبدال': 'Exchange', 'جلب مرتجع': 'Return pickup', 'تسليم بريدي': 'Postal delivery', 'تسليم نفس اليوم': 'Same-day delivery', 'توقيع و استلام مستند': 'Document signing & receipt',
    'مشكلة في التسليم': 'Delivery problem', 'تسليم ناجح': 'Successful delivery', 'رفض الاستلام و رفض والدفع': 'Refused receipt and refused payment', 'رفض الاستلام و تم دفع الشحن': 'Refused receipt, shipping paid',
    'تسليم جزئي': 'Partial delivery', 'استبدال او استلام طرد': 'Exchange or parcel pickup', 'تهرب بعد الوصول و التنسيق': 'Evaded after arrival and coordination',
    'شحنة مرتجع': 'Return shipment', '-عنوان غير واضح': 'Unclear address', 'مؤجل من الاوبريشن': 'Postponed by operations', 'منطقة غير مخدومة': 'Unserved area', 'التليفون مغلق باستمرار': 'Phone constantly off',
    'العميل لغى الاوردر': 'Customer cancelled the order', 'العميل لا يرد': 'Customer not answering', 'العميل لم يطلب شىء': 'Customer did not order anything', 'مؤجل من المرسل اليه': 'Postponed by the recipient',
    'رقم خاطئ': 'Wrong number', 'مؤجل من الراسل': 'Postponed by the sender', 'تم تأجيل واتساب': 'Postponed via WhatsApp', 'اختلاف سعر المنتج': 'Product price mismatch', 'العميل بيكنسل': 'Customer is cancelling',
    'شحنة ملغاه': 'Cancelled shipment', 'تم الغاء واتساب': 'Cancelled via WhatsApp', 'جودة المنتج غير مقبولة': 'Unacceptable product quality',
    'مرتجعات الى الفروع': 'Returns to branches', 'قيد التوصيل': 'Out for delivery', 'في الطريق إلي الفرع': 'On the way to the branch', 'تم استلام - فرع المنطقة': 'Received - area branch', 'تم التأكيد-واتس اب': 'Confirmed - WhatsApp',
    'تم الالغاء- واتس اب': 'Cancelled - WhatsApp', 'تحويلات بين الفروع': 'Inter-branch transfers', 'تأجيل': 'Postponement', 'تم التاجيل- واتس اب': 'Postponed - WhatsApp', 'تم استلام في الفرع': 'Received at the branch',
    'في الطريق للمخزن': 'On the way to the warehouse', 'مرتجعات الي الرئيسي': 'Returns to the main branch', 'في الطريق للتاجر': 'On the way to the merchant', 'تم الارتجاع للراسل': 'Returned to sender', 'تم التسليم': 'Delivered',
    'تم الارتجاع للفرع': 'Returned to branch', 'تم حل المشكلة - p': 'Problem resolved - p', 'المحاولة الاولي': 'First attempt', 'تم حل المشكلة - واتس اب': 'Problem resolved - WhatsApp', 'المحاولة الثالثة': 'Third attempt',
    'لم يتم تاكيد التأجيل': 'Postponement not confirmed', 'لم يتم  تاكيد الالغاء': 'Cancellation not confirmed', 'لم يتم تاكيد الرفض': 'Refusal not confirmed', 'المحاولة الثانية': 'Second attempt',
    'تم رفض و رفض الدفع': 'Refused and refused payment', 'مرتجعات بالفرع': 'Returns at the branch', 'تم الاستلام في المخزن': 'Received at the warehouse', 'اعاده توزيع': 'Redistribution', 'مرتجعات انتجريشن': 'Integration returns',
    'وصول لمخزن خطأ': 'Arrived at the wrong warehouse', 'مرتجعات معلقه': 'Returns on hold', 'تم التعويض': 'Compensated',
    'delivered': 'Delivered', 'returned': 'Returned', 'return': 'Return in progress', 'inprogress': 'In progress', 'compensated': 'Compensated'
  });
  window.CS_I18N = { phrases: PH, patterns: PATS };
})();
