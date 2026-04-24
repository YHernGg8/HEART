import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import UserView from './views/UserView';
import OperatorView from './views/OperatorView';
import FieldUnitView from './views/FieldUnitView';
import HospitalView from './views/HospitalView';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/operator" replace />} />
          <Route path="/user" element={<UserView />} />
          <Route path="/operator" element={<OperatorView />} />
          <Route path="/field" element={<FieldUnitView />} />
          <Route path="/hospital" element={<HospitalView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
