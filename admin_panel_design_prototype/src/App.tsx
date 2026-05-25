import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Overview from './pages/Overview';
import Users from './pages/Users';
import UserDetails from './pages/UserDetails';
import Subscriptions from './pages/Subscriptions';
import Visits from './pages/Visits';
import Executors from './pages/Executors';
import Support from './pages/Support';
import Payments from './pages/Payments';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Overview />} />
        <Route path="users" element={<Users />} />
        <Route path="users/:id" element={<UserDetails />} />
        <Route path="subscriptions" element={<Subscriptions />} />
        <Route path="visits" element={<Visits />} />
        <Route path="executors" element={<Executors />} />
        <Route path="support" element={<Support />} />
        <Route path="payments" element={<Payments />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
