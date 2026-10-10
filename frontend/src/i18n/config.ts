/**
 * i18n configuration: supported languages, display names, and font mappings.
 *
 * Font loading strategy:
 * - Latin subset always loaded (numbers, UI chrome)
 * - Script-specific font loaded only for the active language
 * - Uses next/font/google with unicode-range subsetting
 */

export type LanguageCode = 'en' | 'hi' | 'pa' | 'mr' | 'gu' | 'ta' | 'te' | 'bn';

export interface LanguageConfig {
  code: LanguageCode;
  name: string;           // Name in that language
  nameEn: string;         // English name
  script: string;         // Script family
  fontFamily: string;     // Google Font name
  speechLang: string;     // Web Speech API lang code
  voiceSupported: boolean; // Whether Web Speech API generally supports this
}

export const LANGUAGES: Record<LanguageCode, LanguageConfig> = {
  en: {
    code: 'en',
    name: 'English',
    nameEn: 'English',
    script: 'latin',
    fontFamily: 'Noto Sans',
    speechLang: 'en-IN',
    voiceSupported: true,
  },
  hi: {
    code: 'hi',
    name: 'हिन्दी',
    nameEn: 'Hindi',
    script: 'devanagari',
    fontFamily: 'Noto Sans Devanagari',
    speechLang: 'hi-IN',
    voiceSupported: true,
  },
  pa: {
    code: 'pa',
    name: 'ਪੰਜਾਬੀ',
    nameEn: 'Punjabi',
    script: 'gurmukhi',
    fontFamily: 'Noto Sans Gurmukhi',
    speechLang: 'pa-IN',
    voiceSupported: false, // Limited browser support
  },
  mr: {
    code: 'mr',
    name: 'मराठी',
    nameEn: 'Marathi',
    script: 'devanagari',
    fontFamily: 'Noto Sans Devanagari',
    speechLang: 'mr-IN',
    voiceSupported: true,
  },
  gu: {
    code: 'gu',
    name: 'ગુજરાતી',
    nameEn: 'Gujarati',
    script: 'gujarati',
    fontFamily: 'Noto Sans Gujarati',
    speechLang: 'gu-IN',
    voiceSupported: true,
  },
  ta: {
    code: 'ta',
    name: 'தமிழ்',
    nameEn: 'Tamil',
    script: 'tamil',
    fontFamily: 'Noto Sans Tamil',
    speechLang: 'ta-IN',
    voiceSupported: true,
  },
  te: {
    code: 'te',
    name: 'తెలుగు',
    nameEn: 'Telugu',
    script: 'telugu',
    fontFamily: 'Noto Sans Telugu',
    speechLang: 'te-IN',
    voiceSupported: true,
  },
  bn: {
    code: 'bn',
    name: 'বাংলা',
    nameEn: 'Bengali',
    script: 'bengali',
    fontFamily: 'Noto Sans Bengali',
    speechLang: 'bn-IN',
    voiceSupported: true,
  },
};

export const DEFAULT_LANGUAGE: LanguageCode = 'hi';

export const LANGUAGE_CODES = Object.keys(LANGUAGES) as LanguageCode[];

export const ACTIVE_LANGUAGES: LanguageCode[] = ['hi', 'en', 'pa'];
