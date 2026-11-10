import { Navigate, Route, Routes } from 'react-router-dom';
import RouteProtegee from './auth/RouteProtegee';
import Login from './pages/Login';
import Student from './pages/Student';
import Teacher from './pages/Teacher';
import Admin from './pages/Admin';

export default function App() {
  return (
    <Routes>
      <Route path="/connexion" element={<Login />} />
      <Route
        path="/etudiant"
        element={<RouteProtegee role="etudiant"><Student /></RouteProtegee>}
      />
      <Route
        path="/professeur"
        element={<RouteProtegee role="professeur"><Teacher /></RouteProtegee>}
      />
      <Route
        path="/admin"
        element={<RouteProtegee role="admin"><Admin /></RouteProtegee>}
      />
      <Route path="*" element={<Navigate to="/connexion" replace />} />
    </Routes>
  );
}