# 🔄 Database Restore Methods - Quick Reference

## 🎯 Which Method to Use?

### 🚨 Emergency Situations (Database Conflicts/Changes Made)
```bash
# Use Complete Restore - handles all conflicts automatically
python scripts/database_restore.py complete --name "backup_name"
```

### 🔧 Interactive Selection (Recommended for Most Users)
```bash
# Interactive menu with method selection
python scripts/database_restore.py interactive
```

### 📋 Standard Situations (No Conflicts Expected)
```bash
# Standard full restore
python scripts/database_restore.py full --name "backup_name"
```

## 📊 Restore Method Comparison

| Method | Use Case | Handles Conflicts | Speed | Robustness |
|--------|----------|-------------------|-------|------------|
| **Complete** | Emergency, conflicts, changed DB | ✅ Yes | Slower | 🟢 Highest |
| **Full** | Standard restore, clean state | ⚠️ Limited | Medium | 🟡 Good |
| **SQL** | Database only, no volumes | ❌ No | Fast | 🟡 Limited |
| **Volume** | Files only, no database | ❌ No | Fast | 🟡 Limited |

## 🛠️ Complete Restore Process (Recommended)

**What it does:**
1. ✅ Stops all containers
2. ✅ Removes existing database volumes completely
3. ✅ Restores volumes from backup
4. ✅ Drops and recreates database
5. ✅ Restores SQL data cleanly
6. ✅ Restores Redis cache
7. ✅ Starts all services
8. ✅ Verifies restoration

**Command:**
```bash
python scripts/database_restore.py complete --name "production_backup_ready"
```

## 🎮 Interactive Restore (User-Friendly)

**Features:**
- Lists all available backups
- Shows backup details and creation dates
- Lets you choose restore method
- Confirms before proceeding
- Provides progress feedback

**Command:**
```bash
python scripts/database_restore.py interactive
```

**Example Session:**
```
Available Backups for Restore:
==================================================
Name: production_backup_ready
Type: full_backup
Created: 2025-08-28T23:50:00.858454
Components: SQL=True, Redis=True, Volumes=True

Select a backup to restore:
1. production_backup_ready

🔧 Restore Methods:
1. Complete Restore (Recommended) - Most robust, handles all conflicts
2. Standard Restore - Original method

Enter backup number (0 to cancel): 1
Choose restore method (1 for Complete, 2 for Standard, default=1): 1

⚠️  WARNING: This will replace your current database with backup: production_backup_ready
🔧 Using Complete Restore method (recommended)
Are you sure you want to continue? (yes/no): yes
```

## 🚀 Quick Commands

### List Available Backups
```bash
python scripts/database_restore.py list
```

### Emergency One-Line Restore
```bash
# Replace "backup_name" with your actual backup name
python scripts/database_restore.py complete --name "backup_name"
```

### Test Database Connection After Restore
```bash
# Check if database is working
docker exec goldshop_db psql -U goldshop_user -d goldshop -c "SELECT 'Database OK' as status;"

# Check container status
docker-compose ps

# Test API health
curl http://localhost:8000/health
```

## ⚠️ Important Notes

### Before Restoring
1. **Create a backup** of current state (if needed):
   ```bash
   python scripts/database_backup.py full --name "before_restore_$(date +%Y%m%d_%H%M%S)"
   ```

2. **Stop application** if making changes:
   ```bash
   docker-compose down
   ```

### After Restoring
1. **Verify data** - Check that your data is restored correctly
2. **Test functionality** - Ensure all features work
3. **Check logs** - Look for any errors in container logs:
   ```bash
   docker-compose logs backend
   docker-compose logs frontend
   ```

### Troubleshooting
- **If restore fails**: Try the Complete restore method
- **If containers won't start**: Check `docker-compose logs`
- **If database connection fails**: Wait longer for database to initialize
- **If frontend doesn't load**: Check if backend is healthy first

## 🎯 Success Indicators

After a successful restore, you should see:
- ✅ All containers running and healthy
- ✅ Database connection successful
- ✅ Frontend accessible at http://localhost:3000
- ✅ Backend API accessible at http://localhost:8000
- ✅ Your data restored correctly

## 📞 Emergency Contacts

If restore fails completely:
1. Check container logs: `docker-compose logs`
2. Verify backup files exist in `backups/` directory
3. Try Complete restore method if Standard fails
4. Restart Docker Desktop if containers won't start
5. Check disk space and permissions

---

**Remember**: The Complete restore method is your best option when dealing with database conflicts or when you've made changes that need to be reverted!