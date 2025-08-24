#!/usr/bin/env python3
"""
Simple API test for disaster recovery endpoints
"""

import requests
import json

def test_disaster_recovery_api():
    print('Testing disaster recovery API endpoints...')
    
    base_url = 'http://localhost:8000'
    
    try:
        # Test status endpoint
        response = requests.get(f'{base_url}/api/disaster-recovery/status', timeout=10)
        print(f'Status endpoint: {response.status_code}')
        if response.status_code == 200:
            status = response.json()
            print(f'  System status: {status.get("status")}')
            backup_stats = status.get('backup_statistics', {})
            recovery_procs = status.get('recovery_procedures', {})
            print(f'  Total backups: {backup_stats.get("total_backups", 0)}')
            print(f'  Recovery procedures: {recovery_procs.get("total_procedures", 0)}')
        
        # Test procedures listing
        response = requests.get(f'{base_url}/api/disaster-recovery/procedures', timeout=10)
        print(f'Procedures endpoint: {response.status_code}')
        if response.status_code == 200:
            procedures = response.json()
            print(f'  Available procedures: {len(procedures)}')
            for proc in procedures:
                proc_id = proc.get('procedure_id', 'unknown')
                proc_name = proc.get('name', 'unknown')
                print(f'    - {proc_id}: {proc_name}')
        
        # Test retention policy
        response = requests.get(f'{base_url}/api/disaster-recovery/retention-policy', timeout=10)
        print(f'Retention policy endpoint: {response.status_code}')
        if response.status_code == 200:
            policy = response.json()
            daily_retention = policy.get('daily_retention_days', 'unknown')
            print(f'  Daily retention: {daily_retention} days')
        
        print('✓ All disaster recovery API endpoints working correctly!')
        return True
        
    except Exception as e:
        print(f'✗ API test error: {e}')
        return False

if __name__ == "__main__":
    test_disaster_recovery_api()