import pt from './pt.json';
import es from './es.json';
import en from './en.json';

const translations = { pt, es, en };

export function getTranslation(lang: string) {
  return translations[lang as keyof typeof translations] || translations.pt;
}

export function getPath(lang: string, path: string = '') {
  return `/${lang}${path}`;
}

export const languages = [
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
];
