# Arquivo de Configuração - Sistema de Agendamento

Este arquivo contém exemplos de configuração para diferentes ambientes.

## Atualização SaaS Multiempresa

Depois de configurar o `.env`, rode:

```bash
cd backend
php artisan migrate
php artisan db:seed --class=DatabaseSeeder
```

O seeder cria os planos `Start` e `Pro`, uma empresa demonstração e o gestor inicial:

```txt
E-mail: admin@sistema.com
Senha: 010200
Role: gestor
```

Para links exclusivos de estabelecimento, confirme que o domínio público do frontend está correto. Em desenvolvimento, o link copiado usa `window.location.origin`, por exemplo `http://localhost:3000/agendar/unidade-centro`.

## Backend (.env)

### Desenvolvimento Local

```env
# Aplicação
APP_NAME=Agenda
APP_ENV=local
APP_KEY=base64:YOUR_APP_KEY_HERE
APP_DEBUG=true
APP_URL=http://localhost:8000

# Banco de Dados
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=agenda
DB_USERNAME=root
DB_PASSWORD=

# Cache
CACHE_DRIVER=file
QUEUE_CONNECTION=sync
SESSION_DRIVER=file

# E-mail (para desenvolvimento)
MAIL_MAILER=log
MAIL_FROM_ADDRESS=noreply@agenda.local
MAIL_FROM_NAME="${APP_NAME}"

# Sanctum (API Tokens)
SANCTUM_STATEFUL_DOMAINS=localhost:3000,127.0.0.1:3000

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### Produção

```env
# Aplicação
APP_NAME=Agenda
APP_ENV=production
APP_KEY=base64:YOUR_SECURE_APP_KEY_HERE
APP_DEBUG=false
APP_URL=https://agenda.com

# Banco de Dados
DB_CONNECTION=mysql
DB_HOST=your-db-host.com
DB_PORT=3306
DB_DATABASE=agenda_prod
DB_USERNAME=prod_user
DB_PASSWORD=secure_password_123

# Cache e Sessão
CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis
SESSION_LIFETIME=120

# Redis (se usado)
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

# E-mail
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=noreply@agenda.com
MAIL_PASSWORD=your_app_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@agenda.com
MAIL_FROM_NAME="${APP_NAME}"

# Sanctum
SANCTUM_STATEFUL_DOMAINS=agenda.com,www.agenda.com

# CORS
CORS_ALLOWED_ORIGINS=https://agenda.com,https://www.agenda.com
```

## Frontend (.env)

### Desenvolvimento

```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_VERSION=1.0.0
REACT_APP_ENVIRONMENT=development
```

### Produção

```env
REACT_APP_API_URL=https://api.agenda.com
REACT_APP_VERSION=1.0.0
REACT_APP_ENVIRONMENT=production
```

## Nginx (Produção)

```nginx
# /etc/nginx/sites-available/agenda
server {
    listen 80;
    server_name agenda.com www.agenda.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name agenda.com www.agenda.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/agenda.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/agenda.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Root directory
    root /var/www/html/agenda/public;
    index index.php index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # API routes
    location /api {
        try_files $uri $uri/ /index.php?$query_string;

        location ~ \.php$ {
            fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
            fastcgi_index index.php;
            fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
            include fastcgi_params;
        }
    }

    # Static files (React build)
    location / {
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            try_files $uri =404;
        }
    }

    # PHP files
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # Logs
    access_log /var/log/nginx/agenda_access.log;
    error_log /var/log/nginx/agenda_error.log;

    # Rate limiting
    limit_req zone=api burst=10 nodelay;
    limit_req_status 429;
}

# Rate limiting zone
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
```

## Apache (.htaccess)

```apache
# /var/www/html/agenda/.htaccess
<IfModule mod_rewrite.c>
    RewriteEngine On

    # Redirect to HTTPS
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

    # Handle React Router
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^ index.html [QSA,L]

    # API routes to Laravel
    RewriteCond %{REQUEST_URI} ^/api
    RewriteRule ^ index.php [QSA,L]
</IfModule>

# Security headers
<IfModule mod_headers.c>
    Header always set X-Frame-Options SAMEORIGIN
    Header always set X-XSS-Protection "1; mode=block"
    Header always set X-Content-Type-Options nosniff
    Header always set Referrer-Policy "no-referrer-when-downgrade"
    Header always set Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'"
</IfModule>

# Compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Cache control
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>
```

## Docker (Opcional)

### Dockerfile (Laravel)

```dockerfile
FROM php:8.1-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    zip \
    unzip \
    nodejs \
    npm

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www

# Copy existing application directory contents
COPY . /var/www

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader

# Build frontend assets
RUN npm install && npm run build

# Create storage link
RUN php artisan storage:link

# Set permissions
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache

EXPOSE 9000
CMD ["php-fpm"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: agenda-app
    restart: unless-stopped
    working_dir: /var/www
    volumes:
      - ./:/var/www
      - ./docker/php/local.ini:/usr/local/etc/php/conf.d/local.ini
    networks:
      - agenda

  nginx:
    image: nginx:alpine
    container_name: agenda-nginx
    restart: unless-stopped
    ports:
      - "8000:80"
    volumes:
      - ./:/var/www
      - ./docker/nginx/conf.d/:/etc/nginx/conf.d/
    networks:
      - agenda

  db:
    image: mysql:8.0
    container_name: agenda-db
    restart: unless-stopped
    environment:
      MYSQL_DATABASE: agenda
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_USER: agenda
      MYSQL_PASSWORD: password
    ports:
      - "3306:3306"
    volumes:
      - dbdata:/var/lib/mysql
    networks:
      - agenda

  redis:
    image: redis:alpine
    container_name: agenda-redis
    restart: unless-stopped
    networks:
      - agenda

networks:
  agenda:
    driver: bridge

volumes:
  dbdata:
    driver: local
```

## Scripts de Deploy

### deploy.sh

```bash
#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting deployment..."

# Update code
git pull origin main

# Install/update dependencies
composer install --no-dev --optimize-autoloader
npm install
npm run build

# Run migrations
php artisan migrate --force

# Clear and cache config
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Set permissions
chown -R www-data:www-data storage bootstrap/cache

# Restart services
sudo systemctl restart nginx
sudo systemctl restart php8.1-fpm

echo "✅ Deployment completed successfully!"
```

### backup.sh

```bash
#!/bin/bash

# Database backup
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > backup_$DATE.sql

# Compress
gzip backup_$DATE.sql

# Upload to cloud storage (exemplo com AWS S3)
aws s3 cp backup_$DATE.sql.gz s3://agenda-backups/

# Clean old backups (keep last 7 days)
find . -name "backup_*.sql.gz" -mtime +7 -delete

echo "📦 Backup completed: backup_$DATE.sql.gz"
```

## Monitoramento

### Health Check

```php
// routes/web.php
Route::get('/health', function () {
    $health = [
        'status' => 'ok',
        'timestamp' => now(),
        'services' => [
            'database' => DB::connection()->getPdo() ? 'ok' : 'error',
            'cache' => Cache::store()->getStore() ? 'ok' : 'error',
            'storage' => is_writable(storage_path()) ? 'ok' : 'error',
        ],
        'version' => config('app.version', '1.0.0'),
        'environment' => app()->environment(),
    ];

    $statusCode = collect($health['services'])->contains('error') ? 503 : 200;

    return response()->json($health, $statusCode);
});
```

### Log Rotation

```bash
# /etc/logrotate.d/laravel
/var/www/html/agenda/backend/storage/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        if /usr/sbin/php-fpm8.1 --version > /dev/null 2>&1; then
            systemctl reload php8.1-fpm
        fi
    endscript
}
```

## Variáveis de Ambiente Seguras

### Usando Vault (HashiCorp)

```hcl
# vault-agent.hcl
pid_file = "/tmp/vault-agent.pid"

vault {
  address = "https://vault.agenda.com"
}

auto_auth {
  method "aws" {
    mount_path = "auth/aws"
    config = {
      type = "iam"
      role = "agenda-app"
    }
  }
}

template {
  source = "/etc/vault/templates/.env.tpl"
  destination = "/var/www/.env"
}
```

### AWS Systems Manager Parameter Store

```bash
# Recuperar parâmetros
DB_PASSWORD=$(aws ssm get-parameter --name "/agenda/prod/db_password" --with-decryption --query Parameter.Value --output text)

MAIL_PASSWORD=$(aws ssm get-parameter --name "/agenda/prod/mail_password" --with-decryption --query Parameter.Value --output text)
```

---

*Atualize essas configurações de acordo com seu ambiente específico.*
