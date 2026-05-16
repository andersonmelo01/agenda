# Documentação do Banco de Dados

## Visão Geral

O sistema utiliza MySQL como banco de dados principal, com estrutura relacional normalizada. Todas as tabelas incluem timestamps (`created_at`, `updated_at`) padrão do Laravel.

## Atualização SaaS Multiempresa

O modelo atual separa a operação em três níveis:

- `planos`: catálogo comercial do SaaS. O plano `start` tem `limite_locais = 1`; o plano `pro` usa limite configurado por empresa.
- `empresas`: tenant/cliente do SaaS, com `plano_id`, `limite_locais`, `valor_mensal`, `status` e `data_validade`.
- `estabelecimentos`: locais/unidades/filiais da empresa, com `empresa_id` e `slug` único para o link público `/agendar/{slug}`.

Campos adicionados:

| Tabela | Campo | Descrição |
|--------|-------|-----------|
| users | empresa_id | Vincula usuários admin à empresa/tenant |
| users | role | Agora aceita `gestor`, `admin` e `cliente` |
| estabelecimentos | empresa_id | Define a empresa dona do local |
| estabelecimentos | slug | Identificador único usado no link público do local |

Relacionamento SaaS:

```txt
Plano 1:N Empresa 1:N Estabelecimento 1:N Profissional
Empresa 1:N User(admin)
Estabelecimento 1:N Servico
Profissional 1:N Agenda 1:N Agendamento
```

Regra de limite de locais:

- Ao criar um estabelecimento, o backend conta os locais já vinculados à empresa.
- Se `estabelecimentos_count >= empresas.limite_locais`, a criação é bloqueada.
- Para plano Pro, o gestor define `empresas.limite_locais` conforme o contrato.

## Diagrama ER

```
┌─────────────────┐       ┌─────────────────┐
│  estabelecimentos │◄──────┤   profissionais  │
│                 │       │                 │
│ id              │       │ id              │
│ nome            │       │ nome            │
│ segmento        │       │ email           │
│ data_validade   │       │ estabelecimento_id│
│ email           │       └─────────────────┘
│ senha           │               │
└─────────────────┘               │
        │                        │
        │                        │
        ▼                        ▼
┌─────────────────┐       ┌─────────────────┐
│     servicos     │       │   especialidades │
│                 │       │                 │
│ id              │       │ id              │
│ nome            │       │ nome            │
│ descricao       │       └─────────────────┘
│ preco           │             ▲
│ estabelecimento_id│             │
└─────────────────┘             │
        ▲                        │
        │                        │
        │                        │
        ▼                        ▼
┌─────────────────┐       ┌─────────────────┐
│     agendas      │◄──────┤profissional_especialidade│
│                 │       │                 │
│ id              │       │ profissional_id │
│ profissional_id │       │ especialidade_id│
│ servico_id      │       └─────────────────┘
│ data            │
│ intervalos (JSON)│
│ intervalo_minutos│
│ status          │
└─────────────────┘
        │
        │
        ▼
┌─────────────────┐       ┌─────────────────┐
│   agendamentos   │◄──────┤      users       │
│                 │       │                 │
│ id              │       │ id              │
│ agenda_id       │       │ name            │
│ usuario_id      │       │ email           │
│ horario         │       │ phone           │
│ status          │       │ birth_date      │
│ email_cliente   │       │ role            │
└─────────────────┘       │ password        │
                         └─────────────────┘
```

## Tabelas do Sistema

### 1. users
Tabela padrão do Laravel para autenticação, extendida com campos específicos.

| Campo | Tipo | Descrição | Restrições |
|-------|------|-----------|------------|
| id | BIGINT UNSIGNED | Chave primária | AUTO_INCREMENT |
| name | VARCHAR(255) | Nome completo | NOT NULL |
| email | VARCHAR(255) | E-mail único | UNIQUE, NOT NULL |
| phone | VARCHAR(20) | Telefone | NULL |
| birth_date | DATE | Data de nascimento | NULL |
| role | VARCHAR(255) | Tipo de usuário: `gestor`, `admin` ou `cliente` | DEFAULT 'cliente' |
| password | VARCHAR(255) | Senha hasheada | NOT NULL |
| email_verified_at | TIMESTAMP | Verificação de e-mail | NULL |
| remember_token | VARCHAR(100) | Token de remember | NULL |
| created_at | TIMESTAMP | Data de criação | NULL |
| updated_at | TIMESTAMP | Data de atualização | NULL |

**Índices:**
- PRIMARY KEY (id)
- UNIQUE KEY (email)

### 2. estabelecimentos
Entidades comerciais que utilizam o sistema.

| Campo | Tipo | Descrição | Restrições |
|-------|------|-----------|------------|
| id | BIGINT UNSIGNED | Chave primária | AUTO_INCREMENT |
| nome | VARCHAR(255) | Nome do estabelecimento | NOT NULL |
| segmento | VARCHAR(100) | Tipo de negócio | NOT NULL |
| data_validade | DATE | Data de expiração do sistema | NOT NULL |
| email | VARCHAR(255) | E-mail de contato | NOT NULL |
| senha | VARCHAR(255) | Senha de acesso | NOT NULL |
| created_at | TIMESTAMP | Data de criação | NULL |
| updated_at | TIMESTAMP | Data de atualização | NULL |

**Índices:**
- PRIMARY KEY (id)

### 3. profissionais
Funcionários/profissionais dos estabelecimentos.

| Campo | Tipo | Descrição | Restrições |
|-------|------|-----------|------------|
| id | BIGINT UNSIGNED | Chave primária | AUTO_INCREMENT |
| estabelecimento_id | BIGINT UNSIGNED | FK estabelecimentos | NOT NULL |
| nome | VARCHAR(255) | Nome completo | NOT NULL |
| email | VARCHAR(255) | E-mail de contato | NOT NULL |
| created_at | TIMESTAMP | Data de criação | NULL |
| updated_at | TIMESTAMP | Data de atualização | NULL |

**Índices:**
- PRIMARY KEY (id)
- FOREIGN KEY (estabelecimento_id) REFERENCES estabelecimentos(id)

### 4. especialidades
Áreas de atuação dos profissionais.

| Campo | Tipo | Descrição | Restrições |
|-------|------|-----------|------------|
| id | BIGINT UNSIGNED | Chave primária | AUTO_INCREMENT |
| nome | VARCHAR(255) | Nome da especialidade | NOT NULL |
| created_at | TIMESTAMP | Data de criação | NULL |
| updated_at | TIMESTAMP | Data de atualização | NULL |

**Índices:**
- PRIMARY KEY (id)

### 5. profissional_especialidade
Tabela de relacionamento N:N entre profissionais e especialidades.

| Campo | Tipo | Descrição | Restrições |
|-------|------|-----------|------------|
| profissional_id | BIGINT UNSIGNED | FK profissionais | PRIMARY KEY |
| especialidade_id | BIGINT UNSIGNED | FK especialidades | PRIMARY KEY |

**Índices:**
- PRIMARY KEY (profissional_id, especialidade_id)
- FOREIGN KEY (profissional_id) REFERENCES profissionais(id)
- FOREIGN KEY (especialidade_id) REFERENCES especialidades(id)

### 6. servicos
Serviços oferecidos pelos estabelecimentos.

| Campo | Tipo | Descrição | Restrições |
|-------|------|-----------|------------|
| id | BIGINT UNSIGNED | Chave primária | AUTO_INCREMENT |
| estabelecimento_id | BIGINT UNSIGNED | FK estabelecimentos | NOT NULL |
| nome | VARCHAR(255) | Nome do serviço | NOT NULL |
| descricao | TEXT | Descrição detalhada | NULL |
| preco | DECIMAL(10,2) | Preço do serviço | NOT NULL |
| created_at | TIMESTAMP | Data de criação | NULL |
| updated_at | TIMESTAMP | Data de atualização | NULL |

**Índices:**
- PRIMARY KEY (id)
- FOREIGN KEY (estabelecimento_id) REFERENCES estabelecimentos(id)

### 7. agendas
Horários disponíveis dos profissionais para serviços específicos.

| Campo | Tipo | Descrição | Restrições |
|-------|------|-----------|------------|
| id | BIGINT UNSIGNED | Chave primária | AUTO_INCREMENT |
| profissional_id | BIGINT UNSIGNED | FK profissionais | NOT NULL |
| servico_id | BIGINT UNSIGNED | FK servicos | NOT NULL |
| data | DATE | Data da agenda | NOT NULL |
| intervalos | JSON | Array de intervalos de horário | NOT NULL |
| intervalo_minutos | INT | Duração dos slots em minutos | NOT NULL |
| status | ENUM('disponivel', 'ocupada', 'cancelado') | Status da agenda | DEFAULT 'disponivel' |
| created_at | TIMESTAMP | Data de criação | NULL |
| updated_at | TIMESTAMP | Data de atualização | NULL |

**Estrutura do campo `intervalos`:**
```json
[
  {
    "inicio": "09:00",
    "fim": "12:00"
  },
  {
    "inicio": "14:00",
    "fim": "18:00"
  }
]
```

**Índices:**
- PRIMARY KEY (id)
- FOREIGN KEY (profissional_id) REFERENCES profissionais(id)
- FOREIGN KEY (servico_id) REFERENCES servicos(id)
- INDEX (data, profissional_id, servico_id)

### 8. agendamentos
Reservas realizadas pelos clientes.

| Campo | Tipo | Descrição | Restrições |
|-------|------|-----------|------------|
| id | BIGINT UNSIGNED | Chave primária | AUTO_INCREMENT |
| agenda_id | BIGINT UNSIGNED | FK agendas | NOT NULL |
| usuario_id | BIGINT UNSIGNED | FK users | NULL (para agendamentos anônimos) |
| email_cliente | VARCHAR(255) | E-mail do cliente | NOT NULL |
| horario | TIME | Horário do agendamento | NOT NULL |
| status | ENUM('confirmado', 'cancelado', 'concluido') | Status do agendamento | DEFAULT 'confirmado' |
| created_at | TIMESTAMP | Data de criação | NULL |
| updated_at | TIMESTAMP | Data de atualização | NULL |

**Índices:**
- PRIMARY KEY (id)
- FOREIGN KEY (agenda_id) REFERENCES agendas(id)
- FOREIGN KEY (usuario_id) REFERENCES users(id)
- UNIQUE KEY (agenda_id, horario) - Impede duplicatas

### 9. smtp_settings
Configuração de e-mail por estabelecimento.

| Campo | Tipo | Descrição | Restrições |
|-------|------|-----------|------------|
| id | BIGINT UNSIGNED | Chave primária | AUTO_INCREMENT |
| estabelecimento_id | BIGINT UNSIGNED | FK estabelecimentos | NOT NULL |
| host | VARCHAR(255) | Servidor SMTP | NOT NULL |
| port | INT | Porta SMTP | NOT NULL |
| username | VARCHAR(255) | Usuário SMTP | NOT NULL |
| password | VARCHAR(255) | Senha SMTP | NOT NULL |
| encryption | ENUM('tls', 'ssl', 'none') | Tipo de criptografia | DEFAULT 'tls' |
| from_address | VARCHAR(255) | E-mail remetente | NOT NULL |
| from_name | VARCHAR(255) | Nome remetente | NOT NULL |
| created_at | TIMESTAMP | Data de criação | NULL |
| updated_at | TIMESTAMP | Data de atualização | NULL |

**Índices:**
- PRIMARY KEY (id)
- FOREIGN KEY (estabelecimento_id) REFERENCES estabelecimentos(id)

## Migrations

### Ordem de Execução

1. `0001_01_01_000000_create_users_table.php`
2. `0001_01_01_000001_create_cache_table.php`
3. `0001_01_01_000002_create_jobs_table.php`
4. `2024_01_15_000001_create_estabelecimentos_table.php`
5. `2024_01_15_000002_create_profissionais_table.php`
6. `2024_01_15_000003_create_especialidades_table.php`
7. `2024_01_15_000004_create_profissional_especialidade_table.php`
8. `2024_01_15_000005_create_servicos_table.php`
9. `2024_01_15_000006_create_agendas_table.php`
10. `2024_01_15_000007_create_agendamentos_table.php`
11. `2024_01_15_000008_create_smtp_settings_table.php`

### Comandos de Migração

```bash
# Executar todas as migrations
php artisan migrate

# Rollback da última migration
php artisan migrate:rollback

# Rollback de todas as migrations
php artisan migrate:reset

# Recriar banco do zero
php artisan migrate:fresh
```

## Seeders

### DatabaseSeeder
Executa todos os seeders em ordem.

### Estrutura de Dados de Exemplo

```php
// Usuário admin
User::create([
    'name' => 'Administrador',
    'email' => 'admin@sistema.com',
    'password' => Hash::make('010200'),
    'role' => 'gestor'
]);

// Estabelecimento exemplo
Estabelecimento::create([
    'nome' => 'Clínica Médica Central',
    'segmento' => 'Saúde',
    'data_validade' => now()->addYear(),
    'email' => 'contato@clinica.com',
    'senha' => Hash::make('clinica123')
]);
```

## Consultas Comuns

### Verificar conflitos de agendamento
```sql
SELECT a.* FROM agendamentos a
JOIN agendas ag ON a.agenda_id = ag.id
WHERE ag.profissional_id = ?
  AND ag.servico_id = ?
  AND ag.data = ?
  AND a.horario = ?
  AND a.status != 'cancelado'
```

### Obter horários disponíveis
```sql
SELECT DISTINCT a.horario
FROM agendas ag
CROSS JOIN (
  -- Gerar slots baseado nos intervalos
  SELECT * FROM JSON_TABLE(
    ag.intervalos,
    '$[*]' COLUMNS (
      inicio TIME PATH '$.inicio',
      fim TIME PATH '$.fim'
    )
  ) intervals
) slots
LEFT JOIN agendamentos a ON a.agenda_id = ag.id
  AND a.horario = slots.horario
  AND a.status != 'cancelado'
WHERE ag.id = ?
  AND a.id IS NULL
ORDER BY slots.horario
```

### Dashboard - Estatísticas
```sql
-- Total de estabelecimentos
SELECT COUNT(*) as total_estabelecimentos FROM estabelecimentos;

-- Total de profissionais
SELECT COUNT(*) as total_profissionais FROM profissionais;

-- Total de serviços
SELECT COUNT(*) as total_servicos FROM servicos;

-- Total de agendamentos hoje
SELECT COUNT(*) as agendamentos_hoje
FROM agendamentos a
JOIN agendas ag ON a.agenda_id = ag.id
WHERE DATE(ag.data) = CURDATE()
  AND a.status = 'confirmado';
```

## Backup e Restauração

### Backup
```bash
# Backup completo
mysqldump -u root -p agenda > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup específico de tabelas
mysqldump -u root -p agenda users estabelecimentos > backup_core.sql
```

### Restauração
```bash
# Restaurar backup
mysql -u root -p agenda < backup_20260419_100000.sql
```

## Otimização

### Índices Recomendados
- `agendas(data, profissional_id, servico_id)` - Para consultas de disponibilidade
- `agendamentos(agenda_id, horario, status)` - Para validação de conflitos
- `agendamentos(usuario_id, created_at)` - Para histórico do usuário

### Configurações MySQL
```ini
# my.cnf ou my.ini
[mysqld]
innodb_buffer_pool_size = 256M
innodb_log_file_size = 64M
max_connections = 100
query_cache_size = 64M
```

## Considerações de Segurança

- Senhas hasheadas com bcrypt (Laravel)
- Foreign keys para integridade referencial
- Validação de entrada no nível da aplicação
- Logs de auditoria para ações críticas
- Backup regular recomendado
