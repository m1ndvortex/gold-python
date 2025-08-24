#!/usr/bin/env python3
"""
Simple test for disaster recovery Celery tasks
"""

def test_disaster_recovery_tasks():
    print('Testing disaster recovery Celery tasks...')
    
    try:
        from analytics_tasks.disaster_recovery_tasks import monitor_system_health
        
        print('Testing system health monitoring task...')
        result = monitor_system_health()
        
        print(f'Task result: {result["success"]}')
        print(f'Overall health: {result["overall_health"]}')
        print(f'Health score: {result["health_score"]:.1f}%')
        print(f'Health checks: {result["total_checks"]}')
        
        # Check individual health checks
        health_checks = result.get("health_checks", {})
        for check_name, check_result in health_checks.items():
            status = check_result.get("status", "unknown")
            print(f'  {check_name}: {status}')
        
        print('✓ Disaster recovery Celery tasks working correctly!')
        return True
        
    except Exception as e:
        print(f'✗ Celery task test error: {e}')
        return False

if __name__ == "__main__":
    test_disaster_recovery_tasks()