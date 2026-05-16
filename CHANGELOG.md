# Changelog - Sistema de Agendamento

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-05-10

### Implementado

- Transformação do sistema em SaaS multiempresa.
- Novo papel `gestor` para administração exclusiva do SaaS.
- Novas entidades `planos` e `empresas`.
- Planos iniciais `Start` e `Pro`.
- Limite de locais por empresa conforme plano contratado.
- Vínculo de usuários admin e estabelecimentos por `empresa_id`.
- Links exclusivos por estabelecimento usando `/agendar/{slug}`.
- Endpoint público para buscar estabelecimento por slug.
- Home institucional redesenhada para apresentação profissional do sistema.
- Link discreto para área restrita do gestor/admin.

### Alterado

- `admin@sistema.com` passa a ser usuário `gestor` no seeder.
- Endpoints públicos de listagem passam a usar `/api/public/...`.
- Painel administrativo exibe Empresas, Planos e SMTP apenas para `gestor`.
- Admin de empresa fica limitado aos dados da própria empresa.

### Documentação

- README e documentos em `docs/` atualizados para SaaS multiempresa, planos, links exclusivos e papéis.

## [1.0.0] - 2026-04-19

### ✅ Implementado

#### Funcionalidades Principais
- **Sistema de Agendamento Completo**: Reserva de serviços com validação de conflitos
- **Gestão de Estabelecimentos**: CRUD completo de estabelecimentos comerciais
- **Gestão de Profissionais**: Cadastro de funcionários com especialidades
- **Gestão de Serviços**: Catálogo de serviços com preços
- **Gestão de Agendas**: Criação de horários disponíveis com múltiplos intervalos
- **Sistema de Usuários**: Autenticação com roles (admin/cliente)
- **Notificações por E-mail**: Confirmação e cancelamento automático
- **Interface Responsiva**: Otimizada para desktop e mobile

#### Backend (Laravel 11)
- **API RESTful**: 40+ endpoints com autenticação Sanctum
- **Modelo de Dados**: 9 modelos com relacionamentos complexos
- **Validação de Conflitos**: Impede agendamentos duplicados
- **Sistema de E-mail**: Configuração SMTP dinâmica
- **Controle de Acesso**: Middleware de autorização por roles
- **Logs e Auditoria**: Sistema completo de logging

#### Frontend (React 18)
- **SPA Moderna**: Single Page Application com roteamento
- **Material-UI v9**: Design system consistente e responsivo
- **Autenticação**: Gerenciamento de sessão com localStorage
- **Componentes Reutilizáveis**: ResponsiveTable, PrivateRoute, etc.
- **Formulários Validados**: Tratamento completo de erros
- **Layout Adaptativo**: Admin e public layouts responsivos

#### Banco de Dados
- **15 Migrations**: Estrutura completa e normalizada
- **Relacionamentos Complexos**: N:N, 1:N, validações de integridade
- **Seeders**: Dados de exemplo para desenvolvimento
- **Índices Otimizados**: Performance em consultas críticas

### 🔧 Técnico

#### Segurança
- Autenticação baseada em tokens (Laravel Sanctum)
- Autorização baseada em roles (admin/cliente)
- Validação rigorosa de entrada
- CORS configurado para origens específicas
- Senhas hasheadas com bcrypt

#### Performance
- Lazy loading de componentes React
- Queries otimizadas com índices
- Cache de configurações Laravel
- Bundle splitting no frontend

#### Qualidade de Código
- ESLint e Prettier configurados
- Padrões de código documentados
- Testes automatizados (backend)
- TypeScript-like prop validation

### 📚 Documentação
- **README Completo**: Visão geral e instalação
- **Documentação da API**: Todos os endpoints detalhados
- **Documentação do Banco**: Estrutura e relacionamentos
- **Documentação do Frontend**: Componentes e arquitetura
- **Guia de Desenvolvimento**: Padrões e melhores práticas

---

## [0.1.0] - 2026-01-15

### ✅ Implementado
- Estrutura inicial do projeto Laravel + React
- Configuração básica de autenticação
- Models e migrations iniciais
- Interface básica de login
- Prototipagem da arquitetura

---

## Tipos de Mudanças

- `✅ Implementado` - Novas funcionalidades
- `🔄 Alterado` - Mudanças em funcionalidades existentes
- `🐛 Corrigido` - Correções de bugs
- `🗑️ Removido` - Funcionalidades removidas
- `🔧 Técnico` - Mudanças técnicas/internas
- `📚 Documentação` - Atualizações na documentação

---

## Próximas Versões

### [1.1.0] - Planejado
- [ ] Sistema de notificações push
- [ ] Relatórios e analytics
- [ ] Integração com calendários externos
- [ ] API para aplicativos móveis
- [ ] Sistema de avaliações e comentários

### [1.2.0] - Planejado
- [ ] Multi-tenant (múltiplas empresas)
- [ ] Sistema de pagamentos integrado
- [ ] Agendamentos recorrentes
- [ ] Chat integrado
- [ ] Dashboard avançado com gráficos

### [2.0.0] - Planejado
- [ ] Microserviços
- [ ] GraphQL API
- [ ] Real-time updates (WebSockets)
- [ ] IA para recomendações
- [ ] Mobile apps nativas

---

## Como Contribuir

1. Escolha uma issue ou crie uma nova
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit suas mudanças: `git commit -m 'Adiciona nova funcionalidade'`
4. Push para a branch: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

### Padrões de Commit

```
feat: nova funcionalidade
fix: correção de bug
docs: atualização na documentação
style: formatação, linting
refactor: refatoração de código
test: testes
chore: manutenção
```

---

## Suporte

Para suporte técnico:
- **Issues**: [GitHub Issues](https://github.com/user/repo/issues)
- **E-mail**: suporte@agenda.local
- **Documentação**: Consulte os arquivos em `/docs`

---

*Este changelog foi iniciado em 19 de abril de 2026.*
