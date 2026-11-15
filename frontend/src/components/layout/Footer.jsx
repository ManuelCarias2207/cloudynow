import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="mx-auto hidden w-full max-w-6xl shrink-0 truncate px-4 pb-2 text-xs text-muted sm:block" title={t('footer')}>
      {t('footer')}
    </footer>
  );
}
