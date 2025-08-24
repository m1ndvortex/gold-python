import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { DisasterRecoveryDashboard } from '../components/settings/DisasterRecoveryDashboard';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

// Mock data
const mockSystemStatus = {
  status: 'operational',
  backup_statistics: {
    total_backups: 5,
    backup_types: { database: 3, files: 2 },
    total_size_bytes: 1073741824, // 1GB
    latest_backup: '2024-01-15T10:30:00Z'
  },
  recovery_procedures: {
    total_procedures: 3,
    available_procedures: ['database_recovery', 'file_system_recovery', 'full_system_recovery']
  },
  off_site_storage: {
    configured: true,
    provider: 'aws_s3'
  },
  retention_policy: {
    daily_retention_days: 7,
    weekly_retention_weeks: 4,
    monthly_retention_months: 12,
    yearly_retention_years: 3
  },
  system_health: 'healthy'
};

const mockBackups = [
  {
    backup_id: 'db_goldshop_20240115_103000',
    backup_type: 'database',
    created_at: '2024-01-15T10:30:00Z',
    file_path: '/app/backups/database/db_goldshop_20240115_103000.backup.enc',
    encrypted: true,
    compressed: true,
    size_bytes: 536870912, // 512MB
    database_name: 'goldshop'
  }
];

const mockProcedures = [
  {
    procedure_id: 'database_recovery',
    name: 'Database Recovery',
    description: 'Complete database recovery from backup',
    estimated_duration_minutes: 30,
    prerequisites: ['Database service stopped', 'Backup file available'],
    total_steps: 5,
    validation_steps_count: 3
  }
];

const mockOffSiteStatus = {
  configured: true,
  provider: 'aws_s3',
  bucket_name: 'test-disaster-recovery-backups',
  region: 'us-east-1',
  encryption_enabled: true,
  remote_backups_count: 3,
  local_backups_count: 5,
  total_remote_size: 805306368, // 768MB
  last_sync_check: '2024-01-15T11:00:00Z'
};

describe('DisasterRecoveryDashboard - Basic Functionality', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    
    // Setup default mock responses
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/disaster-recovery/status')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSystemStatus)
        });
      }
      if (url.includes('/api/backup/list')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockBackups)
        });
      }
      if (url.includes('/api/disaster-recovery/procedures')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockProcedures)
        });
      }
      if (url.includes('/api/disaster-recovery/offsite-storage/status')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockOffSiteStatus)
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  it('renders disaster recovery dashboard with loading state initially', () => {
    render(<DisasterRecoveryDashboard />);
    
    expect(screen.getByText('Loading disaster recovery status...')).toBeInTheDocument();
  });

  it('displays disaster recovery management header after loading', async () => {
    render(<DisasterRecoveryDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Disaster Recovery Management')).toBeInTheDocument();
    });

    expect(screen.getByText('Monitor and manage backup systems, recovery procedures, and business continuity')).toBeInTheDocument();
  });

  it('displays system health status badge', async () => {
    render(<DisasterRecoveryDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('healthy')).toBeInTheDocument();
    });
  });

  it('displays backup statistics card', async () => {
    render(<DisasterRecoveryDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Disaster Recovery Management')).toBeInTheDocument();
    });

    // Check that backup statistics are displayed
    expect(screen.getByText('5')).toBeInTheDocument(); // Total backups badge
  });

  it('displays recovery procedures count', async () => {
    render(<DisasterRecoveryDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Disaster Recovery Management')).toBeInTheDocument();
    });

    // Check that procedures count is displayed
    expect(screen.getByText('3')).toBeInTheDocument(); // Total procedures badge
    expect(screen.getAllByText('Ready')[0]).toBeInTheDocument(); // Procedures status
  });

  it('displays off-site storage information', async () => {
    render(<DisasterRecoveryDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Disaster Recovery Management')).toBeInTheDocument();
    });

    // Check that off-site storage info is displayed
    expect(screen.getByText('aws_s3')).toBeInTheDocument(); // Provider
    expect(screen.getByText('Configured')).toBeInTheDocument(); // Status badge
  });

  it('displays retention policy information', async () => {
    render(<DisasterRecoveryDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Disaster Recovery Management')).toBeInTheDocument();
    });

    // Check that retention policy is displayed
    expect(screen.getByText('7d')).toBeInTheDocument(); // Daily retention
    expect(screen.getAllByText('Active')[0]).toBeInTheDocument(); // Status badge
  });

  it('displays refresh button', async () => {
    render(<DisasterRecoveryDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Disaster Recovery Management')).toBeInTheDocument();
    });

    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });

  it('displays tab navigation', async () => {
    render(<DisasterRecoveryDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Disaster Recovery Management')).toBeInTheDocument();
    });

    // Check that all tabs are present
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getAllByText('Backups')[0]).toBeInTheDocument(); // Tab button
    expect(screen.getAllByText('Procedures')[0]).toBeInTheDocument(); // Tab button
    expect(screen.getAllByText('Off-site Storage')[0]).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('displays system health status section', async () => {
    render(<DisasterRecoveryDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Disaster Recovery Management')).toBeInTheDocument();
    });

    // Check system health section
    expect(screen.getByText('System Health Status')).toBeInTheDocument();
    expect(screen.getByText('Backup System')).toBeInTheDocument();
    expect(screen.getByText('Storage Space')).toBeInTheDocument();
    expect(screen.getByText('Recovery Readiness')).toBeInTheDocument();
  });

  it('displays quick actions section', async () => {
    render(<DisasterRecoveryDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Disaster Recovery Management')).toBeInTheDocument();
    });

    // Check quick actions section
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Test Database Recovery')).toBeInTheDocument();
    expect(screen.getByText('Apply Retention Policy')).toBeInTheDocument();
    expect(screen.getByText('Sync to Off-site Storage')).toBeInTheDocument();
    expect(screen.getByText('Refresh All Data')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    mockFetch.mockImplementation(() => {
      return Promise.resolve({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });
    });

    render(<DisasterRecoveryDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/Error loading disaster recovery data/)).toBeInTheDocument();
    });

    // Check that retry button is present
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('makes correct API calls on initialization', async () => {
    render(<DisasterRecoveryDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Disaster Recovery Management')).toBeInTheDocument();
    });

    // Verify that all required API calls were made
    expect(mockFetch).toHaveBeenCalledWith('/api/disaster-recovery/status');
    expect(mockFetch).toHaveBeenCalledWith('/api/backup/list');
    expect(mockFetch).toHaveBeenCalledWith('/api/disaster-recovery/procedures');
    expect(mockFetch).toHaveBeenCalledWith('/api/disaster-recovery/offsite-storage/status');
  });
});