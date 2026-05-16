# Instalacao em VPS Ubuntu com Apache2

Guia de instalacao do Sistema Agenda em uma VPS Ubuntu usando Apache2, MySQL, PHP 8.3 e Node.js.

Dominio usado nos exemplos:

- `kyonix.ams.dev.br`

Estrutura do projeto:

- Backend Laravel: `/var/www/agenda/backend`
- Frontend React: `/var/www/agenda/frontend`
- Build publico do React: `/var/www/agenda/frontend/build`
- API Laravel exposta em: `https://kyonix.ams.dev.br/api`

Importante: este guia nao usa `Alias /api`. O Apache preserva a URL `/api/...` e apenas encaminha internamente para `backend/public/index.php`. Assim o Laravel continua usando o prefixo padrao `api` e o login fica em `/api/login`.

## 1. Preparar servidor

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y curl wget git unzip software-properties-common ca-certificates lsb-release apt-transport-https
```

Instale Apache2:

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

Habilite modulos do Apache:

```bash
sudo a2enmod rewrite headers expires php8.3
sudo systemctl restart apache2
```

Instale MySQL:

```bash
sudo apt install -y mysql-server
sudo systemctl enable mysql
sudo systemctl start mysql
sudo mysql_secure_installation
```

Instale Node.js 20:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

Instale Composer:

```bash
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
composer --version
```

## 2. Baixar projeto

```bash
cd /var/www
sudo git clone <URL_DO_REPOSITORIO> agenda
sudo chown -R $USER:www-data /var/www/agenda
cd /var/www/agenda
```

## 3. Banco de dados

Entre no MySQL:

```bash
sudo mysql
```

Crie banco e usuario. Troque `SENHA_FORTE_DO_BANCO` por uma senha real:

```sql
CREATE DATABASE agenda CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'agenda_user'@'localhost' IDENTIFIED BY 'SENHA_FORTE_DO_BANCO';
GRANT ALL PRIVILEGES ON agenda.* TO 'agenda_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 4. Backend Laravel

```bash
cd /var/www/agenda/backend
composer install --no-dev --optimize-autoloader
cp .env.example .env
nano .env
```

Use esta base:

```env
APP_NAME="Sistema de Agendamento"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://kyonix.ams.dev.br

LOG_CHANNEL=stack
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=agenda
DB_USERNAME=agenda_user
DB_PASSWORD=SENHA_FORTE_DO_BANCO

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

Nao defina `APP_API_PREFIX=` vazio para este VirtualHost. O Laravel deve manter o prefixo padrao `api`.

Finalize o backend:

```bash
php artisan key:generate
php artisan migrate --force
php artisan db:seed --class=DatabaseSeeder --force
php artisan storage:link

sudo chown -R www-data:www-data /var/www/agenda/backend/storage /var/www/agenda/backend/bootstrap/cache
sudo chmod -R 775 /var/www/agenda/backend/storage /var/www/agenda/backend/bootstrap/cache

php artisan optimize:clear
php artisan config:cache
php artisan view:cache
php artisan route:list --path=login
```

O `route:list` deve mostrar:

```txt
POST api/login
```

Login inicial criado pelo seeder:

```txt
E-mail: admin@sistema.com
Senha: 010200
```

Altere essa senha logo no primeiro acesso.

## 5. Frontend React

Em producao no mesmo dominio, use:

```bash
cd /var/www/agenda/frontend
nano .env.production
```

Conteudo:

```env
REACT_APP_API_URL=https://kyonix.ams.dev.br
```

Assim o frontend chamara `https://kyonix.ams.dev.br/api/login`.

Gere o build:

```bash
npm ci
npm run build
```

## 6. Apache2

Crie o VirtualHost:

```bash
sudo nano /etc/apache2/sites-available/agenda.conf
```

Conteudo recomendado:

```apache
<VirtualHost *:80>
    ServerName kyonix.ams.dev.br

    DocumentRoot /var/www/agenda/frontend/build
    DirectoryIndex index.html index.php

    ErrorLog ${APACHE_LOG_DIR}/agenda_error.log
    CustomLog ${APACHE_LOG_DIR}/agenda_access.log combined

    <Directory /var/www/agenda/frontend/build>
        Options -Indexes +FollowSymLinks -MultiViews
        AllowOverride None
        Require all granted
    </Directory>

    <Directory /var/www/agenda/backend/public>
        Options -Indexes +FollowSymLinks -MultiViews
        AllowOverride All
        Require all granted
    </Directory>

    Alias /storage/ /var/www/agenda/backend/public/storage/
    <Directory /var/www/agenda/backend/public/storage>
        Options -Indexes +FollowSymLinks
        AllowOverride None
        Require all granted
    </Directory>

    RewriteEngine On

    # Mantem Authorization: Bearer para Laravel Sanctum/token.
    RewriteCond %{HTTP:Authorization} .
    RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

    # Envia /api/... ao Laravel preservando a URL original /api/...
    RewriteRule ^/api(/.*)?$ /var/www/agenda/backend/public/index.php [L,QSA]

    # Arquivos reais do React.
    RewriteCond %{DOCUMENT_ROOT}%{REQUEST_URI} -f [OR]
    RewriteCond %{DOCUMENT_ROOT}%{REQUEST_URI} -d
    RewriteRule ^ - [L]

    # Fallback da SPA React para /, /login, /admin-login, /agendar/{slug}.
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

Se a VPS tambem hospeda `app.advsis.com`, confira se `kyonix.ams.dev.br` esta no VirtualHost correto:

```bash
sudo apache2ctl -S
sudo grep -R "app.advsis.com\|kyonix.ams.dev.br\|ServerAlias\|Redirect\|RewriteRule" -n /etc/apache2/sites-available /etc/apache2/sites-enabled
```

O dominio `kyonix.ams.dev.br` deve aparecer no `agenda.conf`, e nao como `ServerAlias` do site `app.advsis.com`.

## 7. Firewall e HTTPS

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Apache Full'
sudo ufw --force enable
sudo ufw status
```

Ative HTTPS:

```bash
sudo apt install -y certbot python3-certbot-apache
sudo certbot --apache -d kyonix.ams.dev.br
sudo apache2ctl configtest
sudo systemctl reload apache2
```

Teste renovacao:

```bash
sudo certbot renew --dry-run
```

## 8. Validar instalacao

Teste a home:

```bash
curl -I https://kyonix.ams.dev.br
```

Teste endpoint publico:

```bash
curl -i https://kyonix.ams.dev.br/api/public/estabelecimentos
```

Teste login direto:

```bash
curl -I -X POST https://kyonix.ams.dev.br/api/login \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sistema.com","password":"010200"}'
```

Resultado esperado do login:

```txt
HTTP/2 200
```

ou `HTTP/1.1 200 OK`, com JSON contendo `access_token`, `token` e `user`.

Se retornar `The route login could not be found`, ainda existe `Alias /api` ou regra antiga em algum VirtualHost ativo. Rode:

```bash
sudo apache2ctl -S
sudo grep -R "Alias /api\|APP_API_PREFIX\|kyonix.ams.dev.br" -n /etc/apache2/sites-available /etc/apache2/sites-enabled /var/www/agenda/backend/.env
```

## 9. Cron e filas

Cron do Laravel:

```bash
sudo crontab -e
```

Adicione:

```cron
* * * * * cd /var/www/agenda/backend && php artisan schedule:run >> /dev/null 2>&1
```

Se `QUEUE_CONNECTION=database`, instale Supervisor:

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

## 10. Atualizar deploy

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
sudo apache2ctl configtest
sudo systemctl reload apache2
sudo supervisorctl restart agenda-worker:* || true
```

## 11. Solucao de problemas

**Login mostra "Erro ao fazer login" no frontend**

Teste primeiro pelo terminal:

```bash
curl -i -X POST https://kyonix.ams.dev.br/api/login \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sistema.com","password":"010200"}'
```

Interprete:

- `200`: backend ok; limpe cache do navegador e refaca `npm run build`.
- `404 The route login could not be found`: Apache ainda esta com `Alias /api` ou `.env` esta com `APP_API_PREFIX=` vazio.
- `422 As credenciais estao incorretas`: rode o seeder ou confira usuario/senha no banco.
- `500`: veja logs.

Comandos uteis:

```bash
cd /var/www/agenda/backend
php artisan route:list --path=login
mysql -u agenda_user -p agenda -e "SELECT id,email,role,empresa_id FROM users WHERE email='admin@sistema.com';"
sudo tail -n 100 /var/www/agenda/backend/storage/logs/laravel.log
sudo tail -n 100 /var/log/apache2/agenda_error.log
```

**API retorna HTML do React**

O Apache nao esta aplicando a regra `/api`. Confira:

```bash
sudo apache2ctl -S
sudo apache2ctl configtest
sudo systemctl reload apache2
```

**Dominio abre `app.advsis.com`**

Corrija o VirtualHost:

```bash
sudo apache2ctl -S
sudo grep -R "app.advsis.com\|kyonix.ams.dev.br\|ServerAlias\|Redirect" -n /etc/apache2/sites-available /etc/apache2/sites-enabled
```

Remova `kyonix.ams.dev.br` de qualquer `ServerAlias` do site antigo e recarregue o Apache.

**Permissao negada ou erro 500**

```bash
sudo chown -R www-data:www-data /var/www/agenda/backend/storage /var/www/agenda/backend/bootstrap/cache
sudo chmod -R 775 /var/www/agenda/backend/storage /var/www/agenda/backend/bootstrap/cache
cd /var/www/agenda/backend
php artisan optimize:clear
php artisan config:cache
```

## 12. Backup rapido

Banco:

```bash
mysqldump -u agenda_user -p agenda > agenda_$(date +%F).sql
```

Uploads:

```bash
sudo tar -czf agenda_storage_$(date +%F).tar.gz /var/www/agenda/backend/storage/app/public
```
