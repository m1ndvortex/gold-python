# 🚀 Database Backup & Restore - Quick Reference

## 📦 Create Backups

### Full Backup (Recommended)
```bash
# Interactive menu
scripts\backup_manager.bat              # Windows CMD
.\scripts\backup_manager.ps1            # PowerShell

# Direct command
python scripts/database_backup.py full
python scripts/database_backup.py full --name "my_backup_name"
```

### SQL Only
```bash
python scripts/database_backup.py sql
```

### Volumes Only
```bash
python scripts/database_backup.py volume
```

## 🔄 Restore Backups

### Interactive Restore (Safest)
```bash
python scripts/database_restore.py interactive
```

### Direct Restore
```bash
python scripts/database_restore.py full --name "backup_name"
python scripts/database_restore.py sql --name "backup_name"
```

## 📋 List & Manage

### List All Backups
```bash
python scripts/database_backup.py list
```

### Check Containers
```bash
docker-compose ps
docker-compose logs db
```

## ⚡ Emergency Commands

### Quick Backup Before Changes
```bash
python scripts/database_backup.py full --name "before_changes"
```

### Emergency Restore
```bash
# 1. Stop containers
docker-compose down

# 2. Restore (interactive)
python scripts/database_restore.py interactive

# 3. Start containers
docker-compose up -d
```

## 📁 Backup Locations
- **Backups stored in:** `./backups/`
- **SQL files:** `backup_name.sql`
- **Volume snapshots:** `backup_name/` folder
- **Metadata:** `backup_name_metadata.json`

## ⚠️ Safety Rules
1. **Always backup before changes**
2. **Test backups regularly**
3. **Use descriptive names**
4. **Verify backup success**
5. **Keep multiple backup copies**

## 🆘 Need Help?
- Read full guide: `DATABASE_BACKUP_RESTORE_GUIDE.md`
- Check container status: `docker-compose ps`
- View logs: `docker-compose logs [service_name]`