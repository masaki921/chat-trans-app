import { ja } from './ja';
import { en } from './en';
import { zh } from './zh';
import { useAuthStore } from '../stores/authStore';

export type Translations = typeof ja;

const translations: Record<string, Translations> = { ja, en, zh };

function getDeviceLanguage(): string {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    const lang = locale.split('-')[0];
    if (lang === 'ja' || lang === 'en' || lang === 'zh') return lang;
    return 'en';
  } catch {
    return 'en';
  }
}

export function useI18n() {
  const profileLang = useAuthStore((s) => s.profile?.primary_language);
  const language = profileLang ?? getDeviceLanguage();
  const t = translations[language] ?? translations.en;
  return { t, language };
}
