import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import FilterAltRoundedIcon from '@mui/icons-material/FilterAltRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import MiscellaneousServicesRoundedIcon from '@mui/icons-material/MiscellaneousServicesRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import HourglassEmptyRoundedIcon from '@mui/icons-material/HourglassEmptyRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import PageHeader from '../components/PageHeader';
import ResponsiveTable from '../components/ResponsiveTable';
import { ApiError, request } from '../utils/api';
import { formatDateBR, formatDateTimeBR, formatTimeValue } from '../utils/formatters';

const initialForm = {
  agenda_id: '',
  horario: '',
  usuario_id: '',
  email_cliente: '',
  status: 'pendente',
};

const initialFilters = {
  data: '',
  profissional_id: '',
  servico_id: '',
  status: '',
};

const statusOptions = [
  { value: 'pendente', label: 'Pendente', color: 'warning', icon: HourglassEmptyRoundedIcon },
  { value: 'confirmado', label: 'Confirmado', color: 'success', icon: TaskAltRoundedIcon },
  { value: 'cancelado', label: 'Cancelado', color: 'error', icon: CancelRoundedIcon },
  { value: 'concluido', label: 'Concluído', color: 'primary', icon: CheckCircleRoundedIcon },
];

function Agendamentos() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [agendas, setAgendas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [horariosDisponiveis, setHorariosDisponiveis] = useState([]);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadData = useCallback(async (activeFilters = initialFilters) => {
    setLoading(true);
    setError('');

    try {
      const query = new URLSearchParams();

      Object.entries(activeFilters).forEach(([key, value]) => {
        if (value) {
          query.set(key, value);
        }
      });

      const [agendamentosData, agendasData, usuariosData, profissionaisData, servicosData] = await Promise.all([
        request(`/api/agendamentos${query.toString() ? `?${query.toString()}` : ''}`),
        request('/api/agendas'),
        request('/api/users'),
        request('/api/profissionais'),
        request('/api/servicos'),
      ]);

      setAgendamentos(agendamentosData || []);
      setAgendas(agendasData || []);
      setUsuarios(usuariosData || []);
      setProfissionais(profissionaisData || []);
      setServicos(servicosData || []);
    } catch (error) {
      if (error instanceof ApiError) {
        setError(`Erro ao carregar agendamentos: ${error.message} (status: ${error.status})${error.payload ? '\n' + JSON.stringify(error.payload) : ''}`);
      } else {
        setError('Não foi possível carregar os agendamentos.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(initialFilters);
  }, [loadData]);

  useEffect(() => {
    let mounted = true;

    if (!form.agenda_id) {
      setHorariosDisponiveis([]);
      setLoadingHorarios(false);
      return undefined;
    }

    const loadHorarios = async () => {
      setLoadingHorarios(true);

      try {
        const data = await request(`/api/agendas/${form.agenda_id}/horarios`);

        if (!mounted) {
          return;
        }

        const currentHorario = editingItem?.agenda_id === form.agenda_id && editingItem?.horario
          ? [editingItem.horario]
          : [];

        setHorariosDisponiveis(Array.from(new Set([...(data || []), ...currentHorario])).sort());
      } catch {
        if (mounted) {
          setHorariosDisponiveis(editingItem?.horario ? [editingItem.horario] : []);
        }
      } finally {
        if (mounted) {
          setLoadingHorarios(false);
        }
      }
    };

    loadHorarios();

    return () => {
      mounted = false;
    };
  }, [form.agenda_id, editingItem]);

  const handleOpen = (item = null) => {
    setEditingItem(item);
    setForm(
      item
        ? {
            agenda_id: item.agenda_id || '',
            horario: item.horario || '',
            usuario_id: item.usuario_id || '',
            email_cliente: item.email_cliente || '',
            status: item.status || 'pendente',
          }
        : initialForm
    );
    setMessage('');
    setError('');
    setOpen(true);
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const handleApplyFilters = async () => {
    await loadData();
  };

  const handleClearFilters = async () => {
    const clearedFilters = { ...initialFilters };
    setFilters(clearedFilters);
    await loadData(clearedFilters);
  };

  const handleClose = () => setOpen(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'agenda_id' ? { horario: '' } : {}),
    }));
    setMessage('');
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      await request(editingItem ? `/api/agendamentos/${editingItem.id}` : '/api/agendamentos', {
        method: editingItem ? 'PUT' : 'POST',
        body: form,
      });

      setMessage(editingItem ? 'Agendamento atualizado com sucesso.' : 'Agendamento criado com sucesso.');
      setOpen(false);
      await loadData();
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.message);
      } else {
        setError('Não foi possível salvar o agendamento.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja remover este agendamento?')) {
      return;
    }

    try {
      await request(`/api/agendamentos/${id}`, { method: 'DELETE' });
      setMessage('Agendamento cancelado com sucesso.');
      setError('');
      await loadData();
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.message);
      } else {
        setError('Não foi possível remover o agendamento.');
      }
    }
  };

  const getStatusChip = (value) => {
    const status = statusOptions.find((item) => item.value === value) || statusOptions[0];
    const Icon = status.icon;

    return <Chip size="small" color={status.color} icon={<Icon />} label={status.label} />;
  };

  return (
    <Box>
      <PageHeader
        eyebrow="Reservas"
        title="Agendamentos"
        description="Controle as reservas, clientes e status de atendimento em uma única visão."
        actions={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => handleOpen()}>
            Novo agendamento
          </Button>
        }
      />

      <Paper
        elevation={0}
        sx={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(18px)',
          boxShadow: '0 24px 60px rgba(15, 23, 42, 0.08)',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${alpha('#94a3b8', 0.16)}` }}>
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
            <Chip icon={<EventNoteRoundedIcon />} label={`${agendamentos.length} agendamentos`} sx={{ fontWeight: 700 }} />
            <Chip icon={<EventAvailableRoundedIcon />} label={`${agendas.length} horários`} sx={{ fontWeight: 700 }} />
            <Chip icon={<PersonRoundedIcon />} label={`${usuarios.length} usuários`} sx={{ fontWeight: 700 }} />
            <Chip icon={<MiscellaneousServicesRoundedIcon />} label={`${servicos.length} serviços`} sx={{ fontWeight: 700 }} />
          </Stack>
        </Box>

        <Box sx={{ px: 3, pt: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 4,
              background: 'linear-gradient(180deg, rgba(15, 118, 110, 0.05), rgba(37, 99, 235, 0.03))',
              border: '1px solid rgba(15, 23, 42, 0.06)',
            }}
          >
            <Stack spacing={2}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <FilterAltRoundedIcon color="primary" />
                <Typography variant="h6" fontWeight={800}>
                  Filtros do monitor
                </Typography>
              </Stack>

              <Grid container spacing={2.5}>
                <Grid item xs={12} md={3}>
                  <TextField
                    label="Data"
                    name="data"
                    value={filters.data}
                    onChange={handleFilterChange}
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarMonthRoundedIcon color="primary" fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField select label="Profissional" name="profissional_id" value={filters.profissional_id} onChange={handleFilterChange}>
                    <MenuItem value="">Todos</MenuItem>
                    {profissionais.map((item) => (
                      <MenuItem key={item.id} value={item.id}>
                        {item.nome}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField select label="Serviço" name="servico_id" value={filters.servico_id} onChange={handleFilterChange}>
                    <MenuItem value="">Todos</MenuItem>
                    {servicos.map((item) => (
                      <MenuItem key={item.id} value={item.id}>
                        {item.nome}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField select label="Status" name="status" value={filters.status} onChange={handleFilterChange}>
                    <MenuItem value="">Todos</MenuItem>
                    {statusOptions.map((item) => (
                      <MenuItem key={item.value} value={item.value}>
                        {item.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>

              <Stack direction="row" spacing={1.5} justifyContent="flex-end" flexWrap="wrap">
                <Button variant="outlined" onClick={handleClearFilters}>
                  Limpar
                </Button>
                <Button variant="contained" startIcon={<FilterAltRoundedIcon />} onClick={handleApplyFilters}>
                  Filtrar
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Box>

        {message ? <Alert severity="success" sx={{ mx: 3, mt: 3 }}>{message}</Alert> : null}
        {error ? <Alert severity="error" sx={{ mx: 3, mt: 2 }}>{error}</Alert> : null}

        <Box sx={{ px: { xs: 0, md: 3 }, py: 3 }}>
          <ResponsiveTable
            columns={[
              {
                field: 'agenda',
                label: 'Agenda',
                renderCell: (item) => (
                  <Stack spacing={0.3}>
                    <Typography fontWeight={700}>
                      {item.agenda?.profissional?.nome ||
                        agendas.find((agenda) => agenda.id === item.agenda_id)?.profissional?.nome ||
                        '-'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatDateTimeBR(
                        item.agenda?.data || agendas.find((agenda) => agenda.id === item.agenda_id)?.data,
                        item.horario || item.agenda?.hora_inicio || agendas.find((agenda) => agenda.id === item.agenda_id)?.hora_inicio
                      )}
                    </Typography>
                  </Stack>
                ),
              },
              {
                field: 'servico',
                label: 'Serviço',
                renderCell: (item) =>
                  item.agenda?.servico?.nome ||
                  agendas.find((agenda) => agenda.id === item.agenda_id)?.servico?.nome ||
                  '-',
              },
              {
                field: 'usuario',
                label: 'Usuário',
                renderCell: (item) =>
                  item.usuario?.name || usuarios.find((usuario) => usuario.id === item.usuario_id)?.name || '-',
              },
              {
                field: 'email_cliente',
                label: 'E-mail do cliente',
              },
              {
                field: 'status',
                label: 'Status',
                renderCell: (item) => getStatusChip(item.status),
              },
              {
                field: 'actions',
                label: 'Ações',
                align: 'right',
                renderCell: (item) => (
                  <Stack direction="row" spacing={0.5}>
                    <IconButton size="small" color="primary" onClick={() => handleOpen(item)}>
                      <EditRoundedIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(item.id)}>
                      <CancelRoundedIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                ),
              },
            ]}
            rows={agendamentos}
            loading={loading}
            loadingComponent={
              <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
              </Box>
            }
            emptyComponent={
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                  Nenhum agendamento cadastrado
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Use esta tela para acompanhar as reservas feitas pelo público e pelo time interno.
                </Typography>
              </Box>
            }
          />
        </Box>
      </Paper>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle>{editingItem ? 'Editar agendamento' : 'Novo agendamento'}</DialogTitle>
        <DialogContent dividers>
          <Box component="form" id="agendamento-form" onSubmit={handleSubmit}>
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <TextField select label="Agenda" name="agenda_id" value={form.agenda_id} onChange={handleChange} required>
                  <MenuItem value="">Selecione</MenuItem>
                  {agendas.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.servico?.nome || '-'} - {item.profissional?.nome || '-'} - {formatDateBR(item.data)} {formatTimeValue(item.hora_inicio)}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  select
                  label="Horário"
                  name="horario"
                  value={form.horario}
                  onChange={handleChange}
                  required
                  disabled={!form.agenda_id || loadingHorarios}
                  helperText={
                    !form.agenda_id
                      ? 'Selecione uma agenda primeiro.'
                      : loadingHorarios
                        ? 'Carregando horários disponíveis...'
                        : 'Escolha o horário exato do atendimento.'
                  }
                >
                  <MenuItem value="">Selecione</MenuItem>
                  {horariosDisponiveis.map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField select label="Usuário" name="usuario_id" value={form.usuario_id} onChange={handleChange}>
                  <MenuItem value="">Nenhum</MenuItem>
                  {usuarios.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="E-mail do cliente"
                  name="email_cliente"
                  value={form.email_cliente}
                  onChange={handleChange}
                  type="email"
                  required
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', mr: 1 }}>
                        <EmailRoundedIcon color="primary" fontSize="small" />
                      </Box>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField select label="Status" name="status" value={form.status} onChange={handleChange}>
                  {statusOptions.map((item) => (
                    <MenuItem key={item.value} value={item.value}>
                      {item.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5 }}>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button type="submit" form="agendamento-form" variant="contained" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Agendamentos;
