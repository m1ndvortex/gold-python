# Secrets Directory

This directory contains sensitive configuration files for production deployment.

## Required Files for Production

Create the following files with appropriate values:

### Database Password
```bash
echo "your-secure-database-password" > db_password.txt
```

### JWT Secret
```bash
echo "your-super-secret-jwt-key-for-production" > jwt_secret.txt
```

### SMS API Key
```bash
echo "your-sms-api-key" > sms_api_key.txt
```

### Grafana Admin Password
```bash
echo "your-grafana-admin-password" > grafana_password.txt
```

## Security Notes

1. **Never commit these files to version control**
2. Set appropriate file permissions: `chmod 600 *.txt`
3. Use strong, randomly generated passwords
4. Rotate secrets regularly
5. Use a proper secrets management system in production (e.g., HashiCorp Vault, AWS Secrets Manager)

## File Permissions

```bash
chmod 700 secrets/
chmod 600 secrets/*.txt
```

## Environment Variables Alternative

Instead of files, you can also use environment variables:
- `DB_PASSWORD`
- `JWT_SECRET`
- `SMS_API_KEY`
- `GRAFANA_PASSWORD`