import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '../components/ui/Button.jsx';

export default function HomePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <section className="mx-auto flex min-h-0 max-w-xl flex-1 flex-col items-center justify-center text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-balance">{t('home.title')}</h1>
      <p className="mt-4 text-muted">{t('home.intro')}</p>
      <Button size="lg" className="mt-8" onClick={() => navigate('/zone')}>
        {t('home.start')}
      </Button>
      <p className="mt-6 text-xs text-muted">{t('home.notice')}</p>
    </section>
  );
}
