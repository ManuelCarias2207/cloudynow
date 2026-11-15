import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="mx-auto max-w-5xl px-4 py-6 text-xs text-muted">
      {t('footer')}
    </footer>
  );
}
