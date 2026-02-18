# Build stage
FROM node:18-alpine AS builder

ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# Development stage
FROM node:18-alpine AS development

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]

# Production stage
FROM nginx:alpine AS production

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/nginx.conf
COPY nginx.prod.conf /etc/nginx/nginx.prod.conf.template
COPY docker-entrypoint-ssl.sh /docker-entrypoint.d/90-envsubst-prod.sh
RUN chmod +x /docker-entrypoint.d/90-envsubst-prod.sh

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"] 