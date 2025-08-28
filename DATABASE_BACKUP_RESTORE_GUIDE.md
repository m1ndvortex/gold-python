# Database Backup and Restore Guide

## Overview

This guide provides comprehensive instructions for backing up and restoring your Gold Shop Management System database and data volumes using Docker. The system supports both SQL dumps and Docker volume snapshots to ensure complete data protection.

## 🎯 Quick Start

### Create a Full Backup (Recommended)
```bash
# Windows Command Prompt
scripts\backup_manager.bat

# PowerShell
.\scripts\backup_manager.ps1

# Direct Python command
python scripts/database_backup.py full
```

### Restore from Backup
```bash
# Interactive restore (recommended)
python scripts/database_restore.py interactive
```

## 📋 Prerequisites

### Required Software
- **Docker Desktop**: Must be running
- **Python 3.7+**: For backup/restore scripts
- **Docker Compose**: For container orchestration

### Verify Prerequisites
```bash
# Check Docker
docker --version
docker-compose --version

# Check Python
python --version

# Verify containers are running
docker-compose ps
```

## 🔧 Backup Types

### 1. SQL Dump Backup
**What it includes:**
- Complete PostgreSQL database structure and data
- All tables, indexes, constraints, and sequences
- User data, configurations, and relationships

**When to use:**
- Quick database-only backups
- Before schema changes
- For database migration purposes

**Command:**
```bash
python scripts/database_backup.py sql
python scripts/database_backup.py sql --name "before_schema_update"
```

### 2. Volume Snapshot Backup
**What it includes:**
- All Docker volumes (postgres_data, redis_data, uploads_data)
- File uploads and attachments
- Redis cache data
- Complete file system state

**When to use:**
- Complete system state backup
- Before major system updates
- For disaster recovery

**Command:**
```bash
python scripts/database_backup.py volume
python scripts/database_backup.py volume --name "before_major_update"
```

### 3. Full Backup (Recommended)
**What it includes:**
- SQL database dump
- All Docker volumes
- Redis data backup
- Complete system state

**When to use:**
- Regular scheduled backups
- Before any system changes
- Maximum data protection

**Command:**
```bash
python scripts/database_backup.py full
python scripts/database_backup.py full --name "weekly_backup_$(date +%Y%m%d)"
```

## 📁 Backup Storage Structure

```
backups/
├── goldshop_full_backup_20241228_143022/
│   ├── postgres_data/
│   │   └── data.tar.gz
│   ├── redis_data/
│   │   └── data.tar.gz
│   ├── uploads_data/
│   │   └── data.tar.gz
│   └── metadata.json
├── goldshop_full_backup_20241228_143022.sql
├── goldshop_full_backup_20241228_143022_redis.rdb
├── goldshop_full_backup_20241228_143022_full_metadata.json
└── goldshop_sql_backup_20241228_140015.sql
```

## 🔄 Restore Procedures

### Interactive Restore (Recommended)
```bash
python scripts/database_restore.py interactive
```

This will:
1. List all available backups
2. Let you select which backup to restore
3. Show backup details and creation time
4. Confirm before proceeding
5. Handle the complete restore process

### Direct Restore Commands

#### Restore SQL Backup Only
```bash
python scripts/database_restore.py sql --name "backup_name"
```

#### Restore Volume Snapshots Only
```bash
python scripts/database_restore.py volume --name "backup_name"
```

#### Restore Full Backup
```bash
python scripts/database_restore.py full --name "backup_name"
```

## ⚠️ Important Safety Guidelines

### Before Making Database Changes

1. **Always create a backup first:**
   ```bash
   python scripts/database_backup.py full --name "before_changes_$(date +%Y%m%d_%H%M%S)"
   ```

2. **Verify backup was created successfully:**
   ```bash
   python scripts/database_backup.py list
   ```

3. **Test the backup (optional but recommended):**
   - Create a test environment
   - Restore the backup to test environment
   - Verify data integrity

### During Restore Operations

1. **Stop application containers:**
   ```bash
   docker-compose down
   ```

2. **Backup current state (if needed):**
   ```bash
   python scripts/database_backup.py full --name "before_restore_$(date +%Y%m%d_%H%M%S)"
   ```

3. **Perform restore operation**

4. **Start containers:**
   ```bash
   docker-compose up -d
   ```

5. **Verify system functionality**

## 🛠️ Advanced Usage

### Automated Backup Scripts

#### Daily Backup (Windows Task Scheduler)
```batch
@echo off
cd /d "C:\path\to\your\project"
python scripts/database_backup.py full --name "daily_backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%"
```

#### Weekly Backup (PowerShell)
```powershell
$date = Get-Date -Format "yyyyMMdd"
python scripts/database_backup.py full --name "weekly_backup_$date"
```

### Backup Retention Management

#### Clean Old Backups (PowerShell)
```powershell
# Keep only last 7 days of backups
$cutoffDate = (Get-Date).AddDays(-7)
Get-ChildItem "backups" | Where-Object { $_.CreationTime -lt $cutoffDate } | Remove-Item -Recurse -Force
```

### Remote Backup Storage

#### Copy to Network Drive
```bash
# After creating backup
robocopy backups \\network-drive\goldshop-backups /MIR /Z /W:5 /R:3
```

#### Upload to Cloud Storage (Example with AWS CLI)
```bash
# Upload to S3 bucket
aws s3 sync backups/ s3://your-backup-bucket/goldshop-backups/
```

## 🔍 Troubleshooting

### Common Issues and Solutions

#### 1. "Container not running" Error
**Problem:** Database containers are not running
**Solution:**
```bash
docker-compose up -d
# Wait for containers to be healthy
docker-compose ps
```

#### 2. "Permission denied" Error
**Problem:** File permission issues
**Solution:**
```bash
# Windows (run as Administrator)
# Linux/Mac
sudo chown -R $USER:$USER backups/
```

#### 3. "Backup file not found" Error
**Problem:** Backup file doesn't exist or wrong name
**Solution:**
```bash
# List available backups
python scripts/database_backup.py list
# Use exact backup name from the list
```

#### 4. "Database connection failed" Error
**Problem:** Database not ready or connection issues
**Solution:**
```bash
# Check container health
docker-compose ps
# Check logs
docker-compose logs db
# Wait longer for database to be ready
```

#### 5. "Insufficient disk space" Error
**Problem:** Not enough space for backup
**Solution:**
```bash
# Check disk space
df -h  # Linux/Mac
dir   # Windows
# Clean old backups or move to external storage
```

### Verification Commands

#### Check Backup Integrity
```bash
# Verify SQL backup can be read
head -n 20 backups/backup_name.sql

# Check volume backup sizes
ls -la backups/backup_name/*/data.tar.gz

# Verify metadata
cat backups/backup_name_metadata.json
```

#### Test Database Connection After Restore
```bash
# Connect to database
docker-compose exec db psql -U goldshop_user -d goldshop -c "\dt"

# Check Redis
docker-compose exec redis redis-cli ping

# Verify application startup
docker-compose logs backend
docker-compose logs frontend
```

## 📅 Backup Strategy Recommendations

### Development Environment
- **Daily:** SQL backups before major changes
- **Weekly:** Full backups
- **Before updates:** Full backup with descriptive name

### Production Environment
- **Daily:** Full automated backups
- **Weekly:** Full backups with extended retention
- **Before deployments:** Full backup with version tag
- **Monthly:** Archive backups to long-term storage

### Backup Naming Convention
```
Format: [type]_[environment]_[date]_[time]_[description]
Examples:
- full_prod_20241228_143022_before_v2_deployment
- sql_dev_20241228_140015_schema_update
- volume_staging_20241228_120000_weekly
```

## 🔐 Security Considerations

### Backup Security
1. **Encrypt sensitive backups:**
   ```bash
   # Encrypt backup file
   gpg --symmetric --cipher-algo AES256 backup_file.sql
   ```

2. **Secure backup storage:**
   - Use encrypted storage locations
   - Implement access controls
   - Regular security audits

3. **Database credentials:**
   - Store credentials securely
   - Use environment variables
   - Rotate passwords regularly

### Access Control
- Limit backup script access to authorized users
- Use proper file permissions (600 for backup files)
- Audit backup and restore operations

## 📞 Support and Maintenance

### Regular Maintenance Tasks
1. **Weekly:** Verify backup integrity
2. **Monthly:** Test restore procedures
3. **Quarterly:** Review and update backup strategy
4. **Annually:** Disaster recovery testing

### Monitoring and Alerts
- Set up alerts for backup failures
- Monitor backup storage usage
- Track backup and restore performance

### Documentation Updates
- Keep this guide updated with system changes
- Document any custom backup procedures
- Maintain troubleshooting knowledge base

## 📋 Backup Checklist

### Before Database Changes
- [ ] Create full backup with descriptive name
- [ ] Verify backup completed successfully
- [ ] Note backup location and name
- [ ] Ensure sufficient disk space for changes

### After Database Changes
- [ ] Test application functionality
- [ ] Create new backup if changes are successful
- [ ] Document changes made
- [ ] Update backup retention if needed

### Emergency Restore
- [ ] Identify correct backup to restore
- [ ] Stop application containers
- [ ] Create emergency backup of current state
- [ ] Perform restore operation
- [ ] Start containers and verify functionality
- [ ] Document incident and resolution

---

## 🆘 Emergency Contacts and Procedures

### Quick Recovery Commands
```bash
# Emergency full restore (replace BACKUP_NAME)
docker-compose down
python scripts/database_restore.py full --name "BACKUP_NAME"
docker-compose up -d

# Emergency SQL-only restore
python scripts/database_restore.py sql --name "BACKUP_NAME"
```

### Emergency Backup
```bash
# Create emergency backup immediately
python scripts/database_backup.py full --name "emergency_$(date +%Y%m%d_%H%M%S)"
```

Remember: **Always test your backups regularly and practice restore procedures in a safe environment!**