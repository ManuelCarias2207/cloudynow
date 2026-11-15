import { useTranslation } from 'react-i18next';
import Card from '../ui/Card.jsx';
import { cn } from '../../lib/utils.js';

/** Shows the chosen point and a toggle for the NASA POWER cell its climate data comes from. */
export default function ZoneCard({ location, showCell, onToggleCell, onPreviewCell }) {
  const { t } = useTranslation();
  if (!location) {
    return <Card className="text-sm text-muted">{t('zone.empty')}</Card>;
  }
  return (
    <Card>
      <p className="text-xs text-muted">{t('zone.selected')}</p>
      <p className="mt-1 font-medium">{location.label ?? t('zone.loadingName')}</p>
      <p className="mt-1 text-xs text-muted">
        {location.lat.toFixed(3)}, {location.lon.toFixed(3)}
      </p>
      <div className="mt-3 border-t border-line pt-3" onMouseEnter={() => onPreviewCell(true)} onMouseLeave={() => onPreviewCell(false)}>
        <p className="text-sm text-muted">{t('zone.cellNote')}</p>
        <button
          type="button"
          aria-pressed={showCell}
          onClick={onToggleCell}
          onFocus={() => onPreviewCell(true)}
          onBlur={() => onPreviewCell(false)}
          className={cn(
            'mt-2 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md px-3 text-sm font-medium ring-1',
            showCell ? 'bg-brand-soft text-brand ring-brand' : 'text-ink ring-line-strong hover:bg-surface-2',
          )}
        >
          <span aria-hidden="true" className="size-3.5 rounded-sm border border-dashed border-brand" />
          {t('zone.cellLabel')}
        </button>
      </div>
    </Card>
  );
}
