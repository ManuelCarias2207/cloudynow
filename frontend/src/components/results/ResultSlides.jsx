import { Fragment, lazy, Suspense, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Tooltip from '../ui/Tooltip.jsx';
import { SkeletonBlock } from '../ui/Skeleton.jsx';
import { CRITERIA } from '../../lib/constants.js';
import { cn, toPercent } from '../../lib/utils.js';

// Charts pull in recharts, so they load only when their slide opens.
const ClimateCharts = lazy(() => import('../charts/ClimateCharts.jsx'));

/** 0..1 score -> plain word key. */
export function scoreLevel(score) {
  if (score >= 0.75) return 'great';
  if (score >= 0.6) return 'good';
  if (score >= 0.45) return 'fair';
  return 'weak';
}

const LEVEL_TONE = {
  great: 'bg-brand text-white',
  good: 'bg-brand-soft text-brand',
  fair: 'bg-maize-soft text-maize-ink',
  weak: 'bg-surface-2 text-muted',
};

/** Rotations sorted from best to worst total. */
export function ranked(rotations) {
  return [...rotations].sort((a, b) => b.scores.total - a.scores.total);
}

const NARROW = '(max-width: 767px)';

function useNarrow() {
  const [narrow, setNarrow] = useState(() => window.matchMedia?.(NARROW).matches ?? false);
  useEffect(() => {
    const media = window.matchMedia?.(NARROW);
    if (!media) return undefined;
    const update = () => setNarrow(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return narrow;
}

/** On wide screens shows every part side by side; on phones shows one part at a time behind a small switch, so nothing scrolls. */
function Parts({ items }) {
  const narrow = useNarrow();
  const [active, setActive] = useState(items[0].id);
  if (!narrow) return items.map((item) => <Fragment key={item.id}>{item.content}</Fragment>);
  const current = items.find((item) => item.id === active) ?? items[0];
  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div role="tablist" className="flex shrink-0 gap-1 self-start rounded-full bg-surface-2 p-1">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={item.id === current.id}
            onClick={() => setActive(item.id)}
            className={cn('rounded-full px-3 py-1.5 text-xs font-medium transition-colors', item.id === current.id ? 'bg-surface text-ink shadow-resting' : 'text-muted')}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div key={current.id} className="flex min-h-0 flex-1 animate-enter flex-col gap-4">
        {current.content}
      </div>
    </div>
  );
}

function Kicker({ children }) {
  return <p className="text-xs font-semibold tracking-wide text-brand uppercase">{children}</p>;
}

function LevelPill({ score, className }) {
  const { t } = useTranslation();
  const level = scoreLevel(score);
  return <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', LEVEL_TONE[level], className)}>{t(`slides.level.${level}`)}</span>;
}

function Bullets({ items, tone }) {
  return (
    <ul className="grid gap-1.5 text-sm">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5">
          <span aria-hidden="true" className={cn('mt-2 size-1.5 shrink-0 rounded-full', tone)} />
          <span className="text-pretty">{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** Slide 1: plain-language summary and ranking. */
export function SummarySlide({ data, place, priority, onOpen }) {
  const { t } = useTranslation();
  const order = ranked(data.rotations);
  const best = order[0];
  const bestKey = { water: 'bestWater', income: 'bestIncome', soil: 'bestSoil' }[priority];
  return (
    <div className="grid h-full min-h-0 gap-6 md:grid-cols-[1.1fr_1fr] md:items-center">
      <Parts
        items={[
          {
            id: 'found',
            label: t('slides.parts.found'),
            content: (
      <div className="flex flex-col gap-4">
        <Kicker>{t('slides.summary.kicker')}</Kicker>
        <h2 className="text-xl font-semibold tracking-tight text-balance sm:text-3xl">{t('slides.summary.title', { place })}</h2>
        <p className="text-muted text-pretty">
          {t('slides.summary.climate', { rain: data.indicators.meanAnnualRainMm.toLocaleString(), days: data.indicators.longestDrySpellDays })}
        </p>
        <div className="rounded-lg bg-brand p-4 text-white shadow-raised">
          <p className="text-sm text-on-brand-muted">{t(`slides.summary.${bestKey}`)}</p>
          <p className="mt-1 text-lg font-semibold">
            {t('results.option', { id: best.id })} · {best.name}
          </p>
          <p className="mt-1 text-sm text-on-brand-muted">{best.crops.map((crop) => crop.name).join(' → ')}</p>
        </div>
        {data.similar && <p className="text-sm text-maize-ink">{t('slides.summary.tie', { a: order[0].id, b: order[1].id })}</p>}
        {data.fallback && <p className="text-xs text-muted">{t('slides.summary.stored')}</p>}
      </div>
            ),
          },
          {
            id: 'ranking',
            label: t('slides.parts.ranking'),
            content: (
      <div className="rounded-lg bg-surface p-5 ring-1 ring-line">
        <p className="mb-3 text-sm font-medium">{t('slides.summary.ranking')}</p>
        <ol className="grid gap-2">
          {order.map((rotation, index) => (
            <li key={rotation.id}>
              <button
                type="button"
                onClick={() => onOpen(rotation.id)}
                aria-label={t('slides.summary.seeOption', { id: rotation.id })}
                className="group flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-surface-2"
              >
                <span className={cn('grid size-8 shrink-0 place-items-center rounded-full text-sm font-semibold', index === 0 ? 'bg-brand text-white' : 'bg-surface-2 text-ink')}>
                  {rotation.id}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{rotation.name}</span>
                  <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <span className="block h-full origin-left animate-grow rounded-full bg-brand" style={{ width: `${toPercent(rotation.scores.total)}%`, animationDelay: `${index * 80}ms` }} />
                  </span>
                </span>
                <span className="shrink-0 text-sm font-semibold tabular-nums">{toPercent(rotation.scores.total)}</span>
                <span aria-hidden="true" className="text-muted transition-transform group-hover:translate-x-0.5">→</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
            ),
          },
        ]}
      />
    </div>
  );
}

function CriterionRow({ criterion, score, weight }) {
  const { t } = useTranslation();
  return (
    <li className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1">
      <Tooltip
        content={
          <>
            {t(`slides.criteriaHint.${criterion}`)} {t('slides.weight', { pct: Math.round(weight * 100) })}
          </>
        }
      >
        <button type="button" className="cursor-help text-left text-sm underline decoration-line-strong decoration-dotted underline-offset-4">
          {t(`slides.criteria.${criterion}`)}
        </button>
      </Tooltip>
      <LevelPill score={score} />
      <span aria-hidden="true" className="col-span-2 block h-1.5 overflow-hidden rounded-full bg-surface-2">
        <span className="block h-full origin-left animate-grow rounded-full bg-brand" style={{ width: `${toPercent(score)}%` }} />
      </span>
    </li>
  );
}

/** Slides 2-4: one rotation explained. */
export function OptionSlide({ rotation, weights, isBest }) {
  const { t } = useTranslation();
  return (
    <div className="grid h-full min-h-0 gap-6 md:grid-cols-[0.9fr_1.3fr_1fr]">
      <Parts
        items={[
          {
            id: 'score',
            label: t('slides.parts.score'),
            content: (
      <div className="flex flex-col gap-4">
        <Kicker>{t('slides.option.kicker', { id: rotation.id })}</Kicker>
        <h2 className="text-xl font-semibold tracking-tight text-balance sm:text-[1.75rem] sm:leading-tight">{rotation.name}</h2>
        <div>
          <p className="mb-2 text-xs text-muted">{t('slides.option.plants')}</p>
          <ul className="flex flex-wrap gap-1.5">
            {rotation.crops.map((crop) => (
              <li key={crop.id} className="rounded-full bg-surface px-3 py-1 text-sm ring-1 ring-line">
                {crop.name}
              </li>
            ))}
          </ul>
        </div>
        <div className={cn('mt-auto rounded-lg p-4', isBest ? 'bg-brand text-white' : 'bg-surface ring-1 ring-line')}>
          <p className={cn('text-xs', isBest ? 'text-on-brand-muted' : 'text-muted')}>{t('slides.option.score')}</p>
          <p className="mt-1 flex items-baseline gap-1.5">
            <span className="text-[2.75rem] leading-none font-semibold tabular-nums">{toPercent(rotation.scores.total)}</span>
            <span className={cn('text-sm', isBest ? 'text-on-brand-muted' : 'text-muted')}>{t('slides.option.outOf')}</span>
          </p>
          {isBest && <p className="mt-1 text-sm font-medium">{t('results.best')}</p>}
        </div>
      </div>
            ),
          },
          {
            id: 'pros',
            label: t('slides.parts.pros'),
            content: (
      <div className="flex min-h-0 flex-col gap-4">
        <div>
          <p className="mb-2 text-sm font-semibold">{t('slides.option.good')}</p>
          <Bullets items={rotation.benefits} tone="bg-brand" />
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold">{t('slides.option.watch')}</p>
          {rotation.risks.length > 0 ? <Bullets items={rotation.risks} tone="bg-maize" /> : <p className="text-sm text-muted">{t('slides.option.noRisks')}</p>}
        </div>
      </div>
            ),
          },
          {
            id: 'points',
            label: t('slides.parts.points'),
            content: (
      <div className="rounded-lg bg-surface p-4 ring-1 ring-line md:self-start">
        <p className="mb-3 text-sm font-semibold">{t('slides.option.how')}</p>
        <ul className="grid gap-3">
          {CRITERIA.map((criterion) => (
            <CriterionRow key={criterion} criterion={criterion} score={rotation.scores[criterion]} weight={weights[criterion]} />
          ))}
        </ul>
      </div>
            ),
          },
        ]}
      />
    </div>
  );
}

function ClimateParts({ charts }) {
  const { t } = useTranslation();
  const narrow = useNarrow();
  if (!narrow) return charts(null);
  return (
    <Parts
      items={[
        { id: 'rain', label: t('slides.parts.rain'), content: charts('rain') },
        { id: 'soil', label: t('slides.parts.soil'), content: charts('soil') },
      ]}
    />
  );
}

/** Climate charts slide. */
export function ClimateSlide({ data }) {
  const { t } = useTranslation();
  const charts = (only) => (
    <ClimateCharts
      monthly={data.monthly}
      indicators={data.indicators}
      hasSoilMoisture={data.hasSoilMoisture}
      dataSource={data.dataSource}
      chartHeight={only ? 230 : 190}
      only={only}
      bare
      className="min-h-0 flex-1"
    />
  );
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <Kicker>{t('slides.climate.kicker')}</Kicker>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">{t('slides.climate.title')}</h2>
        </div>
        <p className="text-xs text-muted max-md:hidden">{t('slides.climate.hint')}</p>
      </div>
      <Suspense fallback={<SkeletonBlock label={t('layout.loadingCharts')} className="h-72 w-full" />}>
        <ClimateParts charts={charts} />
      </Suspense>
    </div>
  );
}

/** Last slide: limits, confidence and the support notice. */
export function BeforeSlide({ data, actions }) {
  const { t } = useTranslation();
  // Gaps shared by every rotation, plus one line for the per-crop "draft values" notes.
  const [first, ...others] = data.rotations.map((rotation) => rotation.informationGaps);
  const gaps = [...first.filter((gap) => others.every((list) => list.includes(gap))), t('slides.before.drafts')];
  return (
    <div className="grid h-full min-h-0 gap-6 md:grid-cols-[1.2fr_1fr] md:items-center">
      <Parts
        items={[
          {
            id: 'limits',
            label: t('slides.parts.limits'),
            content: (
      <div className="flex flex-col gap-4">
        <Kicker>{t('slides.before.kicker')}</Kicker>
        <h2 className="text-xl font-semibold tracking-tight text-balance sm:text-3xl">{t('slides.before.title')}</h2>
        <Bullets items={gaps} tone="bg-line-strong" />
      </div>
            ),
          },
          {
            id: 'sure',
            label: t('slides.parts.sure'),
            content: (
      <div className="flex flex-col gap-4">
        <div className="rounded-lg bg-surface p-5 ring-1 ring-line">
          <p className="text-sm font-semibold">{t('slides.before.confidence')}</p>
          <p className="mt-1 text-sm text-muted text-pretty">{data.confidenceNote}</p>
        </div>
        <p className="rounded-lg bg-brand-soft p-5 text-sm text-pretty text-brand">{data.disclaimer}</p>
        <div className="flex flex-wrap gap-2">{actions}</div>
      </div>
            ),
          },
        ]}
      />
    </div>
  );
}
