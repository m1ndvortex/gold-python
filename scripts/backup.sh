#!/bin/bash
# Automated Backup Script for Universal Inventory Management System
# Backs up PostgreSQL database, Redis data, and uploaded files

set -e

# Configuration
DB_HOST="db"
DB_NAME="goldshop"
DB_USER="goldshop_user"
DB_PASSWORD="goldshop_password"
BACKUP_DIR="/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RETENTION_DAYS=30

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "Starting backup process at $(date)"

# PostgreSQL Database Backup
echo "Backing up PostgreSQL database..."
pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" \
    --verbose --clean --if-exists --create \
    --format=custom \
    --file="$BACKUP_DIR/goldshop_db_$TIMESTAMP.backup"

# Create SQL dump for easier restoration
pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" \
    --verbose --clean --if-exists --create \
    --format=plain \
    --file="$BACKUP_DIR/goldshop_db_$TIMESTAMP.sql"

echo "Database backup completed"

# Redis Data Backup
echo "Backing up Redis data..."
redis-cli -h redis --rdb "$BACKUP_DIR/redis_$TIMESTAMP.rdb"
echo "Redis backup completed"

# Uploaded Files Backup
echo "Backing up uploaded files..."
if [ -d "/app/uploads" ]; then
    tar -czf "$BACKUP_DIR/uploads_$TIMESTAMP.tar.gz" -C /app uploads/
    echo "Uploads backup completed"
else
    echo "No uploads directory found, skipping files backup"
fi

# Create backup metadata
cat > "$BACKUP_DIR/backup_$TIMESTAMP.json" << EOF
{
    "timestamp": "$TIMESTAMP",
    "date": "$(date -Iseconds)",
    "database_backup": "goldshop_db_$TIMESTAMP.backup",
    "database_sql": "goldshop_db_$TIMESTAMP.sql",
    "redis_backup": "redis_$TIMESTAMP.rdb",
    "uploads_backup": "uploads_$TIMESTAMP.tar.gz",
    "backup_size": {
        "database": "$(du -h $BACKUP_DIR/goldshop_db_$TIMESTAMP.backup | cut -f1)",
        "redis": "$(du -h $BACKUP_DIR/redis_$TIMESTAMP.rdb | cut -f1)",
        "uploads": "$(du -h $BACKUP_DIR/uploads_$TIMESTAMP.tar.gz 2>/dev/null | cut -f1 || echo 'N/A')"
    },
    "status": "completed"
}
EOF

# Cleanup old backups
echo "Cleaning up old backups (older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "goldshop_db_*.backup" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "goldshop_db_*.sql" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "redis_*.rdb" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "uploads_*.tar.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "backup_*.json" -mtime +$RETENTION_DAYS -delete

echo "Backup process completed at $(date)"
echo "Backup files created:"
echo "  - Database: goldshop_db_$TIMESTAMP.backup"
echo "  - Database SQL: goldshop_db_$TIMESTAMP.sql"
echo "  - Redis: redis_$TIMESTAMP.rdb"
echo "  - Uploads: uploads_$TIMESTAMP.tar.gz"
echo "  - Metadata: backup_$TIMESTAMP.json"