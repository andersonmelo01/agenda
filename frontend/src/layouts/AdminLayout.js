import React, { useState } from 'react';
import { Link as RouterLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import CorporateFareOutlinedIcon from '@mui/icons-material/CorporateFareOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import MiscellaneousServicesOutlinedIcon from '@mui/icons-material/MiscellaneousServicesOutlined';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined';
import { getAuthUser, isAuthenticated, logout } from '../utils/auth';

const drawerWidth = 290;

const navigationItems = [
  { label: 'Dashboard', to: '/dashboard', icon: DashboardRoundedIcon },
  { label: 'Empresas', to: '/gestor/empresas', icon: CorporateFareOutlinedIcon, roles: ['gestor'] },
  { label: 'Planos', to: '/gestor/planos', icon: WorkspacePremiumOutlinedIcon, roles: ['gestor'] },
  { label: 'Estabelecimentos', to: '/estabelecimentos', icon: BusinessOutlinedIcon },
  { label: 'Profissionais', to: '/profissionais', icon: BadgeOutlinedIcon },
  { label: 'Especialidades', to: '/especialidades', icon: CategoryOutlinedIcon },
  { label: 'Serviços', to: '/servicos', icon: MiscellaneousServicesOutlinedIcon },
  { label: 'Agendas', to: '/agendas', icon: CalendarMonthOutlinedIcon },
  { label: 'Agendamentos', to: '/agendamentos', icon: EventNoteOutlinedIcon },
  { label: 'SMTP', to: '/admin/smtp', icon: EmailOutlinedIcon, roles: ['gestor'] },
];

function AdminLayout() {
  const theme = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const user = getAuthUser();
  const visibleNavigationItems = navigationItems.filter((item) => !item.roles || item.roles.includes(user?.role));

  const activeItem = visibleNavigationItems.find((item) => location.pathname.startsWith(item.to)) || visibleNavigationItems[0];

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(246,249,253,0.98) 100%)',
        color: theme.palette.text.primary,
      }}
    >
      <Box sx={{ p: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 3,
              display: 'grid',
              placeItems: 'center',
              background: alpha(theme.palette.primary.main, 0.08),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
              color: theme.palette.primary.main,
            }}
          >
            <CalendarMonthOutlinedIcon />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800}>
              Agenda Pro
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.role === 'gestor' ? 'Gestão do SaaS' : user?.empresa?.nome || 'Painel administrativo'}
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Divider sx={{ borderColor: alpha(theme.palette.divider, 0.8) }} />

      <List sx={{ px: 1.5, py: 2, flex: 1 }}>
        {visibleNavigationItems.map((item) => {
          const Icon = item.icon;
          const selected = location.pathname.startsWith(item.to);

          return (
            <ListItemButton
              key={item.to}
              component={RouterLink}
              to={item.to}
              selected={selected}
              onClick={() => setMobileOpen(false)}
              sx={{
                borderRadius: 3,
                mb: 0.75,
                color: theme.palette.text.secondary,
                '&.Mui-selected': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  color: theme.palette.primary.dark,
                },
                '&.Mui-selected:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.12),
                },
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.04),
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          );
        })}
      </List>

      <Box sx={{ p: 2.5 }}>
        <Box
          sx={{
            p: 2,
            borderRadius: 3,
            background: 'linear-gradient(180deg, rgba(15,118,110,0.05), rgba(37,99,235,0.03))',
            border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
          }}
        >
          <Stack spacing={1.2}>
            <Chip
              label={isAuthenticated() ? 'Sessão ativa' : 'Conecte-se'}
              size="small"
              sx={{
                alignSelf: 'flex-start',
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                color: theme.palette.primary.dark,
                fontWeight: 700,
              }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              {user?.role === 'gestor'
                ? 'Gerencie empresas, planos, unidades e configurações globais do SaaS.'
                : 'Gerencie a operação diária da sua empresa com agenda e confirmações.'}
            </Typography>
            <Button
              component={RouterLink}
              to="/estabelecimentos"
              variant="outlined"
              startIcon={<PublicOutlinedIcon />}
              sx={{
                mt: 1,
                borderColor: alpha(theme.palette.divider, 0.9),
                color: theme.palette.text.primary,
                justifyContent: 'flex-start',
                '&:hover': {
                  borderColor: alpha(theme.palette.primary.main, 0.28),
                  backgroundColor: alpha(theme.palette.primary.main, 0.04),
                },
              }}
            >
              Links públicos
            </Button>
            <Button
              onClick={handleLogout}
              variant="contained"
              startIcon={<LogoutOutlinedIcon />}
              sx={{
                mt: 1,
                backgroundColor: theme.palette.primary.main,
                boxShadow: '0 10px 24px rgba(15, 118, 110, 0.16)',
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                },
              }}
            >
              Sair
            </Button>
          </Stack>
        </Box>
      </Box>
    </Box>
  );

  return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          background:
            'radial-gradient(circle at top left, rgba(45, 212, 191, 0.08), transparent 26%), radial-gradient(circle at top right, rgba(37, 99, 235, 0.08), transparent 30%), linear-gradient(180deg, #f8fbfe 0%, #eef4fb 100%)',
        }}
      >
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          backgroundColor: alpha(theme.palette.background.paper, 0.9),
          backdropFilter: 'blur(16px)',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.65)}`,
          color: theme.palette.text.primary,
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ minHeight: 68, gap: 1.5 }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen((open) => !open)}
            sx={{ display: { xs: 'inline-flex', md: 'none' } }}
          >
            <MenuRoundedIcon />
          </IconButton>

          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 3,
                display: 'grid',
                placeItems: 'center',
                background: alpha(theme.palette.primary.main, 0.08),
                color: theme.palette.primary.main,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
              }}
            >
              <CalendarMonthOutlinedIcon />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight={800} noWrap>
                {activeItem.label}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                Painel administrativo do Agenda Pro
              </Typography>
            </Box>
          </Stack>

          <Chip
            label={user?.role === 'gestor' ? 'Gestor' : 'Admin'}
            sx={{
              display: { xs: 'none', sm: 'inline-flex' },
              fontWeight: 700,
              backgroundColor: alpha(theme.palette.primary.main, 0.08),
              color: theme.palette.primary.dark,
            }}
          />

          <Button
            component={RouterLink}
            to="/estabelecimentos"
            variant="text"
            startIcon={<PublicOutlinedIcon />}
            sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
          >
            Links
          </Button>

          <Button
            onClick={handleLogout}
            variant="contained"
            startIcon={<LogoutOutlinedIcon />}
            sx={{
              display: { xs: 'none', sm: 'inline-flex' },
              backgroundColor: theme.palette.primary.main,
              boxShadow: '0 10px 24px rgba(15, 118, 110, 0.16)',
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
              },
            }}
          >
            Sair
          </Button>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
          }}
        >
          {drawerContent}
        </Drawer>

        <Drawer
          variant="permanent"
          open
          sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: `1px solid ${alpha(theme.palette.divider, 0.65)}`,
            backgroundColor: alpha(theme.palette.background.paper, 0.96),
            boxShadow: '8px 0 30px rgba(15, 23, 42, 0.04)',
          },
        }}
      >
        {drawerContent}
      </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          pt: 9,
          px: { xs: 2, sm: 3, md: 4 },
          pb: 4,
        }}
      >
        <Toolbar sx={{ display: { xs: 'block', md: 'none' }, minHeight: 0, p: 0 }} />
        <Outlet />
      </Box>
    </Box>
  );
}

export default AdminLayout;
