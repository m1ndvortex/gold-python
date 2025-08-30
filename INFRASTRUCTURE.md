# Infrastructure Documentation

## Universal Inventory Management System - Docker Infrastructure

This document describes the comprehensive Docker infrastructure setup for the Universal Inventory Management System, including Nginx reverse proxy, SSL security, monitoring, backup procedures, and deployment strategies.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Internet/Users                           │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                  Nginx Reverse Proxy                           │
│              (SSL Termination, Security)                       │
└─────────────────────┬───────────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
┌───────▼──────┐ ┌────▼────┐ ┌──────▼──────┐
│   Frontend   │ │ Backend │ │   Static    │
│   (React)    │ │(FastAPI)│ │   Assets    │
└──────────────┘ └────┬────┘ └─────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
┌───────▼──────┐ ┌────▼────┐ ┌──────▼──────┐
│ PostgreSQL   │ │  Redis  │ │   File      │
│  Database    │ │  Cache  │ │  Storage    │
└──────────────┘ └─────────┘ └─────────────┘
```

## Components

### Core Services

1. **Nginx Reverse Proxy**
   - SSL termination with TLS 1.2/1.3
   - Security headers and rate limiting
   - Static file serving and caching
   - API request proxying

2. **PostgreSQL Database**
   - TimescaleDB extension for analytics
   - Enhanced schema with LTREE for categories
   - Double-entry accounting tables
   - Comprehensive audit trail

3. **Redis Cache**
   - Session management
   - API response caching
   - Real-time data storage

4. **FastAPI Backend**
   - RESTful API with health checks
   - Comprehensive business logic
   - Image processing and QR generation

5. **React Frontend**
   - Modern responsive UI
   - Progressive Web App features
   - Real-time updates

### Supporting Services

6. **Backup Service**
   - Automated daily backups
   - Database, Redis, and file backups
   - Retention policy management

7. **Monitoring Stack** (Optional)
   - Prometheus metrics collection
   - Grafana dashboards
   - Alert management

8. **Log Aggregation**
   - Fluentd log collection
   - Structured logging
   - Error tracking

## Deployment Environments

### Development Environment

```bash
# Start development environment
./scripts/deploy.sh development

# Or manually
docker-compose up -d
```

**Features:**
- Hot reloading for development
- Debug logging enabled
- Self-signed SSL certificates
- Direct container access

**Access:**
- Frontend: https://localhost
- Backend API: https://localhost/api
- Database: localhost:5432
- Redis: localhost:6379

### Testing Environment

```bash
# Start testing environment
./scripts/deploy.sh testing

# Or manually
docker-compose -f docker-compose.test.yml up -d
```

**Features:**
- Isolated test database
- Automated test execution
- CI/CD integration ready
- Performance testing support

### Production Environment

```bash
# Start production environment
./scripts/deploy.sh production

# Or manually
docker-compose -f docker-compose.prod.yml up -d
```

**Features:**
- Resource limits and optimization
- Real SSL certificates
- Comprehensive monitoring
- Automated backups
- Security hardening

## Security Features

### SSL/TLS Configuration

- **Protocols:** TLS 1.2 and 1.3 only
- **Ciphers:** Modern cipher suites with forward secrecy
- **HSTS:** Strict Transport Security enabled
- **Certificate Management:** Automated renewal support

### Security Headers

```
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: [Comprehensive CSP policy]
```

### Rate Limiting

- **API Endpoints:** 10 requests/second
- **Authentication:** 5 requests/minute
- **General Traffic:** 30 requests/second
- **Connection Limits:** 20 connections per IP

### Access Control

- Sensitive files blocked (`.env`, `.git`, etc.)
- Internal endpoints restricted
- Proper file permissions
- Secrets management

## Monitoring and Observability

### Health Checks

- **Basic Health:** `/api/health`
- **Detailed Health:** `/api/health/detailed`
- **Readiness:** `/api/health/readiness`
- **Liveness:** `/api/health/liveness`

### Metrics Collection

- **Application Metrics:** Custom business metrics
- **System Metrics:** CPU, memory, disk usage
- **Database Metrics:** Connection pool, query performance
- **Redis Metrics:** Memory usage, hit rates
- **Nginx Metrics:** Request rates, response times

### Logging

- **Structured Logging:** JSON format with correlation IDs
- **Log Levels:** DEBUG, INFO, WARNING, ERROR, CRITICAL
- **Log Aggregation:** Centralized with Fluentd
- **Log Retention:** 30 days default

## Backup and Recovery

### Automated Backups

```bash
# Manual backup
./scripts/backup.sh

# Automated daily backups at 2:00 AM
# Configured in docker-compose.prod.yml
```

**Backup Components:**
- PostgreSQL database (custom format + SQL)
- Redis data (RDB snapshot)
- Uploaded files (tar.gz)
- Configuration files
- Metadata and checksums

### Recovery Procedures

```bash
# Restore database
pg_restore -h localhost -U goldshop_user -d goldshop backup_file.backup

# Restore Redis
redis-cli -h localhost --rdb backup_file.rdb

# Restore files
tar -xzf uploads_backup.tar.gz -C /app/
```

## Performance Optimization

### Database Optimization

- Connection pooling
- Query optimization with indexes
- Partitioning for large tables
- Regular VACUUM and ANALYZE

### Caching Strategy

- Redis for session data
- Nginx for static assets
- Application-level caching
- CDN integration ready

### Resource Management

- Container resource limits
- Memory optimization
- CPU allocation
- Disk I/O optimization

## Scaling and High Availability

### Horizontal Scaling

```yaml
# Example scaling configuration
services:
  backend:
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
```

### Load Balancing

- Nginx upstream configuration
- Health check integration
- Session affinity support
- Failover mechanisms

### Database Scaling

- Read replicas support
- Connection pooling
- Query optimization
- Backup strategies

## Maintenance Procedures

### Regular Maintenance

1. **Daily:**
   - Monitor system health
   - Check backup completion
   - Review error logs

2. **Weekly:**
   - Update security patches
   - Analyze performance metrics
   - Clean up old logs

3. **Monthly:**
   - Review and rotate secrets
   - Update dependencies
   - Capacity planning review

### Update Procedures

```bash
# Update to latest version
git pull origin main
./scripts/deploy.sh production

# Rollback if needed
docker-compose -f docker-compose.prod.yml down
git checkout previous-version
./scripts/deploy.sh production
```

## Troubleshooting

### Common Issues

1. **Service Won't Start**
   ```bash
   # Check logs
   docker-compose logs service-name
   
   # Check health
   docker-compose ps
   ```

2. **Database Connection Issues**
   ```bash
   # Test connection
   docker exec goldshop_backend python -c "from database import engine; engine.connect()"
   ```

3. **SSL Certificate Issues**
   ```bash
   # Regenerate certificates
   docker exec goldshop_nginx /usr/local/bin/generate-ssl.sh
   ```

4. **Performance Issues**
   ```bash
   # Check resource usage
   docker stats
   
   # Check database performance
   docker exec goldshop_db psql -U goldshop_user -d goldshop -c "SELECT * FROM pg_stat_activity;"
   ```

### Log Analysis

```bash
# View aggregated logs
tail -f logs/aggregated/goldshop.*.log

# View error logs
tail -f logs/errors/goldshop_errors.*.log

# View specific service logs
docker-compose logs -f backend
```

## Testing Infrastructure

### Automated Testing

```bash
# Run infrastructure tests
./scripts/test-infrastructure.sh

# Run specific test suite
python -m pytest tests/test_infrastructure.py -v
```

### Manual Testing

1. **Health Checks:** Verify all endpoints respond correctly
2. **SSL Configuration:** Test certificate and protocols
3. **Security Headers:** Verify all headers are present
4. **Rate Limiting:** Test with multiple requests
5. **Backup/Restore:** Verify backup and restore procedures

## Configuration Management

### Environment Variables

```bash
# Development
ENVIRONMENT=development
LOG_LEVEL=DEBUG
CORS_ORIGINS=http://localhost:3000

# Production
ENVIRONMENT=production
LOG_LEVEL=WARNING
CORS_ORIGINS=https://yourdomain.com
```

### Secrets Management

```bash
# Create secrets directory
mkdir -p secrets
chmod 700 secrets

# Add secrets
echo "secure-password" > secrets/db_password.txt
chmod 600 secrets/*.txt
```

### Configuration Files

- `nginx/nginx.conf` - Nginx configuration
- `redis/redis.conf` - Redis configuration
- `monitoring/prometheus.yml` - Monitoring configuration
- `logging/fluentd.conf` - Log aggregation configuration

## Best Practices

### Security

1. Use strong, unique passwords for all services
2. Regularly update base images and dependencies
3. Implement proper access controls
4. Monitor for security vulnerabilities
5. Use secrets management for sensitive data

### Performance

1. Monitor resource usage regularly
2. Optimize database queries and indexes
3. Implement proper caching strategies
4. Use CDN for static assets
5. Regular performance testing

### Reliability

1. Implement comprehensive health checks
2. Set up proper monitoring and alerting
3. Regular backup testing
4. Document recovery procedures
5. Practice disaster recovery scenarios

### Development

1. Use consistent environments across dev/test/prod
2. Implement proper CI/CD pipelines
3. Regular dependency updates
4. Code quality checks
5. Comprehensive testing

## Support and Documentation

### Getting Help

1. Check this documentation first
2. Review logs for error messages
3. Check GitHub issues
4. Contact system administrators

### Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [Prometheus Documentation](https://prometheus.io/docs/)

---

This infrastructure provides a robust, scalable, and secure foundation for the Universal Inventory Management System. Regular maintenance and monitoring ensure optimal performance and reliability.