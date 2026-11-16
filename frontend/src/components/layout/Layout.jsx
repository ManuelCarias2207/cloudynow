import { useLocation } from 'react-router-dom';
import Header from './Header.jsx';
import Footer from './Footer.jsx';

/** Fills the viewport exactly: header and footer keep their height, each page fills the rest and never scrolls the window. */
export default function Layout({ children }) {
  const { pathname } = useLocation();
  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <Header />
      <main className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col px-4 py-3 sm:py-4">
        <div key={pathname} className="flex min-h-0 flex-1 animate-enter flex-col">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
