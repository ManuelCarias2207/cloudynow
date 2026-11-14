import RotationCard from './RotationCard.jsx';

export default function RotationComparison({ rotations, weights }) {
  const bestTotal = Math.max(...rotations.map((rotation) => rotation.scores.total));
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {rotations.map((rotation) => (
        <RotationCard key={rotation.id} rotation={rotation} weights={weights} best={rotation.scores.total === bestTotal} />
      ))}
    </div>
  );
}
