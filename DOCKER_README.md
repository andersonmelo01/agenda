# Configuração Docker para o Projeto Agenda

Este projeto inclui uma configuração Docker completa para facilitar o desenvolvimento e implantação.

## Atualização SaaS Multiempresa

Depois de subir os containers, rode migrations e seed para criar os planos `Start`/`Pro` e o gestor inicial:

```bash
docker-compose exec backend php artisan migrate
docker-compose exec backend php artisan db:seed --class=DatabaseSeeder
```

Credencial inicial:

```txt
admin@sistema.com / 010200
```

Rotas importantes:

- Home institucional: `/`
- Área restrita do gestor/admin: `/admin-login`
- Link exclusivo por estabelecimento: `/agendar/{slug}`

## Pré-requisitos

- Docker
- Docker Compose

## Como Usar

### 1. Clonar o Repositório
```bash
git clone <URL_DO_REPOSITORIO>
cd agenda
```

### 2. Configurar Variáveis de Ambiente
Edite o arquivo `docker-compose.yml` e configure:
- Senhas do banco de dados
- APP_KEY do Laravel (gere com `php artisan key:generate`)
- Outras variáveis conforme necessário

### 3. Construir e Iniciar os Containers
```bash
docker-compose up --build
```

### 4. Executar Migrações
```bash
docker-compose exec backend php artisan migrate
```

### 5. Acessar a Aplicação
- Frontend: http://localhost
- API: http://localhost/api

## Serviços

- **db**: MySQL 8.0
- **backend**: Laravel (PHP 8.3-FPM)
- **frontend**: React (servido com serve)
- **apache**: Servidor web Apache

## Comandos Úteis

### Parar os containers
```bash
docker-compose down
```

### Ver logs
```bash
docker-compose logs -f
```

### Executar comandos no backend
```bash
docker-compose exec backend php artisan <comando>
```

### Reconstruir um serviço específico
```bash
docker-compose up --build backend
```

## Produção

Para produção, considere:
- Configurar SSL no Apache
- Usar volumes para persistência de dados
- Configurar variáveis de ambiente adequadas
- Usar Docker Swarm ou Kubernetes para orquestração

## Solução de Problemas

- **Erro de conexão com DB**: Aguarde o MySQL iniciar completamente
- **Permissões**: Certifique-se que os volumes têm permissões corretas
- **Portas ocupadas**: Mude as portas no docker-compose.yml se necessário
