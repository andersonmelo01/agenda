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
import MiscellaneousServicesRoundedIcon from '@mui/icons-material/MiscellaneousServicesRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import AttachMoneyRoundedIcon from '@mui/icons-material/AttachMoneyRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import PageHeader from '../components/PageHeader';
import ResponsiveTable from '../components/ResponsiveTable';
import { ApiError, request } from '../utils/api';
import { formatCurrencyDisplay, formatCurrencyInput, parseCurrency } from '../utils/formatters';

const initialForm = {
  estabelecimento_id: '',
  nome: '',
  descricao: '',
  preco: '',
};

function Servicos() {
  const [servicos, setServicos] = useState([]);
  const [estabelecimentos, setEstabelecimentos] = useState([]);
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
      const [servicosData, estabelecimentosData] = await Promise.all([
        request('/api/servicos'),
        request('/api/estabelecimentos'),
      ]);

      setServicos(servicosData || []);
      setEstabelecimentos(estabelecimentosData || []);
    } catch {
      setError('Não foi possível carregar os serviços.');
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
            estabelecimento_id: item.estabelecimento_id || '',
            nome: item.nome || '',
            descricao: item.descricao || '',
            preco:
              item.preco !== null && item.preco !== undefined && item.preco !== ''
                ? formatCurrencyInput(String(item.preco).replace('.', ''))
                : '',
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

    setForm((current) => ({
      ...current,
      [name]: name === 'preco' ? formatCurrencyInput(value) : value,
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
      const payload = {
        ...form,
        preco: form.preco ? parseCurrency(form.preco) : null,
      };

      if (!payload.preco) {
        delete payload.preco;
      }

      await request(editingItem ? `/api/servicos/${editingItem.id}` : '/api/servicos', {
        method: editingItem ? 'PUT' : 'POST',
        body: payload,
      });

      setMessage(editingItem ? 'Serviço atualizado com sucesso.' : 'Serviço criado com sucesso.');
      setOpen(false);
      await loadData();
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.message);
      } else {
        setError('Não foi possível salvar o serviço.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja remover este serviço?')) {
      return;
    }

    try {
      await request(`/api/servicos/${id}`, { method: 'DELETE' });
      setMessage('Serviço removido com sucesso.');
      setError('');
      await loadData();
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.message);
      } else {
        setError('Não foi possível remover o serviço.');
      }
    }
  };

  return (
    <Box>
      <PageHeader
        eyebrow="Serviços"
        title="Serviços"
        description="Cadastre os serviços oferecidos por cada unidade e mantenha o catálogo visualmente organizado."
        actions={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => handleOpen()}>
            Novo serviço
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
            <Chip icon={<MiscellaneousServicesRoundedIcon />} label={`${servicos.length} serviços`} sx={{ fontWeight: 700 }} />
            <Chip icon={<BusinessRoundedIcon />} label={`${estabelecimentos.length} unidades`} sx={{ fontWeight: 700 }} />
            <Chip icon={<AttachMoneyRoundedIcon />} label="Preço com máscara" sx={{ fontWeight: 700 }} />
          </Stack>
        </Box>

        {message ? <Alert severity="success" sx={{ mx: 3, mt: 3 }}>{message}</Alert> : null}
        {error ? <Alert severity="error" sx={{ mx: 3, mt: 2 }}>{error}</Alert> : null}

        <Box sx={{ px: { xs: 0, md: 3 }, py: 3 }}>
          <ResponsiveTable
            columns={[
              {
                field: 'nome',
                label: 'Nome',
                renderCell: (item) => <Typography fontWeight={700}>{item.nome}</Typography>,
              },
              {
                field: 'descricao',
                label: 'Descrição',
                renderCell: (item) => (
                  <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {item.descricao || '-'}
                  </Typography>
                ),
              },
              {
                field: 'preco',
                label: 'Preço',
                renderCell: (item) => formatCurrencyDisplay(item.preco),
              },
              {
                field: 'estabelecimento',
                label: 'Estabelecimento',
                renderCell: (item) =>
                  item.estabelecimento?.nome ||
                  estabelecimentos.find((estabelecimento) => estabelecimento.id === item.estabelecimento_id)?.nome ||
                  '-',
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
            rows={servicos}
            loading={loading}
            loadingComponent={
              <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
              </Box>
            }
            emptyComponent={
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                  Nenhum serviço cadastrado
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Cadastre serviços com preço para facilitar a escolha no fluxo de atendimento.
                </Typography>
              </Box>
            }
          />
        </Box>
      </Paper>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle>{editingItem ? 'Editar serviço' : 'Novo serviço'}</DialogTitle>
        <DialogContent dividers>
          <Box component="form" id="servico-form" onSubmit={handleSubmit}>
            <Grid container spacing={2.5}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Nome"
                  name="nome"
                  value={form.nome}
                  onChange={handleChange}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MiscellaneousServicesRoundedIcon color="primary" fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="Estabelecimento"
                  name="estabelecimento_id"
                  value={form.estabelecimento_id}
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="">Selecione</MenuItem>
                  {estabelecimentos.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.nome}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Preço"
                  name="preco"
                  value={form.preco}
                  onChange={handleChange}
                  placeholder="R$ 0,00"
                  helperText="Máscara de moeda brasileira."
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AttachMoneyRoundedIcon color="primary" fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Descrição"
                  name="descricao"
                  value={form.descricao}
                  onChange={handleChange}
                  multiline
                  minRows={4}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <DescriptionRoundedIcon color="primary" fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5 }}>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button type="submit" form="servico-form" variant="contained" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Servicos;
