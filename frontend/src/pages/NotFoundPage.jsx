import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <section className="py-16 text-center">
      <h1 className="text-xl font-semibold">{t('notFound.title')}</h1>
      <Link to="/" className="mt-4 inline-block text-sm underline">
        {t('notFound.home')}
      </Link>
    </section>
  );
}
