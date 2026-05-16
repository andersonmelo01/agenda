import { alpha, createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0f766e',
      dark: '#115e59',
      light: '#2dd4bf',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#2563eb',
      dark: '#1d4ed8',
      light: '#60a5fa',
    },
    background: {
      default: '#f6f9fd',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#475569',
    },
    success: {
      main: '#16a34a',
    },
    warning: {
      main: '#d97706',
    },
    error: {
      main: '#dc2626',
    },
  },
  shape: {
    borderRadius: 18,
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Segoe UI", sans-serif',
    h1: { fontWeight: 800, letterSpacing: -1.2 },
    h2: { fontWeight: 800, letterSpacing: -0.9 },
    h3: { fontWeight: 800, letterSpacing: -0.7 },
    h4: { fontWeight: 800, letterSpacing: -0.5 },
    h5: { fontWeight: 700, letterSpacing: -0.3 },
    h6: { fontWeight: 700 },
    button: {
      textTransform: 'none',
      fontWeight: 700,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background:
            'radial-gradient(circle at top left, rgba(45, 212, 191, 0.08), transparent 30%), radial-gradient(circle at top right, rgba(37, 99, 235, 0.08), transparent 34%), linear-gradient(180deg, #fbfdff 0%, #eef4fb 100%)',
          color: '#0f172a',
        },
        a: {
          color: 'inherit',
          textDecoration: 'none',
        },
        '::selection': {
          backgroundColor: alpha('#0f766e', 0.16),
          color: '#0f172a',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          border: `1px solid ${alpha('#94a3b8', 0.14)}`,
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        fullWidth: true,
        variant: 'outlined',
        size: 'small',
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 14,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 24,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: alpha('#0f766e', 0.035),
        },
      },
    },
  },
});

export default theme;
