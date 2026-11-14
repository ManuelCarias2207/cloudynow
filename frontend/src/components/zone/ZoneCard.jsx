import Card from '../ui/Card.jsx';

/** Shows the chosen point. */
export default function ZoneCard({ location }) {
  if (!location) {
    return <Card className="text-sm text-zinc-500">Click the map or search a place to choose where your farm is.</Card>;
  }
  return (
    <Card>
      <p className="text-xs text-zinc-500">Selected location</p>
      <p className="mt-1 font-medium">{location.label ?? 'Loading place name…'}</p>
      <p className="mt-1 text-xs text-zinc-500">
        {location.lat.toFixed(3)}, {location.lon.toFixed(3)}
      </p>
    </Card>
  );
}
