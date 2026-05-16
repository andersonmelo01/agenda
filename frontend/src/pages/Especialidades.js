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
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import SparklesRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import PageHeader from '../components/PageHeader';
import ResponsiveTable from '../components/ResponsiveTable';
import { ApiError, request } from '../utils/api';

const initialForm = { nome: '' };

function Especialidades() {
  const [especialidades, setEspecialidades] = useState([]);
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
      const data = await request('/api/especialidades');
      setEspecialidades(data || []);
    } catch {
      setError('Não foi possível carregar as especialidades.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpen = (item = null) => {
    setEditingItem(item);
    setForm(item ? { nome: item.nome || '' } : initialForm);
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
      await request(editingItem ? `/api/especialidades/${editingItem.id}` : '/api/especialidades', {
        method: editingItem ? 'PUT' : 'POST',
        body: form,
      });

      setMessage(editingItem ? 'Especialidade atualizada com sucesso.' : 'Especialidade criada com sucesso.');
      setOpen(false);
      await loadData();
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.message);
      } else {
        setError('Não foi possível salvar a especialidade.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja remover esta especialidade?')) {
      return;
    }

    try {
      await request(`/api/especialidades/${id}`, { method: 'DELETE' });
      setMessage('Especialidade removida com sucesso.');
      setError('');
      await loadData();
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.message);
      } else {
        setError('Não foi possível remover a especialidade.');
      }
    }
  };

  return (
    <Box>
      <PageHeader
        eyebrow="Catálogo"
        title="Especialidades"
        description="Organize as áreas de atuação para facilitar a associação de serviços e profissionais."
        actions={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => handleOpen()}>
            Nova especialidade
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
            <Chip icon={<CategoryRoundedIcon />} label={`${especialidades.length} especialidades`} sx={{ fontWeight: 700 }} />
            <Chip icon={<SparklesRoundedIcon />} label="Base de serviços" sx={{ fontWeight: 700 }} />
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
            rows={especialidades}
            loading={loading}
            loadingComponent={
              <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
              </Box>
            }
            emptyComponent={
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                  Nenhuma especialidade cadastrada
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Comece cadastrando as áreas de atuação disponíveis no negócio.
                </Typography>
              </Box>
            }
          />
        </Box>
      </Paper>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>{editingItem ? 'Editar especialidade' : 'Nova especialidade'}</DialogTitle>
        <DialogContent dividers>
          <Box component="form" id="especialidade-form" onSubmit={handleSubmit}>
            <TextField
              label="Nome"
              name="nome"
              value={form.nome}
              onChange={handleChange}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5 }}>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button type="submit" form="especialidade-form" variant="contained" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Especialidades;
