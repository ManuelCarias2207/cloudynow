import { useLocation } from 'react-router-dom';
import Header from './Header.jsx';
import Footer from './Footer.jsx';

// Pages that fill the viewport (map) instead of scrolling a centered column.
const FULL_SCREEN = ['/zone'];

export default function Layout({ children }) {
  const { pathname } = useLocation();
  if (FULL_SCREEN.includes(pathname)) {
    return (
      <div className="flex h-dvh flex-col">
        <Header />
        <main className="relative min-h-0 flex-1">{children}</main>
      </div>
    );
  }
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
      <Footer />
    </div>
  );
}
