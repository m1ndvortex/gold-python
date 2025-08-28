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
        """Restore from SQL dump"""
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
        time.sleep(5)
        
        # Restore SQL dump
        restore_cmd = (
            f"docker exec -i {self.db_config['container']} "
            f"psql -U {self.db_config['user']} -d {self.db_config['database']}"
        )
        
        # Use shell redirection to pipe SQL file
        full_cmd = f"{restore_cmd} < {sql_file}"
        result = self.run_command(full_cmd, capture_output=False)
        
        if result is not None:
            print(f"✅ SQL backup restored successfully from: {sql_file}")
            return True
        else:
            print("❌ Failed to restore SQL backup")
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
        """Restore full backup (SQL + volumes)"""
        print(f"Restoring full backup: {backup_name}")
        print("=" * 50)
        
        metadata = self.get_backup_metadata(backup_name)
        if not metadata:
            print(f"❌ Backup metadata not found for: {backup_name}")
            return False
        
        print(f"Backup created: {metadata.get('created_at', 'Unknown')}")
        
        # Stop containers for safe restore
        self.stop_containers()
        
        success = True
        
        # Restore volume snapshots first
        if metadata.get('backup_type') == 'full_backup' or metadata.get('backup_type') == 'volume_snapshot':
            volume_success = self.restore_volume_snapshot(backup_name)
            success = success and volume_success
        
        # Start containers
        self.start_containers()
        
        # Restore SQL backup
        sql_success = self.restore_sql_backup(backup_name)
        success = success and sql_success
        
        # Restore Redis backup
        redis_success = self.restore_redis_backup(backup_name)
        # Redis restore is optional, don't fail if it doesn't exist
        
        if success:
            print("=" * 50)
            print(f"✅ Full backup restored successfully: {backup_name}")
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

    def interactive_restore(self):
        """Interactive restore mode"""
        backups = self.list_backups()
        
        if not backups:
            print("No backups available for restore")
            return
        
        print("\nSelect a backup to restore:")
        for i, backup in enumerate(backups, 1):
            print(f"{i}. {backup}")
        
        try:
            choice = int(input("\nEnter backup number (0 to cancel): "))
            if choice == 0:
                print("Restore cancelled")
                return
            
            if 1 <= choice <= len(backups):
                backup_name = backups[choice - 1]
                
                print(f"\n⚠️  WARNING: This will replace your current database with backup: {backup_name}")
                confirm = input("Are you sure you want to continue? (yes/no): ")
                
                if confirm.lower() == 'yes':
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
    parser.add_argument('action', choices=['sql', 'volume', 'full', 'list', 'interactive'], 
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
    else:
        print("Error: --name is required for sql, volume, and full restore actions")
        print("Use 'interactive' action for guided restore")

if __name__ == "__main__":
    main()