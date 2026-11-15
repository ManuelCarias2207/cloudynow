import { useTranslation } from 'react-i18next';

/** Switches the UI and the API texts between English and Spanish. */
export default function LanguageToggle() {
  const { i18n, t } = useTranslation();
  const next = i18n.language === 'es' ? 'en' : 'es';
  return (
    <button
      type="button"
      onClick={() => i18n.changeLanguage(next)}
      title={t('header.switchLanguage')}
      aria-label={t('header.switchLanguage')}
      className="rounded-full px-3 py-1 text-xs font-medium ring-1 ring-zinc-200 transition hover:bg-zinc-100"
    >
      <span className={i18n.language === 'en' ? 'text-zinc-900' : 'text-zinc-400'}>EN</span>
      <span className="mx-1 text-zinc-300">|</span>
      <span className={i18n.language === 'es' ? 'text-zinc-900' : 'text-zinc-400'}>ES</span>
    </button>
  );
}
