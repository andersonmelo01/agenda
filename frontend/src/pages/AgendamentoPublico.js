import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  useTheme,
  alpha,
} from '@mui/material';
import {
  ArrowForwardRounded as ArrowForwardRoundedIcon,
  CancelRounded as CancelRoundedIcon,
  ChatRounded as ChatRoundedIcon,
  EmailRounded as EmailRoundedIcon,
  EventNoteRounded as EventNoteRoundedIcon,
  InstallMobileRounded as InstallMobileRoundedIcon,
  PhoneRounded as PhoneRoundedIcon,
  PlaceRounded as PlaceRoundedIcon,
  BoltRounded as BoltRoundedIcon,
} from '@mui/icons-material';
import Background from '../components/Background';
import { ApiError, request } from '../utils/api';
import {
  buildPhoneHref,
  buildWhatsAppHref,
  formatDateBR,
  formatDateTimeBR,
  formatEstablishmentAddress,
  formatPhone,
  parseDateOnlyToLocalDate,
} from '../utils/formatters';
import { getAuthUser } from '../utils/auth';

const initialForm = {
  estabelecimento_id: '',
  servico_id: '',
  profissional_id: '',
  agenda_id: '',
  horario: '',
};

function AgendamentoPublico() {
  const theme = useTheme();
  const user = getAuthUser();
  const { estabelecimentoSlug } = useParams();

  const [estabelecimentos, setEstabelecimentos] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [agendas, setAgendas] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [meusAgendamentos, setMeusAgendamentos] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [loadingEstabelecimentos, setLoadingEstabelecimentos] = useState(false);
  const [loadingRelacoes, setLoadingRelacoes] = useState(false);
  const [loadingAgendas, setLoadingAgendas] = useState(false);
  const [loadingMeusAgendamentos, setLoadingMeusAgendamentos] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [tabIndex, setTabIndex] = useState(0);
  const exclusiveMode = Boolean(estabelecimentoSlug);

  const selectedEstablishment = useMemo(
    () => estabelecimentos.find((item) => String(item.id) === String(form.estabelecimento_id)),
    [estabelecimentos, form.estabelecimento_id]
  );
  const selectedService = useMemo(
    () => servicos.find((item) => String(item.id) === String(form.servico_id)),
    [servicos, form.servico_id]
  );
  const selectedProfessional = useMemo(
    () => profissionais.find((item) => String(item.id) === String(form.profissional_id)),
    [profissionais, form.profissional_id]
  );
  const selectedAgenda = useMemo(
    () => agendas.find((item) => String(item.id) === String(form.agenda_id)),
    [agendas, form.agenda_id]
  );

  const readyToSubmit = Boolean(form.agenda_id && form.horario);
  const establishmentAddress = selectedEstablishment ? formatEstablishmentAddress(selectedEstablishment) : '';

  const loadMyBookings = async () => {
    setLoadingMeusAgendamentos(true);
    try {
      const data = await request('/api/me/agendamentos');
      setMeusAgendamentos(data || []);
    } catch {
      setMeusAgendamentos([]);
    } finally {
      setLoadingMeusAgendamentos(false);
    }
  };

  const loadAgendasForSelection = async (selection) => {
    if (!selection.estabelecimento_id || !selection.servico_id || !selection.profissional_id) {
      setAgendas([]);
      setHorarios([]);
      setLoadingAgendas(false);
      return;
    }

    setLoadingAgendas(true);

    try {
      const query = new URLSearchParams({
        estabelecimento_id: selection.estabelecimento_id,
        servico_id: selection.servico_id,
        profissional_id: selection.profissional_id,
      });

      const data = await request(`/api/public/agendas?${query.toString()}`, { auth: false });
      const nextAgendas = data || [];

      setAgendas(nextAgendas);

      if (!nextAgendas.some((item) => String(item.id) === String(selection.agenda_id))) {
        setForm((current) => ({ ...current, agenda_id: '', horario: '' }));
        setHorarios([]);
      }
    } catch {
      setAgendas([]);
      setHorarios([]);
      setError('Não foi possível carregar os horários disponíveis.');
    } finally {
      setLoadingAgendas(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadEstabelecimentos = async () => {
      setLoadingEstabelecimentos(true);

      try {
        const data = exclusiveMode
          ? await request(`/api/public/estabelecimentos/${estabelecimentoSlug}`, { auth: false })
          : await request('/api/public/estabelecimentos', { auth: false });
        if (mounted) {
          const nextEstabelecimentos = exclusiveMode ? (data ? [data] : []) : (data || []);
          setEstabelecimentos(nextEstabelecimentos);

          if (exclusiveMode && data?.id) {
            setForm((current) => ({
              ...current,
              estabelecimento_id: String(data.id),
              servico_id: '',
              profissional_id: '',
              agenda_id: '',
              horario: '',
            }));
          }
        }
      } catch (requestError) {
        if (mounted) {
          setError(requestError instanceof ApiError
            ? requestError.message
            : exclusiveMode
              ? 'Este link de agendamento não está disponível.'
              : 'Não foi possível carregar os estabelecimentos.');
        }
      } finally {
        if (mounted) {
          setLoadingEstabelecimentos(false);
        }
      }
    };

    loadEstabelecimentos();
    loadMyBookings();

    return () => {
      mounted = false;
    };
  }, [exclusiveMode, estabelecimentoSlug]);

  useEffect(() => {
    const beforeInstallHandler = (event) => {
      event.preventDefault();
      setInstallPromptEvent(event);
    };

    window.addEventListener('beforeinstallprompt', beforeInstallHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstallHandler);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    if (!form.estabelecimento_id) {
      setServicos([]);
      setProfissionais([]);
      setAgendas([]);
      setHorarios([]);
      setLoadingRelacoes(false);
      return undefined;
    }

    const loadRelations = async () => {
      setLoadingRelacoes(true);

      try {
        const [servicosData, profissionaisData] = await Promise.all([
          request(`/api/public/servicos?estabelecimento_id=${form.estabelecimento_id}`, { auth: false }),
          request(`/api/public/profissionais?estabelecimento_id=${form.estabelecimento_id}`, { auth: false }),
        ]);

        if (mounted) {
          setServicos(servicosData || []);
          setProfissionais(profissionaisData || []);
        }
      } catch {
        if (mounted) {
          setError('Não foi possível carregar os serviços e profissionais.');
        }
      } finally {
        if (mounted) {
          setLoadingRelacoes(false);
        }
      }
    };

    loadRelations();

    return () => {
      mounted = false;
    };
  }, [form.estabelecimento_id]);

  useEffect(() => {
    loadAgendasForSelection({
      estabelecimento_id: form.estabelecimento_id,
      servico_id: form.servico_id,
      profissional_id: form.profissional_id,
      agenda_id: form.agenda_id,
    });
  }, [form.estabelecimento_id, form.servico_id, form.profissional_id, form.agenda_id]);

  useEffect(() => {
    let mounted = true;

    if (!form.agenda_id) {
      setHorarios([]);
      return undefined;
    }

    const currentAgenda = agendas.find((item) => String(item.id) === String(form.agenda_id));
    
    if (currentAgenda?.horarios_disponiveis && Array.isArray(currentAgenda.horarios_disponiveis)) {
      setHorarios(currentAgenda.horarios_disponiveis);
      return undefined;
    }

    const loadHorarios = async () => {
      try {
        const data = await request(`/api/agendas/${form.agenda_id}/horarios`, { auth: false });
        if (mounted) {
          setHorarios(Array.isArray(data) ? data : []);
        }
      } catch {
        if (mounted) {
          setHorarios([]);
          setError('Não foi possível carregar os horários da agenda selecionada.');
        }
      }
    };

    loadHorarios();

    return () => {
      mounted = false;
    };
  }, [form.agenda_id, agendas]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => {
      if (name === 'estabelecimento_id') {
        return {
          ...current,
          estabelecimento_id: value,
          servico_id: '',
          profissional_id: '',
          agenda_id: '',
          horario: '',
        };
      }

      if (name === 'servico_id') {
        return {
          ...current,
          servico_id: value,
          profissional_id: '',
          agenda_id: '',
          horario: '',
        };
      }

      if (name === 'profissional_id') {
        return {
          ...current,
          profissional_id: value,
          agenda_id: '',
          horario: '',
        };
      }

      if (name === 'agenda_id') {
        return {
          ...current,
          agenda_id: value,
          horario: '',
        };
      }

      return { ...current, [name]: value };
    });

    if (name === 'estabelecimento_id') {
      setServicos([]);
      setProfissionais([]);
      setAgendas([]);
      setHorarios([]);
    }

    if (name === 'servico_id' || name === 'profissional_id') {
      setAgendas([]);
      setHorarios([]);
    }

    if (name === 'agenda_id') {
      setHorarios([]);
    }

    setMessage('');
    setError('');
  };

  const handleSelectAgenda = (agendaId) => {
    setForm((current) => ({
      ...current,
      agenda_id: String(agendaId),
      horario: '',
    }));
    setMessage('');
    setError('');
  };

  const handleSelectHorario = (horario) => {
    setForm((current) => ({ ...current, horario }));
    setMessage('');
    setError('');
  };

  const handleInstallApp = async () => {
    if (!installPromptEvent) {
      return;
    }

    installPromptEvent.prompt();
    await installPromptEvent.userChoice;
    setInstallPromptEvent(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    setError('');

    const currentSelection = { ...form };

    try {
      await request('/api/agendamentos', {
        method: 'POST',
        body: {
          agenda_id: form.agenda_id,
          horario: form.horario,
          email_cliente: user?.email,
          estabelecimento_slug: estabelecimentoSlug || selectedEstablishment?.slug,
        },
      });

      setMessage('Agendamento confirmado com sucesso. Os detalhes também foram enviados para o seu e-mail.');
      setForm((current) => ({
        ...current,
        agenda_id: '',
        horario: '',
      }));
      await Promise.all([
        loadMyBookings(),
        loadAgendasForSelection({ ...currentSelection, agenda_id: '', horario: '' }),
      ]);
      setTabIndex(2);
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.message);
      } else {
        setError('Não foi possível concluir o agendamento.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelBooking = async (id) => {
    if (!window.confirm('Deseja cancelar este agendamento? O horário será liberado novamente.')) {
      return;
    }

    try {
      await request(`/api/me/agendamentos/${id}/cancelar`, {
        method: 'PATCH',
      });

      setMessage('Agendamento cancelado com sucesso.');
      await Promise.all([
        loadMyBookings(),
        loadAgendasForSelection(form),
      ]);
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.message);
      } else {
        setError('Não foi possível cancelar o agendamento.');
      }
    }
  };

  return (
    <Background>
      <Container maxWidth="lg">
        <Stack spacing={3}>
          {/* Header */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 3 },
              borderRadius: 4,
              background: 'linear-gradient(135deg, #0f766e 0%, #2563eb 100%)',
              color: 'white',
            }}
          >
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BoltRoundedIcon />
                <Typography variant="overline" sx={{ fontWeight: 800 }}>
                  Agendamento Online
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight={800}>
                Reserve seu horário em poucos passos
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Autenticado como: <strong>{user?.name || user?.email}</strong>
              </Typography>
            </Stack>
          </Paper>

          {/* Tabs */}
          <Paper elevation={0} sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)' }}>
            <Tabs
              value={tabIndex}
              onChange={(e, newValue) => setTabIndex(newValue)}
              sx={{
                borderBottom: '1px solid',
                borderColor: 'divider',
                background: 'rgba(255,255,255,0.94)',
                backdropFilter: 'blur(18px)',
              }}
              variant="fullWidth"
            >
              <Tab label="1. Selecione" sx={{ fontWeight: 700, py: 2 }} />
              <Tab label="2. Agende" sx={{ fontWeight: 700, py: 2 }} disabled={!form.profissional_id} />
              <Tab label="3. Minhas Reservas" sx={{ fontWeight: 700, py: 2 }} />
            </Tabs>

            {/* Content */}
            <Box sx={{ p: { xs: 2, sm: 3 }, minHeight: { xs: 'auto', md: '60vh' } }}>
              {/* Tab 1: Selection */}
              {tabIndex === 0 && (
                <Stack spacing={3}>
                  {message && <Alert severity="success">{message}</Alert>}
                  {error && <Alert severity="error">{error}</Alert>}

                  {installPromptEvent && (
                    <Button
                      onClick={handleInstallApp}
                      variant="outlined"
                      startIcon={<InstallMobileRoundedIcon />}
                      fullWidth
                    >
                      Instalar no celular
                    </Button>
                  )}

                  <Grid container spacing={2}>
                    {!exclusiveMode && (
                      <Grid item xs={12} sm={6} md={4}>
                        <TextField
                          select
                          label="Estabelecimento"
                          name="estabelecimento_id"
                          value={form.estabelecimento_id}
                          onChange={handleChange}
                          required
                          disabled={loadingEstabelecimentos}
                          fullWidth
                          helperText={loadingEstabelecimentos ? 'Carregando...' : 'Escolha a unidade'}
                        >
                          <MenuItem value="">Selecione</MenuItem>
                          {estabelecimentos.map((item) => (
                            <MenuItem key={item.id} value={item.id}>
                              {item.nome}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                    )}

                    <Grid item xs={12} sm={6} md={exclusiveMode ? 6 : 4}>
                      <TextField
                        select
                        label="Serviço"
                        name="servico_id"
                        value={form.servico_id}
                        onChange={handleChange}
                        required
                        disabled={!form.estabelecimento_id || loadingRelacoes}
                        fullWidth
                        helperText={
                          !form.estabelecimento_id
                            ? 'Selecione estabelecimento'
                            : loadingRelacoes
                            ? 'Carregando...'
                            : 'Escolha o serviço'
                        }
                      >
                        <MenuItem value="">Selecione</MenuItem>
                        {servicos.map((item) => (
                          <MenuItem key={item.id} value={item.id}>
                            {item.nome}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    <Grid item xs={12} sm={6} md={exclusiveMode ? 6 : 4}>
                      <TextField
                        select
                        label="Profissional"
                        name="profissional_id"
                        value={form.profissional_id}
                        onChange={handleChange}
                        required
                        disabled={!form.servico_id || loadingRelacoes}
                        fullWidth
                        helperText={
                          !form.servico_id
                            ? 'Selecione serviço'
                            : loadingRelacoes
                            ? 'Carregando...'
                            : 'Escolha o profissional'
                        }
                      >
                        <MenuItem value="">Selecione</MenuItem>
                        {profissionais.map((item) => (
                          <MenuItem key={item.id} value={item.id}>
                            {item.nome}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                  </Grid>

                  {selectedEstablishment && (
                    <Card elevation={0} sx={{ background: 'rgba(15, 118, 110, 0.04)', border: '1px solid rgba(15, 118, 110, 0.1)' }}>
                      <CardContent>
                        <Stack spacing={2}>
                          <Box>
                            <Typography variant="h6" fontWeight={800}>
                              {selectedEstablishment.nome}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {selectedEstablishment.segmento}
                            </Typography>
                          </Box>

                          <Stack spacing={1}>
                            {establishmentAddress && (
                              <Stack direction="row" spacing={1} alignItems="flex-start">
                                <PlaceRoundedIcon color="primary" fontSize="small" sx={{ mt: 0.5 }} />
                                <Typography variant="body2">{establishmentAddress}</Typography>
                              </Stack>
                            )}

                            {selectedEstablishment.email && (
                              <Stack direction="row" spacing={1} alignItems="center">
                                <EmailRoundedIcon color="primary" fontSize="small" />
                                <Typography variant="body2">{selectedEstablishment.email}</Typography>
                              </Stack>
                            )}
                          </Stack>

                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {selectedEstablishment.telefone_contato && (
                              <Button
                                component="a"
                                href={buildPhoneHref(selectedEstablishment.telefone_contato)}
                                variant="outlined"
                                size="small"
                                startIcon={<PhoneRoundedIcon />}
                              >
                                {formatPhone(selectedEstablishment.telefone_contato)}
                              </Button>
                            )}

                            {selectedEstablishment.whatsapp && (
                              <Button
                                component="a"
                                href={buildWhatsAppHref(selectedEstablishment.whatsapp)}
                                target="_blank"
                                rel="noreferrer"
                                variant="contained"
                                size="small"
                                startIcon={<ChatRoundedIcon />}
                              >
                                WhatsApp
                              </Button>
                            )}
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  )}

                  {form.profissional_id && (
                    <Button
                      variant="contained"
                      size="large"
                      endIcon={<ArrowForwardRoundedIcon />}
                      onClick={() => setTabIndex(1)}
                      fullWidth
                      sx={{
                        boxShadow: '0 14px 30px rgba(15, 118, 110, 0.18)',
                        py: 1.5,
                      }}
                    >
                      Continuar para Agendamento
                    </Button>
                  )}
                </Stack>
              )}

              {/* Tab 2: Schedule */}
              {tabIndex === 1 && (
                <Stack spacing={3}>
                  {message && <Alert severity="success">{message}</Alert>}
                  {error && <Alert severity="error">{error}</Alert>}

                  <Box>
                    <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
                      📅 Selecione uma data
                    </Typography>

                    {loadingAgendas ? (
                      <Typography color="textSecondary">Carregando agendas...</Typography>
                    ) : agendas.length === 0 ? (
                      <Alert severity="warning">
                        Nenhuma agenda disponível para essa combinação de serviço e profissional.
                      </Alert>
                    ) : (
                      <Grid container spacing={1.5}>
                        {agendas.map((agenda) => {
                          const isSelected = String(agenda.id) === String(form.agenda_id);
                          const hasAvailable = (agenda.quantidade_horarios_disponiveis || 0) > 0;
                          const dateObj = parseDateOnlyToLocalDate(agenda.data);
                          const dayName = dateObj?.toLocaleDateString('pt-BR', { weekday: 'long' }) || '';
                          const dayNum = dateObj?.getDate() || String(agenda.data).slice(8, 10);
                          const monthName = dateObj?.toLocaleDateString('pt-BR', { month: 'short' }) || '';

                          return (
                            <Grid item xs={6} sm={4} md={3} key={agenda.id}>
                              <Card
                                sx={{
                                  cursor: hasAvailable ? 'pointer' : 'not-allowed',
                                  border: isSelected ? `3px solid ${theme.palette.primary.main}` : '1px solid',
                                  borderColor: isSelected ? 'primary.main' : 'divider',
                                  background: isSelected ? alpha(theme.palette.primary.main, 0.08) : 'background.paper',
                                  opacity: hasAvailable ? 1 : 0.5,
                                  transition: 'all .2s ease',
                                  '&:hover': hasAvailable ? {
                                    boxShadow: 3,
                                    transform: 'translateY(-2px)',
                                  } : {},
                                }}
                                onClick={() => hasAvailable && handleSelectAgenda(agenda.id)}
                              >
                                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, textAlign: 'center' }}>
                                  <Typography variant="h6" fontWeight={800}>
                                    {dayNum}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: 'textSecondary', textTransform: 'capitalize' }}>
                                    {monthName} - {dayName.slice(0, 3)}
                                  </Typography>
                                  <Chip
                                    size="small"
                                    label={`${agenda.quantidade_horarios_disponiveis || 0} livres`}
                                    sx={{ mt: 1.5, fontWeight: 700 }}
                                  />
                                </CardContent>
                              </Card>
                            </Grid>
                          );
                        })}
                      </Grid>
                    )}
                  </Box>

                  {selectedAgenda && (
                    <Box>
                      <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
                        🕐 Horários disponíveis em {formatDateBR(selectedAgenda.data)}
                      </Typography>

                      {horarios.length === 0 ? (
                        <Alert severity="warning">Nenhum horário disponível para esta data.</Alert>
                      ) : (
                        <Box sx={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', 
                          gap: 1.5 
                        }}>
                          {horarios.map((hora) => (
                            <Button
                              key={hora}
                              variant={form.horario === hora ? 'contained' : 'outlined'}
                              onClick={() => handleSelectHorario(hora)}
                              sx={{
                                fontWeight: 700,
                                py: 1.8,
                                fontSize: '1.1rem',
                                transition: 'all .2s ease',
                                '&:hover': {
                                  transform: 'translateY(-2px)',
                                }
                              }}
                            >
                              {hora}
                            </Button>
                          ))}
                        </Box>
                      )}
                    </Box>
                  )}

                  {selectedAgenda && form.horario && (
                    <Card elevation={0} sx={{ background: 'linear-gradient(135deg, rgba(15, 118, 110, 0.08), rgba(37, 99, 235, 0.08))', border: '1px solid rgba(15, 118, 110, 0.1)' }}>
                      <CardContent>
                        <Stack spacing={2}>
                          <Typography variant="subtitle2" fontWeight={800}>
                            ✓ Resumo da reserva
                          </Typography>
                          <Stack spacing={1}>
                            <Typography variant="body2">
                              <strong>Estabelecimento:</strong> {selectedEstablishment?.nome}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Serviço:</strong> {selectedService?.nome}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Profissional:</strong> {selectedProfessional?.nome}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Data e Hora:</strong> {formatDateBR(selectedAgenda.data)} às {form.horario}
                            </Typography>
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  )}

                  <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      size="large"
                      disabled={!readyToSubmit || submitting}
                      endIcon={<ArrowForwardRoundedIcon />}
                      sx={{ 
                        flex: { xs: '1 1 100%', sm: 1 },
                        minWidth: 200,
                        py: 1.5,
                        boxShadow: '0 14px 30px rgba(15, 118, 110, 0.18)',
                      }}
                      type="submit"
                    >
                      {submitting ? 'Confirmando...' : 'Confirmar Agendamento'}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => setTabIndex(0)}
                      sx={{ flex: { xs: '1 1 100%', sm: 1 }, minWidth: 200, py: 1.5 }}
                    >
                      Voltar
                    </Button>
                  </Box>
                </Stack>
              )}

              {/* Tab 3: My Bookings */}
              {tabIndex === 2 && (
                <Stack spacing={2}>
                  {message && <Alert severity="success">{message}</Alert>}
                  {error && <Alert severity="error">{error}</Alert>}

                  {loadingMeusAgendamentos ? (
                    <Typography color="textSecondary">Carregando seus agendamentos...</Typography>
                  ) : meusAgendamentos.length === 0 ? (
                    <Card elevation={0} sx={{ background: 'rgba(15, 118, 110, 0.04)', textAlign: 'center', p: 4 }}>
                      <Stack spacing={2} alignItems="center">
                        <EventNoteRoundedIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                        <Typography variant="h6" fontWeight={800}>
                          Você ainda não tem reservas
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Faça seu primeiro agendamento voltando à aba "Agende"
                        </Typography>
                      </Stack>
                    </Card>
                  ) : (
                    <Stack spacing={2}>
                      {meusAgendamentos.map((item) => (
                        <Card key={item.id} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                          <CardContent>
                            <Stack spacing={2}>
                              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
                                <Box>
                                  <Typography variant="subtitle1" fontWeight={800}>
                                    {item.agenda?.servico?.nome} - {item.agenda?.profissional?.nome}
                                  </Typography>
                                  <Typography variant="body2" color="textSecondary">
                                    {formatDateTimeBR(item.agenda?.data, item.horario)}
                                  </Typography>
                                  <Typography variant="body2" color="textSecondary">
                                    {item.agenda?.profissional?.estabelecimento?.nome}
                                  </Typography>
                                </Box>

                                <Stack direction="row" spacing={1}>
                                  <Chip
                                    label={item.status}
                                    size="small"
                                    sx={{
                                      fontWeight: 700,
                                      background: item.status === 'confirmado' ? 'rgba(15, 118, 110, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                                      color: item.status === 'confirmado' ? 'primary.dark' : 'error.dark',
                                    }}
                                  />
                                </Stack>
                              </Stack>

                              {item.status !== 'cancelado' && (
                                <Button
                                  variant="text"
                                  color="error"
                                  startIcon={<CancelRoundedIcon />}
                                  onClick={() => handleCancelBooking(item.id)}
                                  size="small"
                                  sx={{ width: 'fit-content' }}
                                >
                                  Cancelar
                                </Button>
                              )}
                            </Stack>
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                  )}
                </Stack>
              )}
            </Box>
          </Paper>
        </Stack>
      </Container>
    </Background>
  );
}

export default AgendamentoPublico;
