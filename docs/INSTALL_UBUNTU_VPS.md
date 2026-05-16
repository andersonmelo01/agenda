# Instalacao em VPS Ubuntu com Apache2

Este guia descreve a instalacao do Sistema Agenda em uma VPS Ubuntu usando Apache2 nativo, MySQL, PHP e Node.js. O projeto possui:

- Backend Laravel em `backend/`
- Frontend React em `frontend/`
- API publica em `/api`
- SPA React servida no mesmo dominio, com rotas como `/`, `/login`, `/admin-login` e `/agendar/{slug}`

Nos exemplos abaixo, o dominio usado e:

- `kyonix.ams.dev.br`
- `<URL_DO_REPOSITORIO>` pela URL do repositorio
- senhas e credenciais por valores fortes de producao

## Pre-requisitos

- VPS Ubuntu 22.04 ou 24.04
- Acesso SSH com usuario `sudo`
- Dominio apontando para o IP da VPS
- Portas `80` e `443` liberadas

## 1. Preparar o servidor

Atualize o sistema e instale utilitarios basicos:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y curl wget git unzip software-properties-common ca-certificates lsb-release apt-transport-https
```

Instale o Apache2:

```bash
sudo apt install -y apache2
sudo systemctl enable apache2
sudo systemctl start apache2
```

Instale PHP 8.3 e extensoes usadas pelo Laravel:

```bash
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update
sudo apt install -y php8.3 php8.3-cli php8.3-common php8.3-mysql php8.3-mbstring php8.3-xml php8.3-curl php8.3-zip php8.3-bcmath php8.3-intl php8.3-gd libapache2-mod-php8.3
```

Habilite os modulos do Apache:

```bash
sudo a2enmod rewrite headers expires php8.3
sudo systemctl restart apache2
```

Instale o MySQL:

```bash
sudo apt install -y mysql-server
sudo systemctl enable mysql
sudo systemctl start mysql
sudo mysql_secure_installation
```

Instale o Node.js e npm. Use Node.js 20 ou superior:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

Instale o Composer:

```bash
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
composer --version
```

## 2. Baixar o projeto

Clone o repositorio em `/var/www/agenda`:

```bash
cd /var/www
sudo git clone <URL_DO_REPOSITORIO> agenda
sudo chown -R $USER:www-data /var/www/agenda
cd /var/www/agenda
```

## 3. Configurar banco de dados

Entre no MySQL:

```bash
sudo mysql
```

Crie o banco e o usuario:

```sql
CREATE DATABASE agenda CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'agenda_user'@'localhost' IDENTIFIED BY 'And95079@';
GRANT ALL PRIVILEGES ON agenda.* TO 'agenda_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 4. Configurar backend Laravel

Instale as dependencias:

```bash
cd /var/www/agenda/backend
composer install --no-dev --optimize-autoloader
```

Crie o arquivo `.env`:

```bash
cp .env.example .env
nano .env
```

Use esta base para producao:

```env
APP_NAME="Sistema de Agendamento"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://kyonix.ams.dev.br
APP_API_PREFIX=

LOG_CHANNEL=stack
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=agenda
DB_USERNAME=agenda_user
DB_PASSWORD=troque_esta_senha

SESSION_DRIVER=database
QUEUE_CONNECTION=database
CACHE_STORE=database

FRONTEND_URL=https://kyonix.ams.dev.br
SANCTUM_STATEFUL_DOMAINS=kyonix.ams.dev.br

MAIL_MAILER=smtp
MAIL_HOST=smtp.kyonix.ams.dev.br
MAIL_PORT=587
MAIL_USERNAME=usuario_smtp
MAIL_PASSWORD=senha_smtp
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@kyonix.ams.dev.br
MAIL_FROM_NAME="${APP_NAME}"
```

Gere a chave da aplicacao, rode migrations e seeders:

```bash
php artisan key:generate
php artisan migrate --force
php artisan db:seed --class=DatabaseSeeder --force
php artisan storage:link
```

O seeder cria os planos iniciais `Start` e `Pro`, alem do gestor inicial:

```txt
E-mail: admin@sistema.com
Senha: 010200
```

Altere essa senha logo no primeiro acesso.

Configure permissoes:

```bash
sudo chown -R www-data:www-data /var/www/agenda/backend/storage /var/www/agenda/backend/bootstrap/cache
sudo chmod -R 775 /var/www/agenda/backend/storage /var/www/agenda/backend/bootstrap/cache
```

Otimize o Laravel para producao:

```bash
php artisan optimize:clear
php artisan config:cache
php artisan view:cache
```

Observacao: este projeto possui uma rota web em closure em `backend/routes/web.php`, por isso o guia nao usa `php artisan route:cache`. Se essa rota for convertida para controller, o cache de rotas pode ser habilitado depois.

Observacao: com o Apache usando `Alias /api /var/www/agenda/backend/public`, mantenha `APP_API_PREFIX=` vazio no `.env` de producao. O alias ja monta o backend em `/api`; se o Laravel tambem usar o prefixo interno `api`, a rota externa de login vira `/api/api/login`.

## 5. Gerar build do frontend React

Instale dependencias e gere o build:

```bash
cd /var/www/agenda/frontend
npm ci
npm run build
```

Por padrao, em producao o frontend usa API no mesmo dominio. Se precisar usar outro dominio para a API, crie `frontend/.env.production` antes do build:

```env
REACT_APP_API_URL=https://api.kyonix.ams.dev.br
```

Depois rode novamente:

```bash
npm run build
```

## 6. Configurar Apache2

Crie o VirtualHost:

```bash
sudo nano /etc/apache2/sites-available/agenda.conf
```

Conteudo recomendado:

```apache
<VirtualHost *:80>
    ServerName kyonix.ams.dev.br

    DocumentRoot /var/www/agenda/frontend/build

    ErrorLog ${APACHE_LOG_DIR}/agenda_error.log
    CustomLog ${APACHE_LOG_DIR}/agenda_access.log combined

    <Directory /var/www/agenda/frontend/build>
        Options -Indexes +FollowSymLinks
        AllowOverride None
        Require all granted
    </Directory>

    Alias /api /var/www/agenda/backend/public
    <Directory /var/www/agenda/backend/public>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    Alias /storage /var/www/agenda/backend/public/storage
    <Directory /var/www/agenda/backend/public/storage>
        Options -Indexes +FollowSymLinks
        AllowOverride None
        Require all granted
    </Directory>

    RewriteEngine On
    RewriteCond %{REQUEST_URI} !^/api(/|$) [NC]
    RewriteCond %{REQUEST_URI} !^/storage(/|$) [NC]
    RewriteCond %{DOCUMENT_ROOT}%{REQUEST_URI} !-f
    RewriteCond %{DOCUMENT_ROOT}%{REQUEST_URI} !-d
    RewriteRule ^ /index.html [L]
</VirtualHost>
```

Habilite o site:

```bash
sudo a2dissite 000-default.conf
sudo a2ensite agenda.conf
sudo apache2ctl configtest
sudo systemctl reload apache2
```

Se a mesma VPS tambem hospeda outros dominios, como `app.advsis.com`, confira se o Apache esta associando `kyonix.ams.dev.br` ao VirtualHost correto:

```bash
sudo apache2ctl -S
sudo ls -la /etc/apache2/sites-enabled
sudo grep -R "app.advsis.com\|kyonix.ams.dev.br\|Redirect\|RewriteRule" -n /etc/apache2/sites-available /etc/apache2/sites-enabled
```

O resultado esperado e que `kyonix.ams.dev.br` apareca no arquivo `agenda.conf`. Se ele aparecer em outro arquivo, ou se houver `ServerAlias kyonix.ams.dev.br` no VirtualHost de `app.advsis.com`, remova esse alias do site antigo e recarregue o Apache:

```bash
sudo apache2ctl configtest
sudo systemctl reload apache2
```

## 7. Liberar firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Apache Full'
sudo ufw --force enable
sudo ufw status
```

## 8. Ativar HTTPS com Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-apache
sudo certbot --apache -d kyonix.ams.dev.br
```

Teste a renovacao automatica:

```bash
sudo certbot renew --dry-run
```

Apos ativar HTTPS, confira se `APP_URL`, `FRONTEND_URL` e `SANCTUM_STATEFUL_DOMAINS` estao corretos no `.env`. Se alterar o `.env`, limpe e recrie o cache:

```bash
cd /var/www/agenda/backend
php artisan optimize:clear
php artisan config:cache
php artisan view:cache
```

## 9. Configurar tarefas agendadas

Abra o crontab:

```bash
sudo crontab -e
```

Adicione:

```cron
* * * * * cd /var/www/agenda/backend && php artisan schedule:run >> /dev/null 2>&1
```

## 10. Configurar filas com Supervisor

Se `QUEUE_CONNECTION=database`, configure um worker:

```bash
sudo apt install -y supervisor
sudo nano /etc/supervisor/conf.d/agenda-worker.conf
```

Conteudo:

```ini
[program:agenda-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/agenda/backend/artisan queue:work --sleep=3 --tries=3 --max-time=3600
directory=/var/www/agenda/backend
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=1
redirect_stderr=true
stdout_logfile=/var/www/agenda/backend/storage/logs/worker.log
stopwaitsecs=3600
```

Ative:

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start agenda-worker:*
```

## 11. Validar instalacao

Confira o status dos servicos:

```bash
sudo systemctl status apache2
sudo systemctl status mysql
```

Teste a home:

```bash
curl -I https://kyonix.ams.dev.br
```

Teste a API:

```bash
curl https://kyonix.ams.dev.br/api/public/estabelecimentos
```

Confira as tabelas:

```bash
mysql -u agenda_user -p agenda -e "SHOW TABLES;"
```

Acesse no navegador:

- Home institucional: `https://kyonix.ams.dev.br/`
- Login de clientes: `https://kyonix.ams.dev.br/login`
- Area restrita gestor/admin: `https://kyonix.ams.dev.br/admin-login`
- Link exclusivo por estabelecimento: `https://kyonix.ams.dev.br/agendar/{slug}`

## 12. Atualizar uma instalacao existente

Use este fluxo para publicar novas versoes:

```bash
cd /var/www/agenda
git pull

cd backend
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan optimize:clear
php artisan config:cache
php artisan view:cache

cd ../frontend
npm ci
npm run build

sudo chown -R www-data:www-data /var/www/agenda/backend/storage /var/www/agenda/backend/bootstrap/cache
sudo systemctl reload apache2
sudo supervisorctl restart agenda-worker:*
```

## Solucao de problemas

**Erro 500 no Laravel**

Veja os logs:

```bash
sudo tail -f /var/log/apache2/agenda_error.log
sudo tail -f /var/www/agenda/backend/storage/logs/laravel.log
```

Corrija permissoes:

```bash
sudo chown -R www-data:www-data /var/www/agenda/backend/storage /var/www/agenda/backend/bootstrap/cache
sudo chmod -R 775 /var/www/agenda/backend/storage /var/www/agenda/backend/bootstrap/cache
```

**Rotas do React retornam 404**

Confira se o modulo `rewrite` esta ativo e se o VirtualHost possui a regra de fallback para `/index.html`:

```bash
sudo a2enmod rewrite
sudo apache2ctl configtest
sudo systemctl reload apache2
```

**API retorna HTML em vez de JSON**

Confira se o `Alias /api /var/www/agenda/backend/public` existe no VirtualHost e se o arquivo `backend/public/.htaccess` esta presente.

**Erro ao fazer login na VPS**

Teste o endpoint direto na VPS:

```bash
curl -i -X POST https://kyonix.ams.dev.br/api/login \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sistema.com","password":"010200"}'
```

Interprete o retorno:

- `200 OK`: o backend autenticou; o problema esta no frontend/build/cache do navegador.
- `404` ou HTML do React: o Apache nao esta encaminhando `/api` para o Laravel.
- `404` com `The route login could not be found`: o Apache encaminhou para o Laravel, mas o prefixo foi duplicado/removido. Confirme `APP_API_PREFIX=` vazio no `.env`, rode `php artisan optimize:clear` e depois `php artisan config:cache`.
- `419` ou erro de CORS: confira `FRONTEND_URL`, limpe o cache do Laravel e gere o build novamente.
- `422 As credenciais estao incorretas`: o seeder nao rodou, a senha foi alterada, ou o usuario nao existe na base da VPS.
- `500`: confira os logs do Laravel e Apache.

Comandos uteis:

```bash
cd /var/www/agenda/backend
php artisan optimize:clear
php artisan migrate --force
php artisan db:seed --class=DatabaseSeeder --force
php artisan config:cache

mysql -u agenda_user -p agenda -e "SELECT id,email,role,empresa_id FROM users WHERE email='admin@sistema.com';"

sudo tail -n 100 /var/www/agenda/backend/storage/logs/laravel.log
sudo tail -n 100 /var/log/apache2/agenda_error.log
```

**Dominio abre outro subdominio**

Se `https://kyonix.ams.dev.br` abrir `https://app.advsis.com/login`, os dois nomes provavelmente apontam para o mesmo IP e o Apache esta usando o VirtualHost errado ou existe um redirect no site antigo.

Na VPS, rode:

```bash
sudo apache2ctl -S
sudo grep -R "app.advsis.com\|kyonix.ams.dev.br\|Redirect\|RewriteRule" -n /etc/apache2/sites-available /etc/apache2/sites-enabled
```

Corrija para que:

- `agenda.conf` tenha `ServerName kyonix.ams.dev.br`
- o VirtualHost de `app.advsis.com` nao tenha `ServerAlias kyonix.ams.dev.br`
- nenhum `Redirect` ou `RewriteRule` envie `kyonix.ams.dev.br` para `app.advsis.com/login`
- o VirtualHost SSL gerado pelo Certbot tambem use `ServerName kyonix.ams.dev.br`

Depois aplique:

```bash
sudo apache2ctl configtest
sudo systemctl reload apache2
curl -I https://kyonix.ams.dev.br
```

**CORS em producao**

No deploy de dominio unico, mantenha:

```env
FRONTEND_URL=https://kyonix.ams.dev.br
```

Depois recarregue o cache:

```bash
cd /var/www/agenda/backend
php artisan optimize:clear
php artisan config:cache
```

**CSS ou JS do frontend nao carregam**

Gere o build novamente e confirme se a pasta existe:

```bash
cd /var/www/agenda/frontend
npm run build
ls -la build
```

**Certificado SSL nao renova**

Teste o certbot e confira DNS/firewall:

```bash
sudo certbot renew --dry-run
sudo ufw status
```

## Backup rapido

Banco de dados:

```bash
mysqldump -u agenda_user -p agenda > agenda_$(date +%F).sql
```

Arquivos enviados pelo sistema:

```bash
sudo tar -czf agenda_storage_$(date +%F).tar.gz /var/www/agenda/backend/storage/app/public
```
