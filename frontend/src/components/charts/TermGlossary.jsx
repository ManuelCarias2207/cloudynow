const TERMS = [
  {
    term: 'Bare-field window',
    text: 'Months with less than 50 mm of rain and drier-than-usual soil. Fields are often left uncovered then, so wind and the first heavy rains can wash soil away.',
  },
  {
    term: 'Soil moisture',
    text: 'How much water the soil holds around the roots, measured from space. Low values mean plants struggle to find water.',
  },
  {
    term: 'Dry spell',
    text: 'Days in a row with almost no rain during the rainy season. Long dry spells can hurt crops when they are flowering.',
  },
];

export default function TermGlossary() {
  return (
    <dl className="grid gap-3 text-sm sm:grid-cols-3">
      {TERMS.map(({ term, text }) => (
        <div key={term}>
          <dt className="font-medium">{term}</dt>
          <dd className="text-zinc-600">{text}</dd>
        </div>
      ))}
    </dl>
  );
}
