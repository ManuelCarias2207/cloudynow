import HomePage from './pages/HomePage.jsx';
import ZonePage from './pages/ZonePage.jsx';
import FarmPage from './pages/FarmPage.jsx';
import ResultsPage from './pages/ResultsPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export const routes = [
  { path: '/', element: <HomePage /> },
  { path: '/zone', element: <ZonePage /> },
  { path: '/farm', element: <FarmPage /> },
  { path: '/results', element: <ResultsPage /> },
  { path: '*', element: <NotFoundPage /> },
];
