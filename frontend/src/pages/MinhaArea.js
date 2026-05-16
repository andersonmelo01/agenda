import React, { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
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
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import Background from '../components/Background';
import { request } from '../utils/api';
import { getAuthUser } from '../utils/auth';
import { formatCurrencyDisplay, formatDateTimeBR } from '../utils/formatters';

const statusStyles = {
  confirmado: { color: '#0f766e', background: alpha('#0f766e', 0.12) },
  pendente: { color: '#d97706', background: alpha('#d97706', 0.14) },
  concluido: { color: '#2563eb', background: alpha('#2563eb', 0.12) },
  cancelado: { color: '#dc2626', background: alpha('#dc2626', 0.12) },
};

function MinhaArea() {
  const user = getAuthUser();
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadAgendamentos = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await request('/api/me/agendamentos');

        if (mounted) {
          setAgendamentos(data || []);
        }
      } catch {
        if (mounted) {
          setError('Não foi possível carregar seu histórico de agendamentos.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadAgendamentos();

    return () => {
      mounted = false;
    };
  }, []);

  const resumo = useMemo(() => {
    const ativos = agendamentos.filter((item) => !['cancelado', 'concluido'].includes(item.status)).length;
    const estabelecimentos = new Set(
      agendamentos
        .map((item) => item.agenda?.profissional?.estabelecimento?.id)
        .filter(Boolean)
    ).size;

    return {
      total: agendamentos.length,
      ativos,
      estabelecimentos,
    };
  }, [agendamentos]);

  return (
    <Background>
      <Container maxWidth="lg">
        <Stack spacing={3}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, md: 3.5 },
              borderRadius: 4,
              background: 'linear-gradient(135deg, #0f766e 0%, #2563eb 100%)',
              color: '#fff',
            }}
          >
            <Stack spacing={2}>
              <Stack direction="row" spacing={1.2} alignItems="center">
                <EventNoteRoundedIcon />
                <Typography variant="overline" fontWeight={900}>
                  Minha area
                </Typography>
              </Stack>

              <Box>
                <Typography variant="h4" fontWeight={900}>
                  Historico de servicos agendados
                </Typography>
                <Typography sx={{ mt: 1, color: 'rgba(255,255,255,0.84)', maxWidth: 760, lineHeight: 1.7 }}>
                  Olá, {user?.name || user?.email}. Aqui aparecem todos os seus agendamentos, mesmo quando foram feitos em estabelecimentos diferentes.
                </Typography>
              </Box>

              <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                <Chip label={`${resumo.total} no historico`} sx={{ bgcolor: 'rgba(255,255,255,0.16)', color: '#fff', fontWeight: 800 }} />
                <Chip label={`${resumo.ativos} ativos`} sx={{ bgcolor: 'rgba(255,255,255,0.16)', color: '#fff', fontWeight: 800 }} />
                <Chip label={`${resumo.estabelecimentos} locais`} sx={{ bgcolor: 'rgba(255,255,255,0.16)', color: '#fff', fontWeight: 800 }} />
              </Stack>
            </Stack>
          </Paper>

          {error ? <Alert severity="error">{error}</Alert> : null}

          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, md: 3 },
              borderRadius: 4,
              background: 'rgba(255,255,255,0.94)',
              boxShadow: '0 18px 50px rgba(15, 23, 42, 0.08)',
            }}
          >
            {loading ? (
              <Box sx={{ py: 8, display: 'grid', placeItems: 'center' }}>
                <CircularProgress />
              </Box>
            ) : agendamentos.length === 0 ? (
              <Stack spacing={2} alignItems="center" sx={{ py: 7, textAlign: 'center' }}>
                <EventNoteRoundedIcon sx={{ fontSize: 56, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight={900}>
                  Nenhum agendamento encontrado
                </Typography>
                <Typography color="text.secondary" sx={{ maxWidth: 560, lineHeight: 1.7 }}>
                  Para fazer uma reserva, acesse o link exclusivo enviado pelo estabelecimento. O agendamento so fica disponivel dentro desse link.
                </Typography>
              </Stack>
            ) : (
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="h6" fontWeight={900}>
                    Meus agendamentos
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Lista consolidada de todos os locais onde voce reservou servicos.
                  </Typography>
                </Box>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Servico</TableCell>
                        <TableCell>Estabelecimento</TableCell>
                        <TableCell>Data e hora</TableCell>
                        <TableCell>Valor</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Link</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {agendamentos.map((item) => {
                        const estabelecimento = item.agenda?.profissional?.estabelecimento;
                        const servico = item.agenda?.servico;
                        const statusStyle = statusStyles[item.status] || statusStyles.pendente;

                        return (
                          <TableRow key={item.id} hover>
                            <TableCell>
                              <Typography fontWeight={800}>
                                {servico?.nome || '-'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {item.agenda?.profissional?.nome || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <PlaceRoundedIcon fontSize="small" color="primary" />
                                <Typography>{estabelecimento?.nome || '-'}</Typography>
                              </Stack>
                            </TableCell>
                            <TableCell>{formatDateTimeBR(item.agenda?.data, item.horario)}</TableCell>
                            <TableCell>{formatCurrencyDisplay(servico?.preco)}</TableCell>
                            <TableCell>
                              <Chip
                                label={item.status}
                                size="small"
                                sx={{ fontWeight: 800, bgcolor: statusStyle.background, color: statusStyle.color }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              {estabelecimento?.slug ? (
                                <Button
                                  component={RouterLink}
                                  to={`/agendar/${estabelecimento.slug}`}
                                  variant="outlined"
                                  size="small"
                                  endIcon={<OpenInNewRoundedIcon />}
                                >
                                  Agendar
                                </Button>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Stack>
            )}
          </Paper>
        </Stack>
      </Container>
    </Background>
  );
}

export default MinhaArea;
