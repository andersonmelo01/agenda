# Dockerfile para Frontend React
FROM node:18-alpine

# Definir diretório de trabalho
WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Expor porta
EXPOSE 3000

# Comando para iniciar (usar servidor de produção)
RUN npm install -g serve
CMD ["serve", "-s", "build", "-l", "3000"]