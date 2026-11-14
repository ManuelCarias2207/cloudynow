import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';

export default function HomePage() {
  const navigate = useNavigate();
  return (
    <section className="mx-auto max-w-xl py-16 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Compare crop rotations with NASA climate data</h1>
      <p className="mt-4 text-zinc-600">
        Pick your farm on the map, tell us what you plant and what matters most. We compare three rotations using 10 years of
        NASA POWER rainfall, temperature and soil moisture.
      </p>
      <Button className="mt-8" onClick={() => navigate('/zone')}>
        Start
      </Button>
      <p className="mt-6 text-xs text-zinc-500">This tool supports your decision. It does not replace you or your local technician.</p>
    </section>
  );
}
