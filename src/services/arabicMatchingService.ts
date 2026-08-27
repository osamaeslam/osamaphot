import { Customer, User } from '../types';

/**
 * Universal Arabic Text Normalizer
 * Cleans diacritics (tashkeel), tatweel/kashida, non-breaking spaces,
 * normalizes alif variants, taa marbuta, alef maqsura, and punctuation.
 */
export function normalizeArabicText(str?: string): string {
  if (!str) return '';
  return str
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
    // 6. Normalize Alef Maqsura (ى) -> ي
    .replace(/ى/g, 'ي')
    // 7. Normalize Hamzas (ؤ, ئ, ء)
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ء/g, '')
    // 8. Replace punctuation and separators with spaces
    .replace(/[\-_/\\()\[\]+.,:;*&^%$#@!~"'{}`|]/g, ' ')
    // 9. Collapse multiple spaces into single space and trim
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
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
    'استاذة',
    'كابتن',
    'فرع',
    'المبيعات',
    'مبيعات',
    'مسؤول',
    'مسئول',
    'مسوول',
    'السيد',
    'السيده',
    'م',
    'أ',
    'ا',
    'د',
    'دكتور',
    'مهندس',
    'حساب',
    'توزيع',
    'شركة',
    'شركه',
  ]);

  return norm
    .split(' ')
    .map((t) => t.trim())
    .filter((token) => token.length >= 2 && !ignoreWords.has(token));
}

/**
 * Intelligent Arabic Name Matcher
 * Handles exact matches, token overlap, prefix/suffix names (e.g. "حسن محمد" vs "حسن محمد أحمد"),
 * and fuzzy Arabic variations.
 */
export function isArabicNameMatch(nameA?: string, nameB?: string): boolean {
  if (!nameA || !nameB) return false;
  const normA = normalizeArabicText(nameA);
  const normB = normalizeArabicText(nameB);
  if (!normA || !normB) return false;
  if (normA === normB) return true;

  const tokensA = getArabicTokens(nameA);
  const tokensB = getArabicTokens(nameB);
  if (tokensA.length === 0 || tokensB.length === 0) return false;

  const joinedA = tokensA.join(' ');
  const joinedB = tokensB.join(' ');
  if (joinedA === joinedB) return true;

  // If one full string is contained in the other
  if (joinedA.length >= 4 && joinedB.length >= 4) {
    if (joinedA.includes(joinedB) || joinedB.includes(joinedA)) {
      return true;
    }
  }

  // Token subset match: e.g. "حسن محمد" vs "حسن محمد عثمان"
  const [shorter, longer] = tokensA.length <= tokensB.length ? [tokensA, tokensB] : [tokensB, tokensA];
  const longerSet = new Set(longer);

  // Check if all tokens of the shorter name exist in the longer name
  const allShorterMatch = shorter.every((t) => longerSet.has(t));
  if (allShorterMatch && shorter.length >= 2) {
    return true;
  }

  // Overlap count for longer or multi-token names
  let matchCount = 0;
  shorter.forEach((t) => {
    if (longerSet.has(t)) matchCount++;
  });

  if (matchCount >= 2 && matchCount / shorter.length >= 0.6) {
    return true;
  }

  return false;
}

/**
 * Branch canonical identifier
 */
export function normalizeBranchKey(branch?: string): string {
  if (!branch) return '';
  const norm = normalizeArabicText(branch);
  if (
    norm.includes('اكتوبر') ||
    norm.includes('مركزي') ||
    norm.includes('رئيسي') ||
    norm.includes('october') ||
    norm.includes('main')
  ) {
    return 'main';
  }
  if (norm.includes('منيا القمح') || norm.includes('القمح') || norm.includes('meq')) {
    return 'meq';
  }
  if (norm.includes('منيا') || norm.includes('minya')) {
    return 'minya';
  }
  if (norm.includes('فيوم') || norm.includes('fayoum')) {
    return 'fayoum';
  }
  if (norm.includes('قاهره') || norm.includes('cairo')) {
    return 'cairo';
  }
  if (
    norm.includes('بحيره') ||
    norm.includes('دمنهور') ||
    norm.includes('beheira') ||
    norm.includes('damanhour')
  ) {
    return 'beheira';
  }
  if (norm.includes('ديمشلت') || norm.includes('dimeshalt')) {
    return 'dimeshalt';
  }
  if (norm.includes('منوف') || norm.includes('menouf')) {
    return 'menouf';
  }
  return norm;
}

/**
 * Check if two branch references match
 */
export function isBranchMatch(branchA?: string, branchB?: string): boolean {
  if (!branchA || !branchB) return true; // Tolerant if unassigned
  const keyA = normalizeBranchKey(branchA);
  const keyB = normalizeBranchKey(branchB);
  if (!keyA || !keyB) return true;
  return keyA === keyB;
}

/**
 * Check if a customer strictly belongs to a specific sales rep
 */
export function doesCustomerBelongToRep(customer: Customer, repUser: User): boolean {
  if (!repUser) return false;

  // 1. Direct ID match
  if (customer.repId && customer.repId === repUser.id) {
    return true;
  }

  // 2. Branch compatibility check (if customer specifies branch and rep has branch)
  if (!isBranchMatch(customer.branchName, repUser.branchName)) {
    return false;
  }

  // 3. Name / Username match with intelligent Arabic tolerance
  const repField = (customer.salesRepName || customer.repName || '').trim();
  if (!repField) return false;

  if (isArabicNameMatch(repField, repUser.name)) return true;
  if (repUser.username && isArabicNameMatch(repField, repUser.username)) return true;
  if (repUser.phone && repField.includes(repUser.phone)) return true;

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

  // 1. Branch check
  if (!isBranchMatch(customer.branchName, supervisorUser.branchName)) {
    return false;
  }

  // 2. Check if assigned directly to the supervisor
  if (doesCustomerBelongToRep(customer, supervisorUser)) {
    return true;
  }

  // 3. Find all sales reps belonging to this supervisor
  const supervisedReps = allUsers.filter(
    (u) =>
      u.supervisorId === supervisorUser.id ||
      (u.role === 'sales_rep' && isBranchMatch(u.branchName, supervisorUser.branchName))
  );

  // 4. Check if customer belongs to any of these reps
  return supervisedReps.some((rep) => doesCustomerBelongToRep(customer, rep));
}

/**
 * Check if a customer belongs to a branch manager's branch
 */
export function doesCustomerBelongToBranch(customer: Customer, branchName?: string): boolean {
  if (!branchName) return true;
  return isBranchMatch(customer.branchName, branchName);
}
