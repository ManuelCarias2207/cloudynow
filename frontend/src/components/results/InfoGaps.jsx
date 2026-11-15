export default function InfoGaps({ gaps }) {
  return (
    <ul className="list-disc space-y-1 pl-4 text-xs text-muted">
      {gaps.map((gap) => (
        <li key={gap}>{gap}</li>
      ))}
    </ul>
  );
}
