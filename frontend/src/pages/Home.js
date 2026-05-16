import React, { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  Container,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import AutoGraphRoundedIcon from '@mui/icons-material/AutoGraphRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import { request } from '../utils/api';

const benefits = [
  {
    title: 'Agenda por unidade',
    text: 'Cada estabelecimento tem um link próprio para receber clientes sem expor os outros locais da empresa.',
    icon: StorefrontRoundedIcon,
    accent: '#0f766e',
  },
  {
    title: 'Planos Start e Pro',
    text: 'Comece com um local ou configure o plano Pro conforme a quantidade de filiais contratadas.',
    icon: PaymentsRoundedIcon,
    accent: '#2563eb',
  },
  {
    title: 'Operação centralizada',
    text: 'Gestor do SaaS acompanha empresas, planos e locais; cada admin cuida apenas da própria empresa.',
    icon: AutoGraphRoundedIcon,
    accent: '#9333ea',
  },
];

const processSteps = [
  'Cadastre a empresa e escolha o plano',
  'Crie os locais e envie seus links exclusivos',
  'Configure serviços, profissionais e agendas',
  'Acompanhe reservas e confirmações pelo painel',
];

function Metric({ value, label }) {
  return (
    <Box>
      <Typography variant="h4" fontWeight={900} sx={{ lineHeight: 1 }}>
        {value}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.6, color: 'rgba(255,255,255,0.78)' }}>
        {label}
      </Typography>
    </Box>
  );
}

function Home() {
  const theme = useTheme();
  const [stats, setStats] = useState({ estabelecimentos: 0, servicos: 0 });

  useEffect(() => {
    let mounted = true;

    const loadStats = async () => {
      try {
        const [estabelecimentos, servicos] = await Promise.all([
          request('/api/public/estabelecimentos', { auth: false }),
          request('/api/public/servicos', { auth: false }),
        ]);

        if (mounted) {
          setStats({
            estabelecimentos: Array.isArray(estabelecimentos) ? estabelecimentos.length : 0,
            servicos: Array.isArray(servicos) ? servicos.length : 0,
          });
        }
      } catch {
        if (mounted) {
          setStats({ estabelecimentos: 0, servicos: 0 });
        }
      }
    };

    loadStats();

    return () => {
      mounted = false;
    };
  }, []);

  const heroMetrics = useMemo(
    () => [
      { value: `${Math.max(stats.estabelecimentos, 1)}+`, label: 'locais ativos' },
      { value: `${Math.max(stats.servicos, 3)}+`, label: 'serviços publicados' },
      { value: '24h', label: 'agenda disponível' },
    ],
    [stats]
  );

  return (
    <Box sx={{ bgcolor: '#f7fafc' }}>
      <Box
        sx={{
          minHeight: { xs: 620, md: 680 },
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          color: '#fff',
          overflow: 'hidden',
          backgroundImage:
            'linear-gradient(90deg, rgba(6, 78, 59, 0.92) 0%, rgba(15, 118, 110, 0.82) 44%, rgba(15, 23, 42, 0.28) 100%), url("https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1800&q=80")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: { xs: 8, md: 10 } }}>
          <Grid container spacing={5} alignItems="center">
            <Grid item xs={12} md={7}>
              <Stack spacing={3.5}>
                <Chip
                  label="Kyonix Agenda"
                  sx={{
                    alignSelf: 'flex-start',
                    bgcolor: 'rgba(255,255,255,0.16)',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.24)',
                    fontWeight: 800,
                  }}
                />

                <Box>
                  <Typography
                    component="h1"
                    sx={{
                      fontSize: { xs: '2.7rem', md: '4.8rem' },
                      fontWeight: 950,
                      lineHeight: 0.96,
                      maxWidth: 760,
                    }}
                  >
                    Kyonix
                  </Typography>
                  <Typography
                    sx={{
                      mt: 2.5,
                      fontSize: { xs: '1.1rem', md: '1.35rem' },
                      lineHeight: 1.55,
                      color: 'rgba(255,255,255,0.86)',
                      maxWidth: 660,
                    }}
                  >
                    Sistema SaaS de agendamento online para empresas com uma ou várias unidades,
                    com links exclusivos por estabelecimento e painel de gestão completo.
                  </Typography>
                </Box>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <Button
                    component="a"
                    href="#planos"
                    size="large"
                    variant="contained"
                    endIcon={<ArrowForwardRoundedIcon />}
                    sx={{
                      px: 3.5,
                      py: 1.45,
                      bgcolor: '#ffffff',
                      color: '#0f766e',
                      fontWeight: 900,
                      boxShadow: '0 18px 34px rgba(0,0,0,0.18)',
                      '&:hover': { bgcolor: '#ecfeff' },
                    }}
                  >
                    Ver planos
                  </Button>
                  <Button
                    component={RouterLink}
                    to="/admin-login"
                    size="large"
                    variant="outlined"
                    startIcon={<LockRoundedIcon fontSize="small" />}
                    sx={{
                      px: 3.5,
                      py: 1.45,
                      color: '#fff',
                      borderColor: 'rgba(255,255,255,0.56)',
                      fontWeight: 800,
                      '&:hover': {
                        borderColor: '#fff',
                        bgcolor: 'rgba(255,255,255,0.08)',
                      },
                    }}
                  >
                    Área restrita
                  </Button>
                </Stack>

                <Stack direction="row" spacing={{ xs: 2.5, md: 5 }} flexWrap="wrap" useFlexGap>
                  {heroMetrics.map((metric) => (
                    <Metric key={metric.label} value={metric.value} label={metric.label} />
                  ))}
                </Stack>
              </Stack>
            </Grid>

            <Grid item xs={12} md={5}>
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.24)',
                  backdropFilter: 'blur(18px)',
                }}
              >
                <Stack spacing={2}>
                  {[
                    ['Plano Pro', '5 filiais configuradas', 'R$ sob demanda'],
                    ['Link público', '/agendar/unidade-centro', 'exclusivo por local'],
                    ['Painel gestor', 'empresas, planos e cobrança', 'visão SaaS'],
                  ].map(([title, detail, meta]) => (
                    <Paper
                      key={title}
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'rgba(255,255,255,0.92)',
                      }}
                    >
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box
                          sx={{
                            width: 38,
                            height: 38,
                            borderRadius: 1.5,
                            display: 'grid',
                            placeItems: 'center',
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main,
                          }}
                        >
                          <CheckCircleRoundedIcon fontSize="small" />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography fontWeight={900} color="text.primary">
                            {title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {detail}
                          </Typography>
                          <Typography variant="caption" color="primary.main" fontWeight={800}>
                            {meta}
                          </Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Box component="section" sx={{ py: { xs: 6, md: 9 } }}>
        <Container maxWidth="lg">
          <Stack spacing={4}>
            <Box sx={{ maxWidth: 720 }}>
              <Typography variant="overline" color="primary" fontWeight={900}>
                Plataforma
              </Typography>
              <Typography variant="h3" fontWeight={950} sx={{ mt: 1, color: '#0f172a' }}>
                Uma agenda pensada para SaaS multiempresa
              </Typography>
            </Box>

            <Grid container spacing={2.5}>
              {benefits.map((benefit) => {
                const Icon = benefit.icon;

                return (
                  <Grid item xs={12} md={4} key={benefit.title}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        height: '100%',
                        borderRadius: 2,
                        bgcolor: '#fff',
                        border: '1px solid rgba(15,23,42,0.08)',
                        boxShadow: '0 18px 40px rgba(15,23,42,0.05)',
                      }}
                    >
                      <Stack spacing={2}>
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            display: 'grid',
                            placeItems: 'center',
                            bgcolor: alpha(benefit.accent, 0.11),
                            color: benefit.accent,
                          }}
                        >
                          <Icon />
                        </Box>
                        <Typography variant="h6" fontWeight={900}>
                          {benefit.title}
                        </Typography>
                        <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                          {benefit.text}
                        </Typography>
                      </Stack>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </Stack>
        </Container>
      </Box>

      <Box id="planos" component="section" sx={{ py: { xs: 6, md: 9 }, bgcolor: '#ffffff' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="stretch">
            <Grid item xs={12} md={5}>
              <Stack spacing={2.5}>
                <Typography variant="overline" color="primary" fontWeight={900}>
                  Planos
                </Typography>
                <Typography variant="h3" fontWeight={950} color="#0f172a">
                  Comece simples, cresça por filial
                </Typography>
                <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>
                  O gestor do SaaS configura a quantidade de locais da empresa e a cobrança mensal
                  conforme o contrato. O estabelecimento recebe um link próprio para cada unidade.
                </Typography>
              </Stack>
            </Grid>

            {[
              ['Start', '1 local', 'Ideal para negócios com uma unidade ativa.'],
              ['Pro', 'locais configuráveis', 'Para empresas com múltiplas filiais e cobrança sob medida.'],
            ].map(([name, limit, text]) => (
              <Grid item xs={12} md={3.5} key={name}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    height: '100%',
                    borderRadius: 2,
                    border: name === 'Pro' ? '2px solid #0f766e' : '1px solid rgba(15,23,42,0.1)',
                    bgcolor: name === 'Pro' ? '#f0fdfa' : '#fff',
                  }}
                >
                  <Stack spacing={2.2}>
                    <Chip label={name} sx={{ alignSelf: 'flex-start', fontWeight: 900 }} color={name === 'Pro' ? 'primary' : 'default'} />
                    <Typography variant="h4" fontWeight={950}>
                      {limit}
                    </Typography>
                    <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                      {text}
                    </Typography>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Box component="section" sx={{ py: { xs: 6, md: 9 } }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={5}>
              <Typography variant="overline" color="primary" fontWeight={900}>
                Implantação
              </Typography>
              <Typography variant="h3" fontWeight={950} sx={{ mt: 1, color: '#0f172a' }}>
                Do contrato ao primeiro agendamento
              </Typography>
            </Grid>
            <Grid item xs={12} md={7}>
              <Stack spacing={1.5}>
                {processSteps.map((step, index) => (
                  <Stack key={step} direction="row" spacing={2} alignItems="center">
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        display: 'grid',
                        placeItems: 'center',
                        bgcolor: index === 0 ? '#0f766e' : '#e2e8f0',
                        color: index === 0 ? '#fff' : '#0f172a',
                        fontWeight: 900,
                      }}
                    >
                      {index + 1}
                    </Box>
                    <Typography fontWeight={800}>{step}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Box component="footer" sx={{ py: 4, bgcolor: '#0f172a', color: '#fff' }}>
        <Container maxWidth="lg">
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
            <Stack direction="row" spacing={1.2} alignItems="center">
              <CalendarMonthRoundedIcon />
              <Box>
                <Typography fontWeight={900}>Kyonix</Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.68)' }}>
                  Agendamento online multiempresa
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={2} alignItems="center">
              <Button
                component={RouterLink}
                to="/admin-login"
                variant="text"
                startIcon={<LockRoundedIcon fontSize="small" />}
                sx={{ color: 'rgba(255,255,255,0.54)', fontSize: '0.82rem' }}
              >
                Área restrita
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}

export default Home;
