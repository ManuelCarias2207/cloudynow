import { Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout.jsx';
import { routes } from './routes.jsx';

export default function App() {
  return (
    <Layout>
      <Routes>
        {routes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
      </Routes>
    </Layout>
  );
}
