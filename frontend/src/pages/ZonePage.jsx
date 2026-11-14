import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StepIndicator from '../components/layout/StepIndicator.jsx';
import ZoneMap from '../components/zone/ZoneMap.jsx';
import ZoneCard from '../components/zone/ZoneCard.jsx';
import Button from '../components/ui/Button.jsx';
import { useFlow } from '../hooks/useFlow.js';
import { searchPlaces, placeName } from '../services/api.js';
import { EL_SALVADOR_BOUNDS } from '../lib/constants.js';
import { isInsideBounds } from '../lib/utils.js';

export default function ZonePage() {
  const navigate = useNavigate();
  const { location, setLocation } = useFlow();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState('');

  const pick = async (point) => {
    if (!isInsideBounds(point, EL_SALVADOR_BOUNDS)) {
      setMessage('Please choose a point inside El Salvador.');
      return;
    }
    setMessage('');
    setResults([]);
    setLocation({ ...point, label: point.label ?? null });
    if (!point.label) {
      const label = await placeName(point);
      setLocation((current) => (current?.lat === point.lat && current?.lon === point.lon ? { ...current, label: label ?? 'Unnamed place' } : current));
    }
  };

  const search = async (event) => {
    event.preventDefault();
    if (!query.trim()) return;
    try {
      const places = await searchPlaces(query.trim());
      setResults(places);
      setMessage(places.length === 0 ? 'No places found in El Salvador.' : '');
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <>
      <StepIndicator current={0} />
      <h1 className="mb-4 text-xl font-semibold">Where is your farm?</h1>
      <form onSubmit={search} className="relative mb-3 flex gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search a town or place, e.g. Chalatenango"
          className="w-full rounded-xl bg-white px-4 py-2.5 text-sm ring-1 ring-zinc-200 outline-none focus:ring-zinc-900"
        />
        <Button type="submit" variant="secondary">
          Search
        </Button>
        {results.length > 0 && (
          <ul className="absolute top-full z-10 mt-1 w-full overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-zinc-200">
            {results.map((place) => (
              <li key={`${place.lat},${place.lon}`}>
                <button type="button" onClick={() => pick(place)} className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-100">
                  {place.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </form>
      {message && <p className="mb-3 text-sm text-amber-700">{message}</p>}
      <div className="grid gap-4 md:grid-cols-[1fr_280px]">
        <ZoneMap selected={location} onPick={pick} />
        <div className="flex flex-col gap-4">
          <ZoneCard location={location} />
          <Button disabled={!location} onClick={() => navigate('/farm')}>
            Continue
          </Button>
        </div>
      </div>
    </>
  );
}
