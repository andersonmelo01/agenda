# Troubleshooting - Sistema de Agendamento

Este guia ajuda a resolver problemas comuns durante desenvolvimento e produção.

## Atualização SaaS Multiempresa

Problemas comuns do modo SaaS:

- **Gestor não vê Empresas/Planos**: confirme que o usuário tem `role = gestor`.
- **Admin vê dados de outra empresa**: revise escopos por `empresa_id`; admins não devem acessar dados fora do próprio tenant.
- **Não consigo criar nova filial**: a empresa atingiu `limite_locais`; ajuste o plano Pro ou aumente o limite em `/gestor/empresas`.
- **Link `/agendar/{slug}` mostra local errado ou 404**: confirme o campo `slug` do estabelecimento e se a empresa está com `status = ativo`.
- **Cliente tenta acessar `/agendar` sem local**: esse fluxo não existe mais. Envie sempre o link exclusivo `/agendar/{slug}` gerado na tela de Estabelecimentos.

## 🚨 Problemas Comuns

### 1. Erro: "SQLSTATE[HY000] [2002] Connection refused"

**Sintomas:**
- Erro de conexão com banco de dados
- Aplicação não consegue acessar MySQL

**Soluções:**

1. **Verificar se MySQL está rodando:**
```bash
# Windows (XAMPP)
net start mysql

# Linux
sudo systemctl status mysql
sudo systemctl start mysql

# macOS
brew services start mysql
```

2. **Verificar credenciais no .env:**
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=agenda
DB_USERNAME=root
DB_PASSWORD=
```

3. **Testar conexão:**
```bash
mysql -h 127.0.0.1 -P 3306 -u root -p
```

4. **Verificar se porta está livre:**
```bash
# Windows
netstat -ano | findstr :3306

# Linux/macOS
lsof -i :3306
```

### 2. Erro: "The only supported ciphers are AES-128-CBC and AES-256-CBC"

**Sintomas:**
- Erro ao executar comandos Laravel
- APP_KEY inválida

**Solução:**
```bash
# Gerar nova chave
php artisan key:generate

# Ou definir manualmente
php artisan key:generate --show
# Copie a chave gerada para APP_KEY no .env
```

### 3. Erro: "Class 'App\Models\ModelName' not found"

**Sintomas:**
- Erro de classe não encontrada
- Model não reconhecido

**Solução:**
```bash
# Limpar cache do composer
composer dump-autoload

# Ou recarregar
composer install
```

### 4. Erro: "419 Page Expired" (CSRF Token)

**Sintomas:**
- Formulários retornam erro 419
- Problemas com sessões

**Solução:**
```bash
# Limpar cache de sessões
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

### 5. Frontend: "Failed to fetch" / CORS Error

**Sintomas:**
- Requests da API falham
- Erro de CORS no console

**Soluções:**

1. **Verificar se backend está rodando:**
```bash
curl http://localhost:8000/api/health
```

2. **Verificar configuração CORS no Laravel:**
```php
// config/cors.php
'allowed_origins' => ['http://localhost:3000', 'http://127.0.0.1:3000'],
'allowed_methods' => ['*'],
'allowed_headers' => ['*'],
'supports_credentials' => false,
```

3. **Verificar URL da API no frontend:**
```javascript
// frontend/.env
REACT_APP_API_URL=http://localhost:8000
```

### 6. Erro: "Token has expired" (Sanctum)

**Sintomas:**
- Usuário deslogado automaticamente
- Tokens expiram rapidamente

**Solução:**
```php
// config/sanctum.php
'expiration' => null, // Nunca expira, ou definir em minutos
```

### 7. E-mail não é enviado

**Sintomas:**
- Agendamentos criados mas sem e-mail
- Log mostra erro de SMTP

**Soluções:**

1. **Verificar configuração de e-mail:**
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=seu-email@gmail.com
MAIL_PASSWORD=sua-senha-app
MAIL_ENCRYPTION=tls
```

2. **Para Gmail, gerar senha de app:**
   - Acesse [Google Account Settings](https://myaccount.google.com/security)
   - Ative 2FA
   - Gere senha de app em "App passwords"

3. **Testar envio:**
```bash
php artisan tinker
>>> Mail::raw('Test email', function($msg) { $msg->to('test@example.com')->subject('Test'); });
```

4. **Verificar logs:**
```bash
tail -f storage/logs/laravel.log
```

### 8. Frontend: Branco/Erro de build

**Sintomas:**
- Página em branco
- Erro no console do navegador

**Soluções:**

1. **Verificar build:**
```bash
cd frontend
npm run build
```

2. **Verificar se arquivos foram servidos:**
```bash
ls -la build/
```

3. **Limpar cache do navegador**

4. **Verificar console do navegador:**
   - Abra DevTools (F12)
   - Vá para Console
   - Procure por erros JavaScript

### 9. Erro: "Port 8000 already in use"

**Sintomas:**
- Não consegue iniciar servidor Laravel
- Porta ocupada

**Solução:**
```bash
# Encontrar processo usando a porta
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/macOS
lsof -ti:8000 | xargs kill -9

# Ou usar porta diferente
php artisan serve --port=8001
```

### 10. Problemas de Permissões (Linux/macOS)

**Sintomas:**
- Erro ao escrever em storage/logs
- Permissões negadas

**Solução:**
```bash
# Definir permissões corretas
sudo chown -R $USER:www-data backend
sudo chown -R $USER:www-data backend/storage
sudo chown -R $USER:www-data backend/bootstrap/cache

# Permissões
chmod -R 775 backend/storage
chmod -R 775 backend/bootstrap/cache
```

## 🔍 Debugging

### Backend (Laravel)

#### 1. Habilitar Debug Mode
```env
APP_DEBUG=true
APP_LOG_LEVEL=debug
```

#### 2. Ver Logs em Tempo Real
```bash
tail -f backend/storage/logs/laravel.log
```

#### 3. Debugbar (Desenvolvimento)
```bash
composer require barryvdh/laravel-debugbar --dev
```

#### 4. Usar Tinker para Testes
```bash
php artisan tinker

# Testar queries
>>> App\Models\User::all()
>>> App\Models\User::find(1)->agendamentos

# Testar e-mail
>>> Mail::to('test@example.com')->send(new App\Mail\TestMail())
```

#### 5. Ver Queries Executadas
```php
// Em qualquer controller
\DB::enableQueryLog();
// ... código ...
dd(\DB::getQueryLog());
```

### Frontend (React)

#### 1. React DevTools
- Instale extensão do Chrome/Firefox
- Visualize componentes, estado e props

#### 2. Console Logging
```javascript
// Debug de estado
useEffect(() => {
  console.log('State changed:', state);
}, [state]);

// Debug de API calls
const originalRequest = window.fetch;
window.fetch = async (...args) => {
  console.log('Fetch called:', args);
  const result = await originalRequest(...args);
  console.log('Fetch result:', result);
  return result;
};
```

#### 3. Network Tab
- Abra DevTools → Network
- Verifique status dos requests
- Veja headers e payloads

#### 4. Component Stack Trace
```javascript
// Em desenvolvimento, erros mostram stack trace completo
// Procure por "Error:" no console
```

### Banco de Dados

#### 1. Ver Estrutura das Tabelas
```sql
DESCRIBE users;
SHOW CREATE TABLE users;
```

#### 2. Ver Dados
```sql
SELECT * FROM users LIMIT 5;
SELECT COUNT(*) FROM agendamentos WHERE status = 'confirmado';
```

#### 3. Ver Queries Lentas
```sql
SHOW PROCESSLIST;
SHOW ENGINE INNODB STATUS;
```

#### 4. phpMyAdmin/HeidiSQL
- Interface gráfica para debug de banco
- Execute queries manualmente
- Visualize estrutura e relacionamentos

## 🧪 Testes

### Backend

#### Executar Testes
```bash
# Todos os testes
php artisan test

# Teste específico
php artisan test --filter=UserTest

# Com coverage
php artisan test --coverage
```

#### Criar Teste
```bash
php artisan make:test UserTest
php artisan make:test Feature/AuthTest
```

### Frontend

#### Executar Testes
```bash
cd frontend

# Todos os testes
npm test

# Com coverage
npm test -- --coverage --watchAll=false
```

#### Teste Manual da API
```bash
# Usando curl
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sistema.com","password":"010200"}'

# Usando Python
python3 -c "
import requests
response = requests.post('http://localhost:8000/api/login', json={
    'email': 'admin@sistema.com',
    'password': '010200'
})
print('Status:', response.status_code)
print('Response:', response.json())
"
```

## 🚀 Performance

### Problemas de Performance

#### 1. Queries Lentas
```sql
-- Ver queries lentas
SHOW PROCESSLIST;

-- Adicionar índices
ALTER TABLE agendamentos ADD INDEX idx_agenda_horario (agenda_id, horario);
ALTER TABLE agendas ADD INDEX idx_data_profissional (data, profissional_id);
```

#### 2. Memória PHP
```ini
# php.ini
memory_limit = 256M
max_execution_time = 300
```

#### 3. Cache do Laravel
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan optimize
```

#### 4. Frontend Bundle
```bash
cd frontend

# Analisar bundle
npm install --save-dev webpack-bundle-analyzer
npm run build -- --analyze
```

## 🔒 Segurança

### Verificações de Segurança

#### 1. Headers de Segurança
```bash
# Testar headers
curl -I http://localhost:8000

# Deve conter:
# X-Frame-Options: SAMEORIGIN
# X-XSS-Protection: 1; mode=block
# X-Content-Type-Options: nosniff
```

#### 2. Verificar Exposição de Informações
```bash
# APP_DEBUG deve ser false em produção
grep "APP_DEBUG" .env
```

#### 3. Verificar Senhas
```bash
# Nunca commite senhas
git log --oneline --grep="password"
```

#### 4. Verificar Dependências Vulneráveis
```bash
# Backend
composer audit

# Frontend
npm audit
```

## 📞 Suporte

### Quando Pedir Ajuda

1. **Colete informações:**
   - Versão do PHP/Node
   - Sistema operacional
   - Logs de erro completos
   - Passos para reproduzir

2. **Ferramentas de diagnóstico:**
```bash
# Informações do sistema
php -v
node -v
npm -v
composer -v

# Status dos serviços
# Windows
net start | findstr mysql
# Linux
systemctl status mysql nginx php8.1-fpm
```

3. **Logs relevantes:**
```bash
# Laravel logs
tail -50 backend/storage/logs/laravel.log

# Nginx logs
tail -50 /var/log/nginx/error.log

# Node logs (se aplicável)
tail -50 ~/.npm/_logs/*.log
```

### Checklist de Troubleshooting

- [ ] Backend está rodando? (`php artisan serve`)
- [ ] Frontend está rodando? (`npm start`)
- [ ] Banco de dados está acessível?
- [ ] Migrations foram executadas? (`php artisan migrate:status`)
- [ ] Arquivo .env existe e está correto?
- [ ] Dependências instaladas? (`composer install` e `npm install`)
- [ ] Cache limpo? (`php artisan cache:clear`)
- [ ] Permissões corretas nos arquivos?
- [ ] Firewall bloqueando portas?
- [ ] Antivirus interferindo?

---

*Lembre-se: a maioria dos problemas são causados por configuração incorreta ou serviços não iniciados.*
