import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import MiscellaneousServicesRoundedIcon from '@mui/icons-material/MiscellaneousServicesRounded';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import PageHeader from '../components/PageHeader';
import { ApiError, request } from '../utils/api';
import { getAuthUser, setAuthUser } from '../utils/auth';
import { formatDateBR, formatDateTimeBR, formatTimeValue } from '../utils/formatters';

const quickActions = [
  { label: 'Cadastrar profissional', to: '/profissionais', icon: BadgeRoundedIcon },
  { label: 'Criar serviço', to: '/servicos', icon: MiscellaneousServicesRoundedIcon },
  { label: 'Montar agenda', to: '/agendas', icon: CalendarMonthRoundedIcon },
  { label: 'Ver agendamentos', to: '/agendamentos', icon: EventNoteRoundedIcon },
];

function MetricCard({ title, value, helper, icon: Icon, accent }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.75,
        height: '100%',
        borderRadius: 5,
        background: `linear-gradient(180deg, ${alpha(accent, 0.08)}, ${alpha(accent, 0.03)})`,
        border: `1px solid ${alpha(accent, 0.14)}`,
        boxShadow: '0 16px 40px rgba(15, 23, 42, 0.06)',
      }}
    >
      <Stack spacing={2}>
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: 3,
            display: 'grid',
            placeItems: 'center',
            bgcolor: alpha(accent, 0.12),
            color: accent,
            border: `1px solid ${alpha(accent, 0.12)}`,
          }}
        >
          <Icon />
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          <Typography variant="h3" fontWeight={800} sx={{ mt: 0.5, lineHeight: 1, color: 'text.primary' }}>
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.6 }}>
            {helper}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(getAuthUser());
  const [stats, setStats] = useState({
    estabelecimentos: [],
    profissionais: [],
    servicos: [],
    agendas: [],
    agendamentos: [],
  });

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      setLoading(true);
      setError('');

      try {
        const [me, estabelecimentos, profissionais, servicos, agendas, agendamentos] = await Promise.all([
          request('/api/me'),
          request('/api/estabelecimentos'),
          request('/api/profissionais'),
          request('/api/servicos'),
          request('/api/agendas'),
          request('/api/agendamentos'),
        ]);

        if (mounted) {
          setCurrentUser(me);
          setAuthUser(me);
          setStats({
            estabelecimentos: estabelecimentos || [],
            profissionais: profissionais || [],
            servicos: servicos || [],
            agendas: agendas || [],
            agendamentos: agendamentos || [],
          });
        }
      } catch (requestError) {
        if (mounted) {
          setError(requestError instanceof ApiError ? requestError.message : 'Não foi possível carregar o painel administrativo.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const availableAgendas = stats.agendas.filter((agenda) => agenda.status === 'disponivel').length;
  const upcomingBookings = stats.agendamentos.filter((agendamento) => agendamento.status !== 'cancelado').length;
  const licenseMessage = currentUser?.role === 'admin' && currentUser?.empresa?.licenca_proxima_vencimento
    ? currentUser.empresa.licenca_mensagem
    : '';

  return (
    <Box>
      <PageHeader
        eyebrow="Administração"
        title="Dashboard"
        description="Visão geral do sistema para acompanhar cadastros, horários disponíveis e reservas em tempo real."
        actions={
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <Button
                  key={action.to}
                  component={RouterLink}
                  to={action.to}
                  variant="outlined"
                  startIcon={<Icon />}
                >
                  {action.label}
                </Button>
              );
            })}
          </Stack>
        }
      />

      {error ? <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert> : null}
      {licenseMessage ? <Alert severity="warning" sx={{ mb: 3 }}>{licenseMessage}</Alert> : null}

      {loading ? (
        <Box sx={{ py: 8, display: 'grid', placeItems: 'center' }}>
          <CircularProgress />
        </Box>
      ) : (
        <Stack spacing={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <MetricCard
                title="Estabelecimentos"
                value={stats.estabelecimentos.length}
                helper="Unidades cadastradas no sistema."
                icon={BusinessRoundedIcon}
                accent="#0f766e"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <MetricCard
                title="Profissionais"
                value={stats.profissionais.length}
                helper="Equipe disponível para atendimento."
                icon={BadgeRoundedIcon}
                accent="#2563eb"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <MetricCard
                title="Serviços"
                value={stats.servicos.length}
                helper="Catálogo de serviços oferecidos."
                icon={MiscellaneousServicesRoundedIcon}
                accent="#7c3aed"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <MetricCard
                title="Horários livres"
                value={availableAgendas}
                helper={`${upcomingBookings} reservas ativas no momento.`}
                icon={EventAvailableRoundedIcon}
                accent="#ea580c"
              />
            </Grid>
          </Grid>

          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 5,
              background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(18px)',
              boxShadow: '0 24px 60px rgba(15, 23, 42, 0.08)',
            }}
          >
            <Stack spacing={1.2} sx={{ mb: 2.5 }}>
              <Typography variant="h6" fontWeight={800}>
                Agendamentos recentes
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Monitore os últimos registros com data, profissional, serviço e status.
              </Typography>
            </Stack>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Serviço</TableCell>
                    <TableCell>Profissional</TableCell>
                    <TableCell>Data/Hora</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.agendamentos.slice(0, 8).map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Typography fontWeight={700}>
                          {item.agenda?.servico?.nome || '-'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.agenda?.profissional?.estabelecimento?.nome || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>{item.agenda?.profissional?.nome || '-'}</TableCell>
                      <TableCell>
                        <Typography fontWeight={700}>
                          {formatDateBR(item.agenda?.data)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatTimeValue(item.agenda?.hora_inicio)} às {formatTimeValue(item.agenda?.hora_fim)}
                        </Typography>
                      </TableCell>
                      <TableCell>{item.usuario?.name || item.email_cliente || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={item.status}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            bgcolor:
                              item.status === 'cancelado'
                                ? alpha('#dc2626', 0.12)
                                : item.status === 'concluido'
                                  ? alpha('#0f766e', 0.12)
                                  : alpha('#f59e0b', 0.12),
                            color:
                              item.status === 'cancelado'
                                ? '#dc2626'
                                : item.status === 'concluido'
                                  ? '#0f766e'
                                  : '#b45309',
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}

                  {stats.agendamentos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Box sx={{ py: 4, textAlign: 'center' }}>
                          <Typography variant="body1" fontWeight={700}>
                            Nenhum agendamento registrado ainda.
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Assim que os clientes começarem a reservar, os registros aparecem aqui.
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Grid container spacing={3}>
            <Grid item xs={12} md={5}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 5,
                  background: 'linear-gradient(180deg, rgba(15, 118, 110, 0.08), rgba(37, 99, 235, 0.06))',
                  border: '1px solid rgba(15, 23, 42, 0.06)',
                }}
              >
                <Stack spacing={1.5}>
                  <Typography variant="h6" fontWeight={800}>
                    Próximos passos
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    Cadastre a equipe, relacione serviços e monte a agenda por dia e horário. Depois, acompanhe
                    as reservas na tela de monitoramento.
                  </Typography>

                  <Stack spacing={1}>
                    {[
                      ['1', 'Cadastrar profissionais'],
                      ['2', 'Criar serviços'],
                      ['3', 'Montar agendas'],
                      ['4', 'Monitorar agendamentos'],
                    ].map(([number, label]) => (
                      <Stack key={label} direction="row" spacing={1.5} alignItems="center">
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: 2,
                            display: 'grid',
                            placeItems: 'center',
                            bgcolor: 'primary.main',
                            color: '#fff',
                            fontWeight: 800,
                          }}
                        >
                          {number}
                        </Box>
                        <Typography fontWeight={700}>{label}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12} md={7}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 5,
                  background: 'rgba(255,255,255,0.92)',
                  backdropFilter: 'blur(18px)',
                  boxShadow: '0 24px 60px rgba(15, 23, 42, 0.08)',
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
                  <CalendarMonthRoundedIcon color="primary" />
                  <Box>
                    <Typography variant="h6" fontWeight={800}>
                      Destaque da operação
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Visão rápida da agenda com {stats.agendas.length} horários cadastrados.
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                  <Chip label={`${stats.agendas.length} agendas`} sx={{ fontWeight: 700 }} />
                  <Chip label={`${availableAgendas} disponíveis`} sx={{ fontWeight: 700 }} />
                  <Chip label={`${upcomingBookings} reservas ativas`} sx={{ fontWeight: 700 }} />
                  <Chip
                    label={stats.agendas.length > 0 ? formatDateTimeBR(stats.agendas[0].data, stats.agendas[0].hora_inicio) : 'Sem horários'}
                    sx={{ fontWeight: 700 }}
                  />
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Stack>
      )}
    </Box>
  );
}

export default Dashboard;
