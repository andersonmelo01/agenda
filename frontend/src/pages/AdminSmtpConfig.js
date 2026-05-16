import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
} from '@mui/material';
import CloudOutlinedIcon from '@mui/icons-material/CloudOutlined';
import KeyRoundedIcon from '@mui/icons-material/KeyRounded';
import LanguageRoundedIcon from '@mui/icons-material/LanguageRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import PasswordRoundedIcon from '@mui/icons-material/PasswordRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import PageHeader from '../components/PageHeader';
import { ApiError, request } from '../utils/api';

const initialForm = {
  host: '',
  port: '',
  username: '',
  password: '',
  encryption: '',
  from_address: '',
  from_name: '',
};

function AdminSmtpConfig() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadSetting = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await request('/api/smtp-setting');
        if (mounted && data) {
          setForm((current) => ({
            ...current,
            ...data,
            password: '',
          }));
        }
      } catch {
        if (mounted) {
          setError('Não foi possível carregar a configuração de e-mail.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadSetting();

    return () => {
      mounted = false;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setMessage('');
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const payload = { ...form };

      if (!payload.password.trim()) {
        delete payload.password;
      }

      await request('/api/smtp-setting', {
        method: 'POST',
        body: payload,
      });

      setMessage('Configuração SMTP salva com sucesso.');
      setForm((current) => ({ ...current, password: '' }));
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.message);
      } else {
        setError('Não foi possível salvar a configuração.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <PageHeader
        eyebrow="Comunicação"
        title="Configuração SMTP"
        description="Ajuste o servidor de envio usado nas confirmações de agendamento e nos avisos do sistema."
      />

      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 4 },
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(18px)',
          boxShadow: '0 24px 60px rgba(15, 23, 42, 0.08)',
        }}
      >
        <Stack spacing={3}>
          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            <Chip icon={<CloudOutlinedIcon />} label="Entrega de e-mails" sx={{ fontWeight: 700 }} />
            <Chip icon={<KeyRoundedIcon />} label="Senha segura" sx={{ fontWeight: 700 }} />
            <Chip icon={<EmailRoundedIcon />} label="Confirmações automáticas" sx={{ fontWeight: 700 }} />
          </Stack>

          {message ? (
            <Alert severity="success">{message}</Alert>
          ) : null}

          {error ? (
            <Alert severity="error">{error}</Alert>
          ) : null}

          <form onSubmit={handleSubmit} autoComplete="off">
            <Stack spacing={2.5}>
              <Grid container spacing={2.5}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Host"
                    name="host"
                    value={form.host}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LanguageRoundedIcon color="primary" fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                    helperText="Ex.: smtp.seudominio.com"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    label="Porta"
                    name="port"
                    value={form.port}
                    onChange={handleChange}
                    required
                    type="number"
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <KeyRoundedIcon color="primary" fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                    helperText="Ex.: 587 ou 465"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    label="Usuário"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailRoundedIcon color="primary" fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    label="Senha"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    type={showPassword ? 'text' : 'password'}
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PasswordRoundedIcon color="primary" fontSize="small" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword((current) => !current)} edge="end">
                            {showPassword ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    helperText="Deixe em branco para manter a senha atual."
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    label="Criptografia"
                    name="encryption"
                    value={form.encryption}
                    onChange={handleChange}
                    disabled={loading}
                    helperText="O provedor normalmente usa TLS ou SSL."
                  >
                    <MenuItem value="">Nenhuma</MenuItem>
                    <MenuItem value="tls">TLS</MenuItem>
                    <MenuItem value="ssl">SSL</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    label="Remetente"
                    name="from_address"
                    value={form.from_address}
                    onChange={handleChange}
                    type="email"
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailRoundedIcon color="primary" fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                    helperText="E-mail que aparecerá para o cliente."
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Nome do remetente"
                    name="from_name"
                    value={form.from_name}
                    onChange={handleChange}
                    disabled={loading}
                    helperText="Ex.: Agenda Pro"
                  />
                </Grid>
              </Grid>

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={saving}
                startIcon={<SaveRoundedIcon />}
                sx={{
                  alignSelf: 'flex-start',
                  px: 3,
                  background: 'linear-gradient(135deg, #0f766e 0%, #2563eb 100%)',
                  boxShadow: '0 18px 40px rgba(37, 99, 235, 0.22)',
                }}
              >
                {saving ? 'Salvando...' : 'Salvar configuração'}
              </Button>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </Box>
  );
}

export default AdminSmtpConfig;
