import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '../components/ui/Button.jsx';
import Reveal from '../components/ui/Reveal.jsx';

// Monthly rain shape (Jan-Dec) for the decorative preview; bare-field months are drawn in maize.
const PREVIEW_RAIN = [12, 13, 29, 18, 66, 100, 54, 70, 92, 72, 41, 38];
const PREVIEW_BARE = new Set([0, 1, 3]);

function StepItem({ number, text, index }) {
  return (
    <Reveal as="li" index={index + 3} className="flex items-center gap-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-semibold text-brand">{number}</span>
      <span className="text-sm">{text}</span>
    </Reveal>
  );
}

/** Decorative sample of a result, so farmers see what they will get before starting. */
function ResultPreview() {
  const { t } = useTranslation();
  return (
    <div aria-hidden="true" className="relative w-full max-w-sm">
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-brand-soft/70" />
      <div className="rounded-lg bg-surface p-5 shadow-raised ring-1 ring-line">
        <div className="flex items-center justify-between text-xs text-muted">
          <span>{t('home.preview.place')}</span>
          <span className="rounded-full bg-surface-2 px-2 py-0.5">{t('home.preview.example')}</span>
        </div>
        <p className="mt-1 text-sm font-medium">{t('home.preview.rain')}</p>
        <p className="mt-4 text-xs text-muted">{t('home.preview.months')}</p>
        <div className="mt-2 flex h-20 items-end gap-1">
          {PREVIEW_RAIN.map((value, index) => (
            <span
              key={index}
              className={`flex-1 origin-bottom animate-enter rounded-t-sm ${PREVIEW_BARE.has(index) ? 'bg-maize' : 'bg-[#2f6f9a]'}`}
              style={{ height: `${value}%`, animationDelay: `${200 + index * 40}ms` }}
            />
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between gap-3 rounded-md bg-brand p-3 text-white">
          <div className="min-w-0">
            <p className="text-xs text-on-brand-muted">{t('home.preview.best')}</p>
            <p className="truncate text-sm font-semibold">{t('home.preview.option')}</p>
          </div>
          <p className="shrink-0 text-lg font-semibold tabular-nums">{t('home.preview.score')}</p>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <section className="grid min-h-0 flex-1 items-center gap-10 md:grid-cols-[1.15fr_1fr]">
      <div className="flex flex-col items-start">
        <Reveal as="p" className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-brand ring-1 ring-line">
          {t('home.eyebrow')}
        </Reveal>
        <Reveal as="h1" index={1} className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-[2.6rem] sm:leading-[1.15]">
          {t('home.title')}
        </Reveal>
        <Reveal as="p" index={2} className="mt-4 max-w-xl text-muted text-pretty">
          {t('home.intro')}
        </Reveal>
        <ol aria-label={t('home.stepsTitle')} className="mt-6 grid gap-2.5">
          <StepItem number={1} text={t('home.step1')} index={0} />
          <StepItem number={2} text={t('home.step2')} index={1} />
          <StepItem number={3} text={t('home.step3')} index={2} />
        </ol>
        <Reveal index={6} className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Button size="lg" onClick={() => navigate('/zone')}>
            {t('home.start')}
            <span aria-hidden="true">→</span>
          </Button>
          <span className="text-xs text-muted">{t('home.time')}</span>
        </Reveal>
        <Reveal as="p" index={7} className="mt-5 text-xs text-muted">
          {t('home.notice')}
        </Reveal>
      </div>
      <Reveal index={3} className="hidden justify-center md:flex">
        <ResultPreview />
      </Reveal>
    </section>
  );
}
