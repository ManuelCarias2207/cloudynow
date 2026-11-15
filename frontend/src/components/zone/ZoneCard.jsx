import { useTranslation } from 'react-i18next';
import Card from '../ui/Card.jsx';

/** Shows the chosen point. */
export default function ZoneCard({ location }) {
  const { t } = useTranslation();
  if (!location) {
    return <Card className="text-sm text-zinc-500">{t('zone.empty')}</Card>;
  }
  return (
    <Card>
      <p className="text-xs text-zinc-500">{t('zone.selected')}</p>
      <p className="mt-1 font-medium">{location.label ?? t('zone.loadingName')}</p>
      <p className="mt-1 text-xs text-zinc-500">
        {location.lat.toFixed(3)}, {location.lon.toFixed(3)}
      </p>
    </Card>
  );
}
