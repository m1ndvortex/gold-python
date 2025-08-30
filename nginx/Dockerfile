# Nginx Dockerfile with SSL and Security Configuration
FROM nginx:1.25-alpine

# Install OpenSSL for certificate generation
RUN apk add --no-cache openssl

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy SSL generation script
COPY generate-ssl.sh /usr/local/bin/generate-ssl.sh
RUN chmod +x /usr/local/bin/generate-ssl.sh

# Create SSL directory
RUN mkdir -p /etc/nginx/ssl

# Create log directories
RUN mkdir -p /var/log/nginx

# Create web root directory
RUN mkdir -p /var/www/html

# Create basic error pages
RUN echo '<h1>404 - Page Not Found</h1>' > /usr/share/nginx/html/404.html
RUN echo '<h1>500 - Internal Server Error</h1>' > /usr/share/nginx/html/500.html

# Generate SSL certificates on container start
RUN /usr/local/bin/generate-ssl.sh

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f https://localhost/health || exit 1

# Expose ports
EXPOSE 80 443

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]