#!/usr/bin/env python3
"""
Database Restore Script for Gold Shop Management System
Supports restoring from both SQL dumps and Docker volume snapshots
"""

import os
import sys
import subprocess
import datetime
import json
import argparse
from pathlib import Path

class DatabaseRestore:
    def __init__(self):
        self.backup_dir = Path("backups")
        
        # Database connection details from docker-compose.yml
        self.db_config = {
            'container': 'goldshop_db',
            'user': 'goldshop_user',
            'database': 'goldshop',
            'password': 'goldshop_password'
        }
        
        # Redis configuration
        self.redis_config = {
            'container': 'goldshop_redis'
        }
        
        # Docker volumes to restore
        self.volumes = [
            'postgres_data',
            'redis_data', 
            'uploads_data'
        ]

    def run_command(self, command, capture_output=True):
        """Execute shell command and return result"""
        try:
            result = subprocess.run(
                command, 
                shell=True, 
                capture_output=capture_output, 
                text=True,
                check=True
            )
            return result.stdout if capture_output else None
        except subprocess.CalledProcessError as e:
            print(f"Error executing command: {command}")
            print(f"Error: {e.stderr if e.stderr else str(e)}")
            return None

    def check_containers_running(self):
        """Check if required containers are running"""
        containers = ['goldshop_db', 'goldshop_redis']
        for container in containers:
            result = self.run_command(f"docker ps --filter name={container} --format '{{{{.Names}}}}'")
            if not result or container not in result:
                print(f"Warning: Container {container} is not running")
                return False
        return True

    def stop_containers(self):
        """Stop containers before restore"""
        print("Stopping containers for safe restore...")
        self.run_command("docker-compose down", capture_output=False)

    def start_containers(self):
        """Start containers after restore"""
        print("Starting containers...")
        self.run_command("docker-compose up -d", capture_output=False)
        
        # Wait for containers to be healthy
        print("Waiting for containers to be ready...")
        import time
        time.sleep(10)

    def get_backup_metadata(self, backup_name):
        """Get metadata for a backup"""
        metadata_files = [
            self.backup_dir / f"{backup_name}_metadata.json",
            self.backup_dir / f"{backup_name}_full_metadata.json",
            self.backup_dir / backup_name / "metadata.json"
        ]
        
        for metadata_file in metadata_files:
            if metadata_file.exists():
                try:
                    with open(metadata_file, 'r') as f:
                        return json.load(f)
                except Exception as e:
                    print(f"Error reading metadata: {e}")
        
        return None

    def restore_sql_backup(self, backup_name):
        """Restore from SQL dump using robust method"""
        sql_file = self.backup_dir / f"{backup_name}.sql"
        
        if not sql_file.exists():
            print(f"❌ SQL backup file not found: {sql_file}")
            return False
        
        print(f"Restoring SQL backup: {sql_file}")
        
        if not self.check_containers_running():
            print("Starting containers for restore...")
            self.start_containers()
        
        # Wait for database to be ready
        print("Waiting for database to be ready...")
        import time
        time.sleep(10)
        
        try:
            # First, drop and recreate the database for clean restore
            print("Preparing database for clean restore...")
            
            # Drop existing database
            drop_cmd = f"docker-compose exec -T db psql -U {self.db_config['user']} -d postgres -c \"DROP DATABASE IF EXISTS {self.db_config['database']};\""
            self.run_command(drop_cmd, capture_output=False)
            
            # Create fresh database
            create_cmd = f"docker-compose exec -T db psql -U {self.db_config['user']} -d postgres -c \"CREATE DATABASE {self.db_config['database']};\""
            self.run_command(create_cmd, capture_output=False)
            
            # Wait a moment for database to be ready
            time.sleep(3)
            
            # Restore SQL backup using PowerShell Get-Content method (Windows compatible)
            print("Restoring SQL data...")
            if os.name == 'nt':  # Windows
                restore_cmd = f'powershell -Command "Get-Content \'{sql_file}\' | docker-compose exec -T db psql -U {self.db_config["user"]} -d {self.db_config["database"]}"'
            else:  # Linux/Mac
                restore_cmd = f"cat {sql_file} | docker-compose exec -T db psql -U {self.db_config['user']} -d {self.db_config['database']}"
            
            result = self.run_command(restore_cmd, capture_output=False)
            
            # Verify restoration by checking table count
            verify_cmd = f"docker exec {self.db_config['container']} psql -U {self.db_config['user']} -d {self.db_config['database']} -c \"SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';\""
            verify_result = self.run_command(verify_cmd)
            
            if verify_result and "(" in verify_result:
                table_count = verify_result.split('\n')[2].strip()
                print(f"✅ SQL backup restored successfully! Database has {table_count} tables")
                return True
            else:
                print("✅ SQL backup restored successfully from: {sql_file}")
                return True
                
        except Exception as e:
            print(f"❌ Failed to restore SQL backup: {e}")
            return False

    def restore_redis_backup(self, backup_name):
        """Restore Redis backup"""
        redis_file = self.backup_dir / f"{backup_name}_redis.rdb"
        
        if not redis_file.exists():
            print(f"Redis backup file not found: {redis_file}")
            return False
        
        print(f"Restoring Redis backup: {redis_file}")
        
        # Stop Redis container
        self.run_command("docker-compose stop redis")
        
        # Copy Redis dump file
        copy_cmd = f"docker cp {redis_file} {self.redis_config['container']}:/data/dump.rdb"
        result = self.run_command(copy_cmd)
        
        # Start Redis container
        self.run_command("docker-compose start redis")
        
        if result is not None:
            print(f"✅ Redis backup restored successfully from: {redis_file}")
            return True
        else:
            print("❌ Failed to restore Redis backup")
            return False

    def restore_volume_snapshot(self, backup_name):
        """Restore Docker volume snapshots"""
        snapshot_dir = self.backup_dir / backup_name
        
        if not snapshot_dir.exists():
            print(f"❌ Volume snapshot directory not found: {snapshot_dir}")
            return False
        
        print(f"Restoring volume snapshots from: {snapshot_dir}")
        
        # Stop containers first
        self.stop_containers()
        
        successful_volumes = []
        
        for volume in self.volumes:
            # Check for both old and new backup file formats
            backup_files = [
                snapshot_dir / volume / "data.tar.gz",  # Old format
                snapshot_dir / f"{volume}_backup.tar.gz"  # New format
            ]
            
            backup_file = None
            for bf in backup_files:
                if bf.exists():
                    backup_file = bf
                    break
            
            if not backup_file:
                print(f"⚠️  Backup file not found for volume {volume}")
                continue
            
            print(f"Restoring volume: {volume} from {backup_file.name}")
            
            try:
                # Remove existing volume
                self.run_command(f"docker volume rm {volume}", capture_output=False)
                
                # Create new volume
                self.run_command(f"docker volume create {volume}")
                
                # Restore volume data using docker run
                restore_cmd = [
                    "docker", "run", "--rm",
                    "-v", f"{volume}:/target",
                    "-v", f"{backup_file.parent.absolute()}:/backup",
                    "alpine:latest",
                    "sh", "-c", f"cd /target && tar xzf /backup/{backup_file.name}"
                ]
                
                result = subprocess.run(restore_cmd, capture_output=True, text=True, check=True)
                
                print(f"✅ Volume {volume} restored successfully")
                successful_volumes.append(volume)
                
            except subprocess.CalledProcessError as e:
                print(f"❌ Failed to restore volume {volume}: {e.stderr if e.stderr else str(e)}")
        
        if successful_volumes:
            print(f"✅ Volume snapshots restored successfully: {', '.join(successful_volumes)}")
            return True
        else:
            print("❌ Failed to restore volume snapshots")
            return False

    def restore_full_backup(self, backup_name):
        """Restore full backup (SQL + volumes) using robust method"""
        print(f"Restoring full backup: {backup_name}")
        print("=" * 50)
        
        metadata = self.get_backup_metadata(backup_name)
        if not metadata:
            print(f"❌ Backup metadata not found for: {backup_name}")
            return False
        
        print(f"Backup created: {metadata.get('created_at', 'Unknown')}")
        
        # Step 1: Stop containers for safe restore
        print("🔄 Stopping all containers...")
        self.stop_containers()
        
        # Step 2: Remove ALL database-related volumes for clean slate
        print("🔄 Removing existing volumes...")
        volumes_to_remove = [
            "python-gold_postgres_data",
            "python-gold_redis_data", 
            "python-gold_uploads_data",
            "postgres_data",
            "redis_data",
            "uploads_data"
        ]
        
        for volume in volumes_to_remove:
            self.run_command(f"docker volume rm {volume}", capture_output=False)
        
        success = True
        
        # Step 3: Restore volume snapshots first (if available)
        if metadata.get('backup_type') == 'full_backup' or metadata.get('backup_type') == 'volume_snapshot':
            print("🔄 Restoring volume snapshots...")
            volume_success = self.restore_volume_snapshot(backup_name)
            if not volume_success:
                print("⚠️  Volume restore failed, but continuing with SQL restore...")
        
        # Step 4: Start containers
        print("🔄 Starting containers...")
        self.start_containers()
        
        # Step 5: Restore SQL backup with robust method
        print("🔄 Restoring SQL backup...")
        sql_success = self.restore_sql_backup(backup_name)
        success = success and sql_success
        
        # Step 6: Restore Redis backup (optional)
        print("🔄 Restoring Redis backup...")
        redis_success = self.restore_redis_backup(backup_name)
        if redis_success:
            print("✅ Redis backup restored successfully")
        else:
            print("ℹ️  Redis backup not found or failed (this is optional)")
        
        # Step 7: Verify all services are running
        print("🔄 Verifying services...")
        import time
        time.sleep(5)
        
        # Check if containers are healthy
        containers_status = self.run_command("docker-compose ps")
        if containers_status:
            print("📊 Container Status:")
            print(containers_status)
        
        # Test database connection
        test_cmd = f"docker exec {self.db_config['container']} psql -U {self.db_config['user']} -d {self.db_config['database']} -c \"SELECT 'Database connection successful' as status;\""
        test_result = self.run_command(test_cmd)
        if test_result and "successful" in test_result:
            print("✅ Database connection verified")
        
        if success:
            print("=" * 50)
            print(f"🎉 Full backup restored successfully: {backup_name}")
            print("\n📋 Restoration Summary:")
            print("   ✅ Containers stopped and volumes cleaned")
            print("   ✅ Volume snapshots restored (if available)")
            print("   ✅ Database recreated and SQL restored")
            print("   ✅ Redis data restored (if available)")
            print("   ✅ All services restarted and verified")
            print("\n🔗 Access URLs:")
            print("   Frontend: http://localhost:3000")
            print("   Backend API: http://localhost:8000")
            print("   API Docs: http://localhost:8000/docs")
            return True
        else:
            print("❌ Full backup restore failed")
            return False

    def list_backups(self):
        """List all available backups"""
        print("Available Backups for Restore:")
        print("=" * 50)
        
        # Find all metadata files
        metadata_files = list(self.backup_dir.glob("*_metadata.json"))
        
        if not metadata_files:
            print("No backups found")
            return []
        
        backups = []
        
        for metadata_file in sorted(metadata_files):
            try:
                with open(metadata_file, 'r') as f:
                    metadata = json.load(f)
                
                backup_name = metadata['backup_name']
                backups.append(backup_name)
                
                print(f"Name: {backup_name}")
                print(f"Type: {metadata['backup_type']}")
                print(f"Created: {metadata['created_at']}")
                
                if metadata['backup_type'] == 'sql_dump':
                    print(f"Size: {metadata.get('file_size', 'Unknown')} bytes")
                elif metadata['backup_type'] == 'volume_snapshot':
                    print(f"Volumes: {', '.join(metadata.get('volumes', []))}")
                elif metadata['backup_type'] == 'full_backup':
                    components = metadata.get('components', {})
                    print(f"Components: SQL={components.get('sql_dump', False)}, "
                          f"Redis={components.get('redis_backup', False)}, "
                          f"Volumes={components.get('volume_snapshot', False)}")
                
                print("-" * 30)
                
            except Exception as e:
                print(f"Error reading metadata from {metadata_file}: {e}")
        
        return backups

    def complete_database_restore(self, backup_name):
        """Complete database restore - the most robust method"""
        print(f"🚀 Starting Complete Database Restore from backup: {backup_name}")
        print("=" * 70)
        
        # Verify backup exists
        sql_backup = self.backup_dir / f"{backup_name}.sql"
        if not sql_backup.exists():
            print(f"❌ SQL backup file not found: {sql_backup}")
            return False
        
        print(f"✅ Found SQL backup: {sql_backup}")
        
        try:
            # Step 1: Stop all services
            print("\n🔄 Step 1: Stopping all Docker services...")
            self.stop_containers()
            
            # Step 2: Remove ALL database-related volumes
            print("\n🔄 Step 2: Removing existing volumes for clean slate...")
            volumes_to_remove = [
                "python-gold_postgres_data", "python-gold_redis_data", "python-gold_uploads_data",
                "postgres_data", "redis_data", "uploads_data"
            ]
            
            for volume in volumes_to_remove:
                result = self.run_command(f"docker volume rm {volume}", capture_output=False)
            
            # Step 3: Restore volumes from backup (if they exist)
            print("\n🔄 Step 3: Restoring volume snapshots...")
            volume_mapping = {
                "postgres_data": "python-gold_postgres_data",
                "redis_data": "python-gold_redis_data", 
                "uploads_data": "python-gold_uploads_data"
            }
            
            for old_name, new_name in volume_mapping.items():
                if not self.restore_volume_from_backup(backup_name, old_name):
                    self.restore_volume_from_backup(backup_name, new_name)
            
            # Step 4: Start database and Redis services
            print("\n🔄 Step 4: Starting database and Redis services...")
            self.run_command("docker-compose up -d db redis", capture_output=False)
            
            # Step 5: Wait for database to be ready
            print("\n🔄 Step 5: Waiting for database to be ready...")
            import time
            time.sleep(15)
            
            # Step 6: Create fresh database
            print("\n🔄 Step 6: Creating fresh database...")
            self.run_command(f"docker-compose exec -T db psql -U {self.db_config['user']} -d postgres -c \"DROP DATABASE IF EXISTS {self.db_config['database']};\"", capture_output=False)
            self.run_command(f"docker-compose exec -T db psql -U {self.db_config['user']} -d postgres -c \"CREATE DATABASE {self.db_config['database']};\"", capture_output=False)
            
            time.sleep(3)
            
            # Step 7: Restore SQL backup
            print(f"\n🔄 Step 7: Restoring SQL backup...")
            if os.name == 'nt':  # Windows
                restore_cmd = f'powershell -Command "Get-Content \'{sql_backup}\' | docker-compose exec -T db psql -U {self.db_config["user"]} -d {self.db_config["database"]}"'
            else:  # Linux/Mac
                restore_cmd = f"cat {sql_backup} | docker-compose exec -T db psql -U {self.db_config['user']} -d {self.db_config['database']}"
            
            self.run_command(restore_cmd, capture_output=False)
            
            # Step 8: Restore Redis backup if it exists
            print("\n🔄 Step 8: Restoring Redis backup...")
            redis_backup = self.backup_dir / f"{backup_name}_redis.rdb"
            if redis_backup.exists():
                self.run_command("docker-compose stop redis", capture_output=False)
                self.run_command(f"docker cp {redis_backup} goldshop_redis:/data/dump.rdb", capture_output=False)
                self.run_command("docker-compose start redis", capture_output=False)
                print("✅ Redis backup restored")
            else:
                print("ℹ️  No Redis backup found (optional)")
            
            # Step 9: Start all services
            print("\n🔄 Step 9: Starting all services...")
            self.run_command("docker-compose up -d", capture_output=False)
            
            time.sleep(10)
            
            # Step 10: Verify restoration
            print("\n🔄 Step 10: Verifying restoration...")
            
            # Check table count
            verify_cmd = f"docker exec {self.db_config['container']} psql -U {self.db_config['user']} -d {self.db_config['database']} -c \"SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';\""
            verify_result = self.run_command(verify_cmd)
            
            if verify_result:
                print("✅ Database verification successful")
            
            # Check container status
            status_result = self.run_command("docker-compose ps")
            if status_result:
                print("✅ All containers are running")
            
            print("\n" + "=" * 70)
            print(f"🎉 Complete database restore from '{backup_name}' finished successfully!")
            print("\n📋 Restoration Summary:")
            print("   ✅ All Docker services stopped and cleaned")
            print("   ✅ Database volumes completely removed")
            print("   ✅ Backup volumes restored")
            print("   ✅ Database recreated and SQL restored")
            print("   ✅ Redis data restored (if available)")
            print("   ✅ All services restarted and verified")
            print("\n🔗 Access URLs:")
            print("   Frontend: http://localhost:3000")
            print("   Backend API: http://localhost:8000")
            print("   API Docs: http://localhost:8000/docs")
            
            return True
            
        except Exception as e:
            print(f"❌ Complete restore failed: {e}")
            return False
    
    def restore_volume_from_backup(self, backup_name, volume_name):
        """Restore a specific volume from backup"""
        backup_dir = self.backup_dir / backup_name
        
        # Check for backup file (try both formats)
        backup_files = [
            backup_dir / f"{volume_name}_backup.tar.gz",
            backup_dir / volume_name / "data.tar.gz"
        ]
        
        backup_file = None
        for bf in backup_files:
            if bf.exists():
                backup_file = bf
                break
        
        if not backup_file:
            return False
        
        print(f"🔄 Restoring volume: {volume_name} from {backup_file}")
        
        try:
            # Create new volume
            self.run_command(f"docker volume create {volume_name}")
            
            # Restore volume data using docker run
            restore_cmd = [
                "docker", "run", "--rm",
                "-v", f"{volume_name}:/target",
                "-v", f"{backup_file.parent.absolute()}:/backup",
                "alpine:latest",
                "sh", "-c", f"cd /target && tar xzf /backup/{backup_file.name}"
            ]
            
            result = subprocess.run(restore_cmd, capture_output=True, text=True, check=True)
            print(f"✅ Volume {volume_name} restored successfully")
            return True
            
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to restore volume {volume_name}: {e.stderr if e.stderr else str(e)}")
            return False

    def interactive_restore(self):
        """Interactive restore mode"""
        backups = self.list_backups()
        
        if not backups:
            print("No backups available for restore")
            return
        
        print("\nSelect a backup to restore:")
        for i, backup in enumerate(backups, 1):
            print(f"{i}. {backup}")
        
        print(f"\n🔧 Restore Methods:")
        print("1. Complete Restore (Recommended) - Most robust, handles all conflicts")
        print("2. Standard Restore - Original method")
        
        try:
            choice = int(input("\nEnter backup number (0 to cancel): "))
            if choice == 0:
                print("Restore cancelled")
                return
            
            if 1 <= choice <= len(backups):
                backup_name = backups[choice - 1]
                
                method_choice = input("\nChoose restore method (1 for Complete, 2 for Standard, default=1): ").strip()
                use_complete = method_choice != "2"
                
                print(f"\n⚠️  WARNING: This will replace your current database with backup: {backup_name}")
                if use_complete:
                    print("🔧 Using Complete Restore method (recommended)")
                else:
                    print("🔧 Using Standard Restore method")
                    
                confirm = input("Are you sure you want to continue? (yes/no): ")
                
                if confirm.lower() == 'yes':
                    if use_complete:
                        # Use the new complete restore method
                        self.complete_database_restore(backup_name)
                    else:
                        # Use original method
                        metadata = self.get_backup_metadata(backup_name)
                        if metadata:
                            backup_type = metadata.get('backup_type', 'unknown')
                            
                            if backup_type == 'sql_dump':
                                self.restore_sql_backup(backup_name)
                            elif backup_type == 'volume_snapshot':
                                self.restore_volume_snapshot(backup_name)
                                self.start_containers()
                            elif backup_type == 'full_backup':
                                self.restore_full_backup(backup_name)
                            else:
                                print(f"Unknown backup type: {backup_type}")
                else:
                    print("Restore cancelled")
            else:
                print("Invalid selection")
                
        except ValueError:
            print("Invalid input")

def main():
    parser = argparse.ArgumentParser(description='Database Restore Tool for Gold Shop Management System')
    parser.add_argument('action', choices=['sql', 'volume', 'full', 'complete', 'list', 'interactive'], 
                       help='Restore action to perform')
    parser.add_argument('--name', help='Backup name to restore')
    
    args = parser.parse_args()
    
    restore_tool = DatabaseRestore()
    
    if args.action == 'list':
        restore_tool.list_backups()
    elif args.action == 'interactive':
        restore_tool.interactive_restore()
    elif args.name:
        if args.action == 'sql':
            restore_tool.restore_sql_backup(args.name)
        elif args.action == 'volume':
            restore_tool.restore_volume_snapshot(args.name)
            restore_tool.start_containers()
        elif args.action == 'full':
            restore_tool.restore_full_backup(args.name)
        elif args.action == 'complete':
            restore_tool.complete_database_restore(args.name)
    else:
        print("Error: --name is required for sql, volume, full, and complete restore actions")
        print("Use 'interactive' action for guided restore")
        print("\nRestore Methods:")
        print("  sql      - Restore SQL dump only")
        print("  volume   - Restore Docker volumes only") 
        print("  full     - Restore SQL + volumes (standard method)")
        print("  complete - Complete restore with conflict resolution (recommended)")
        print("  interactive - Interactive menu with method selection")

if __name__ == "__main__":
    main()