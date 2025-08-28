@echo off
REM Database Backup Manager for Gold Shop Management System
REM Windows Batch Script for easy backup operations

setlocal enabledelayedexpansion

echo ========================================
echo Gold Shop Database Backup Manager
echo ========================================
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python 3.7+ to use this backup system
    pause
    exit /b 1
)

REM Check if Docker is running
docker ps >nul 2>&1
if errorlevel 1 (
    echo Error: Docker is not running or not accessible
    echo Please start Docker Desktop and try again
    pause
    exit /b 1
)

:menu
echo.
echo Select an option:
echo 1. Create SQL Backup (Database dump only)
echo 2. Create Volume Snapshot (All data volumes)
echo 3. Create Full Backup (SQL + Volumes + Redis)
echo 4. List Available Backups
echo 5. Restore from Backup (Interactive)
echo 6. Complete Restore (Robust method)
echo 7. Quick Backup (Full backup with timestamp)
echo 8. Exit
echo.

set /p choice="Enter your choice (1-8): "

if "%choice%"=="1" goto sql_backup
if "%choice%"=="2" goto volume_backup
if "%choice%"=="3" goto full_backup
if "%choice%"=="4" goto list_backups
if "%choice%"=="5" goto restore_backup
if "%choice%"=="6" goto complete_restore
if "%choice%"=="7" goto quick_backup
if "%choice%"=="8" goto exit
goto invalid_choice

:sql_backup
echo.
echo Creating SQL Backup...
echo ----------------------
set /p backup_name="Enter backup name (or press Enter for auto-generated): "
if "%backup_name%"=="" (
    python scripts/database_backup.py sql
) else (
    python scripts/database_backup.py sql --name "%backup_name%"
)
pause
goto menu

:volume_backup
echo.
echo Creating Volume Snapshot...
echo ---------------------------
set /p backup_name="Enter backup name (or press Enter for auto-generated): "
if "%backup_name%"=="" (
    python scripts/database_backup.py volume
) else (
    python scripts/database_backup.py volume --name "%backup_name%"
)
pause
goto menu

:full_backup
echo.
echo Creating Full Backup...
echo -----------------------
set /p backup_name="Enter backup name (or press Enter for auto-generated): "
if "%backup_name%"=="" (
    python scripts/database_backup.py full
) else (
    python scripts/database_backup.py full --name "%backup_name%"
)
pause
goto menu

:quick_backup
echo.
echo Creating Quick Full Backup...
echo -----------------------------
python scripts/database_backup.py full
pause
goto menu

:list_backups
echo.
echo Available Backups:
echo ------------------
python scripts/database_backup.py list
pause
goto menu

:restore_backup
echo.
echo *** WARNING: This will replace your current database! ***
echo Make sure you have a recent backup before proceeding.
echo.
set /p confirm="Are you sure you want to continue? (yes/no): "
if /i not "%confirm%"=="yes" (
    echo Restore cancelled.
    pause
    goto menu
)

echo.
echo Starting Interactive Restore...
echo -------------------------------
python scripts/database_restore.py interactive
pause
goto menu

:complete_restore
echo.
echo *** COMPLETE RESTORE - MOST ROBUST METHOD ***
echo This method handles all database conflicts automatically.
echo *** WARNING: This will completely replace your current database! ***
echo Make sure you have a recent backup before proceeding.
echo.
python scripts/database_backup.py list
echo.
set /p backup_name="Enter backup name to restore: "
if "%backup_name%"=="" (
    echo No backup name provided. Returning to menu.
    pause
    goto menu
)

set /p confirm="Are you sure you want to restore '%backup_name%'? (yes/no): "
if /i not "%confirm%"=="yes" (
    echo Restore cancelled.
    pause
    goto menu
)

echo.
echo Starting Complete Restore...
echo ----------------------------
python scripts/database_restore.py complete --name "%backup_name%"
pause
goto menu

:invalid_choice
echo.
echo Invalid choice. Please select 1-8.
pause
goto menu

:exit
echo.
echo Goodbye!
exit /b 0