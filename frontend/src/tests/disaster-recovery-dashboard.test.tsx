import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DisasterRecoveryDashboard } from '../components/settings/DisasterRecoveryDashboard';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

// Mock window.alert
const mockAlert = jest.fn();
global.alert = mockAlert;

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
  },
  {
    backup_id: 'files_uploads_20240115_090000',
    backup_type: 'files',
    created_at: '2024-01-15T09:00:00Z',
    file_path: '/app/backups/files/files_uploads_20240115_090000.backup.enc',
    encrypted: true,
    compressed: true,
    size_bytes: 268435456, // 256MB
    source_path: '/app/uploads'
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
  },
  {
    procedure_id: 'file_system_recovery',
    name: 'File System Recovery',
    description: 'Recovery of file system components',
    estimated_duration_minutes: 20,
    prerequisites: ['File backup available', 'Target directories accessible'],
    total_steps: 5,
    validation_steps_count: 2
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

describe('DisasterRecoveryDashboard', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockAlert.mockClear();
    
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

  it('renders disaster recovery dashboard with loading state', () => {
    render(<DisasterRecoveryDashboard />);
    
    expect(screen.getByText('Loading disaster recovery status...')).toBeInTheDocument();
  });

  it('displays system status overview after loading', async () => {
    render(<DisasterRecoveryDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Disaster Recovery Management')).toBeInTheDocument();
    });

    // Check system status cards
    expect(screen.getByText('1.00 GB')).toBeInTheDocument(); // Total backup size
    expect(screen.getByText('Ready')).toBeInTheDocument(); // Procedures status
    expect(screen.getByText('aws_s3')).toBeInTheDocument(); // Off-site storage provider
    expect(screen.getByText('7d')).toBeInTheDocument(); // Retention policy
  });

  it('displays backup information in backups tab', async () => {
    render(<DisasterRecoveryDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Disaster Recovery Management')).toBeInTheDocument();
    });

    // Click on backups tab
    fireEvent.click(screen.getByText('Backups'));

    await waitFor(() => {
      expect(screen.getByText('Backup Management')).toBeInTheDocument();
      expect(screen.getByText('db_goldshop_20240115_103000')).toBeInTheDocument();
      expect(screen.getByText('files_uploads_20240115_090000')).toBeInTheDocument();
    });
  });

  it('displays recovery procedures in procedures tab', async () => {
    render(<DisasterRecoveryDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Disaster Recovery Management')).toBeInTheDocument();
    });

    // Click on procedures tab
    fireEvent.click(screen.getByText('Procedures'));

    await waitFor(() => {
      expect(screen.getByText('Recovery Procedures')).toBeInTheDocument();
      expect(screen.getByText('Database Recovery')).toBeInTheDocument();
      expect(screen.getByText('File System Recovery')).toBeInTheDocument();
    });
  });

  it('displays off-site storage information in storage tab', async () => {
    render(<DisasterRecoveryDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Disaster Recovery Management')).toBeInTheDocument();
    });

    // Click on off-site storage tab
    fireEvent.click(screen.getByText('Off-site Storage'));

    await waitFor(() => {
      expect(screen.getByText('Off-site Storage Configuration')).toBeInTheDocument();
      expect(screen.getByText('test-disaster-recovery-backups')).toBeInTheDocument();
      expect(screen.getByText('us-east-1')).toBeInTheDocument();
    });
  });

  it('handles test recovery procedure execution', async () => {
    mockFetch.mockImplementation((url: string, options?: any) => {
      if (url.includes('/api/disaster-recovery/execute') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            recovery_id: 'test_recovery_123',
            status: 'completed'
          })
        });
      }
      // Return default mocks for other endpoints
      return mockFetch.mockImplementation((url: string) => {
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
      })(url);
    });

    render(<DisasterRecoveryDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Disaster Recovery Management')).toBeInTheDocument();
    });

    // Click on procedures tab
    fireEvent.click(screen.getByText('Procedures'));

    await waitFor(() => {
      expect(screen.getByText('Recovery Procedures')).toBeInTheDocument();
    });

    // Click test procedure button
    const testButtons = screen.getAllByText('Test Procedure');
    fireEvent.click(testButtons[0]);

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Recovery procedure test completed: Success');
    });
  });

  it('handles retention policy application', async () => {
    mockFetch.mockImplementation((url: string, options?: any) => {
      if (url.includes('/api/disaster-recovery/retention-policy/apply') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            backups_deleted: 2,
            backups_archived: 1
          })
        });
      }
      // Return default mocks for other endpoints
      return mockFetch.mockImplementation((url: string) => {
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
      })(url);
    });

    render(<DisasterRecoveryDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Disaster Recovery Management')).toBeInTheDocument();
    });

    // Click on overview tab to access quick actions
    const applyRetentionButtons = screen.getAllByText('Apply Retention Policy');
    fireEvent.click(applyRetentionButtons[0]);

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Retention policy applied: 2 backups deleted, 1 archived');
    });
  });

  it('handles off-site storage sync', async () => {
    mockFetch.mockImplementation((url: string, options?: any) => {
      if (url.includes('/api/disaster-recovery/offsite-storage/sync') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            uploaded_count: 2,
            failed_count: 0
          })
        });
      }
      // Return default mocks for other endpoints
      return mockFetch.mockImplementation((url: string) => {
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
      })(url);
    });

    render(<DisasterRecoveryDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Disaster Recovery Management')).toBeInTheDocument();
    });

    // Click on overview tab to access quick actions
    const syncButtons = screen.getAllByText('Sync to Off-site Storage');
    fireEvent.click(syncButtons[0]);

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Off-site sync completed: 2 backups uploaded');
    });
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

  it('refreshes data when refresh button is clicked', async () => {
    render(<DisasterRecoveryDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Disaster Recovery Management')).toBeInTheDocument();
    });

    // Click refresh button
    fireEvent.click(screen.getByText('Refresh'));

    // Verify that fetch was called again
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(8); // 4 initial calls + 4 refresh calls
    });
  });

  it('displays system health with progress bars', async () => {
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

  it('formats bytes correctly', async () => {
    render(<DisasterRecoveryDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Disaster Recovery Management')).toBeInTheDocument();
    });

    // Check that bytes are formatted correctly (1GB = 1073741824 bytes)
    expect(screen.getByText('1.00 GB')).toBeInTheDocument();
  });

  it('formats dates correctly', async () => {
    render(<DisasterRecoveryDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Disaster Recovery Management')).toBeInTheDocument();
    });

    // Click on backups tab to see formatted dates
    fireEvent.click(screen.getByText('Backups'));

    await waitFor(() => {
      // Check that dates are formatted (exact format may vary by locale)
      expect(screen.getByText(/2024/)).toBeInTheDocument();
    });
  });
});