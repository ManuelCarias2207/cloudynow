import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <section className="py-16 text-center">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <Link to="/" className="mt-4 inline-block text-sm underline">
        Go home
      </Link>
    </section>
  );
}
