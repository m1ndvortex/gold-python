#!/usr/bin/env python3
"""
Database Backup Script for Gold Shop Management System
Supports both SQL dumps and Docker volume snapshots
"""

import os
import sys
import subprocess
import datetime
import json
import argparse
from pathlib import Path

class DatabaseBackup:
    def __init__(self):
        self.backup_dir = Path("backups")
        self.backup_dir.mkdir(exist_ok=True)
        
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
        
        # Docker volumes to backup
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

    def create_sql_backup(self, backup_name=None):
        """Create SQL dump backup of PostgreSQL database"""
        if backup_name is None:
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_name = f"goldshop_sql_backup_{timestamp}"
        
        sql_file = self.backup_dir / f"{backup_name}.sql"
        
        print(f"Creating SQL backup: {sql_file}")
        
        # Create PostgreSQL dump
        pg_dump_cmd = (
            f"docker exec {self.db_config['container']} "
            f"pg_dump -U {self.db_config['user']} "
            f"-d {self.db_config['database']} "
            f"--verbose --clean --if-exists --create"
        )
        
        result = self.run_command(f"{pg_dump_cmd} > {sql_file}")
        
        if sql_file.exists() and sql_file.stat().st_size > 0:
            print(f"✅ SQL backup created successfully: {sql_file}")
            
            # Create metadata file
            metadata = {
                'backup_type': 'sql_dump',
                'backup_name': backup_name,
                'created_at': datetime.datetime.now().isoformat(),
                'database': self.db_config['database'],
                'file_size': sql_file.stat().st_size,
                'file_path': str(sql_file)
            }
            
            metadata_file = self.backup_dir / f"{backup_name}_metadata.json"
            with open(metadata_file, 'w') as f:
                json.dump(metadata, f, indent=2)
            
            return backup_name
        else:
            print("❌ Failed to create SQL backup")
            return None

    def create_redis_backup(self, backup_name):
        """Create Redis backup"""
        redis_file = self.backup_dir / f"{backup_name}_redis.rdb"
        
        print(f"Creating Redis backup: {redis_file}")
        
        # Create Redis backup
        redis_cmd = f"docker exec {self.redis_config['container']} redis-cli BGSAVE"
        self.run_command(redis_cmd)
        
        # Wait a moment for background save to complete
        import time
        time.sleep(2)
        
        # Copy Redis dump file
        copy_cmd = f"docker cp {self.redis_config['container']}:/data/dump.rdb {redis_file}"
        result = self.run_command(copy_cmd)
        
        if redis_file.exists():
            print(f"✅ Redis backup created successfully: {redis_file}")
            return True
        else:
            print("❌ Failed to create Redis backup")
            return False

    def create_volume_snapshot(self, backup_name=None):
        """Create Docker volume snapshots using simple docker cp method"""
        if backup_name is None:
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_name = f"goldshop_volume_snapshot_{timestamp}"
        
        snapshot_dir = self.backup_dir / backup_name
        snapshot_dir.mkdir(exist_ok=True)
        
        print(f"Creating volume snapshots in: {snapshot_dir}")
        
        successful_volumes = []
        
        for volume in self.volumes:
            print(f"Backing up volume: {volume}")
            
            # Create backup file path
            backup_file = snapshot_dir / f"{volume}_backup.tar.gz"
            
            try:
                # Use docker run with volume mount to create tar backup
                # This approach works better on Windows
                backup_cmd = [
                    "docker", "run", "--rm",
                    "-v", f"{volume}:/source:ro",
                    "-v", f"{snapshot_dir.absolute()}:/host_backup",
                    "alpine:latest",
                    "tar", "czf", f"/host_backup/{volume}_backup.tar.gz", "-C", "/source", "."
                ]
                
                result = subprocess.run(backup_cmd, capture_output=True, text=True, check=True)
                
                if backup_file.exists() and backup_file.stat().st_size > 0:
                    print(f"✅ Volume {volume} backed up successfully ({backup_file.stat().st_size} bytes)")
                    successful_volumes.append(volume)
                else:
                    print(f"❌ Failed to backup volume {volume} - no output file created")
                    
            except subprocess.CalledProcessError as e:
                print(f"❌ Failed to backup volume {volume}")
                print(f"   Error: {e.stderr if e.stderr else str(e)}")
                
                # Try alternative method using docker cp
                try:
                    print(f"   Trying alternative method for {volume}...")
                    temp_container = f"temp_backup_{volume}_{int(datetime.datetime.now().timestamp())}"
                    
                    # Create container with volume
                    subprocess.run([
                        "docker", "create", "--name", temp_container,
                        "-v", f"{volume}:/data",
                        "alpine:latest"
                    ], check=True, capture_output=True)
                    
                    # Create tar inside container and copy out
                    subprocess.run([
                        "docker", "run", "--rm", "--volumes-from", temp_container,
                        "alpine:latest", "tar", "czf", "/tmp/backup.tar.gz", "-C", "/data", "."
                    ], check=True, capture_output=True)
                    
                    # Copy the backup file out
                    subprocess.run([
                        "docker", "cp", f"{temp_container}:/tmp/backup.tar.gz", str(backup_file)
                    ], check=True, capture_output=True)
                    
                    # Clean up
                    subprocess.run(["docker", "rm", temp_container], capture_output=True)
                    
                    if backup_file.exists() and backup_file.stat().st_size > 0:
                        print(f"✅ Volume {volume} backed up successfully with alternative method ({backup_file.stat().st_size} bytes)")
                        successful_volumes.append(volume)
                    else:
                        print(f"❌ Alternative method also failed for volume {volume}")
                        
                except Exception as alt_e:
                    print(f"❌ Alternative method failed: {alt_e}")
                    # Clean up temp container if it exists
                    subprocess.run(["docker", "rm", "-f", temp_container], capture_output=True)
        
        if successful_volumes:
            # Create metadata file
            metadata = {
                'backup_type': 'volume_snapshot',
                'backup_name': backup_name,
                'created_at': datetime.datetime.now().isoformat(),
                'volumes': successful_volumes,
                'backup_path': str(snapshot_dir)
            }
            
            metadata_file = snapshot_dir / "metadata.json"
            with open(metadata_file, 'w') as f:
                json.dump(metadata, f, indent=2)
            
            print(f"✅ Volume snapshot created successfully: {snapshot_dir}")
            return backup_name
        else:
            print("❌ Failed to create volume snapshots")
            return None

    def create_full_backup(self, backup_name=None):
        """Create both SQL dump and volume snapshot"""
        if backup_name is None:
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_name = f"goldshop_full_backup_{timestamp}"
        
        print(f"Creating full backup: {backup_name}")
        print("=" * 50)
        
        if not self.check_containers_running():
            print("❌ Required containers are not running. Please start them first:")
            print("docker-compose up -d")
            return None
        
        # Create SQL backup
        sql_success = self.create_sql_backup(backup_name)
        
        # Create Redis backup
        redis_success = self.create_redis_backup(backup_name)
        
        # Create volume snapshots
        volume_success = self.create_volume_snapshot(backup_name)
        
        if sql_success and volume_success:
            print("=" * 50)
            print(f"✅ Full backup completed successfully: {backup_name}")
            
            # Create combined metadata
            full_metadata = {
                'backup_type': 'full_backup',
                'backup_name': backup_name,
                'created_at': datetime.datetime.now().isoformat(),
                'components': {
                    'sql_dump': sql_success is not None,
                    'redis_backup': redis_success,
                    'volume_snapshot': volume_success is not None
                }
            }
            
            metadata_file = self.backup_dir / f"{backup_name}_full_metadata.json"
            with open(metadata_file, 'w') as f:
                json.dump(full_metadata, f, indent=2)
            
            return backup_name
        else:
            print("❌ Full backup failed")
            return None

    def list_backups(self):
        """List all available backups"""
        print("Available Backups:")
        print("=" * 50)
        
        # Find all metadata files
        metadata_files = list(self.backup_dir.glob("*_metadata.json"))
        
        if not metadata_files:
            print("No backups found")
            return
        
        for metadata_file in sorted(metadata_files):
            try:
                with open(metadata_file, 'r') as f:
                    metadata = json.load(f)
                
                print(f"Name: {metadata['backup_name']}")
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

def main():
    parser = argparse.ArgumentParser(description='Database Backup Tool for Gold Shop Management System')
    parser.add_argument('action', choices=['sql', 'volume', 'full', 'list'], 
                       help='Backup action to perform')
    parser.add_argument('--name', help='Custom backup name')
    
    args = parser.parse_args()
    
    backup_tool = DatabaseBackup()
    
    if args.action == 'sql':
        backup_tool.create_sql_backup(args.name)
    elif args.action == 'volume':
        backup_tool.create_volume_snapshot(args.name)
    elif args.action == 'full':
        backup_tool.create_full_backup(args.name)
    elif args.action == 'list':
        backup_tool.list_backups()

if __name__ == "__main__":
    main()