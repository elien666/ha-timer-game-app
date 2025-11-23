# Stage 1: Build the Vite app
FROM node:20-alpine AS builder

WORKDIR /app

# Accept build arguments for environment variables
ARG VITE_HASS_HOST
ARG VITE_HASS_ACCESS_TOKEN
ARG VITE_HASS_BUTTON_ENTITY

# Set as environment variables for the build
ENV VITE_HASS_HOST=$VITE_HASS_HOST
ENV VITE_HASS_ACCESS_TOKEN=$VITE_HASS_ACCESS_TOKEN
ENV VITE_HASS_BUTTON_ENTITY=$VITE_HASS_BUTTON_ENTITY

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Install Node.js for the config injection script
RUN apk add --no-cache nodejs npm

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy config injection script
COPY inject-config.js /usr/local/bin/inject-config.js
RUN chmod +x /usr/local/bin/inject-config.js

# Create entrypoint script
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'node /usr/local/bin/inject-config.js' >> /docker-entrypoint.sh && \
    echo 'exec nginx -g "daemon off;"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

# Expose port 80
EXPOSE 80

# Use custom entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]

