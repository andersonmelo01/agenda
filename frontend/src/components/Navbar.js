import React from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  Chip,
  Container,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import { getAuthUser, isAuthenticated, logout } from '../utils/auth';

function Navbar() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();
  const authenticated = isAuthenticated();
  const user = getAuthUser();
  const isAdmin = ['admin', 'gestor'].includes(user?.role);
  const isClient = authenticated && !isAdmin;
  const hideStartButton = location.pathname === '/login';

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: alpha(theme.palette.background.paper, 0.88),
        backdropFilter: 'blur(14px)',
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.65)}`,
        color: theme.palette.text.primary,
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ minHeight: 68, gap: 1.5 }}>
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2.5,
                display: 'grid',
                placeItems: 'center',
                background: alpha(theme.palette.primary.main, 0.08),
                color: theme.palette.primary.main,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                flex: '0 0 auto',
              }}
            >
              <CalendarMonthRoundedIcon fontSize="small" />
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                component={RouterLink}
                to="/"
                variant="h6"
                fontWeight={800}
                sx={{
                  display: 'inline-flex',
                  gap: 1,
                  lineHeight: 1,
                }}
              >
                Kyonix
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                Estabelecimento, serviços e horários em um só lugar
              </Typography>
            </Box>
          </Stack>

          <Chip
            icon={<HomeRoundedIcon />}
            label="Atendimento online"
            sx={{
              display: { xs: 'none', md: 'inline-flex' },
              backgroundColor: alpha(theme.palette.primary.main, 0.06),
              color: theme.palette.primary.dark,
              fontWeight: 700,
            }}
          />

          <Stack direction="row" spacing={1} alignItems="center">
            {!hideStartButton ? (
              <Button
                component={RouterLink}
                to={isClient ? '/minha-area' : '/'}
                variant="text"
                startIcon={isClient ? <EventNoteRoundedIcon /> : <HomeRoundedIcon />}
                sx={{ minWidth: { xs: 'auto', sm: 0 }, px: { xs: 1.25, sm: 1.75 } }}
              >
                {isClient ? 'Histórico' : 'Início'}
              </Button>
            ) : null}

            {!authenticated ? (
              <Button
                component={RouterLink}
                to="/login"
                variant="outlined"
                startIcon={<LoginRoundedIcon />}
                sx={{
                  borderColor: alpha(theme.palette.divider, 0.8),
                  color: theme.palette.text.primary,
                  '&:hover': {
                    borderColor: alpha(theme.palette.primary.main, 0.4),
                    backgroundColor: alpha(theme.palette.primary.main, 0.04),
                  },
                }}
                >
                  {isMobile ? 'Entrar' : 'Entrar'}
                </Button>
              ) : (
              <>
                {isAdmin ? (
                  <Button
                    component={RouterLink}
                    to="/dashboard"
                    variant="contained"
                    startIcon={<DashboardRoundedIcon />}
                    sx={{
                      backgroundColor: theme.palette.primary.main,
                      boxShadow: '0 10px 24px rgba(15, 118, 110, 0.16)',
                      '&:hover': {
                        backgroundColor: theme.palette.primary.dark,
                      },
                    }}
                  >
                    Área restrita
                  </Button>
                ) : null}

                <Button
                  onClick={handleLogout}
                  variant="outlined"
                  startIcon={<LogoutRoundedIcon />}
                  sx={
                    isAdmin
                      ? {
                          borderColor: alpha(theme.palette.divider, 0.7),
                          display: { xs: 'none', sm: 'inline-flex' },
                        }
                      : {
                          borderColor: alpha(theme.palette.divider, 0.7),
                          '&:hover': {
                            borderColor: alpha(theme.palette.primary.main, 0.4),
                            backgroundColor: alpha(theme.palette.primary.main, 0.04),
                          },
                        }
                  }
                >
                  Sair
                </Button>
              </>
            )}
          </Stack>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default Navbar;
