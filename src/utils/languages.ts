import { Platform, NativeModules } from 'react-native';

// UI言語（アプリの表示言語）
export const SUPPORTED_LANGUAGES: Record<string, string> = {
  ja: '日本語',
  en: 'English',
  zh: '中文',
};

// 翻訳対応言語（14言語）
export const TRANSLATION_LANGUAGES: Record<string, string> = {
  ja: '日本語',
  en: 'English',
  zh: '中文',
  ko: '한국어',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  pt: 'Português',
  it: 'Italiano',
  ru: 'Русский',
  ar: 'العربية',
  th: 'ไทย',
  vi: 'Tiếng Việt',
  id: 'Bahasa Indonesia',
};

export function getDeviceLanguage(): string {
  const locale =
    Platform.OS === 'ios'
      ? NativeModules.SettingsManager?.settings?.AppleLocale ??
        NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ??
        'en'
      : NativeModules.I18nManager?.localeIdentifier ?? 'en';

  const langCode = locale.split(/[-_]/)[0];
  return langCode in SUPPORTED_LANGUAGES ? langCode : 'en';
}

export function getLanguageName(code: string): string {
  return TRANSLATION_LANGUAGES[code] ?? SUPPORTED_LANGUAGES[code] ?? code;
}
