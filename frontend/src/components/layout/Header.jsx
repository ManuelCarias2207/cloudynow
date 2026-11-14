import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <img src="/favicon.svg" alt="" className="h-7 w-7" />
          Siembra Satelital
        </Link>
        <span className="text-xs text-zinc-500">NASA POWER climate data</span>
      </div>
    </header>
  );
}
