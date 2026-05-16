# Documentação do Frontend

## Visão Geral

O frontend é uma aplicação React 18 com Material-UI v9, utilizando roteamento com React Router v7. A aplicação é totalmente responsiva e otimizada para dispositivos móveis.

## Atualização SaaS Multiempresa

Rotas principais atualizadas:

| Rota | Uso |
|------|-----|
| `/` | Home institucional profissional do Kyonix Agenda |
| `/login` | Login de cliente para agendamento |
| `/admin-login` | Acesso discreto ao painel restrito do gestor/admin |
| `/agendar/:estabelecimentoSlug` | Link obrigatório e exclusivo de um estabelecimento/local |
| `/gestor/empresas` | Gestão de empresas, plano, limite de locais e mensalidade |
| `/gestor/planos` | Gestão dos planos Start e Pro |

Comportamento do link exclusivo:

- A página `AgendamentoPublico` lê `estabelecimentoSlug` pela URL.
- Busca apenas `/api/public/estabelecimentos/{slug}`.
- Pré-seleciona o estabelecimento e oculta o seletor de locais.
- Serviços, profissionais e agendas passam a ser carregados somente para aquele `estabelecimento_id`.

Menu administrativo:

- Usuário `gestor` vê Empresas, Planos, Estabelecimentos, Profissionais, Serviços, Agendas, Agendamentos e SMTP.
- Usuário `admin` vê apenas a operação da própria empresa.
- A Home mantém o link do gestor no rodapé como `Área restrita`, sem destaque visual.

## Estrutura de Arquivos

```
frontend/src/
├── components/           # Componentes reutilizáveis
│   ├── Background.js    # Fundo decorativo com gradientes
│   ├── Card.js          # Wrapper de cartão
│   ├── Navbar.js        # Barra de navegação superior
│   ├── PageHeader.js    # Cabeçalho de página com título/breadcrumb
│   ├── PrivateRoute.js  # Guarda de rota com autenticação
│   ├── ResponsiveTable.js # Tabela responsiva para mobile
│   └── StyledInput.js   # Input customizado
├── layouts/             # Layouts da aplicação
│   ├── AdminLayout.js   # Layout admin com drawer lateral
│   └── PublicLayout.js  # Layout público com navbar
├── pages/               # Páginas/componentes de rota
│   ├── AdminLogin.js    # Login de administrador
│   ├── AdminSmtpConfig.js # Configuração de SMTP
│   ├── AgendamentoPublico.js # Sistema de agendamento público
│   ├── Agendamentos.js  # Lista de agendamentos (admin)
│   ├── Agendas.js       # CRUD de agendas
│   ├── Dashboard.js     # Dashboard administrativo
│   ├── Especialidades.js # CRUD de especialidades
│   ├── Estabelecimentos.js # CRUD de estabelecimentos
│   ├── Home.js          # Página inicial
│   ├── Login.js         # Login de cliente
│   ├── Profissionais.js # CRUD de profissionais
│   └── Servicos.js      # CRUD de serviços
├── styles/              # Estilos globais e tema
│   ├── global.css       # CSS variables e gradientes
│   ├── theme.js         # Configuração MUI theme
│   └── [page].css       # Estilos específicos de página
├── utils/               # Utilitários
│   ├── api.js           # Cliente HTTP com autenticação
│   ├── auth.js          # Gerenciamento de autenticação
│   └── formatters.js    # Formatadores de data/moeda/telefone
├── App.js               # Componente raiz com roteamento
└── index.js             # Ponto de entrada React
```

## Tema e Design System

### Configuração do Tema (theme.js)

```javascript
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0f766e', // Teal
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#2563eb', // Blue
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 18, // Bordas arredondadas
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
});

export default theme;
```

### Variáveis CSS Globais (global.css)

```css
:root {
  --primary-color: #0f766e;
  --secondary-color: #2563eb;
  --success-color: #10b981;
  --error-color: #ef4444;
  --warning-color: #f59e0b;
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --background-primary: #f8fafc;
  --background-secondary: #ffffff;
  --border-color: #e5e7eb;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --border-radius: 18px;
}

.gradient-bg {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
}

.gradient-text {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

## Componentes Principais

### 1. PrivateRoute

**Arquivo:** `components/PrivateRoute.js`

Componente de guarda de rota que verifica autenticação e roles.

```javascript
// Uso básico (cliente logado pelo link exclusivo)
<Route element={<PrivateRoute />}>
  <Route path="/agendar/:estabelecimentoSlug" element={<AgendamentoPublico />} />
</Route>

// Uso com roles específicos
<Route element={<PrivateRoute allowedRoles={['admin', 'gestor']} />}>
  <Route element={<AdminLayout />}>
    <Route path="/dashboard" element={<Dashboard />} />
  </Route>
</Route>
```

**Props:**
- `allowedRoles`: Array de roles permitidos (opcional)
- `redirectTo`: Rota de redirecionamento se não autorizado (padrão: '/login')

### 2. ResponsiveTable

**Arquivo:** `components/ResponsiveTable.js`

Tabela responsiva que se transforma em cards no mobile.

```javascript
<ResponsiveTable
  columns={[
    { key: 'nome', label: 'Nome', sortable: true },
    { key: 'email', label: 'E-mail' },
    { key: 'telefone', label: 'Telefone', format: formatPhone }
  ]}
  data={profissionais}
  onEdit={handleEdit}
  onDelete={handleDelete}
  loading={loading}
/>
```

**Props:**
- `columns`: Array de definições de coluna
- `data`: Array de dados
- `onEdit/onDelete`: Callbacks para ações
- `loading`: Estado de carregamento
- `emptyMessage`: Mensagem quando não há dados

### 3. AdminLayout

**Arquivo:** `layouts/AdminLayout.js`

Layout principal para páginas administrativas com drawer lateral.

**Features:**
- Drawer responsivo (temporário no mobile, permanente no desktop)
- Header com toggle do drawer
- Menu de navegação lateral
- Área de conteúdo principal
- Logout no menu

**Estrutura do Menu:**
```javascript
const menuItems = [
  { text: 'Dashboard', icon: DashboardIcon, path: '/dashboard' },
  { text: 'Estabelecimentos', icon: BusinessIcon, path: '/estabelecimentos' },
  { text: 'Profissionais', icon: PeopleIcon, path: '/profissionais' },
  { text: 'Especialidades', icon: CategoryIcon, path: '/especialidades' },
  { text: 'Serviços', icon: WorkIcon, path: '/servicos' },
  { text: 'Agendas', icon: ScheduleIcon, path: '/agendas' },
  { text: 'Agendamentos', icon: EventIcon, path: '/agendamentos' },
  { text: 'Config. E-mail', icon: EmailIcon, path: '/admin/smtp' },
];
```

## Utilitários

### 1. API Client (api.js)

Cliente HTTP centralizado com autenticação automática.

```javascript
// Função principal
export async function request(endpoint, options = {}) {
  const config = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Injeção automática do token
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Execução da requisição
  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  // Tratamento de erros
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.message || `HTTP ${response.status}`,
      response.status,
      errorData.errors
    );
  }

  return response.json();
}

// Uso
import { request } from '../utils/api';

// GET
const data = await request('/profissionais');

// POST
const newProfissional = await request('/profissionais', {
  method: 'POST',
  body: JSON.stringify(profissionalData)
});
```

### 2. Auth Utils (auth.js)

Gerenciamento de autenticação e sessão.

```javascript
// Armazenamento
export function setAuthToken(token) {
  localStorage.setItem('token', token);
}

export function getAuthToken() {
  return localStorage.getItem('token');
}

export function setAuthUser(user) {
  localStorage.setItem('user', JSON.stringify(user));
}

export function getAuthUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

// Verificações
export function isAuthenticated() {
  return !!getAuthToken() && !!getAuthUser();
}

export function hasRole(role) {
  const user = getAuthUser();
  return user && user.role === role;
}

// Logout
export async function logout() {
  try {
    await request('/logout', { method: 'POST' });
  } catch (error) {
    console.warn('Logout API failed:', error);
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}
```

### 3. Formatters (formatters.js)

Funções de formatação para exibição de dados.

```javascript
// Telefone brasileiro
export function formatPhone(phone) {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{2})(\d{4,5})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
}

// Moeda brasileira
export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// Data brasileira
export function formatDateBR(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('pt-BR');
}

// Horário
export function formatTimeValue(time) {
  if (!time) return '';
  return time.substring(0, 5); // HH:MM
}
```

## Páginas Principais

### 1. Agendamento Público (AgendamentoPublico.js)

Sistema de agendamento com filtros em cascata.

**Fluxo:**
1. Selecionar Estabelecimento
2. Selecionar Serviço (filtra profissionais relacionados)
3. Selecionar Profissional
4. Selecionar Data
5. Selecionar Horário disponível
6. Confirmar agendamento

**Estado:**
```javascript
const [formData, setFormData] = useState({
  estabelecimento: '',
  servico: '',
  profissional: '',
  data: '',
  horario: '',
  email_cliente: ''
});
```

### 2. CRUD de Agendas (Agendas.js)

Interface para criação de agendas com múltiplos intervalos.

**Features:**
- Formulário com campos dinâmicos para intervalos
- Validação de conflitos de horário
- Tabela responsiva mostrando intervalos
- Integração com API de horários disponíveis

**Estrutura do Form:**
```javascript
const [form, setForm] = useState({
  profissional_id: '',
  servico_id: '',
  data: '',
  intervalo_minutos: 30,
  intervalos: [{ inicio: '', fim: '' }]
});
```

### 3. Dashboard (Dashboard.js)

Dashboard administrativo com estatísticas.

**Métricas:**
- Total de estabelecimentos
- Total de profissionais
- Total de serviços
- Total de agendas
- Total de agendamentos

**Cards de Ação Rápida:**
- Links para CRUDs principais
- Botões de atalho para ações comuns

## Roteamento (App.js)

```javascript
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          {/* Públicas */}
          <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
          <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
          <Route path="/admin/login" element={<PublicLayout><AdminLogin /></PublicLayout>} />

          {/* Cliente logado */}
          <Route element={<PrivateRoute />}>
            <Route path="/agendar/:estabelecimentoSlug" element={<PublicLayout><AgendamentoPublico /></PublicLayout>} />
          </Route>

          {/* Admin/Gestor */}
          <Route element={<PrivateRoute allowedRoles={['admin', 'gestor']} />}>
            <Route element={<AdminLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/estabelecimentos" element={<Estabelecimentos />} />
              <Route path="/profissionais" element={<Profissionais />} />
              <Route path="/especialidades" element={<Especialidades />} />
              <Route path="/servicos" element={<Servicos />} />
              <Route path="/agendas" element={<Agendas />} />
              <Route path="/agendamentos" element={<Agendamentos />} />
              <Route path="/admin/smtp" element={<AdminSmtpConfig />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
```

## Estados e Gerenciamento

### Estados Locais (useState)

Cada página gerencia seu próprio estado local:
- Formulários: `formData`, `errors`, `loading`
- Listas: `data`, `loading`, `page`, `search`
- Modais: `openDialog`, `selectedItem`

### Estados Globais

Atualmente não há estado global complexo. A autenticação é gerenciada via localStorage e utilitários.

## Tratamento de Erros

### ApiError Class

Classe customizada para erros da API:

```javascript
export class ApiError extends Error {
  constructor(message, status, errors = {}) {
    super(message);
    this.status = status;
    this.errors = errors;
    this.name = 'ApiError';
  }
}
```

### Tratamento em Componentes

```javascript
const [error, setError] = useState('');
const [fieldErrors, setFieldErrors] = useState({});

try {
  await request('/endpoint', { method: 'POST', body: JSON.stringify(data) });
  // Sucesso
} catch (err) {
  if (err instanceof ApiError) {
    setError(err.message);
    setFieldErrors(err.errors);
  } else {
    setError('Erro inesperado');
  }
}
```

## Responsividade

### Breakpoints

- **xs**: 0-600px (mobile)
- **sm**: 600-900px (tablet)
- **md**: 900-1200px (desktop pequeno)
- **lg**: 1200-1536px (desktop)
- **xl**: 1536px+ (desktop grande)

### Padrões de Responsividade

1. **AdminLayout**: Drawer temporário no mobile
2. **ResponsiveTable**: Cards no mobile, tabela no desktop
3. **Formulários**: Campos em coluna única no mobile
4. **Navbar**: Menu hamburger no mobile

## Performance

### Otimizações Implementadas

1. **Lazy Loading**: Componentes carregados sob demanda
2. **Memoização**: useMemo para cálculos pesados
3. **Debounced Search**: Busca atrasada para evitar requests excessivos
4. **Loading States**: Feedback visual durante operações assíncronas

### Bundle Analysis

```bash
npm install --save-dev webpack-bundle-analyzer
npm run build -- --analyze
```

## Testes

### Configuração de Testes

```javascript
// src/setupTests.js
import '@testing-library/jest-dom';

// Mock de API
global.fetch = jest.fn();
```

### Exemplo de Teste

```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from './Login';

test('login form submission', async () => {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({ access_token: 'token', user: { name: 'Test' } })
  });

  render(
    <BrowserRouter>
      <Login />
    </BrowserRouter>
  );

  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: 'test@example.com' }
  });
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: 'password' }
  });
  fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password'
        })
      })
    );
  });
});
```

## Build e Deploy

### Build de Produção

```bash
npm run build
```

Gera arquivos otimizados em `build/`:
- `index.html`
- `static/js/*.js` (chunks code-split)
- `static/css/*.css`
- `manifest.json`

### Variáveis de Ambiente

```javascript
// .env.production
REACT_APP_API_URL=https://api.agenda.com
REACT_APP_VERSION=1.0.0
```

### Deploy no Apache/Nginx

```apache
# .htaccess
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QSA,L]
```

## Considerações de Desenvolvimento

### Padrões de Código

1. **Nomenclatura**: camelCase para variáveis/funções, PascalCase para componentes
2. **Estrutura**: Componentes em arquivos separados, hooks customizados
3. **Estilos**: CSS-in-JS com MUI, variáveis CSS para cores globais
4. **Estado**: useState para estado local, localStorage para persistência

### Debugging

```javascript
// Debug de estado
useEffect(() => {
  console.log('Form state:', formData);
}, [formData]);

// Debug de API calls
const debugRequest = (endpoint, options) => {
  console.log('API Call:', endpoint, options);
  return request(endpoint, options);
};
```

### Ferramentas de Desenvolvimento

- **React DevTools**: Inspeção de componentes
- **Redux DevTools**: (se usado no futuro)
- **Lighthouse**: Auditoria de performance
- **ESLint**: Linting de código
- **Prettier**: Formatação automática
