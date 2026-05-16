# Sistema de Agendamento Online

Um sistema completo de agendamento e reserva de serviços desenvolvido com Laravel 11 (backend) e React 18 (frontend), utilizando autenticação baseada em tokens e interface responsiva.

## Atualização SaaS Multiempresa

O projeto agora opera como SaaS multiempresa:

- **Gestor do SaaS**: acessa a área restrita em `/admin-login` e administra empresas, planos, locais, SMTP e operação global.
- **Empresas**: representam clientes/tenants do SaaS.
- **Estabelecimentos**: representam locais/unidades/filiais vinculados a uma empresa.
- **Planos**: `Start` permite 1 local; `Pro` permite configurar a quantidade de locais/filiais e a mensalidade conforme contrato.
- **Links exclusivos por estabelecimento**: cada local possui URL própria no formato `/agendar/{slug}`. Quem acessa esse link vê apenas aquele local, mesmo quando a empresa está no plano Pro.
- **Home institucional**: a página inicial foi redesenhada como apresentação profissional do sistema, com acesso discreto à área restrita do gestor no rodapé.

Credencial inicial criada pelo seeder:

```txt
Gestor: admin@sistema.com
Senha: 010200
```

## 📋 Visão Geral

O **Sistema de Agendamento Online** permite que estabelecimentos comerciais gerenciem seus profissionais, serviços e agendas, enquanto clientes podem fazer reservas online. O sistema inclui funcionalidades de administração completa, notificações por e-mail e interface responsiva para dispositivos móveis.

### ✨ Principais Funcionalidades

- **👥 Gestão de Usuários**: Cadastro de clientes e administradores
- **🏢 Gestão Multiempresa**: Empresas, planos e locais/filiais por tenant
- **🔗 Links Exclusivos**: URL pública própria por estabelecimento/local
- **👨‍💼 Gestão de Profissionais**: Cadastro de funcionários com especialidades
- **🛍️ Gestão de Serviços**: Catálogo de serviços com preços
- **📅 Gestão de Agendas**: Criação de horários disponíveis com intervalos múltiplos
- **📝 Sistema de Agendamentos**: Reserva online com validação de conflitos
- **📧 Notificações por E-mail**: Confirmação e cancelamento automático
- **📱 Interface Responsiva**: Otimizada para desktop e mobile
- **🔐 Autenticação Segura**: Token-based com roles (gestor/admin/cliente)

## 🏗️ Arquitetura

### Backend (Laravel 11)
- **Framework**: Laravel 11 com PHP 8+
- **Autenticação**: Laravel Sanctum (tokens API)
- **Banco de Dados**: MySQL
- **ORM**: Eloquent
- **Validação**: Laravel Validation
- **E-mail**: Laravel Mail com SMTP configurável

### Frontend (React 18)
- **Framework**: React 18 com hooks
- **UI Library**: Material-UI v9 (@mui/material)
- **Roteamento**: React Router v7
- **HTTP Client**: Fetch API com wrapper customizado
- **Estilização**: MUI Theme + CSS Variables
- **Responsividade**: Breakpoints MUI (xs, sm, md, lg, xl)

## 📁 Estrutura do Projeto

```
agenda/
├── backend/                    # Laravel API
│   ├── app/
│   │   ├── Models/            # Modelos Eloquent (9 modelos)
│   │   ├── Http/Controllers/  # Controladores (10 controllers)
│   │   ├── Mail/             # Classes de e-mail (2 mailables)
│   │   └── Support/          # Utilitários (MailConfiguration)
│   ├── config/               # Configurações Laravel
│   ├── database/
│   │   ├── migrations/       # Migrations do banco (15+)
│   │   └── seeders/          # Seeders para dados iniciais
│   ├── routes/api.php        # Rotas da API (40+ endpoints)
│   └── resources/views/emails/ # Templates de e-mail
│
├── frontend/                  # React SPA
│   ├── src/
│   │   ├── pages/            # Páginas (13 componentes)
│   │   ├── components/       # Componentes reutilizáveis (7)
│   │   ├── layouts/          # Layouts (Admin/Public)
│   │   ├── styles/           # Tema MUI + CSS global
│   │   ├── utils/            # Utilitários (api, auth, formatters)
│   │   └── App.js            # Definição de rotas
│   └── public/               # Assets estáticos
│
├── package.json              # Dependências frontend
└── README.md                 # Esta documentação
```

## 🗄️ Modelo de Dados

### Entidades Principais

| Entidade | Descrição | Campos Principais |
|----------|-----------|-------------------|
| **User** | Usuários do sistema | name, email, phone, birth_date, role |
| **Empresa** | Tenant/cliente SaaS | nome, plano_id, limite_locais, valor_mensal |
| **Plano** | Plano comercial SaaS | nome, codigo, preco_base, preco_por_local |
| **Estabelecimento** | Local/unidade/filial | empresa_id, slug, nome, segmento, email |
| **Profissional** | Funcionários | nome, email, estabelecimento_id |
| **Especialidade** | Áreas de atuação | nome |
| **Servico** | Serviços oferecidos | nome, descricao, preco, estabelecimento_id |
| **Agenda** | Horários disponíveis | data, intervalos (JSON), profissional_id, servico_id |
| **Agendamento** | Reservas realizadas | horario, status, agenda_id, usuario_id |
| **SmtpSetting** | Configuração de e-mail | host, port, username, password |

### Relacionamentos

```
Estabelecimento
├── 1:N Profissional
├── 1:N Servico
└── 1:1 SmtpSetting

Profissional
├── N:N Especialidade (via profissional_especialidade)
└── 1:N Agenda

Agenda
├── 1:N Agendamento
├── 1:1 Profissional
└── 1:1 Servico

User (Cliente)
└── 1:N Agendamento
```

## 🚀 Instalação e Configuração

### Pré-requisitos

- **PHP 8.1+** com extensões: pdo, mbstring, openssl, tokenizer
- **Composer** (gerenciador de dependências PHP)
- **Node.js 16+** e **npm**
- **MySQL 5.7+** ou **MariaDB 10.3+**
- **XAMPP** (recomendado para desenvolvimento local)

### 1. Clonagem e Dependências

```bash
# Clonar repositório
git clone <repository-url>
cd agenda

# Instalar dependências backend
cd backend
composer install

# Instalar dependências frontend
cd ../frontend
npm install
```

### 2. Configuração do Banco de Dados

```bash
# Criar banco de dados MySQL
# Nome sugerido: 'agenda'

# Configurar arquivo .env (backend)
cp .env.example .env
```

Editar `backend/.env`:
```env
APP_NAME=Agenda
APP_ENV=local
APP_DEBUG=true

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=agenda
DB_USERNAME=root
DB_PASSWORD=

MAIL_MAILER=smtp
MAIL_FROM_ADDRESS=noreply@agenda.local
MAIL_FROM_NAME="${APP_NAME}"
```

### 3. Configuração do Laravel

```bash
# Gerar chave da aplicação
php artisan key:generate

# Executar migrations
php artisan migrate

# (Opcional) Popular banco com dados de exemplo
php artisan db:seed
```

### 4. Configuração do Frontend

Editar `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:8000
```

## 🏃‍♂️ Executando o Sistema

### Desenvolvimento

```bash
# Terminal 1: Backend
cd backend
php artisan serve --host=127.0.0.1 --port=8000

# Terminal 2: Frontend
cd frontend
npm start
```

O sistema estará disponível em:
- **Frontend**: http://localhost:3000
- **API Backend**: http://localhost:8000

### Produção

```bash
# Build do frontend
cd frontend
npm run build

# Servir arquivos estáticos ou configurar servidor web
# (Apache/Nginx) para servir a pasta build/
```

## 📡 API Endpoints

### Autenticação
```http
POST   /api/login              # Login de usuário
POST   /api/register           # Registro de cliente
POST   /api/logout             # Logout
GET    /api/me                 # Dados do usuário logado
```

### Agendamentos (Clientes)
```http
GET    /api/me/agendamentos                 # Meus agendamentos
POST   /api/agendamentos                    # Criar agendamento
PATCH  /api/me/agendamentos/{id}/cancelar   # Cancelar agendamento
```

### Administração (Gestor/Admin)
```http
# Estabelecimentos
GET    /api/estabelecimentos
POST   /api/estabelecimentos
PUT    /api/estabelecimentos/{id}
DELETE /api/estabelecimentos/{id}

# Profissionais
GET    /api/profissionais
POST   /api/profissionais
PUT    /api/profissionais/{id}
DELETE /api/profissionais/{id}

# Especialidades, Serviços, Agendas, Agendamentos
# (Mesmos padrões CRUD acima)

# Configuração de E-mail
GET    /api/smtp-setting
POST   /api/smtp-setting
```

### Endpoints Especiais
```http
GET    /api/agendas/{id}/horarios   # Horários disponíveis para uma agenda
GET    /api/public/estabelecimentos/{slug} # Dados do local pelo link exclusivo
```

## 🎨 Interface do Usuário

### Páginas Públicas
- **/** - Página inicial com apresentação
- **/login** - Login de clientes
- **/admin/login** e **/admin-login** - Login do gestor/admin
- **/agendar/{slug}** - Link exclusivo obrigatório de um estabelecimento/local

### Área Administrativa (Gestor/Admin)
- **/dashboard** - Dashboard com estatísticas
- **/gestor/empresas** - Gestão de empresas e limites de locais
- **/gestor/planos** - Gestão dos planos Start e Pro
- **/estabelecimentos** - Gestão de estabelecimentos
- **/profissionais** - Gestão de profissionais
- **/especialidades** - Gestão de especialidades
- **/servicos** - Gestão de serviços
- **/agendas** - Gestão de agendas
- **/agendamentos** - Visualização de todos os agendamentos
- **/admin/smtp** - Configuração de e-mail

### Design System
- **Tema**: Material-UI v9 com cores teal/blue
- **Fonte**: Plus Jakarta Sans
- **Responsividade**: Breakpoints móveis otimizados
- **Componentes**: Tabelas responsivas, formulários validados

## 🔧 Funcionalidades Técnicas

### Sistema de Agendas com Intervalos Múltiplos

```json
// Exemplo de agenda com múltiplos intervalos
{
  "data": "2026-04-20",
  "intervalos": [
    {"inicio": "09:00", "fim": "12:00"},
    {"inicio": "14:00", "fim": "18:00"}
  ],
  "intervalo_minutos": 30
}
```

Gera automaticamente horários disponíveis:
- 09:00, 09:30, 10:00, 10:30, 11:00, 11:30
- 14:00, 14:30, 15:00, 15:30, 16:00, 16:30, 17:00, 17:30

### Validação de Conflitos

O sistema impede agendamentos duplicados verificando:
- Mesmo horário
- Mesmo serviço
- Mesmo profissional
- Status diferente de 'cancelado'

### Notificações por E-mail

Configuração SMTP dinâmica via interface admin:
- **BookingConfirmationMail**: Confirmação de agendamento
- **BookingCancellationMail**: Cancelamento de agendamento

### Autenticação e Autorização

- **Tokens**: Laravel Sanctum com Bearer tokens
- **Roles**: `gestor` (SaaS), `admin` (empresa) e `cliente` (agendamentos)
- **Middleware**: Proteção de rotas por autenticação e role
- **Storage**: LocalStorage no frontend

## 🧪 Testes

### Testes de API

```bash
# Usando curl
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sistema.com","password":"010200"}'

# Usando Python
python test_agenda.py
```

### Testes de Frontend

```bash
cd frontend
npm test
```

## 🔒 Segurança

### Implementado
- ✅ Autenticação baseada em tokens
- ✅ Autorização baseada em roles
- ✅ Validação de entrada em todos os endpoints
- ✅ CORS configurado para origens específicas
- ✅ Senhas hasheadas com bcrypt
- ✅ Validação de propriedade (usuários só cancelam seus agendamentos)

### Recomendações para Produção
- ⚠️ Habilitar HTTPS
- ⚠️ Usar senhas fortes para SMTP
- ⚠️ Implementar rate limiting
- ⚠️ Logs de auditoria para ações admin
- ⚠️ Backup regular do banco de dados

## 📊 Monitoramento e Logs

### Logs do Laravel
```bash
# Visualizar logs
tail -f backend/storage/logs/laravel.log
```

### Logs de E-mail
```bash
# Verificar envios
php artisan tinker
>>> Mail::getSwiftMailer()->getTransport()->getSpool()->flushQueue()
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para detalhes.

## 📞 Suporte

Para suporte técnico ou dúvidas:
- **E-mail**: suporte@agenda.local
- **Documentação**: Este README.md
- **Issues**: GitHub Issues do repositório

---

## 📚 Documentação Detalhada

Para informações completas sobre o sistema, consulte a documentação técnica:

- **[📡 Documentação da API](docs/API.md)** - Endpoints, autenticação, exemplos de uso
- **[🗄️ Documentação do Banco de Dados](docs/DATABASE.md)** - Estrutura das tabelas, migrations, queries
- **[🎨 Documentação do Frontend](docs/FRONTEND.md)** - Componentes, estado, responsividade
- **[🔧 Guia de Desenvolvimento](docs/DEVELOPMENT.md)** - Setup, padrões de código, testes, deploy
- **[⚙️ Configurações](docs/CONFIG.md)** - Arquivos de configuração para diferentes ambientes
- **[🔍 Troubleshooting](docs/TROUBLESHOOTING.md)** - Resolução de problemas comuns
- **[📝 Changelog](CHANGELOG.md)** - Histórico de mudanças e versões

## 📋 Resumo das Funcionalidades

### 👥 Gestão de Usuários
- Cadastro e login de clientes
- Sistema de administradores
- Autenticação baseada em tokens

### 🏢 Gestão de Estabelecimentos
- CRUD completo de empresas
- Controle de validade do sistema
- Configuração individual de SMTP

### 👨‍💼 Gestão de Profissionais
- Cadastro de funcionários
- Vinculação com estabelecimentos
- Especialidades (relacionamento N:N)

### 🛍️ Gestão de Serviços
- Catálogo de serviços oferecidos
- Definição de preços
- Vinculação com estabelecimentos

### 📅 Gestão de Agendas
- Criação de horários disponíveis
- **Múltiplos intervalos por dia**
- Vinculação com profissionais e serviços

### 📝 Sistema de Agendamentos
- Reserva online de serviços
- **Validação automática de conflitos**
- E-mails de confirmação/cancelamento

### 📧 Notificações por E-mail
- Configuração SMTP dinâmica
- Templates customizados
- Disparo automático

### 📱 Interface Responsiva
- Otimizada para desktop e mobile
- Material-UI v9
- Layouts adaptativos

---

**Desenvolvido com ❤️ usando Laravel e React**
