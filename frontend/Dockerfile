FROM node:18-alpine

WORKDIR /app

# Copiar package.json e instalar dependências
COPY package*.json ./
RUN npm install

# Copiar código
COPY . .

# Expor porta
EXPOSE 3000

# Iniciar aplicação
CMD ["npm", "start"]