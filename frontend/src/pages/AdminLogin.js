import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import { request, ApiError } from '../utils/api';
import { setAuthToken, setAuthUser, clearAuthToken, clearAuthUser } from '../utils/auth';

function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await request('/api/login', {
        method: 'POST',
        body: {
          email: form.email.trim(),
          password: form.password
        },
        auth: false,
      });
      setAuthToken(data.access_token || data.token);
      setAuthUser(data.user);
      const role = String(data.user?.role || '').toLowerCase();
      if (role === 'admin' || role === 'gestor') {
        navigate('/dashboard', { replace: true });
      } else {
        setError('Acesso restrito: apenas gestores e administradores podem acessar esta área.');
        clearAuthToken();
        clearAuthUser();
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao fazer login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
        <Stack spacing={3}>
          <Typography variant="h5" fontWeight={800} align="center">
            Login Administrativo
          </Typography>
          <form onSubmit={handleSubmit} autoComplete="off">
            <Stack spacing={2}>
              <TextField
                label="E-mail"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                fullWidth
              />
              <TextField
                label="Senha"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                fullWidth
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={loading}
                sx={{ py: 1.5, fontWeight: 700 }}
              >
                {loading ? 'Entrando...' : 'Entrar no painel'}
              </Button>
            </Stack>
          </form>
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </Paper>
    </Container>
  );
}

export default AdminLogin;
