import React, { useEffect, useState } from 'react';
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
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import MiscellaneousServicesRoundedIcon from '@mui/icons-material/MiscellaneousServicesRounded';
import PageHeader from '../components/PageHeader';
import ResponsiveTable from '../components/ResponsiveTable';
import { ApiError, request } from '../utils/api';
import { formatDateBR, formatTimeValue, toDateInputValue, toTimeInputValue } from '../utils/formatters';

const initialForm = {
  profissional_id: '',
  servico_id: '',
  data: '',
  intervalo_minutos: 30,
  intervalos: [{ hora_inicio: '', hora_fim: '' }],
  status: 'disponivel',
};

const statusOptions = [
  { value: 'disponivel', label: 'Disponível', color: 'success', icon: CheckCircleRoundedIcon },
  { value: 'bloqueada', label: 'Bloqueada', color: 'warning', icon: BlockRoundedIcon },
  { value: 'ocupada', label: 'Ocupada', color: 'error', icon: EventNoteRoundedIcon },
];

function getTodayInputValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function Agendas() {
  const [agendas, setAgendas] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const todayInputValue = getTodayInputValue();

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [agendasData, profissionaisData, servicosData] = await Promise.all([
        request('/api/agendas'),
        request('/api/profissionais'),
        request('/api/servicos'),
      ]);

      setAgendas(agendasData || []);
      setProfissionais(profissionaisData || []);
      setServicos(servicosData || []);
    } catch (error) {
      if (error instanceof ApiError) {
        setError(`Erro ao carregar agendas: ${error.message} (status: ${error.status})${error.payload ? '\n' + JSON.stringify(error.payload) : ''}`);
      } else {
        setError('Não foi possível carregar as agendas.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpen = (item = null) => {
    setEditingItem(item);
    setForm(
      item
        ? {
            profissional_id: item.profissional_id || '',
            servico_id: item.servico_id || '',
            data: toDateInputValue(item.data),
            intervalo_minutos: item.intervalo_minutos || 30,
            intervalos: item.intervalos && item.intervalos.length > 0
              ? item.intervalos.map(intervalo => ({
                  hora_inicio: toTimeInputValue(intervalo.hora_inicio),
                  hora_fim: toTimeInputValue(intervalo.hora_fim),
                }))
              : [{ hora_inicio: toTimeInputValue(item.hora_inicio), hora_fim: toTimeInputValue(item.hora_fim) }],
            status: item.status || 'disponivel',
          }
        : initialForm
    );
    setMessage('');
    setError('');
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setMessage('');
    setError('');
  };

  const handleIntervaloChange = (index, field, value) => {
    setForm((current) => ({
      ...current,
      intervalos: current.intervalos.map((intervalo, i) =>
        i === index ? { ...intervalo, [field]: value } : intervalo
      ),
    }));
    setMessage('');
    setError('');
  };

  const addIntervalo = () => {
    setForm((current) => ({
      ...current,
      intervalos: [...current.intervalos, { hora_inicio: '', hora_fim: '' }],
    }));
  };

  const removeIntervalo = (index) => {
    if (form.intervalos.length > 1) {
      setForm((current) => ({
        ...current,
        intervalos: current.intervalos.filter((_, i) => i !== index),
      }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      await request(editingItem ? `/api/agendas/${editingItem.id}` : '/api/agendas', {
        method: editingItem ? 'PUT' : 'POST',
        body: form,
      });

      setMessage(editingItem ? 'Agenda atualizada com sucesso.' : 'Agenda criada com sucesso.');
      setOpen(false);
      await loadData();
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.message);
      } else {
        setError('Não foi possível salvar a agenda.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja remover esta agenda?')) {
      return;
    }

    try {
      await request(`/api/agendas/${id}`, { method: 'DELETE' });
      setMessage('Agenda removida com sucesso.');
      setError('');
      await loadData();
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.message);
      } else {
        setError('Não foi possível remover a agenda.');
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
        eyebrow="Operação"
        title="Agendas"
        description="Registre os horários disponíveis por profissional com leitura clara de status e período."
        actions={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => handleOpen()}>
            Nova agenda
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
            <Chip icon={<EventNoteRoundedIcon />} label={`${agendas.length} agendas`} sx={{ fontWeight: 700 }} />
            <Chip icon={<BadgeRoundedIcon />} label={`${profissionais.length} profissionais`} sx={{ fontWeight: 700 }} />
            <Chip icon={<MiscellaneousServicesRoundedIcon />} label={`${servicos.length} serviços`} sx={{ fontWeight: 700 }} />
            <Chip icon={<CalendarMonthRoundedIcon />} label="Data e horário" sx={{ fontWeight: 700 }} />
          </Stack>
        </Box>

        {message ? <Alert severity="success" sx={{ mx: 3, mt: 3 }}>{message}</Alert> : null}
        {error ? <Alert severity="error" sx={{ mx: 3, mt: 2 }}>{error}</Alert> : null}

        <Box sx={{ px: { xs: 0, md: 3 }, py: 3 }}>
          <ResponsiveTable
            columns={[
              {
                field: 'profissional',
                label: 'Profissional',
                renderCell: (item) => <Typography fontWeight={700}>{item.profissional?.nome || '-'}</Typography>,
              },
              {
                field: 'servico',
                label: 'Serviço',
                renderCell: (item) =>
                  item.servico?.nome || servicos.find((servico) => servico.id === item.servico_id)?.nome || '-',
              },
              {
                field: 'data',
                label: 'Data',
                renderCell: (item) => formatDateBR(item.data),
              },
              {
                field: 'intervalos',
                label: 'Horários',
                renderCell: (item) => {
                  if (item.intervalos && item.intervalos.length > 0) {
                    return (
                      <Stack spacing={0.5}>
                        {item.intervalos.map((intervalo, idx) => (
                          <Typography key={idx} variant="body2">
                            {formatTimeValue(intervalo.hora_inicio)} - {formatTimeValue(intervalo.hora_fim)}
                          </Typography>
                        ))}
                      </Stack>
                    );
                  }
                  // Fallback para formato antigo
                  return `${formatTimeValue(item.hora_inicio)} - ${formatTimeValue(item.hora_fim)}`;
                },
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
                      <DeleteRoundedIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                ),
              },
            ]}
            rows={agendas}
            loading={loading}
            loadingComponent={
              <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
              </Box>
            }
            emptyComponent={
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                  Nenhuma agenda cadastrada
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Comece registrando os horários disponíveis de cada profissional.
                </Typography>
              </Box>
            }
          />
        </Box>
      </Paper>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle>{editingItem ? 'Editar agenda' : 'Nova agenda'}</DialogTitle>
        <DialogContent dividers>
          <Box component="form" id="agenda-form" onSubmit={handleSubmit}>
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <TextField
                  select
                  label="Profissional"
                  name="profissional_id"
                  value={form.profissional_id}
                  onChange={handleChange}
                  required
                  >
                    <MenuItem value="">Selecione</MenuItem>
                    {profissionais.map((item) => (
                      <MenuItem key={item.id} value={item.id}>
                        {item.nome}
                      </MenuItem>
                    ))}
                  </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  select
                  label="Serviço"
                  name="servico_id"
                  value={form.servico_id}
                  onChange={handleChange}
                  required
                  helperText="A agenda precisa estar vinculada a um serviço."
                >
                  <MenuItem value="">Selecione</MenuItem>
                  {servicos.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.nome}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="Data"
                  name="data"
                  value={form.data}
                  onChange={handleChange}
                  type="date"
                  required
                  inputProps={{ min: todayInputValue }}
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

              <Grid item xs={12} md={4}>
                <TextField
                  label="Intervalo (minutos)"
                  name="intervalo_minutos"
                  value={form.intervalo_minutos}
                  onChange={handleChange}
                  type="number"
                  required
                  inputProps={{ min: 1, max: 180 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AccessTimeRoundedIcon color="primary" fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField select label="Status" name="status" value={form.status} onChange={handleChange}>
                  {statusOptions.map((item) => (
                    <MenuItem key={item.value} value={item.value}>
                      {item.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Intervalos de Horário
                </Typography>
                <Stack spacing={2}>
                  {form.intervalos.map((intervalo, index) => (
                    <Grid container key={index} spacing={2} alignItems="center">
                      <Grid item xs={12} md={5}>
                        <TextField
                          label={`Hora início ${index + 1}`}
                          value={intervalo.hora_inicio}
                          onChange={(e) => handleIntervaloChange(index, 'hora_inicio', e.target.value)}
                          type="time"
                          required
                          InputLabelProps={{ shrink: true }}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12} md={5}>
                        <TextField
                          label={`Hora fim ${index + 1}`}
                          value={intervalo.hora_fim}
                          onChange={(e) => handleIntervaloChange(index, 'hora_fim', e.target.value)}
                          type="time"
                          required
                          InputLabelProps={{ shrink: true }}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12} md={2}>
                        {form.intervalos.length > 1 && (
                          <Button
                            variant="outlined"
                            color="error"
                            onClick={() => removeIntervalo(index)}
                            fullWidth
                          >
                            Remover
                          </Button>
                        )}
                      </Grid>
                    </Grid>
                  ))}
                  <Button variant="outlined" onClick={addIntervalo} startIcon={<AddRoundedIcon />}>
                    Adicionar Intervalo
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5 }}>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button type="submit" form="agenda-form" variant="contained" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Agendas;
