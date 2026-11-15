import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { searchPlaces } from '../../services/api.js';
import { cn } from '../../lib/utils.js';

const MIN_CHARS = 3;
const DEBOUNCE_MS = 300;
const cache = new Map();

/** Place autocomplete (ARIA combobox): debounced, cancels stale requests, El Salvador only. */
export default function PlaceSearch({ onPick }) {
  const { t, i18n } = useTranslation();
  const id = useId();
  const listId = `${id}-list`;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const lastPicked = useRef('');

  useEffect(() => {
    const text = query.trim();
    if (text.length < MIN_CHARS || text === lastPicked.current) {
      setResults([]);
      setStatus('idle');
      return undefined;
    }
    const key = `${i18n.language}:${text.toLowerCase()}`;
    if (cache.has(key)) {
      setResults(cache.get(key));
      setStatus('done');
      setActive(-1);
      return undefined;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setStatus('loading');
      try {
        const places = await searchPlaces(text, { signal: controller.signal, lang: i18n.language });
        cache.set(key, places);
        setResults(places);
        setStatus('done');
        setActive(-1);
      } catch (error) {
        if (error.name !== 'AbortError') setStatus('error');
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, i18n.language]);

  const choose = (place) => {
    lastPicked.current = place.label;
    setQuery(place.label);
    setOpen(false);
    setResults([]);
    onPick({ ...place, source: 'search' });
  };

  const onKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (results.length === 0) return;
      event.preventDefault();
      setOpen(true);
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive((index) => (index + step + results.length) % results.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const place = results[active] ?? results[0];
      if (open && place) choose(place);
    } else if (event.key === 'Escape') {
      setOpen(false);
      setActive(-1);
    }
  };

  const text = query.trim();
  const showList = open && results.length > 0;
  const message =
    text.length > 0 && text.length < MIN_CHARS
      ? t('zone.minChars', { count: MIN_CHARS })
      : status === 'loading'
        ? t('zone.searching')
        : status === 'error'
          ? t('zone.searchUnavailable')
          : status === 'done' && results.length === 0
            ? t('zone.noPlaces')
            : '';

  return (
    <div className="relative">
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {t('zone.searchLabel')}
      </label>
      <input
        id={id}
        type="search"
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
        aria-describedby={`${id}-status`}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        placeholder={t('zone.searchPlaceholder')}
        className="min-h-11 w-full rounded-md bg-surface px-3 py-2.5 text-base ring-1 ring-line-strong placeholder:text-muted"
      />
      <p id={`${id}-status`} role="status" className={cn('text-sm', message ? 'mt-1' : 'sr-only', status === 'error' ? 'text-danger' : 'text-muted')}>
        {message || (showList ? t('zone.resultsCount', { count: results.length }) : '')}
      </p>
      <ul
        id={listId}
        role="listbox"
        aria-label={t('zone.searchLabel')}
        hidden={!showList}
        className="absolute top-full z-20 mt-1 max-h-64 w-full overflow-auto rounded-md bg-surface shadow-pop ring-1 ring-line"
      >
        {results.map((place, index) => (
          <li
            key={`${place.lat},${place.lon},${index}`}
            id={`${listId}-${index}`}
            role="option"
            aria-selected={index === active}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => choose(place)}
            onMouseEnter={() => setActive(index)}
            className={cn('cursor-pointer px-3 py-2.5 text-sm', index === active && 'bg-brand-soft text-brand')}
          >
            {place.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
