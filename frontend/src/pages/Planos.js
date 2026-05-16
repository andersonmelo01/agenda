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
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import WorkspacePremiumRoundedIcon from '@mui/icons-material/WorkspacePremiumRounded';
import AttachMoneyRoundedIcon from '@mui/icons-material/AttachMoneyRounded';
import PageHeader from '../components/PageHeader';
import ResponsiveTable from '../components/ResponsiveTable';
import { ApiError, request } from '../utils/api';
import { formatCurrencyDisplay } from '../utils/formatters';

const initialForm = {
  nome: '',
  codigo: 'start',
  descricao: '',
  preco_base: '',
  preco_por_local: '',
  limite_locais: 1,
  ativo: true,
};

function Planos() {
  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await request('/api/planos');
      setPlanos(data || []);
    } catch {
      setError('Não foi possível carregar os planos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpen = (item = null) => {
    setEditingItem(item);
    setForm(item ? {
      nome: item.nome || '',
      codigo: item.codigo || 'start',
      descricao: item.descricao || '',
      preco_base: item.preco_base || '',
      preco_por_local: item.preco_por_local || '',
      limite_locais: item.codigo === 'pro' ? '' : item.limite_locais || 1,
      ativo: Boolean(item.ativo),
    } : initialForm);
    setMessage('');
    setError('');
    setOpen(true);
  };

  const handleChange = (event) => {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'codigo' && value === 'start' ? { limite_locais: 1 } : {}),
      ...(name === 'codigo' && value === 'pro' ? { limite_locais: '' } : {}),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const payload = {
        ...form,
        preco_base: form.preco_base || 0,
        preco_por_local: form.preco_por_local || 0,
        limite_locais: form.codigo === 'pro' ? null : form.limite_locais,
      };

      await request(editingItem ? `/api/planos/${editingItem.id}` : '/api/planos', {
        method: editingItem ? 'PUT' : 'POST',
        body: payload,
      });

      setMessage(editingItem ? 'Plano atualizado com sucesso.' : 'Plano criado com sucesso.');
      setOpen(false);
      await loadData();
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Não foi possível salvar o plano.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja remover este plano?')) {
      return;
    }

    try {
      await request(`/api/planos/${id}`, { method: 'DELETE' });
      setMessage('Plano removido com sucesso.');
      await loadData();
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Não foi possível remover o plano.');
    }
  };

  return (
    <Box>
      <PageHeader
        eyebrow="SaaS"
        title="Planos"
        description="Configure os planos Start e Pro, preços e regras de locais por empresa."
        actions={<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => handleOpen()}>Novo plano</Button>}
      />

      <Paper elevation={0} sx={{ background: 'rgba(255,255,255,0.92)', boxShadow: '0 24px 60px rgba(15, 23, 42, 0.08)', overflow: 'hidden' }}>
        <Box sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${alpha('#94a3b8', 0.16)}` }}>
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
            <Chip icon={<WorkspacePremiumRoundedIcon />} label={`${planos.length} planos`} sx={{ fontWeight: 700 }} />
            <Chip label="Start: 1 local" sx={{ fontWeight: 700 }} />
            <Chip label="Pro: locais sob demanda" sx={{ fontWeight: 700 }} />
          </Stack>
        </Box>

        {message ? <Alert severity="success" sx={{ mx: 3, mt: 3 }}>{message}</Alert> : null}
        {error ? <Alert severity="error" sx={{ mx: 3, mt: 2 }}>{error}</Alert> : null}

        <Box sx={{ px: { xs: 0, md: 3 }, py: 3 }}>
          <ResponsiveTable
            columns={[
              { field: 'nome', label: 'Plano', renderCell: (item) => <Typography fontWeight={700}>{item.nome}</Typography> },
              { field: 'codigo', label: 'Código', renderCell: (item) => <Chip size="small" label={item.codigo} /> },
              { field: 'preco_base', label: 'Base', renderCell: (item) => formatCurrencyDisplay(item.preco_base) },
              { field: 'preco_por_local', label: 'Por local', renderCell: (item) => formatCurrencyDisplay(item.preco_por_local) },
              { field: 'limite_locais', label: 'Limite', renderCell: (item) => item.codigo === 'pro' ? 'Configurável' : item.limite_locais },
              { field: 'ativo', label: 'Status', renderCell: (item) => <Chip size="small" color={item.ativo ? 'success' : 'default'} label={item.ativo ? 'Ativo' : 'Inativo'} /> },
              {
                field: 'actions',
                label: 'Ações',
                align: 'right',
                renderCell: (item) => (
                  <Stack direction="row" spacing={0.5}>
                    <IconButton size="small" color="primary" onClick={() => handleOpen(item)}><EditRoundedIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(item.id)}><DeleteRoundedIcon fontSize="small" /></IconButton>
                  </Stack>
                ),
              },
            ]}
            rows={planos}
            loading={loading}
            loadingComponent={<Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>}
          />
        </Box>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingItem ? 'Editar plano' : 'Novo plano'}</DialogTitle>
        <DialogContent dividers>
          <Box component="form" id="plano-form" onSubmit={handleSubmit}>
            <Grid container spacing={2.5}>
              <Grid item xs={12} md={6}>
                <TextField label="Nome" name="nome" value={form.nome} onChange={handleChange} required />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField select label="Tipo" name="codigo" value={form.codigo} onChange={handleChange} required>
                  <MenuItem value="start">Start</MenuItem>
                  <MenuItem value="pro">Pro</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Preço base" name="preco_base" value={form.preco_base} onChange={handleChange} type="number" inputProps={{ min: 0, step: '0.01' }} InputProps={{ startAdornment: <InputAdornment position="start"><AttachMoneyRoundedIcon color="primary" fontSize="small" /></InputAdornment> }} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Preço por local" name="preco_por_local" value={form.preco_por_local} onChange={handleChange} type="number" inputProps={{ min: 0, step: '0.01' }} disabled={form.codigo === 'start'} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Limite de locais" name="limite_locais" value={form.codigo === 'start' ? 1 : form.limite_locais} onChange={handleChange} type="number" inputProps={{ min: 1 }} disabled={form.codigo === 'pro'} helperText={form.codigo === 'pro' ? 'Definido por empresa.' : 'Start sempre permite 1 local.'} />
              </Grid>
              <Grid item xs={12} md={6}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ height: '100%' }}>
                  <Switch name="ativo" checked={form.ativo} onChange={handleChange} />
                  <Typography fontWeight={700}>Plano ativo</Typography>
                </Stack>
              </Grid>
              <Grid item xs={12}>
                <TextField label="Descrição" name="descricao" value={form.descricao} onChange={handleChange} multiline minRows={3} />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5 }}>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button type="submit" form="plano-form" variant="contained" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Planos;
