import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageToggle from './LanguageToggle.jsx';

export default function Header() {
  const { t } = useTranslation();
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 rounded-md font-semibold text-ink">
          <img src="/favicon.svg" alt="" width="28" height="28" className="h-7 w-7" />
          Siembra Satelital
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-muted sm:inline">{t('header.tagline')}</span>
          <LanguageToggle />
        </div>
      </div>
    </header>
  );
}
