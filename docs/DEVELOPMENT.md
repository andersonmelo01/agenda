# Guia de Desenvolvimento

## Atualização SaaS Multiempresa

Fluxo recomendado para desenvolvimento:

1. Rode `php artisan migrate`.
2. Rode `php artisan db:seed --class=DatabaseSeeder`.
3. Acesse `/admin-login` com `admin@sistema.com` e senha `010200`.
4. Cadastre ou ajuste planos em `/gestor/planos`.
5. Cadastre empresas em `/gestor/empresas`.
6. Cadastre estabelecimentos/locais e copie o link exclusivo gerado na tela de Estabelecimentos.

Regras importantes ao codar:

- Nunca consultar dados administrativos sem escopo de empresa para usuários `admin`.
- `gestor` pode ver tudo; `admin` deve ficar limitado a `users.empresa_id`.
- Links públicos devem usar endpoints `/api/public/...`.
- O link `/agendar/{slug}` deve mostrar apenas o estabelecimento do slug.
- Antes de entregar alterações, rode:

```bash
cd backend
php artisan test

cd ../frontend
npm run build
```

## Introdução

Este guia fornece instruções detalhadas para desenvolvedores que trabalham no Sistema de Agendamento. Aqui você encontrará informações sobre configuração do ambiente, fluxo de desenvolvimento, padrões de código e melhores práticas.

## 🚀 Configuração do Ambiente

### Pré-requisitos

1. **PHP 8.1+** com extensões:
   - `pdo`
   - `mbstring`
   - `openssl`
   - `tokenizer`

2. **Composer** (gerenciador de dependências PHP)

3. **Node.js 16+** e **npm**

4. **MySQL 5.7+** ou **MariaDB 10.3+**

5. **XAMPP** (recomendado para desenvolvimento local)

### Instalação

#### 1. Clonagem do Repositório

```bash
git clone <repository-url>
cd agenda
```

#### 2. Backend (Laravel)

```bash
cd backend

# Instalar dependências
composer install

# Copiar arquivo de configuração
cp .env.example .env

# Gerar chave da aplicação
php artisan key:generate

# Configurar banco de dados no .env
# DB_DATABASE=agenda
# DB_USERNAME=root
# DB_PASSWORD=

# Executar migrations
php artisan migrate

# (Opcional) Popular com dados de exemplo
php artisan db:seed
```

#### 3. Frontend (React)

```bash
cd ../frontend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# REACT_APP_API_URL=http://localhost:8000
```

### Executando o Sistema

#### Desenvolvimento

```bash
# Terminal 1: Backend
cd backend
php artisan serve --host=127.0.0.1 --port=8000

# Terminal 2: Frontend
cd frontend
npm start
```

Acesse:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:8000

#### Produção

```bash
# Build do frontend
cd frontend
npm run build

# Servir arquivos estáticos via Apache/Nginx
```

## 📁 Estrutura do Projeto

```
agenda/
├── backend/                    # Laravel API
│   ├── app/
│   │   ├── Models/            # Modelos Eloquent
│   │   ├── Http/Controllers/  # Controladores da API
│   │   ├── Mail/             # Classes de e-mail
│   │   └── Support/          # Utilitários
│   ├── database/migrations/  # Migrations do banco
│   ├── routes/api.php        # Definição de rotas
│   └── config/               # Configurações Laravel
│
├── frontend/                  # React SPA
│   ├── src/
│   │   ├── components/       # Componentes reutilizáveis
│   │   ├── pages/           # Páginas da aplicação
│   │   ├── layouts/         # Layouts (Admin/Public)
│   │   ├── utils/           # Utilitários
│   │   └── styles/          # Tema e estilos
│   └── public/              # Assets estáticos
│
└── docs/                     # Documentação
    ├── API.md               # Documentação da API
    ├── DATABASE.md          # Documentação do banco
    ├── FRONTEND.md          # Documentação do frontend
    └── DEVELOPMENT.md       # Este arquivo
```

## 🔧 Fluxo de Desenvolvimento

### 1. Criando uma Nova Feature

#### Backend

1. **Criar Migration** (se necessário)
```bash
php artisan make:migration create_nova_tabela_table
```

2. **Criar Model**
```bash
php artisan make:model NovaTabela
```

3. **Criar Controller**
```bash
php artisan make:controller NovaTabelaController --api
```

4. **Definir Rotas** em `routes/api.php`
```php
Route::apiResource('nova-tabela', NovaTabelaController::class);
```

5. **Implementar Lógica** no Controller
```php
public function store(Request $request)
{
    $validated = $request->validate([
        'nome' => 'required|string|max:255',
        'email' => 'required|email|unique:nova_tabela'
    ]);

    $item = NovaTabela::create($validated);

    return response()->json($item, 201);
}
```

#### Frontend

1. **Criar Página/Componente**
```bash
# Criar arquivo em src/pages/NovaFeature.js
```

2. **Implementar Componente**
```javascript
import React, { useState, useEffect } from 'react';
import { request } from '../utils/api';

function NovaFeature() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const result = await request('/nova-feature');
      setData(result);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Nova Feature</h1>
      {loading ? (
        <p>Carregando...</p>
      ) : (
        <ul>
          {data.map(item => (
            <li key={item.id}>{item.nome}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default NovaFeature;
```

3. **Adicionar Rota** em `App.js`
```javascript
import NovaFeature from './pages/NovaFeature';

// Dentro do Routes
<Route element={<PrivateRoute allowedRoles={['admin', 'gestor']} />}>
  <Route element={<AdminLayout />}>
    <Route path="/nova-feature" element={<NovaFeature />} />
  </Route>
</Route>
```

4. **Adicionar ao Menu** em `AdminLayout.js`
```javascript
const menuItems = [
  // ... outros items
  { text: 'Nova Feature', icon: SomeIcon, path: '/nova-feature' },
];
```

### 2. Trabalhando com Formulários

#### Padrão de Formulário React

```javascript
import React, { useState } from 'react';
import { TextField, Button, Box } from '@mui/material';
import { request } from '../utils/api';

function CreateForm() {
  const [formData, setFormData] = useState({
    nome: '',
    email: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpar erro do campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      await request('/endpoint', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      // Sucesso - redirecionar ou mostrar mensagem
      alert('Criado com sucesso!');

      // Reset form
      setFormData({
        nome: '',
        email: ''
      });

    } catch (error) {
      if (error.errors) {
        setErrors(error.errors);
      } else {
        alert('Erro: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <TextField
        fullWidth
        label="Nome"
        name="nome"
        value={formData.nome}
        onChange={handleChange}
        error={!!errors.nome}
        helperText={errors.nome}
        margin="normal"
        required
      />

      <TextField
        fullWidth
        label="E-mail"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        error={!!errors.email}
        helperText={errors.email}
        margin="normal"
        required
      />

      <Button
        type="submit"
        variant="contained"
        disabled={loading}
        sx={{ mt: 2 }}
      >
        {loading ? 'Salvando...' : 'Salvar'}
      </Button>
    </Box>
  );
}
```

### 3. Trabalhando com Tabelas

#### Usando ResponsiveTable

```javascript
import React, { useState, useEffect } from 'react';
import { Button, Box } from '@mui/material';
import { request } from '../utils/api';
import ResponsiveTable from '../components/ResponsiveTable';

function DataTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const result = await request('/endpoint');
      setData(result);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    // Lógica de edição
    console.log('Editar:', item);
  };

  const handleDelete = async (item) => {
    if (window.confirm('Tem certeza que deseja excluir?')) {
      try {
        await request(`/endpoint/${item.id}`, {
          method: 'DELETE'
        });
        // Recarregar dados
        loadData();
      } catch (error) {
        alert('Erro ao excluir: ' + error.message);
      }
    }
  };

  const columns = [
    { key: 'nome', label: 'Nome', sortable: true },
    { key: 'email', label: 'E-mail' },
    {
      key: 'created_at',
      label: 'Data de Criação',
      format: (value) => new Date(value).toLocaleDateString('pt-BR')
    }
  ];

  return (
    <Box>
      <ResponsiveTable
        columns={columns}
        data={data}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        emptyMessage="Nenhum item encontrado"
      />
    </Box>
  );
}
```

## 📋 Padrões de Código

### Backend (Laravel)

#### Nomenclatura
- **Models**: PascalCase (ex: `User`, `Estabelecimento`)
- **Controllers**: PascalCase + `Controller` (ex: `UserController`)
- **Migrations**: snake_case (ex: `create_users_table`)
- **Routes**: kebab-case (ex: `api/users`)

#### Estrutura de Controller

```php
<?php

namespace App\Http\Controllers;

use App\Models\ModelName;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ModelNameController extends Controller
{
    public function index(): JsonResponse
    {
        $items = ModelName::all();
        return response()->json($items);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'field' => 'required|rule',
        ]);

        $item = ModelName::create($validated);

        return response()->json($item, 201);
    }

    public function show(ModelName $modelName): JsonResponse
    {
        return response()->json($modelName);
    }

    public function update(Request $request, ModelName $modelName): JsonResponse
    {
        $validated = $request->validate([
            'field' => 'required|rule',
        ]);

        $modelName->update($validated);

        return response()->json($modelName);
    }

    public function destroy(ModelName $modelName): JsonResponse
    {
        $modelName->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }
}
```

#### Validação

```php
public function store(Request $request)
{
    $validated = $request->validate([
        'nome' => 'required|string|max:255',
        'email' => 'required|email|unique:users,email',
        'senha' => 'required|string|min:8|confirmed',
        'data_validade' => 'required|date|after:today',
        'preco' => 'required|numeric|min:0|max:999999.99',
    ]);

    // Usar dados validados
    $user = User::create($validated);
}
```

### Frontend (React)

#### Nomenclatura
- **Componentes**: PascalCase (ex: `UserForm`, `DataTable`)
- **Funções**: camelCase (ex: `handleSubmit`, `loadData`)
- **Variáveis**: camelCase (ex: `userData`, `isLoading`)
- **Arquivos**: PascalCase (ex: `UserForm.js`, `ApiService.js`)

#### Estrutura de Componente

```javascript
import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';

function MyComponent({ prop1, prop2 }) {
  // Estados
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Efeitos
  useEffect(() => {
    loadData();
  }, []);

  // Funções
  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await request('/endpoint');
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = () => {
    // Lógica da ação
  };

  // Render
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Título da Página
      </Typography>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {/* Conteúdo */}
    </Box>
  );
}

export default MyComponent;
```

#### Hooks Customizados

```javascript
// useApi.js - Hook para API calls
import { useState, useCallback } from 'react';
import { request } from '../utils/api';

export function useApi(endpoint) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const execute = useCallback(async (options = {}) => {
    setLoading(true);
    setError('');

    try {
      const result = await request(endpoint, options);
      setData(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  return { data, loading, error, execute };
}
```

## 🧪 Testes

### Backend (PHPUnit)

```bash
# Executar todos os testes
php artisan test

# Executar teste específico
php artisan test --filter=UserTest

# Criar novo teste
php artisan make:test UserTest
```

#### Exemplo de Teste

```php
<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register()
    {
        $userData = [
            'name' => 'João Silva',
            'email' => 'joao@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ];

        $response = $this->postJson('/api/register', $userData);

        $response->assertStatus(201)
                ->assertJsonStructure([
                    'access_token',
                    'user' => ['id', 'name', 'email']
                ]);

        $this->assertDatabaseHas('users', [
            'email' => 'joao@example.com',
            'name' => 'João Silva',
        ]);
    }
}
```

### Frontend (Jest + React Testing Library)

```bash
# Executar testes
npm test

# Executar testes uma vez
npm run test:ci

# Testes com coverage
npm test -- --coverage
```

#### Exemplo de Teste

```javascript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from './Login';

// Mock da API
jest.mock('../utils/api', () => ({
  request: jest.fn()
}));

const mockRequest = require('../utils/api').request;

describe('Login Component', () => {
  beforeEach(() => {
    mockRequest.mockClear();
  });

  test('renders login form', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  test('submits login form successfully', async () => {
    const mockUser = { id: 1, name: 'João', email: 'joao@example.com' };
    mockRequest.mockResolvedValueOnce({
      access_token: 'token123',
      user: mockUser
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/e-mail/i), {
      target: { value: 'joao@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/senha/i), {
      target: { value: 'password123' }
    });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(mockRequest).toHaveBeenCalledWith('/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'joao@example.com',
          password: 'password123'
        })
      });
    });
  });
});
```

## 🔍 Debugging

### Backend

#### Logs do Laravel

```bash
# Ver logs em tempo real
tail -f backend/storage/logs/laravel.log

# Logs por nível
php artisan log:level error
```

#### Debug no Código

```php
// Debug de variáveis
dd($variable); // Dump and die
var_dump($variable);

// Log personalizado
Log::info('Mensagem', ['data' => $data]);
Log::error('Erro', ['exception' => $exception]);
```

#### Tinker

```bash
php artisan tinker

# Testar queries
>>> App\Models\User::all()
>>> App\Models\User::where('email', 'like', '%@example.com%')->get()
```

### Frontend

#### React DevTools

- Inspecione componentes
- Visualize estado e props
- Performance profiling

#### Console Debugging

```javascript
// Debug de estado
useEffect(() => {
  console.log('Component state:', state);
}, [state]);

// Debug de API calls
const debugRequest = async (endpoint, options) => {
  console.log('API Call:', endpoint, options);
  const result = await request(endpoint, options);
  console.log('API Response:', result);
  return result;
};
```

#### Network Tab

- Verifique requests HTTP
- Status codes
- Headers e payloads
- Timing de requests

## 🚀 Deploy

### Preparação

1. **Configurar variáveis de produção**
```bash
# .env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://agenda.com

DB_HOST=production-db-host
DB_DATABASE=agenda_prod
DB_USERNAME=prod_user
DB_PASSWORD=secure_password

MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=noreply@agenda.com
MAIL_PASSWORD=app_password
```

2. **Build do frontend**
```bash
cd frontend
npm run build
```

3. **Otimizar Laravel**
```bash
cd backend
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Servidores

#### Apache

```apache
# /var/www/html/agenda/.htaccess
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteRule ^(.*)$ public/$1 [L]
</IfModule>
```

#### Nginx

```nginx
server {
    listen 80;
    server_name agenda.com;
    root /var/www/html/agenda/public;
    index index.php index.html;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # API routes
    location /api {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # Static files
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Pós-deploy

```bash
# Executar migrations
php artisan migrate --force

# Limpar caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Criar storage link
php artisan storage:link
```

## 📊 Monitoramento

### Laravel

```php
// Health check route
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now(),
        'database' => DB::connection()->getPdo() ? 'connected' : 'disconnected'
    ]);
});
```

### Logs

```bash
# Monitorar logs
tail -f /var/log/nginx/error.log
tail -f /var/www/html/agenda/backend/storage/logs/laravel.log

# Rotacionar logs
logrotate -f /etc/logrotate.d/nginx
```

### Métricas

- **Response Times**: Monitorar tempo de resposta da API
- **Error Rates**: Taxa de erros 4xx/5xx
- **Database**: Queries lentas, conexões ativas
- **Memory**: Uso de memória PHP/Laravel

## 🔒 Segurança

### Checklist de Segurança

- [ ] HTTPS habilitado
- [ ] APP_DEBUG=false em produção
- [ ] APP_KEY segura e única
- [ ] Senhas hasheadas (bcrypt)
- [ ] Validação de entrada rigorosa
- [ ] Rate limiting implementado
- [ ] CORS configurado corretamente
- [ ] Headers de segurança (CSP, HSTS)
- [ ] Backup regular do banco
- [ ] Logs de auditoria

### Boas Práticas

1. **Nunca commite chaves/senhas**
2. **Use prepared statements** (Laravel faz automaticamente)
3. **Valide todas as entradas**
4. **Implemente autorização baseada em roles**
5. **Monitore tentativas de acesso suspeitas**
6. **Mantenha dependências atualizadas**

## 📚 Recursos Adicionais

### Documentação Oficial

- [Laravel Documentation](https://laravel.com/docs)
- [React Documentation](https://reactjs.org/docs)
- [Material-UI Documentation](https://mui.com/material-ui/)
- [MySQL Documentation](https://dev.mysql.com/doc/)

### Ferramentas

- **Postman/Insomnia**: Teste de APIs
- **Laravel Debugbar**: Debugging Laravel
- **React DevTools**: Debugging React
- **phpMyAdmin**: Gerenciamento MySQL

### Comunidade

- [Laravel Forum](https://laravel.com/forum)
- [React Community](https://reactjs.org/community)
- [Stack Overflow](https://stackoverflow.com)

---

**Boa sorte no desenvolvimento!** 🎉
