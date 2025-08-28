# Database Backup Manager for Gold Shop Management System
# PowerShell Script for easy backup operations

param(
    [Parameter(Position=0)]
    [ValidateSet("backup", "restore", "list", "help")]
    [string]$Action = "menu",
    
    [Parameter(Position=1)]
    [ValidateSet("sql", "volume", "full")]
    [string]$Type,
    
    [Parameter()]
    [string]$Name
)

function Show-Header {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Gold Shop Database Backup Manager" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
}

function Test-Prerequisites {
    # Check Python
    try {
        $pythonVersion = python --version 2>&1
        Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Python is not installed or not in PATH" -ForegroundColor Red
        Write-Host "Please install Python 3.7+ to use this backup system" -ForegroundColor Yellow
        return $false
    }
    
    # Check Docker
    try {
        docker ps | Out-Null
        Write-Host "✅ Docker is running" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Docker is not running or not accessible" -ForegroundColor Red
        Write-Host "Please start Docker Desktop and try again" -ForegroundColor Yellow
        return $false
    }
    
    return $true
}

function Show-Menu {
    Write-Host ""
    Write-Host "Select an option:" -ForegroundColor Yellow
    Write-Host "1. Create SQL Backup (Database dump only)"
    Write-Host "2. Create Volume Snapshot (All data volumes)"
    Write-Host "3. Create Full Backup (SQL + Volumes + Redis)"
    Write-Host "4. List Available Backups"
    Write-Host "5. Restore from Backup (Interactive)"
    Write-Host "6. Complete Restore (Robust method)"
    Write-Host "7. Quick Backup (Full backup with timestamp)"
    Write-Host "8. Exit"
    Write-Host ""
}

function Invoke-BackupCommand {
    param($BackupType, $BackupName = $null)
    
    $cmd = "python scripts/database_backup.py $BackupType"
    if ($BackupName) {
        $cmd += " --name `"$BackupName`""
    }
    
    Write-Host "Executing: $cmd" -ForegroundColor Gray
    Invoke-Expression $cmd
}

function Invoke-RestoreCommand {
    param($RestoreType = "interactive", $BackupName = $null)
    
    if ($RestoreType -eq "interactive") {
        Write-Host "*** WARNING: This will replace your current database! ***" -ForegroundColor Red
        Write-Host "Make sure you have a recent backup before proceeding." -ForegroundColor Yellow
        Write-Host ""
        
        $confirm = Read-Host "Are you sure you want to continue? (yes/no)"
        if ($confirm -ne "yes") {
            Write-Host "Restore cancelled." -ForegroundColor Yellow
            return
        }
    }
    
    $cmd = "python scripts/database_restore.py $RestoreType"
    if ($BackupName) {
        $cmd += " --name `"$BackupName`""
    }
    
    Write-Host "Executing: $cmd" -ForegroundColor Gray
    Invoke-Expression $cmd
}

function Show-Help {
    Write-Host "Usage Examples:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Interactive Menu:"
    Write-Host "  .\backup_manager.ps1"
    Write-Host ""
    Write-Host "Direct Commands:"
    Write-Host "  .\backup_manager.ps1 backup sql"
    Write-Host "  .\backup_manager.ps1 backup full -Name 'before_update'"
    Write-Host "  .\backup_manager.ps1 restore interactive"
    Write-Host "  .\backup_manager.ps1 list"
    Write-Host ""
    Write-Host "Parameters:"
    Write-Host "  -Action: backup, restore, list, help"
    Write-Host "  -Type: sql, volume, full (for backup action)"
    Write-Host "  -Name: Custom backup name (optional)"
    Write-Host ""
}

# Main execution
Show-Header

if (-not (Test-Prerequisites)) {
    Read-Host "Press Enter to exit"
    exit 1
}

switch ($Action) {
    "backup" {
        if (-not $Type) {
            Write-Host "Error: Backup type is required" -ForegroundColor Red
            Write-Host "Use: .\backup_manager.ps1 backup [sql|volume|full]" -ForegroundColor Yellow
            exit 1
        }
        Invoke-BackupCommand -BackupType $Type -BackupName $Name
    }
    
    "restore" {
        Invoke-RestoreCommand -RestoreType "interactive"
    }
    
    "list" {
        python scripts/database_backup.py list
    }
    
    "help" {
        Show-Help
    }
    
    default {
        # Interactive menu
        do {
            Show-Menu
            $choice = Read-Host "Enter your choice (1-8)"
            
            switch ($choice) {
                "1" {
                    Write-Host ""
                    Write-Host "Creating SQL Backup..." -ForegroundColor Green
                    Write-Host "----------------------"
                    $backupName = Read-Host "Enter backup name (or press Enter for auto-generated)"
                    if ([string]::IsNullOrWhiteSpace($backupName)) {
                        Invoke-BackupCommand -BackupType "sql"
                    } else {
                        Invoke-BackupCommand -BackupType "sql" -BackupName $backupName
                    }
                    Read-Host "Press Enter to continue"
                }
                
                "2" {
                    Write-Host ""
                    Write-Host "Creating Volume Snapshot..." -ForegroundColor Green
                    Write-Host "---------------------------"
                    $backupName = Read-Host "Enter backup name (or press Enter for auto-generated)"
                    if ([string]::IsNullOrWhiteSpace($backupName)) {
                        Invoke-BackupCommand -BackupType "volume"
                    } else {
                        Invoke-BackupCommand -BackupType "volume" -BackupName $backupName
                    }
                    Read-Host "Press Enter to continue"
                }
                
                "3" {
                    Write-Host ""
                    Write-Host "Creating Full Backup..." -ForegroundColor Green
                    Write-Host "-----------------------"
                    $backupName = Read-Host "Enter backup name (or press Enter for auto-generated)"
                    if ([string]::IsNullOrWhiteSpace($backupName)) {
                        Invoke-BackupCommand -BackupType "full"
                    } else {
                        Invoke-BackupCommand -BackupType "full" -BackupName $backupName
                    }
                    Read-Host "Press Enter to continue"
                }
                
                "4" {
                    Write-Host ""
                    Write-Host "Available Backups:" -ForegroundColor Green
                    Write-Host "------------------"
                    python scripts/database_backup.py list
                    Read-Host "Press Enter to continue"
                }
                
                "5" {
                    Write-Host ""
                    Invoke-RestoreCommand -RestoreType "interactive"
                    Read-Host "Press Enter to continue"
                }
                
                "6" {
                    Write-Host ""
                    Write-Host "*** COMPLETE RESTORE - MOST ROBUST METHOD ***" -ForegroundColor Yellow
                    Write-Host "This method handles all database conflicts automatically." -ForegroundColor Green
                    Write-Host "*** WARNING: This will completely replace your current database! ***" -ForegroundColor Red
                    Write-Host "Make sure you have a recent backup before proceeding." -ForegroundColor Yellow
                    Write-Host ""
                    python scripts/database_backup.py list
                    Write-Host ""
                    $backupName = Read-Host "Enter backup name to restore"
                    if ([string]::IsNullOrWhiteSpace($backupName)) {
                        Write-Host "No backup name provided. Returning to menu." -ForegroundColor Yellow
                    } else {
                        $confirm = Read-Host "Are you sure you want to restore '$backupName'? (yes/no)"
                        if ($confirm -eq "yes") {
                            Write-Host ""
                            Write-Host "Starting Complete Restore..." -ForegroundColor Green
                            Write-Host "----------------------------"
                            python scripts/database_restore.py complete --name "$backupName"
                        } else {
                            Write-Host "Restore cancelled." -ForegroundColor Yellow
                        }
                    }
                    Read-Host "Press Enter to continue"
                }
                
                "7" {
                    Write-Host ""
                    Write-Host "Creating Quick Full Backup..." -ForegroundColor Green
                    Write-Host "-----------------------------"
                    Invoke-BackupCommand -BackupType "full"
                    Read-Host "Press Enter to continue"
                }
                
                "8" {
                    Write-Host ""
                    Write-Host "Goodbye!" -ForegroundColor Cyan
                    exit 0
                }
                
                default {
                    Write-Host ""
                    Write-Host "Invalid choice. Please select 1-8." -ForegroundColor Red
                    Read-Host "Press Enter to continue"
                }
            }
        } while ($true)
    }
}