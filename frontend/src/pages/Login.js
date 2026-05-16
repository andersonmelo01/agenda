import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded';
import CakeRoundedIcon from '@mui/icons-material/CakeRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import PublicRoundedIcon from '@mui/icons-material/PublicRounded';
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded';
import Background from '../components/Background';
import { ApiError, request } from '../utils/api';
import { formatPhone } from '../utils/formatters';
import { getAuthUser, isAuthenticated, setAuthToken, setAuthUser } from '../utils/auth';

const initialLoginForm = {
  email: '',
  password: '',
};

const initialRegisterForm = {
  name: '',
  phone: '',
  birth_date: '',
  email: '',
  password: '',
  password_confirmation: '',
};

const adminPaths = [
  '/dashboard',
  '/estabelecimentos',
  '/profissionais',
  '/especialidades',
  '/servicos',
  '/agendas',
  '/agendamentos',
  '/admin/smtp',
  '/gestor/empresas',
  '/gestor/planos',
];

function resolveDestination(role, requestedPath) {
  const safeRequestedPath = requestedPath && requestedPath !== '/login' ? requestedPath : '';

  if (safeRequestedPath) {
    if (adminPaths.some((path) => safeRequestedPath.startsWith(path))) {
      return ['admin', 'gestor'].includes(role) ? safeRequestedPath : '/minha-area';
    }

    return safeRequestedPath;
  }

  return ['admin', 'gestor'].includes(role) ? '/dashboard' : '/minha-area';
}

function Login() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const requestedPath = location.state?.from?.pathname || '';
  const [mode, setMode] = useState('login');
  const [loginForm, setLoginForm] = useState(initialLoginForm);
  const [registerForm, setRegisterForm] = useState(initialRegisterForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      const user = getAuthUser();
      navigate(resolveDestination(user?.role, requestedPath), { replace: true });
    }
  }, [navigate, requestedPath]);

  const handleLoginChange = (event) => {
    const { name, value } = event.target;
    setLoginForm((current) => ({ ...current, [name]: value }));
    setError('');
  };

  const handleRegisterChange = (event) => {
    const { name, value } = event.target;

    setRegisterForm((current) => ({
      ...current,
      [name]: name === 'phone' ? formatPhone(value) : value,
    }));
    setError('');
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await request('/api/login', {
        method: 'POST',
        auth: false,
        body: loginForm,
      });

      setAuthToken(data.access_token || data.token);
      setAuthUser(data.user || null);
      navigate(resolveDestination(data.user?.role, requestedPath), { replace: true });
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.message);
      } else {
        setError('Não foi possível entrar. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    if (registerForm.password !== registerForm.password_confirmation) {
      setLoading(false);
      setError('As senhas não conferem.');
      return;
    }

    try {
      const data = await request('/api/register', {
        method: 'POST',
        auth: false,
        body: registerForm,
      });

      setAuthToken(data.access_token || data.token);
      setAuthUser(data.user || null);
      navigate(resolveDestination(data.user?.role, requestedPath), { replace: true });
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.message);
      } else {
        setError('Não foi possível concluir o cadastro.');
      }
    } finally {
      setLoading(false);
    }
  };

  const leftPanelItems = [
    'Cadastro rápido com telefone e data de nascimento.',
    'Horários protegidos contra dupla reserva.',
    'Histórico consolidado dos serviços agendados.',
  ];

  return (
    <Background>
      <Container maxWidth="lg">
        <Paper
          elevation={0}
          sx={{
            mx: 'auto',
            maxWidth: 1080,
            overflow: 'hidden',
            borderRadius: 5,
            background: 'rgba(255,255,255,0.96)',
            boxShadow: '0 18px 50px rgba(15, 23, 42, 0.08)',
          }}
        >
          <Grid container spacing={0}>
            <Grid item xs={12} md={5}>
              <Box
                sx={{
                  height: '100%',
                  p: { xs: 2.5, sm: 3, md: 3.5 },
                  background: 'linear-gradient(180deg, rgba(15, 118, 110, 0.06), rgba(37, 99, 235, 0.04))',
                  borderRight: { md: '1px solid rgba(15, 23, 42, 0.06)' },
                }}
              >
                <Stack spacing={2.25}>
                  <Chip
                    icon={<CalendarMonthRoundedIcon />}
                    label="Acesso rápido"
                    sx={{
                      alignSelf: 'flex-start',
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      color: 'primary.dark',
                      fontWeight: 700,
                    }}
                  />

                  <Box>
                    <Typography
                      variant="h3"
                      sx={{
                        fontSize: { xs: '1.9rem', md: '2.55rem' },
                        lineHeight: 1.08,
                        letterSpacing: -0.8,
                        mb: 1,
                      }}
                    >
                      Entre ou crie sua conta em poucos passos.
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.75 }}>
                      O cliente entra para acompanhar seus agendamentos. Para reservar um serviço, use o link
                      exclusivo enviado pelo estabelecimento.
                    </Typography>
                  </Box>

                  <Stack spacing={1}>
                    {leftPanelItems.map((item, index) => (
                      <Box
                        key={item}
                        sx={{
                          p: 1.5,
                          borderRadius: 3,
                          background: 'rgba(255,255,255,0.82)',
                          border: '1px solid rgba(15, 23, 42, 0.06)',
                        }}
                      >
                        <Stack direction="row" spacing={1.25} alignItems="flex-start">
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: 2,
                              display: 'grid',
                              placeItems: 'center',
                              bgcolor: alpha(theme.palette.primary.main, 0.08),
                              color: 'primary.main',
                              fontWeight: 800,
                              flex: '0 0 auto',
                            }}
                          >
                            {index + 1}
                          </Box>
                          <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                            {item}
                          </Typography>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>

                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip label="Cliente" size="small" sx={{ fontWeight: 700 }} />
                    <Chip label="Admin" size="small" sx={{ fontWeight: 700 }} />
                    <Chip label="Cadastro rápido" size="small" sx={{ fontWeight: 700 }} />
                  </Stack>
                </Stack>
              </Box>
            </Grid>

            <Grid item xs={12} md={7}>
              <Box sx={{ p: { xs: 2.5, sm: 3, md: 3.5 } }}>
                <Stack spacing={2.5}>
                  <Box>
                    <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800 }}>
                      Acesso ao sistema
                    </Typography>
                    <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5, mb: 0.75 }}>
                      Faça login ou crie sua conta rápida
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.75 }}>
                      Se voce chegou por um link de estabelecimento, o agendamento continua apos o login. Ao entrar
                      direto, voce acessa seu historico de servicos.
                    </Typography>
                  </Box>

                  <Tabs
                    value={mode}
                    onChange={(_, nextMode) => setMode(nextMode)}
                    sx={{
                      minHeight: 42,
                      '& .MuiTab-root': {
                        minHeight: 42,
                        py: 0.75,
                        px: 1.5,
                      },
                    }}
                    textColor="primary"
                    indicatorColor="primary"
                    variant="fullWidth"
                  >
                    <Tab value="login" label="Entrar" />
                    <Tab value="register" label="Cadastro rápido" />
                  </Tabs>

                  {mode === 'login' ? (
                    <Box component="form" onSubmit={handleLoginSubmit} autoComplete="off">
                      <Stack spacing={2}>
                        <TextField
                          label="E-mail"
                          name="email"
                          value={loginForm.email}
                          onChange={handleLoginChange}
                          type="email"
                          required
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <EmailRoundedIcon color="primary" fontSize="small" />
                              </InputAdornment>
                            ),
                          }}
                        />

                        <TextField
                          label="Senha"
                          name="password"
                          value={loginForm.password}
                          onChange={handleLoginChange}
                          type={showPassword ? 'text' : 'password'}
                          required
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <LockRoundedIcon color="primary" fontSize="small" />
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
                        />

                        <Button
                          type="submit"
                          variant="contained"
                          size="large"
                          disabled={loading}
                          endIcon={<HowToRegRoundedIcon />}
                          sx={{
                            py: 1.35,
                            boxShadow: '0 14px 30px rgba(15, 118, 110, 0.18)',
                          }}
                        >
                          {loading ? 'Entrando...' : 'Entrar'}
                        </Button>
                      </Stack>
                    </Box>
                  ) : (
                    <Box component="form" onSubmit={handleRegisterSubmit} autoComplete="off">
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <TextField
                            label="Nome completo"
                            name="name"
                            value={registerForm.name}
                            onChange={handleRegisterChange}
                            required
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <PersonRoundedIcon color="primary" fontSize="small" />
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Telefone"
                            name="phone"
                            value={registerForm.phone}
                            onChange={handleRegisterChange}
                            required
                            placeholder="(11) 99999-0000"
                            helperText="Telefone para contato."
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <PhoneRoundedIcon color="primary" fontSize="small" />
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Data de nascimento"
                            name="birth_date"
                            value={registerForm.birth_date}
                            onChange={handleRegisterChange}
                            type="date"
                            required
                            InputLabelProps={{ shrink: true }}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <CakeRoundedIcon color="primary" fontSize="small" />
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Grid>

                        <Grid item xs={12}>
                          <TextField
                            label="E-mail"
                            name="email"
                            value={registerForm.email}
                            onChange={handleRegisterChange}
                            type="email"
                            required
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <EmailRoundedIcon color="primary" fontSize="small" />
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Senha"
                            name="password"
                            value={registerForm.password}
                            onChange={handleRegisterChange}
                            type={showPassword ? 'text' : 'password'}
                            required
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <LockRoundedIcon color="primary" fontSize="small" />
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
                          />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Confirmar senha"
                            name="password_confirmation"
                            value={registerForm.password_confirmation}
                            onChange={handleRegisterChange}
                            type={showConfirmPassword ? 'text' : 'password'}
                            required
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <LockRoundedIcon color="primary" fontSize="small" />
                                </InputAdornment>
                              ),
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton onClick={() => setShowConfirmPassword((current) => !current)} edge="end">
                                    {showConfirmPassword ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
                                  </IconButton>
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Grid>

                        <Grid item xs={12}>
                          <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            disabled={loading}
                            endIcon={<ArrowForwardRoundedIcon />}
                            sx={{
                              py: 1.35,
                              boxShadow: '0 14px 30px rgba(15, 118, 110, 0.18)',
                            }}
                          >
                            {loading ? 'Criando...' : 'Criar cadastro'}
                          </Button>
                        </Grid>
                      </Grid>
                    </Box>
                  )}

                  {error ? (
                    <Alert severity="error" sx={{ mt: 0.5 }}>
                      {error}
                    </Alert>
                  ) : null}

                  <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                    <Button component={RouterLink} to="/" variant="text" startIcon={<PublicRoundedIcon />}>
                      Página inicial
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </Background>
  );
}

export default Login;
