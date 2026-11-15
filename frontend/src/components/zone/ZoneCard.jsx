import { useTranslation } from 'react-i18next';
import Card from '../ui/Card.jsx';

/** Shows the chosen point and the NASA POWER cell its climate data comes from. */
export default function ZoneCard({ location }) {
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
      <p className="mt-3 flex gap-2 border-t border-line pt-3 text-sm">
        <span aria-hidden="true" className="mt-1 size-3 shrink-0 rounded-sm bg-accent/40 ring-1 ring-brand" />
        <span>
          <span className="font-medium">{t('zone.cellNote')}</span> <span className="text-muted">{t('zone.cellDetail')}</span>
        </span>
      </p>
    </Card>
  );
}
