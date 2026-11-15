import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageToggle from './LanguageToggle.jsx';

export default function Header() {
  const { t } = useTranslation();
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <img src="/favicon.svg" alt="" className="h-7 w-7" />
          Siembra Satelital
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-zinc-500 sm:inline">{t('header.tagline')}</span>
          <LanguageToggle />
        </div>
      </div>
    </header>
  );
}
