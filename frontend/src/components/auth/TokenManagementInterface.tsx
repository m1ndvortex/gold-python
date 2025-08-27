import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';
import { 
  Key, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Activity,
  Calendar,
  Timer,
  Trash2,
  LogOut
} from 'lucide-react';

interface TokenInfo {
  access_token_expires_at: string;
  refresh_token_expires_at: string;
  scopes: string[];
  created_at: string;
  last_refreshed_at?: string;
  refresh_count: number;
}

interface SessionInfo {
  session_id: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  last_activity: string;
  is_current: boolean;
}

export const TokenManagementInterface: React.FC = () => {
  const { language } = useLanguage();
  const { logout } = useAuth();
  
  // State
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Load token information
  useEffect(() => {
    loadTokenInfo();
    loadSessions();
    
    // Set up auto-refresh timer
    const interval = setInterval(() => {
      loadTokenInfo();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const loadTokenInfo = async () => {
    try {
      const response = await fetch('/api/oauth2/token-info', {
        headers: {
          'Authorization': \Bearer \\
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTokenInfo(data);
      }
    } catch (error) {
      console.error('Failed to load token info:', error);
    }
  };

  const loadSessions = async () => {
    try {
      const response = await fetch('/api/oauth2/sessions', {
        headers: {
          'Authorization': \Bearer \\
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const handleRefreshToken = async () => {
    setRefreshing(true);
    setError('');
    setSuccess('');

    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch('/api/oauth2/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          refresh_token: refreshToken
        })
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      
      // Update stored tokens
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('token_expiry', (Date.now() + (data.expires_in * 1000)).toString());

      setSuccess(language === 'en' 
        ? 'Tokens refreshed successfully' 
        : 'توکنها با موفقیت تازهسازی شدند'
      );
      
      // Reload token info
      await loadTokenInfo();

    } catch (error) {
      setError(language === 'en' 
        ? \Token refresh failed: \The term 'tail' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'X'. The term 'chmod' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'Chord'. A parameter cannot be found that matches parameter name 'Chord'. A parameter cannot be found that matches parameter name 'Chord'. A parameter cannot be found that matches parameter name 'Chord'.\ 
        : \تازهسازی توکن ناموفق بود: \The term 'tail' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'X'. The term 'chmod' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'Chord'. A parameter cannot be found that matches parameter name 'Chord'. A parameter cannot be found that matches parameter name 'Chord'. A parameter cannot be found that matches parameter name 'Chord'.\
      );
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className=" space-y-6\>
