# Documentação da API - Sistema de Agendamento

## Visão Geral

A API do Sistema de Agendamento é construída com Laravel 11 e utiliza autenticação baseada em tokens (Laravel Sanctum). Todos os endpoints retornam JSON e seguem convenções RESTful.

**Base URL**: `http://localhost:8000/api`

## Atualização SaaS Multiempresa

Roles atuais:

- `gestor`: acesso exclusivo à gestão do SaaS, empresas, planos e SMTP.
- `admin`: administrador de uma empresa/tenant, limitado aos dados da própria empresa.
- `cliente`: usuário final que agenda e acompanha suas reservas.

Entidades SaaS:

- `Empresa`: cliente/tenant do SaaS.
- `Plano`: define regras comerciais. `Start` limita a 1 local; `Pro` permite quantidade configurável de locais.
- `Estabelecimento`: local/unidade/filial de uma empresa.

Links públicos por estabelecimento:

```http
GET /api/public/estabelecimentos/{slug}
GET /api/public/servicos?estabelecimento_id={id}
GET /api/public/profissionais?estabelecimento_id={id}
GET /api/public/agendas?estabelecimento_id={id}&servico_id={id}&profissional_id={id}
```

No frontend, o link exclusivo fica em `/agendar/{slug}`. Esse fluxo bloqueia a seleção no estabelecimento do slug, então uma empresa no plano Pro não expõe suas outras filiais nesse link.
Não há tela pública de agendamento sem estabelecimento; `/agendar` sem slug não deve ser usado.

### Gestão do SaaS (Gestor)

```http
GET    /api/planos
POST   /api/planos
PUT    /api/planos/{id}
DELETE /api/planos/{id}

GET    /api/empresas
POST   /api/empresas
PUT    /api/empresas/{id}
DELETE /api/empresas/{id}
```

### Operação da Empresa (Gestor/Admin)

```http
GET    /api/estabelecimentos
POST   /api/estabelecimentos
PUT    /api/estabelecimentos/{id}
DELETE /api/estabelecimentos/{id}
```

O `gestor` informa `empresa_id` ao criar locais. O `admin` usa automaticamente a própria empresa.

## Autenticação

### Login
```http
POST /api/login
```

**Request Body:**
```json
{
  "email": "cliente@email.com",
  "password": "senha123"
}
```

**Response (200):**
```json
{
  "access_token": "1|abc123...",
  "token_type": "Bearer",
  "user": {
    "id": 1,
    "name": "João Silva",
    "email": "cliente@email.com",
    "phone": "(11) 99999-9999",
    "role": "cliente"
  }
}
```

**Response (401):**
```json
{
  "message": "Credenciais inválidas"
}
```

### Registro
```http
POST /api/register
```

**Request Body:**
```json
{
  "name": "João Silva",
  "email": "cliente@email.com",
  "phone": "(11) 99999-9999",
  "birth_date": "1990-01-01",
  "password": "senha123",
  "password_confirmation": "senha123"
}
```

### Logout
```http
POST /api/logout
Authorization: Bearer {token}
```

### Dados do Usuário
```http
GET /api/me
Authorization: Bearer {token}
```

**Response:**
```json
{
  "id": 1,
  "name": "João Silva",
  "email": "cliente@email.com",
  "phone": "(11) 99999-9999",
  "birth_date": "1990-01-01",
  "role": "cliente",
  "created_at": "2026-04-19T10:00:00.000000Z",
  "updated_at": "2026-04-19T10:00:00.000000Z"
}
```

## Agendamentos

### Listar Meus Agendamentos
```http
GET /api/me/agendamentos
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": 1,
    "horario": "14:30",
    "status": "confirmado",
    "email_cliente": "cliente@email.com",
    "created_at": "2026-04-19T10:00:00.000000Z",
    "agenda": {
      "id": 1,
      "data": "2026-04-20",
      "intervalos": [
        {"inicio": "09:00", "fim": "12:00"},
        {"inicio": "14:00", "fim": "18:00"}
      ],
      "profissional": {
        "id": 1,
        "nome": "Dr. Silva",
        "estabelecimento": {
          "id": 1,
          "nome": "Clínica Médica"
        }
      },
      "servico": {
        "id": 1,
        "nome": "Consulta Geral",
        "preco": 150.00
      }
    }
  }
]
```

### Criar Agendamento
```http
POST /api/agendamentos
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "agenda_id": 1,
  "horario": "14:30",
  "email_cliente": "cliente@email.com"
}
```

**Response (201):**
```json
{
  "id": 2,
  "horario": "14:30",
  "status": "confirmado",
  "email_cliente": "cliente@email.com",
  "agenda_id": 1,
  "usuario_id": 1,
  "created_at": "2026-04-19T10:30:00.000000Z",
  "updated_at": "2026-04-19T10:30:00.000000Z"
}
```

**Response (422 - Conflito):**
```json
{
  "message": "Este horário já está ocupado para este serviço e profissional.",
  "errors": {
    "horario": ["Este horário já está ocupado para este serviço e profissional."]
  }
}
```

### Cancelar Agendamento
```http
PATCH /api/me/agendamentos/{id}/cancelar
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Agendamento cancelado com sucesso"
}
```

## Administração (Gestor/Admin)

### Estabelecimentos

#### Listar Todos
```http
GET /api/estabelecimentos
Authorization: Bearer {token} (gestor/admin)
```

#### Criar Estabelecimento
```http
POST /api/estabelecimentos
Authorization: Bearer {token} (gestor/admin)
```

**Request Body:**
```json
{
  "nome": "Clínica Médica Central",
  "segmento": "Saúde",
  "data_validade": "2026-12-31",
  "email": "contato@clinica.com",
  "senha": "senha123"
}
```

#### Atualizar Estabelecimento
```http
PUT /api/estabelecimentos/{id}
Authorization: Bearer {token} (gestor/admin)
```

#### Deletar Estabelecimento
```http
DELETE /api/estabelecimentos/{id}
Authorization: Bearer {token} (gestor/admin)
```

### Profissionais

#### Listar Todos
```http
GET /api/profissionais
Authorization: Bearer {token} (admin)
```

**Response:**
```json
[
  {
    "id": 1,
    "nome": "Dr. João Silva",
    "email": "joao@clinica.com",
    "estabelecimento_id": 1,
    "especialidades": [
      {
        "id": 1,
        "nome": "Clínico Geral"
      }
    ],
    "created_at": "2026-04-19T09:00:00.000000Z",
    "updated_at": "2026-04-19T09:00:00.000000Z"
  }
]
```

#### Criar Profissional
```http
POST /api/profissionais
Authorization: Bearer {token} (admin)
```

**Request Body:**
```json
{
  "nome": "Dr. João Silva",
  "email": "joao@clinica.com",
  "estabelecimento_id": 1,
  "especialidades": [1, 2]  // Array de IDs de especialidades
}
```

### Serviços

#### Listar Todos
```http
GET /api/servicos
Authorization: Bearer {token} (admin)
```

#### Criar Serviço
```http
POST /api/servicos
Authorization: Bearer {token} (admin)
```

**Request Body:**
```json
{
  "nome": "Consulta Geral",
  "descricao": "Consulta médica geral com clínico geral",
  "preco": 150.00,
  "estabelecimento_id": 1
}
```

### Agendas

#### Listar Todas
```http
GET /api/agendas
Authorization: Bearer {token} (admin)
```

#### Criar Agenda
```http
POST /api/agendas
Authorization: Bearer {token} (admin)
```

**Request Body:**
```json
{
  "profissional_id": 1,
  "servico_id": 1,
  "data": "2026-04-20",
  "intervalo_minutos": 30,
  "intervalos": [
    {
      "inicio": "09:00",
      "fim": "12:00"
    },
    {
      "inicio": "14:00",
      "fim": "18:00"
    }
  ],
  "status": "disponivel"
}
```

#### Obter Horários Disponíveis
```http
GET /api/agendas/{id}/horarios
```

**Response:**
```json
[
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30"
]
```

### Agendamentos (Admin)

#### Listar Todos
```http
GET /api/agendamentos
Authorization: Bearer {token} (admin)
```

#### Atualizar Agendamento
```http
PUT /api/agendamentos/{id}
Authorization: Bearer {token} (admin)
```

**Request Body:**
```json
{
  "status": "cancelado"
}
```

### Configuração de E-mail

#### Obter Configuração Atual
```http
GET /api/smtp-setting
Authorization: Bearer {token} (admin)
```

**Response:**
```json
{
  "host": "smtp.gmail.com",
  "port": 587,
  "username": "noreply@clinica.com",
  "password": "****",
  "encryption": "tls",
  "from_address": "noreply@clinica.com",
  "from_name": "Clínica Médica"
}
```

#### Atualizar Configuração
```http
POST /api/smtp-setting
Authorization: Bearer {token} (admin)
```

**Request Body:**
```json
{
  "host": "smtp.gmail.com",
  "port": 587,
  "username": "noreply@clinica.com",
  "password": "sua-senha-app",
  "encryption": "tls",
  "from_address": "noreply@clinica.com",
  "from_name": "Clínica Médica"
}
```

## Códigos de Status HTTP

| Código | Descrição |
|--------|-----------|
| 200 | OK - Requisição bem-sucedida |
| 201 | Created - Recurso criado |
| 204 | No Content - Sem conteúdo |
| 400 | Bad Request - Dados inválidos |
| 401 | Unauthorized - Não autorizado |
| 403 | Forbidden - Acesso negado |
| 404 | Not Found - Recurso não encontrado |
| 422 | Unprocessable Entity - Erro de validação |
| 500 | Internal Server Error - Erro interno |

## Tratamento de Erros

Todos os erros seguem o formato:
```json
{
  "message": "Mensagem de erro principal",
  "errors": {
    "campo": ["Erro específico do campo"]
  }
}
```

### Exemplos de Erros de Validação

**Campos obrigatórios:**
```json
{
  "message": "Erro de validação",
  "errors": {
    "nome": ["O campo nome é obrigatório."],
    "email": ["O campo email é obrigatório."]
  }
}
```

**Conflito de agendamento:**
```json
{
  "message": "Erro de validação",
  "errors": {
    "horario": ["Este horário já está ocupado para este serviço e profissional."]
  }
}
```

## Rate Limiting

A API implementa rate limiting básico. Em produção, considere implementar limites mais específicos por endpoint.

## Autenticação de Testes

Para testar endpoints protegidos, inclua o header:
```
Authorization: Bearer {seu-token-aqui}
```

## Considerações de Segurança

- Endpoints de empresa exigem `gestor`; endpoints operacionais aceitam `gestor` ou `admin` com escopo de empresa
- Tokens expiram automaticamente
- Senhas são hasheadas com bcrypt
- Validação rigorosa de entrada
- CORS configurado para origens específicas
