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
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import PageHeader from '../components/PageHeader';
import ResponsiveTable from '../components/ResponsiveTable';
import { ApiError, request } from '../utils/api';

const initialForm = {
  nome: '',
  email: '',
  estabelecimento_id: '',
};

function Profissionais() {
  const [profissionais, setProfissionais] = useState([]);
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
      const [profissionaisData, estabelecimentosData] = await Promise.all([
        request('/api/profissionais'),
        request('/api/estabelecimentos'),
      ]);

      setProfissionais(profissionaisData || []);
      setEstabelecimentos(estabelecimentosData || []);
    } catch (error) {
      if (error instanceof ApiError) {
        setError(`Erro ao carregar profissionais: ${error.message} (status: ${error.status})${error.payload ? '\n' + JSON.stringify(error.payload) : ''}`);
      } else {
        setError('Não foi possível carregar os profissionais.');
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
            nome: item.nome || '',
            email: item.email || '',
            estabelecimento_id: item.estabelecimento_id || '',
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      await request(editingItem ? `/api/profissionais/${editingItem.id}` : '/api/profissionais', {
        method: editingItem ? 'PUT' : 'POST',
        body: form,
      });

      setMessage(editingItem ? 'Profissional atualizado com sucesso.' : 'Profissional criado com sucesso.');
      setOpen(false);
      await loadData();
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.message);
      } else {
        setError('Não foi possível salvar o profissional.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja remover este profissional?')) {
      return;
    }

    try {
      await request(`/api/profissionais/${id}`, { method: 'DELETE' });
      setMessage('Profissional removido com sucesso.');
      setError('');
      await loadData();
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.message);
      } else {
        setError('Não foi possível remover o profissional.');
      }
    }
  };

  return (
    <Box>
      <PageHeader
        eyebrow="Equipe"
        title="Profissionais"
        description="Cadastre a equipe vinculada a cada estabelecimento e mantenha o painel alinhado ao atendimento."
        actions={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => handleOpen()}>
            Novo profissional
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
            <Chip icon={<BadgeRoundedIcon />} label={`${profissionais.length} profissionais`} sx={{ fontWeight: 700 }} />
            <Chip icon={<BusinessRoundedIcon />} label={`${estabelecimentos.length} unidades`} sx={{ fontWeight: 700 }} />
            <Chip icon={<EmailRoundedIcon />} label="E-mail opcional" sx={{ fontWeight: 700 }} />
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
                field: 'email',
                label: 'E-mail',
                renderCell: (item) => item.email || '-',
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
            rows={profissionais}
            loading={loading}
            loadingComponent={
              <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
              </Box>
            }
            emptyComponent={
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                  Nenhum profissional cadastrado
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Cadastre a equipe para poder vincular serviços e horários.
                </Typography>
              </Box>
            }
          />
        </Box>
      </Paper>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle>{editingItem ? 'Editar profissional' : 'Novo profissional'}</DialogTitle>
        <DialogContent dividers>
          <Box component="form" id="profissional-form" onSubmit={handleSubmit}>
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
                        <BadgeRoundedIcon color="primary" fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="E-mail"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  type="email"
                  helperText="Opcional, mas útil para contato interno."
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailRoundedIcon color="primary" fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  select
                  label="Estabelecimento"
                  name="estabelecimento_id"
                  value={form.estabelecimento_id}
                  onChange={handleChange}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BusinessRoundedIcon color="primary" fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                >
                  <MenuItem value="">Selecione</MenuItem>
                  {estabelecimentos.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.nome}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5 }}>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button type="submit" form="profissional-form" variant="contained" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Profissionais;
