import { Customer, Product, User } from '../types';

/**
 * Universal Arabic Text Normalizer
 * Cleans diacritics (tashkeel), tatweel/kashida, non-breaking spaces,
 * normalizes alif variants, taa marbuta, alef maqsura, compound names (عبد الفتاح / عبدالفتاح),
 * honorific prefixes (أ/ , ك/ , م/ , د/ ), and punctuation.
 */
export function normalizeArabicText(str?: string): string {
  if (!str) return '';
  let text = str
    .toString()
    // 1. Remove non-breaking spaces, zero-width chars, tabs
    .replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ')
    // 2. Remove Arabic Tashkeel / Harakat (Fatha, Damma, Kasra, Shadda, Sukun, Tanween...)
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // 3. Remove Arabic Tatweel / Kashida (ـ)
    .replace(/\u0640/g, '')
    // 4. Normalize all forms of Alif (أ, إ, آ, ٱ, ٵ, ٲ) -> ا
    .replace(/[أإآٱٵٲ]/g, 'ا')
    // 5. Normalize Taa Marbuta (ة) -> ه
    .replace(/ة/g, 'ه')
    // 6. Normalize Alef Maqsura (ى) -> ي, and common duplicated ya spelling (يحيى / يحيي)
    .replace(/ى/g, 'ي')
    .replace(/يي+/g, 'ي')
    // 7. Normalize Hamzas (ؤ, ئ, ء)
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ء/g, '')
    // 8. Replace punctuation, brackets, dashes, and separators with spaces
    .replace(/[\-_/\\()\[\]+.,:;*&^%$#@!~"'{}`|]/g, ' ')
    // 9. Collapse spaces
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  // 10. Normalize compound Arabic names (e.g. "عبد الفتاح" -> "عبدالفتاح", "ابو بكر" -> "ابوبكر")
  text = normalizeCompoundNames(text);

  return text;
}

/**
 * Normalizes compound Arabic names so that variants like "عبد الفتاح" and "عبدالفتاح"
 * or "ابو بكر" and "ابوبكر" match identically.
 */
export function normalizeCompoundNames(text: string): string {
  if (!text) return '';
  return text
    // Normalize "عبد ال..." -> "عبدال..."
    .replace(/\bعبد\s+ال/g, 'عبدال')
    .replace(/\bعبد\s+/g, 'عبد')
    // Normalize "ابو ال..." -> "ابوال..."
    .replace(/\bابو\s+ال/g, 'ابوال')
    .replace(/\bابو\s+/g, 'ابو')
    .replace(/\bابي\s+/g, 'ابو')
    .replace(/\bابا\s+/g, 'ابو')
    // Normalize "ال " prefix when detached
    .replace(/\bال\s+/g, 'ال')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract meaningful Arabic name tokens, filtering out common noise titles
 */
export function getArabicTokens(str?: string): string[] {
  const norm = normalizeArabicText(str);
  if (!norm) return [];

  const ignoreWords = new Set([
    'المندوب',
    'مندوب',
    'استاذ',
    'استاذه',
    'كابتن',
    'فرع',
    'فروع',
    'المبيعات',
    'مبيعات',
    'مسؤول',
    'مسئول',
    'مسوول',
    'بائع',
    'بايع',
    'موزع',
    'الموزع',
    'السيد',
    'السيده',
    'محل',
    'شركة',
    'شركه',
    'مؤسسة',
    'مؤسسه',
    'م',
    'أ',
    'ا',
    'د',
    'ك',
    'دكتور',
    'مهندس',
    'باشمهندس',
    'حساب',
    'توزيع',
    'خط',
    'منطقة',
    'محافظة',
    // Common branch tokens when embedded in rep column
    'المنيا',
    'منيا',
    'الفيوم',
    'فيوم',
    'القاهرة',
    'قاهرة',
    'ديمشلت',
    'دكرنس',
    'البحيرة',
    'بحيرة',
    'دمنهور',
    'منوف',
    'المنوفية',
    'منوفية',
    'اكتوبر',
    'أكتوبر',
    'المركزي',
    'مركزي',
    'رئيسي',
    'الرئيسي',
    'طنطا',
    'اسكندرية',
    'الاسكندرية',
  ]);

  return norm
    .split(' ')
    .map((t) => t.trim())
    .filter((token) => token.length >= 2 && !ignoreWords.has(token));
}

/**
 * Intelligent Arabic Name Matcher
 * Strictly compares Arabic names by token equality and normalized Arabic representations.
 * Prevents false positive matching between different individuals (e.g. "حسن محمد" will NOT match "محمد علي" or "أحمد محمد").
 */
export function isArabicNameMatch(nameA?: string, nameB?: string): boolean {
  if (!nameA || !nameB) return false;
  const normA = normalizeCompoundNames(normalizeArabicText(nameA));
  const normB = normalizeCompoundNames(normalizeArabicText(nameB));
  if (!normA || !normB) return false;
  if (normA === normB) return true;

  const tokensA = getArabicTokens(nameA);
  const tokensB = getArabicTokens(nameB);
  if (tokensA.length === 0 || tokensB.length === 0) return false;

  const joinedA = tokensA.join(' ');
  const joinedB = tokensB.join(' ');
  if (joinedA === joinedB) return true;

  // If one name has single token, it can ONLY match if both have single token and they are identical
  if (tokensA.length === 1 || tokensB.length === 1) {
    if (tokensA.length === 1 && tokensB.length === 1) {
      return tokensA[0] === tokensB[0];
    }
    // A single word like "محمد" or "حسن" does NOT match a full composite name "حسن محمد"
    return false;
  }

  // Both have at least 2 tokens (First name + Father's name / Family name)
  // 1. First name MUST match exactly in order
  if (tokensA[0] !== tokensB[0]) {
    return false;
  }

  // 2. Second name MUST match exactly in order
  if (tokensA[1] !== tokensB[1]) {
    return false;
  }

  // 3. If one has 2 tokens and the other has >= 2 tokens with the same first 2 tokens (e.g. "حسن محمد" and "حسن محمد طنطاوي")
  return true;
}

/**
 * Canonical Branch Names in Dream Distribution
 */
export const CANONICAL_BRANCHES = [
  'الفرع الرئيسي (المخزن المركزي - 6 أكتوبر)',
  'فرع المنيا',
  'فرع منيا القمح',
  'فرع القاهرة',
  'فرع الفيوم',
  'فرع البحيرة',
  'فرع ديمشلت',
  'فرع منوف',
] as const;

/**
 * Infer exact branch name from text (address, customer name, notes, governorate, or branch string)
 * Distinguishes Upper Egypt Minya (بني مزار، ملوي، سمالوط، مغاغة) from Sharqia Minya El-Qamh (منيا القمح، الزقازيق، بلبيس)
 */
export function inferBranchFromText(text?: string): string {
  if (!text) return '';
  const norm = normalizeArabicText(text);
  if (!norm) return '';

  // 1. Minya (Upper Egypt) specific centers & districts - Check first for unambiguous Minya locations
  if (
    norm.includes('بني مزار') ||
    norm.includes('بنى مزار') ||
    norm.includes('ملوي') ||
    norm.includes('ملوى') ||
    norm.includes('مغاغة') ||
    norm.includes('مغاغه') ||
    norm.includes('سمالوط') ||
    norm.includes('ابوقرقاص') ||
    norm.includes('ابو قرقاص') ||
    norm.includes('دير مواس') ||
    norm.includes('ديرمواس') ||
    norm.includes('مطاي') ||
    norm.includes('مطاى') ||
    norm.includes('العدوة') ||
    norm.includes('العدوه') ||
    norm.includes('عروس الصعيد') ||
    norm.includes('طه حسين')
  ) {
    return 'فرع المنيا';
  }

  // 2. Minya El-Qamh (Sharqia) - Must be checked before generic "منيا"
  if (
    norm.includes('منيا القمح') ||
    norm.includes('القمح') ||
    norm.includes('meq') ||
    norm.includes('شرقيه') ||
    norm.includes('الشرقيه') ||
    norm.includes('زقازيق') ||
    norm.includes('الزقازيق') ||
    norm.includes('بلبيس') ||
    norm.includes('فاقوس') ||
    norm.includes('مشتول') ||
    norm.includes('ابو حماد') ||
    norm.includes('ابوحماد') ||
    norm.includes('ديرب نجم') ||
    norm.includes('العاشر من رمضان')
  ) {
    return 'فرع منيا القمح';
  }

  // 3. Minya (Upper Egypt) general
  if (norm.includes('المنيا') || norm.includes('منيا') || norm.includes('minya') || norm.includes('min')) {
    return 'فرع المنيا';
  }

  // 4. Central October
  if (
    norm.includes('اكتوبر') ||
    norm.includes('مركزي') ||
    norm.includes('رئيسي') ||
    norm.includes('الجيزه') ||
    norm.includes('جيزه') ||
    norm.includes('october') ||
    norm.includes('giza') ||
    norm.includes('main')
  ) {
    return 'الفرع الرئيسي (المخزن المركزي - 6 أكتوبر)';
  }

  // 5. Dimeshalt (Dakahlia / Mansoura)
  if (
    norm.includes('ديمشلت') ||
    norm.includes('دكرنس') ||
    norm.includes('منصوره') ||
    norm.includes('المنصوره') ||
    norm.includes('دقهليه') ||
    norm.includes('الدقهليه') ||
    norm.includes('ميت غمر') ||
    norm.includes('شربين') ||
    norm.includes('السنبلاوين') ||
    norm.includes('سنبلاوين') ||
    norm.includes('بلقاس') ||
    norm.includes('اجا') ||
    norm.includes('طلخا') ||
    norm.includes('المنزله') ||
    norm.includes('dimeshalt') ||
    norm.includes('dim')
  ) {
    return 'فرع ديمشلت';
  }

  // 6. Fayoum
  if (
    norm.includes('فيوم') ||
    norm.includes('الفيوم') ||
    norm.includes('اطسا') ||
    norm.includes('سنورس') ||
    norm.includes('طاميه') ||
    norm.includes('ابشواي') ||
    norm.includes('يوسف الصديق') ||
    norm.includes('fayoum') ||
    norm.includes('fay')
  ) {
    return 'فرع الفيوم';
  }

  // 7. Cairo
  if (
    norm.includes('قاهره') ||
    norm.includes('القاهره') ||
    norm.includes('مدينة نصر') ||
    norm.includes('وسط البلد') ||
    norm.includes('المعادي') ||
    norm.includes('شبرا') ||
    norm.includes('عين شمس') ||
    norm.includes('حلوان') ||
    norm.includes('cairo') ||
    norm.includes('cai')
  ) {
    return 'فرع القاهرة';
  }

  // 8. Beheira / Damanhour
  if (
    norm.includes('بحيره') ||
    norm.includes('البحيره') ||
    norm.includes('دمنهور') ||
    norm.includes('كفر الدوار') ||
    norm.includes('ايتاي البارود') ||
    norm.includes('ابو حمص') ||
    norm.includes('حوش عيسى') ||
    norm.includes('شبراخيت') ||
    norm.includes('كوم حماده') ||
    norm.includes('رشيد') ||
    norm.includes('الدلنجات') ||
    norm.includes('beheira') ||
    norm.includes('damanhour') ||
    norm.includes('beh')
  ) {
    return 'فرع البحيرة';
  }

  // 9. Menouf / Menoufia
  if (
    norm.includes('منوف') ||
    norm.includes('المنوفيه') ||
    norm.includes('شبين') ||
    norm.includes('اشمون') ||
    norm.includes('الباجور') ||
    norm.includes('قويسنا') ||
    norm.includes('بركة السبع') ||
    norm.includes('بركه السبع') ||
    norm.includes('تلا') ||
    norm.includes('الشهداء') ||
    norm.includes('السادات') ||
    norm.includes('menouf') ||
    norm.includes('mnf')
  ) {
    return 'فرع منوف';
  }

  return '';
}

/**
 * Branch canonical identifier
 */
export function normalizeBranchKey(branch?: string): string {
  if (!branch) return '';
  const inferred = inferBranchFromText(branch);
  if (inferred) {
    if (inferred.includes('أكتوبر') || inferred.includes('اكتوبر') || inferred.includes('مركزي')) return 'main';
    if (inferred.includes('منيا القمح')) return 'meq';
    if (inferred.includes('المنيا')) return 'minya';
    if (inferred.includes('ديمشلت')) return 'dimeshalt';
    if (inferred.includes('الفيوم') || inferred.includes('فيوم')) return 'fayoum';
    if (inferred.includes('القاهرة') || inferred.includes('قاهرة')) return 'cairo';
    if (inferred.includes('البحيرة') || inferred.includes('بحيرة')) return 'beheira';
    if (inferred.includes('منوف')) return 'menouf';
  }

  const norm = normalizeArabicText(branch);

  if (
    norm.includes('اكتوبر') ||
    norm.includes('مركزي') ||
    norm.includes('رئيسي') ||
    norm.includes('الجيزه') ||
    norm.includes('جيزه') ||
    norm.includes('october') ||
    norm.includes('giza') ||
    norm.includes('main')
  ) {
    return 'main';
  }

  // Minya El-Qamh (Sharqia) - Must be evaluated before general Minya
  if (
    norm.includes('منيا القمح') ||
    norm.includes('القمح') ||
    norm.includes('meq') ||
    norm.includes('شرقيه') ||
    norm.includes('زقازيق') ||
    norm.includes('بلبيس') ||
    norm.includes('فاقوس')
  ) {
    return 'meq';
  }

  // Minya (Upper Egypt) - All centers & districts
  if (
    norm.includes('المنيا') ||
    norm.includes('منيا') ||
    norm.includes('ملوي') ||
    norm.includes('ملوى') ||
    norm.includes('بني مزار') ||
    norm.includes('بنى مزار') ||
    norm.includes('مغاغة') ||
    norm.includes('مغاغه') ||
    norm.includes('سمالوط') ||
    norm.includes('ابوقرقاص') ||
    norm.includes('ابو قرقاص') ||
    norm.includes('دير مواس') ||
    norm.includes('ديرمواس') ||
    norm.includes('مطاي') ||
    norm.includes('مطاى') ||
    norm.includes('العدوة') ||
    norm.includes('العدوه') ||
    norm.includes('عروس الصعيد') ||
    norm.includes('طه حسين') ||
    norm.includes('minya') ||
    norm.includes('min')
  ) {
    return 'minya';
  }

  // Dimeshalt (Dakahlia / Mansoura)
  if (
    norm.includes('ديمشلت') ||
    norm.includes('دكرنس') ||
    norm.includes('منصوره') ||
    norm.includes('المنصوره') ||
    norm.includes('دقهليه') ||
    norm.includes('الدقهليه') ||
    norm.includes('ميت غمر') ||
    norm.includes('شربين') ||
    norm.includes('السنبلاوين') ||
    norm.includes('سنبلاوين') ||
    norm.includes('بلقاس') ||
    norm.includes('اجا') ||
    norm.includes('طلخا') ||
    norm.includes('المنزله') ||
    norm.includes('dimeshalt') ||
    norm.includes('dim')
  ) {
    return 'dimeshalt';
  }

  // Fayoum
  if (
    norm.includes('فيوم') ||
    norm.includes('الفيوم') ||
    norm.includes('اطسا') ||
    norm.includes('سنورس') ||
    norm.includes('طاميه') ||
    norm.includes('ابشواي') ||
    norm.includes('يوسف الصديق') ||
    norm.includes('fayoum') ||
    norm.includes('fay')
  ) {
    return 'fayoum';
  }

  // Cairo
  if (
    norm.includes('قاهره') ||
    norm.includes('القاهره') ||
    norm.includes('مدينة نصر') ||
    norm.includes('وسط البلد') ||
    norm.includes('المعادي') ||
    norm.includes('شبرا') ||
    norm.includes('عين شمس') ||
    norm.includes('حلوان') ||
    norm.includes('cairo') ||
    norm.includes('cai')
  ) {
    return 'cairo';
  }

  // Beheira / Damanhour
  if (
    norm.includes('بحيره') ||
    norm.includes('البحيره') ||
    norm.includes('دمنهور') ||
    norm.includes('كفر الدوار') ||
    norm.includes('ايتاي البارود') ||
    norm.includes('ابو حمص') ||
    norm.includes('حوش عيسى') ||
    norm.includes('شبراخيت') ||
    norm.includes('كوم حماده') ||
    norm.includes('رشيد') ||
    norm.includes('الدلنجات') ||
    norm.includes('beheira') ||
    norm.includes('damanhour') ||
    norm.includes('beh')
  ) {
    return 'beheira';
  }

  // Menouf / Menoufia
  if (
    norm.includes('منوف') ||
    norm.includes('المنوفيه') ||
    norm.includes('شبين') ||
    norm.includes('اشمون') ||
    norm.includes('الباجور') ||
    norm.includes('قويسنا') ||
    norm.includes('بركة السبع') ||
    norm.includes('بركه السبع') ||
    norm.includes('تلا') ||
    norm.includes('الشهداء') ||
    norm.includes('السادات') ||
    norm.includes('menouf') ||
    norm.includes('mnf')
  ) {
    return 'menouf';
  }

  return norm;
}

/**
 * Check if two branch references match
 */
export function isBranchMatch(
  branchA?: string,
  branchB?: string,
  options: { allowUnassigned?: boolean } = { allowUnassigned: true }
): boolean {
  const normA = (branchA || '').trim();
  const normB = (branchB || '').trim();

  if (!normA && !normB) return true;

  if (!normA || !normB) {
    return options.allowUnassigned !== false;
  }

  const keyA = normalizeBranchKey(normA);
  const keyB = normalizeBranchKey(normB);

  if (!keyA || !keyB) {
    return options.allowUnassigned !== false;
  }

  return keyA === keyB;
}

/**
 * Check if a customer strictly belongs to a specific sales rep
 * Direct rep assignment (by repId or salesRepName/repName) takes top priority,
 * followed by fallback branch matching for unassigned customers.
 */
export function doesCustomerBelongToRep(customer: Customer, repUser: User): boolean {
  if (!repUser) return false;

  // Branch check: If customer and rep both have branches specified, they MUST match
  if (repUser.branchName && customer.branchName) {
    if (!isBranchMatch(customer.branchName, repUser.branchName, { allowUnassigned: false })) {
      return false;
    }
  }

  // 1. Direct ID match (Highest authority)
  if (customer.repId && customer.repId.trim()) {
    if (customer.repId.trim() === (repUser.id || '').trim()) {
      return true;
    }
    // Explicitly assigned to a different rep ID
    return false;
  }

  // 2. Direct Match by rep_name / repName / salesRepName / representative_name
  const repField = (
    customer.rep_name ||
    customer.repName ||
    customer.salesRepName ||
    customer.representative_name ||
    ''
  ).toString().trim();

  const isGenericRep =
    !repField ||
    repField === 'مندوب المبيعات' ||
    repField === 'المندوب' ||
    repField === 'مندوب' ||
    repField === 'مبيعات' ||
    repField === '---' ||
    repField === '..' ||
    repField.toLowerCase() === 'unassigned' ||
    repField.toLowerCase() === 'none';

  if (isGenericRep) {
    return false;
  }

  const currentRepName = (repUser.name || '').trim();
  const currentRepUsername = (repUser.username || '').trim();

  // Exact trimmed equality
  if (repField === currentRepName) return true;
  if (currentRepUsername && repField === currentRepUsername) return true;

  // Phone match (if exact phone digits match)
  const cleanRepFieldPhone = repField.replace(/\D/g, '');
  const cleanUserPhone = (repUser.phone || '').replace(/\D/g, '');
  if (cleanUserPhone.length >= 8 && cleanRepFieldPhone === cleanUserPhone) {
    return true;
  }

  // Exact normalized match
  const normRepField = normalizeCompoundNames(normalizeArabicText(repField));
  const normUserName = normalizeCompoundNames(normalizeArabicText(currentRepName));
  const normUsername = normalizeArabicText(currentRepUsername);

  if (normRepField && normUserName && normRepField === normUserName) {
    return true;
  }
  if (normUsername && normRepField === normUsername) {
    return true;
  }

  // Strict Arabic multi-token match
  if (isArabicNameMatch(repField, currentRepName)) return true;
  if (currentRepUsername && isArabicNameMatch(repField, currentRepUsername)) return true;

  return false;
}

/**
 * Check if a customer belongs to a supervisor's supervised team
 */
export function doesCustomerBelongToSupervisor(
  customer: Customer,
  supervisorUser: User,
  allUsers: User[]
): boolean {
  if (!supervisorUser) return false;

  // 1. STRICT Branch Verification
  if (supervisorUser.branchName && customer.branchName) {
    if (!isBranchMatch(customer.branchName, supervisorUser.branchName, { allowUnassigned: false })) {
      return false;
    }
  }

  // 2. Check if assigned directly to the supervisor
  if (doesCustomerBelongToRep(customer, supervisorUser)) {
    return true;
  }

  // 3. Find all sales reps belonging to this supervisor in the same branch
  const supervisedReps = allUsers.filter(
    (u) =>
      u.supervisorId === supervisorUser.id ||
      (u.role === 'sales_rep' &&
        isBranchMatch(u.branchName, supervisorUser.branchName, { allowUnassigned: false }))
  );

  // 4. Check if customer belongs to any of these reps
  return supervisedReps.some((rep) => doesCustomerBelongToRep(customer, rep));
}

/**
 * Check if a customer belongs to a branch manager's branch
 */
export function doesCustomerBelongToBranch(customer: Customer, branchName?: string): boolean {
  if (!branchName) return true;
  if (!customer.branchName) return true;
  return isBranchMatch(customer.branchName, branchName, { allowUnassigned: false });
}

/**
 * Robustly resolve product branch stock in cartons for a target branch using normalized matching
 */
export function getBranchStockForProduct(product: Product, targetBranch?: string): number {
  if (!product) return 0;
  if (!targetBranch || targetBranch === 'الكل') {
    return product.branchStockActual || 0;
  }

  const targetKey = normalizeBranchKey(targetBranch);

  // 1. If querying October Central Warehouse
  if (targetKey === 'main') {
    if (typeof product.mainWarehouseActual === 'number') {
      return product.mainWarehouseActual;
    }
  }

  // 2. Direct branchStocks map lookup by normalized keys
  if (product.branchStocks && typeof product.branchStocks === 'object' && Object.keys(product.branchStocks).length > 0) {
    let hasBranchKey = false;
    for (const [key, stock] of Object.entries(product.branchStocks)) {
      if (typeof stock === 'number' && !isNaN(stock)) {
        hasBranchKey = true;
        if (normalizeBranchKey(key) === targetKey) {
          return stock;
        }
      }
    }
    // If the product has explicit branch-specific stock map but the requested branch is not present
    if (hasBranchKey) {
      return 0;
    }
  }

  // 3. If product has a single branchName assigned, verify branch match
  if (product.branchName) {
    if (normalizeBranchKey(product.branchName) === targetKey) {
      return product.branchStockActual || 0;
    }
    return 0;
  }

  // 4. Fallback to product.branchStockActual if unassigned
  return product.branchStockActual || 0;
}

