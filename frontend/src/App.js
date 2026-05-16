import React from 'react';
import './styles/global.css';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import AdminSmtpConfig from './pages/AdminSmtpConfig';
import Login from './pages/Login';
import MinhaArea from './pages/MinhaArea';
import AdminLogin from './pages/AdminLogin';
import PrivateRoute from './components/PrivateRoute';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Empresas from './pages/Empresas';
import Estabelecimentos from './pages/Estabelecimentos';
import Planos from './pages/Planos';
import Profissionais from './pages/Profissionais';
import Especialidades from './pages/Especialidades';
import Servicos from './pages/Servicos';
import Agendas from './pages/Agendas';
import Agendamentos from './pages/Agendamentos';
import AgendamentoPublico from './pages/AgendamentoPublico';

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin-login" element={<AdminLogin />} />

          <Route element={<PrivateRoute allowedRoles={['cliente']} />}>
            <Route path="/agendar/:estabelecimentoSlug" element={<AgendamentoPublico />} />
          </Route>

          <Route element={<PrivateRoute allowedRoles={['cliente']} />}>
            <Route path="/minha-area" element={<MinhaArea />} />
          </Route>
        </Route>

        <Route element={<PrivateRoute allowedRoles={['admin', 'gestor']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin/smtp" element={<AdminSmtpConfig />} />
            <Route path="/gestor/empresas" element={<Empresas />} />
            <Route path="/gestor/planos" element={<Planos />} />
            <Route path="/estabelecimentos" element={<Estabelecimentos />} />
            <Route path="/profissionais" element={<Profissionais />} />
            <Route path="/especialidades" element={<Especialidades />} />
            <Route path="/servicos" element={<Servicos />} />
            <Route path="/agendas" element={<Agendas />} />
            <Route path="/agendamentos" element={<Agendamentos />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
