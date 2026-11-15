import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="mx-auto max-w-5xl px-4 py-6 text-xs text-zinc-500">
      {t('footer')}
    </footer>
  );
}
