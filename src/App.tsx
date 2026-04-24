import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LoginGate from './components/LoginGate';
import UserView from './views/UserView';
import OperatorView from './views/OperatorView';
import FieldUnitView from './views/FieldUnitView';
import HospitalView from './views/HospitalView';
import DoctorView from './views/DoctorView';
import LandingPage from './views/LandingPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/user" element={<LoginGate role="patient"><UserView /></LoginGate>} />
          <Route path="/operator" element={<LoginGate role="operator"><OperatorView /></LoginGate>} />
          <Route path="/doctor" element={<LoginGate role="doctor"><DoctorView /></LoginGate>} />
          <Route path="/field" element={<LoginGate role="field"><FieldUnitView /></LoginGate>} />
          <Route path="/hospital" element={<LoginGate role="admin"><HospitalView /></LoginGate>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
