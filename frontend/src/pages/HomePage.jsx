import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '../components/ui/Button.jsx';

export default function HomePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <section className="mx-auto max-w-xl py-16 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">{t('home.title')}</h1>
      <p className="mt-4 text-muted">
        {t('home.intro')}
      </p>
      <Button className="mt-8" onClick={() => navigate('/zone')}>
        {t('home.start')}
      </Button>
      <p className="mt-6 text-xs text-muted">{t('home.notice')}</p>
    </section>
  );
}
