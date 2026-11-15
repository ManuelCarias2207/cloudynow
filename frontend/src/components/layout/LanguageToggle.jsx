import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../../i18n/index.js';
import { cn } from '../../lib/utils.js';

const NAMES = { en: 'English', es: 'Español' };

/** Switches the UI and the API texts between English and Spanish. */
export default function LanguageToggle() {
  const { i18n, t } = useTranslation();
  return (
    <div role="group" aria-label={t('header.language')} className="flex rounded-full bg-surface p-1 ring-1 ring-line-strong">
      {LANGUAGES.map((lang) => {
        const active = i18n.language === lang;
        return (
          <button
            key={lang}
            type="button"
            lang={lang}
            aria-pressed={active}
            onClick={() => i18n.changeLanguage(lang)}
            className={cn(
              'min-h-9 min-w-11 cursor-pointer rounded-full px-3 text-sm font-semibold',
              active ? 'bg-brand text-white' : 'text-muted hover:text-ink',
            )}
          >
            {lang.toUpperCase()}
            <span className="sr-only"> {NAMES[lang]}</span>
          </button>
        );
      })}
    </div>
  );
}
