import {Platform, NativeModules} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './en';
import ja from './ja';
import ko from './ko';
import zh from './zh';
import zhTW from './zhTW';
import es from './es';
import fr from './fr';
import de from './de';
import it from './it';
import pt from './pt';
import ru from './ru';
import ar from './ar';
import hi from './hi';
import th from './th';
import tr from './tr';
import vi from './vi';
import ind from './id';
import nl from './nl';

const translations: Record<string, Record<string, string>> = {
  en, ja, ko, zh, 'zh-TW': zhTW, es, fr, de, it, pt, ru, ar, hi, th, tr, vi, id: ind, nl,
};

export const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  ja: '日本語',
  ko: '한국어',
  zh: '简体中文',
  'zh-TW': '繁體中文',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  pt: 'Português',
  ru: 'Русский',
  ar: 'العربية',
  hi: 'हिन्दी',
  th: 'ไทย',
  tr: 'Türkçe',
  vi: 'Tiếng Việt',
  id: 'Bahasa Indonesia',
  nl: 'Nederlands',
};

export const AVAILABLE_LANGUAGES = Object.keys(LANGUAGE_NAMES);

const LANG_KEY = 'app_language';

function detectLocale(): string {
  try {
    let raw = 'en';
    if (Platform.OS === 'ios') {
      const s = NativeModules.SettingsManager?.settings;
      raw = s?.AppleLocale || s?.AppleLanguages?.[0] || 'en';
    } else {
      const i18n = NativeModules.I18nManager;
      raw = i18n?.localeIdentifier
        || i18n?.getConstants?.()?.localeIdentifier
        || 'en';
    }
    raw = raw.replace(/_/g, '-');
    if (raw.startsWith('zh-Hant') || raw.startsWith('zh-TW') || raw.startsWith('zh-HK')) return 'zh-TW';
    if (raw.startsWith('zh')) return 'zh';
    const lang = raw.split('-')[0];
    return translations[lang] ? lang : 'en';
  } catch {
    return 'en';
  }
}

let currentLocale = detectLocale();

export async function initLocale(): Promise<void> {
  try {
    const saved = await AsyncStorage.getItem(LANG_KEY);
    if (saved && translations[saved]) {
      currentLocale = saved;
    }
  } catch {}
}

export async function changeLocale(lang: string): Promise<void> {
  if (!translations[lang]) return;
  currentLocale = lang;
  await AsyncStorage.setItem(LANG_KEY, lang);
}

export function getCurrentLocale(): string {
  return currentLocale;
}

export function t(key: string, ...args: (string | number)[]): string {
  const template = translations[currentLocale]?.[key] || en[key] || key;
  if (args.length === 0) return template;
  return template.replace(/\{(\d+)\}/g, (_, i) => String(args[Number(i)]));
}
