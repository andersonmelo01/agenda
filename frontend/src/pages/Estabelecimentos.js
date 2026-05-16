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
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import ChatRoundedIcon from '@mui/icons-material/ChatRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import CorporateFareRoundedIcon from '@mui/icons-material/CorporateFareRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import PageHeader from '../components/PageHeader';
import ResponsiveTable from '../components/ResponsiveTable';
import { ApiError, request } from '../utils/api';
import { getAuthUser } from '../utils/auth';
import {
  formatDateBR,
  formatEstablishmentAddress,
  formatPhone,
  formatPostalCode,
  toDateInputValue,
} from '../utils/formatters';

const initialForm = {
  empresa_id: '',
  slug: '',
  nome: '',
  segmento: '',
  status: 'ativo',
  data_validade: '',
  email: '',
  telefone_contato: '',
  whatsapp: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  senha: '',
};

const segments = [
  'Clínica',
  'Consultório',
  'Salão',
  'Barbearia',
  'Estúdio',
  'Escritório',
  'Outro',
];

const states = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

function Estabelecimentos() {
  const user = getAuthUser();
  const isGestor = user?.role === 'gestor';
  const [estabelecimentos, setEstabelecimentos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [estabelecimentosData, empresasData] = await Promise.all([
        request('/api/estabelecimentos'),
        isGestor ? request('/api/empresas') : Promise.resolve([]),
      ]);
      setEstabelecimentos(estabelecimentosData || []);
      setEmpresas(empresasData || []);
    } catch {
      setError('Não foi possível carregar os estabelecimentos.');
    } finally {
      setLoading(false);
    }
  }, [isGestor]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpen = (item = null) => {
    setEditingItem(item);
    setForm(
      item
        ? {
            nome: item.nome || '',
            empresa_id: item.empresa_id || '',
            slug: item.slug || '',
            segmento: item.segmento || '',
            status: item.status || 'ativo',
            data_validade: toDateInputValue(item.data_validade),
            email: item.email || '',
            telefone_contato: item.telefone_contato || '',
            whatsapp: item.whatsapp || '',
            cep: item.cep || '',
            logradouro: item.logradouro || '',
            numero: item.numero || '',
            complemento: item.complemento || '',
            bairro: item.bairro || '',
            cidade: item.cidade || '',
            estado: item.estado || '',
            senha: '',
          }
        : initialForm
    );
    setShowPassword(false);
    setMessage('');
    setError('');
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    const normalizedValue = (() => {
      if (name === 'telefone_contato' || name === 'whatsapp') {
        return formatPhone(value);
      }

      if (name === 'cep') {
        return formatPostalCode(value);
      }

      if (name === 'estado') {
        return String(value).toUpperCase().slice(0, 2);
      }

      return value;
    })();

    setForm((current) => ({ ...current, [name]: normalizedValue }));
    setMessage('');
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const payload = { ...form };

      if (!isGestor) {
        delete payload.empresa_id;
      }

      if (editingItem && !payload.senha.trim()) {
        delete payload.senha;
      }

      await request(editingItem ? `/api/estabelecimentos/${editingItem.id}` : '/api/estabelecimentos', {
        method: editingItem ? 'PUT' : 'POST',
        body: payload,
      });

      setMessage(editingItem ? 'Estabelecimento atualizado com sucesso.' : 'Estabelecimento criado com sucesso.');
      setOpen(false);
      await loadData();
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.message);
      } else {
        setError('Não foi possível salvar o estabelecimento.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja remover este estabelecimento?')) {
      return;
    }

    try {
      await request(`/api/estabelecimentos/${id}`, { method: 'DELETE' });
      setMessage('Estabelecimento removido com sucesso.');
      setError('');
      await loadData();
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.message);
      } else {
        setError('Não foi possível remover o estabelecimento.');
      }
    }
  };

  const getPublicBookingUrl = (item) => {
    if (!item?.slug) {
      return '';
    }

    return `${window.location.origin}/agendar/${item.slug}`;
  };

  const handleCopyLink = async (item) => {
    const url = getPublicBookingUrl(item);

    if (!url) {
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setMessage('Link exclusivo copiado.');
      setError('');
    } catch {
      setError(url);
    }
  };

  const getValidityChip = (item) => {
    if (item.status && item.status !== 'ativo') {
      return (
        <Chip
          size="small"
          color={item.status === 'suspenso' ? 'warning' : 'default'}
          icon={<WarningRoundedIcon />}
          label={item.status}
        />
      );
    }

    const dateValue = item.data_validade;

    if (!dateValue) {
      return <Chip size="small" variant="outlined" label="Sem data" />;
    }

    const current = new Date();
    current.setHours(0, 0, 0, 0);

    const target = new Date(`${dateValue}T00:00:00`);
    const diffDays = Math.ceil((target.getTime() - current.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return <Chip size="small" color="error" icon={<WarningRoundedIcon />} label="Vencido" />;
    }

    if (diffDays <= 30) {
      return <Chip size="small" color="warning" icon={<WarningRoundedIcon />} label="Próximo" />;
    }

    return <Chip size="small" color="success" icon={<CheckCircleRoundedIcon />} label="Ativo" />;
  };

  return (
    <Box>
      <PageHeader
        eyebrow="Cadastros"
        title="Estabelecimentos"
        description="Gerencie as unidades do sistema, credenciais de acesso e validade de uso."
        actions={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => handleOpen()}>
            Novo estabelecimento
          </Button>
        }
      />

      <Paper
        elevation={0}
        sx={{
          p: 0,
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(18px)',
          boxShadow: '0 24px 60px rgba(15, 23, 42, 0.08)',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${alpha('#94a3b8', 0.16)}` }}>
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
            <Chip icon={<BusinessRoundedIcon />} label={`${estabelecimentos.length} registros`} sx={{ fontWeight: 700 }} />
            <Chip icon={<CategoryRoundedIcon />} label="Segmento do negócio" sx={{ fontWeight: 700 }} />
            <Chip icon={<CalendarMonthRoundedIcon />} label="Validade contratual" sx={{ fontWeight: 700 }} />
            <Chip icon={<PlaceRoundedIcon />} label="Endereço e contatos" sx={{ fontWeight: 700 }} />
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
                field: 'empresa',
                label: 'Empresa',
                renderCell: (item) => item.empresa?.nome || empresas.find((empresa) => empresa.id === item.empresa_id)?.nome || '-',
              },
              {
                field: 'segmento',
                label: 'Segmento',
              },
              {
                field: 'data_validade',
                label: 'Validade',
                renderCell: (item) => formatDateBR(item.data_validade),
              },
              {
                field: 'status_operacional',
                label: 'Operação',
                renderCell: (item) => (
                  <Chip
                    size="small"
                    color={item.status === 'ativo' ? 'success' : item.status === 'suspenso' ? 'warning' : 'default'}
                    label={item.status || 'ativo'}
                    sx={{ fontWeight: 700 }}
                  />
                ),
              },
              {
                field: 'email',
                label: 'E-mail',
              },
              {
                field: 'link_publico',
                label: 'Link público',
                renderCell: (item) => (
                  <Stack direction="row" spacing={0.5}>
                    <IconButton size="small" color="primary" onClick={() => handleCopyLink(item)} title="Copiar link">
                      <ContentCopyRoundedIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="primary"
                      component="a"
                      href={getPublicBookingUrl(item)}
                      target="_blank"
                      rel="noreferrer"
                      title="Abrir link"
                    >
                      <OpenInNewRoundedIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                ),
              },
              {
                field: 'contatos',
                label: 'Contatos',
                renderCell: (item) => (
                  <Stack spacing={0.4}>
                    <Typography variant="body2">{item.email || '-'}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.telefone_contato || '-'} {item.whatsapp ? `| WhatsApp ${item.whatsapp}` : ''}
                    </Typography>
                  </Stack>
                ),
              },
              {
                field: 'endereco',
                label: 'Endereço',
                renderCell: (item) => (
                  <Typography variant="body2" sx={{ maxWidth: 320, whiteSpace: 'normal' }}>
                    {formatEstablishmentAddress(item) || '-'}
                  </Typography>
                ),
              },
              {
                field: 'status',
                label: 'Status',
                renderCell: (item) => getValidityChip(item),
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
            rows={estabelecimentos}
            loading={loading}
            loadingComponent={
              <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
              </Box>
            }
            emptyComponent={
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                  Nenhum estabelecimento cadastrado
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Crie a primeira unidade para liberar os cadastros de profissionais, serviços e agendas.
                </Typography>
              </Box>
            }
          />
        </Box>
      </Paper>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle>{editingItem ? 'Editar estabelecimento' : 'Novo estabelecimento'}</DialogTitle>
        <DialogContent dividers>
          <Box component="form" id="estabelecimento-form" onSubmit={handleSubmit}>
            <Grid container spacing={2.5}>
              {isGestor ? (
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    label="Empresa"
                    name="empresa_id"
                    value={form.empresa_id}
                    onChange={handleChange}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CorporateFareRoundedIcon color="primary" fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  >
                    <MenuItem value="">Selecione</MenuItem>
                    {empresas.map((empresa) => (
                      <MenuItem key={empresa.id} value={empresa.id}>
                        {empresa.nome} ({empresa.estabelecimentos_count || 0}/{empresa.limite_locais} locais)
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              ) : null}

              <Grid item xs={12} md={isGestor ? 6 : 12}>
                <TextField
                  label="Nome"
                  name="nome"
                  value={form.nome}
                  onChange={handleChange}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BusinessRoundedIcon color="primary" fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="Segmento"
                  name="segmento"
                  value={form.segmento}
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="">Selecione</MenuItem>
                  {segments.map((segment) => (
                    <MenuItem key={segment} value={segment}>
                      {segment}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="Status da unidade"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  required
                  helperText="Unidades inativas ou suspensas não aparecem para o cliente."
                >
                  <MenuItem value="ativo">Ativo</MenuItem>
                  <MenuItem value="inativo">Inativo</MenuItem>
                  <MenuItem value="suspenso">Suspenso</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Slug do link público"
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  helperText="Opcional. Se vazio, será gerado a partir do nome."
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Data de validade"
                  name="data_validade"
                  value={form.data_validade}
                  onChange={handleChange}
                  type="date"
                  required
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

              <Grid item xs={12} md={6}>
                <TextField
                  label="E-mail"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  type="email"
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailRoundedIcon color="primary" fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Telefone de contato"
                  name="telefone_contato"
                  value={form.telefone_contato}
                  onChange={handleChange}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneRoundedIcon color="primary" fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="WhatsApp"
                  name="whatsapp"
                  value={form.whatsapp}
                  onChange={handleChange}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <ChatRoundedIcon color="primary" fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="CEP"
                  name="cep"
                  value={form.cep}
                  onChange={handleChange}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PlaceRoundedIcon color="primary" fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={8}>
                <TextField
                  label="Logradouro"
                  name="logradouro"
                  value={form.logradouro}
                  onChange={handleChange}
                  required
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="Número"
                  name="numero"
                  value={form.numero}
                  onChange={handleChange}
                  required
                />
              </Grid>

              <Grid item xs={12} md={8}>
                <TextField
                  label="Complemento"
                  name="complemento"
                  value={form.complemento}
                  onChange={handleChange}
                  helperText="Opcional"
                />
              </Grid>

              <Grid item xs={12} md={5}>
                <TextField
                  label="Bairro"
                  name="bairro"
                  value={form.bairro}
                  onChange={handleChange}
                  required
                />
              </Grid>

              <Grid item xs={12} md={5}>
                <TextField
                  label="Cidade"
                  name="cidade"
                  value={form.cidade}
                  onChange={handleChange}
                  required
                />
              </Grid>

              <Grid item xs={12} md={2}>
                <TextField
                  select
                  label="UF"
                  name="estado"
                  value={form.estado}
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="">UF</MenuItem>
                  {states.map((state) => (
                    <MenuItem key={state} value={state}>
                      {state}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Senha"
                  name="senha"
                  value={form.senha}
                  onChange={handleChange}
                  type={showPassword ? 'text' : 'password'}
                  required={!editingItem}
                  helperText={editingItem ? 'Deixe em branco para manter a senha atual.' : 'Senha de acesso ao painel.'}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockRoundedIcon color="primary" fontSize="small" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword((current) => !current)} edge="end">
                          {showPassword ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
                        </IconButton>
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
          <Button
            type="submit"
            form="estabelecimento-form"
            variant="contained"
            disabled={saving}
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Estabelecimentos;
