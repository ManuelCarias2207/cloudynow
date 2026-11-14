export default function InfoGaps({ gaps }) {
  return (
    <ul className="list-disc space-y-1 pl-4 text-xs text-zinc-600">
      {gaps.map((gap) => (
        <li key={gap}>{gap}</li>
      ))}
    </ul>
  );
}
