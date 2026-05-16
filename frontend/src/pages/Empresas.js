import React, { useEffect, useMemo, useState } from 'react';
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
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import CorporateFareRoundedIcon from '@mui/icons-material/CorporateFareRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded';
import PageHeader from '../components/PageHeader';
import ResponsiveTable from '../components/ResponsiveTable';
import { ApiError, request } from '../utils/api';
import { formatCurrencyDisplay, formatDateBR, toDateInputValue } from '../utils/formatters';

const initialForm = {
  plano_id: '',
  nome: '',
  documento: '',
  email: '',
  telefone: '',
  status: 'ativo',
  limite_locais: 1,
  valor_mensal: '',
  data_validade: '',
};

function Empresas() {
  const [empresas, setEmpresas] = useState([]);
  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const selectedPlan = useMemo(
    () => planos.find((plano) => String(plano.id) === String(form.plano_id)),
    [planos, form.plano_id]
  );

  const calculatedValue = useMemo(() => {
    if (!selectedPlan) {
      return 0;
    }

    const quantity = selectedPlan.codigo === 'start' ? 1 : Number(form.limite_locais || 1);
    return Number(selectedPlan.preco_base || 0) + Number(selectedPlan.preco_por_local || 0) * quantity;
  }, [selectedPlan, form.limite_locais]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [empresasData, planosData] = await Promise.all([
        request('/api/empresas'),
        request('/api/planos'),
      ]);
      setEmpresas(empresasData || []);
      setPlanos((planosData || []).filter((plano) => plano.ativo));
    } catch {
      setError('Não foi possível carregar as empresas.');
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
      plano_id: item.plano_id || '',
      nome: item.nome || '',
      documento: item.documento || '',
      email: item.email || '',
      telefone: item.telefone || '',
      status: item.status || 'ativo',
      limite_locais: item.limite_locais || 1,
      valor_mensal: item.valor_mensal || '',
      data_validade: toDateInputValue(item.data_validade),
    } : initialForm);
    setMessage('');
    setError('');
    setOpen(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => {
      const next = { ...current, [name]: value };
      const plan = name === 'plano_id'
        ? planos.find((plano) => String(plano.id) === String(value))
        : planos.find((plano) => String(plano.id) === String(current.plano_id));

      if (name === 'plano_id' && plan?.codigo === 'start') {
        next.limite_locais = 1;
      }

      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const payload = {
        ...form,
        limite_locais: selectedPlan?.codigo === 'start' ? 1 : form.limite_locais,
        valor_mensal: form.valor_mensal || calculatedValue,
      };

      await request(editingItem ? `/api/empresas/${editingItem.id}` : '/api/empresas', {
        method: editingItem ? 'PUT' : 'POST',
        body: payload,
      });

      setMessage(editingItem ? 'Empresa atualizada com sucesso.' : 'Empresa criada com sucesso.');
      setOpen(false);
      await loadData();
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Não foi possível salvar a empresa.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja remover esta empresa?')) {
      return;
    }

    try {
      await request(`/api/empresas/${id}`, { method: 'DELETE' });
      setMessage('Empresa removida com sucesso.');
      await loadData();
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Não foi possível remover a empresa.');
    }
  };

  return (
    <Box>
      <PageHeader
        eyebrow="Gestor"
        title="Empresas"
        description="Cadastre clientes SaaS, escolha o plano e defina quantas filiais cada empresa pode abrir."
        actions={<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => handleOpen()}>Nova empresa</Button>}
      />

      <Paper elevation={0} sx={{ background: 'rgba(255,255,255,0.92)', boxShadow: '0 24px 60px rgba(15, 23, 42, 0.08)', overflow: 'hidden' }}>
        <Box sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${alpha('#94a3b8', 0.16)}` }}>
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
            <Chip icon={<CorporateFareRoundedIcon />} label={`${empresas.length} empresas`} sx={{ fontWeight: 700 }} />
            <Chip icon={<BusinessRoundedIcon />} label="Locais por plano" sx={{ fontWeight: 700 }} />
          </Stack>
        </Box>

        {message ? <Alert severity="success" sx={{ mx: 3, mt: 3 }}>{message}</Alert> : null}
        {error ? <Alert severity="error" sx={{ mx: 3, mt: 2 }}>{error}</Alert> : null}

        <Box sx={{ px: { xs: 0, md: 3 }, py: 3 }}>
          <ResponsiveTable
            columns={[
              { field: 'nome', label: 'Empresa', renderCell: (item) => <Typography fontWeight={700}>{item.nome}</Typography> },
              { field: 'plano', label: 'Plano', renderCell: (item) => item.plano?.nome || '-' },
              { field: 'locais', label: 'Locais', renderCell: (item) => `${item.estabelecimentos_count || 0}/${item.limite_locais}` },
              { field: 'valor_mensal', label: 'Mensalidade', renderCell: (item) => formatCurrencyDisplay(item.valor_mensal) },
              { field: 'data_validade', label: 'Validade', renderCell: (item) => formatDateBR(item.data_validade) },
              { field: 'status', label: 'Status', renderCell: (item) => <Chip size="small" color={item.status === 'ativo' ? 'success' : 'warning'} label={item.status} /> },
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
            rows={empresas}
            loading={loading}
            loadingComponent={<Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>}
          />
        </Box>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{editingItem ? 'Editar empresa' : 'Nova empresa'}</DialogTitle>
        <DialogContent dividers>
          <Box component="form" id="empresa-form" onSubmit={handleSubmit}>
            <Grid container spacing={2.5}>
              <Grid item xs={12} md={6}>
                <TextField label="Nome da empresa" name="nome" value={form.nome} onChange={handleChange} required InputProps={{ startAdornment: <InputAdornment position="start"><CorporateFareRoundedIcon color="primary" fontSize="small" /></InputAdornment> }} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField select label="Plano" name="plano_id" value={form.plano_id} onChange={handleChange} required>
                  <MenuItem value="">Selecione</MenuItem>
                  {planos.map((plano) => <MenuItem key={plano.id} value={plano.id}>{plano.nome}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField label="Documento" name="documento" value={form.documento} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField label="E-mail" name="email" value={form.email} onChange={handleChange} type="email" InputProps={{ startAdornment: <InputAdornment position="start"><EmailRoundedIcon color="primary" fontSize="small" /></InputAdornment> }} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField label="Telefone" name="telefone" value={form.telefone} onChange={handleChange} InputProps={{ startAdornment: <InputAdornment position="start"><PhoneRoundedIcon color="primary" fontSize="small" /></InputAdornment> }} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField label="Quantidade de locais" name="limite_locais" value={selectedPlan?.codigo === 'start' ? 1 : form.limite_locais} onChange={handleChange} type="number" required inputProps={{ min: 1 }} disabled={selectedPlan?.codigo === 'start'} helperText={selectedPlan?.codigo === 'start' ? 'Start permite 1 local.' : 'Pro permite definir a quantidade.'} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField label="Valor mensal" name="valor_mensal" value={form.valor_mensal} onChange={handleChange} type="number" inputProps={{ min: 0, step: '0.01' }} helperText={`Sugerido: ${formatCurrencyDisplay(calculatedValue)}`} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField label="Validade" name="data_validade" value={form.data_validade} onChange={handleChange} type="date" InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12}>
                <TextField select label="Status" name="status" value={form.status} onChange={handleChange}>
                  <MenuItem value="ativo">Ativo</MenuItem>
                  <MenuItem value="suspenso">Suspenso</MenuItem>
                  <MenuItem value="cancelado">Cancelado</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5 }}>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button type="submit" form="empresa-form" variant="contained" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Empresas;
