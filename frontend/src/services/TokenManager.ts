import CryptoJS from 'crypto-js';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface TokenPayload {
  sub: string;
  exp: number;
  iat: number;
  scope?: string[];
  user_id: string;
  email: string;
  roles?: string[];
  permissions?: string[];
}

export class TokenManager {
  private static instance: TokenManager;
  private refreshTimer: NodeJS.Timeout | null = null;
  private readonly ENCRYPTION_KEY = 'goldshop-secure-key-2024';
  private readonly ACCESS_TOKEN_KEY = 'goldshop_access_token';
  private readonly REFRESH_TOKEN_KEY = 'goldshop_refresh_token';
  private readonly TOKEN_EXPIRY_KEY = 'goldshop_token_expiry';
  private readonly TOKEN_TYPE_KEY = 'goldshop_token_type';

  private constructor() {
    // Private constructor for singleton
    this.scheduleTokenRefresh();
  }

  public static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  /**
   * Store tokens securely with encryption
   */
  public setTokens(accessToken: string, refreshToken: string, expiresIn: number): void {
    try {
      const expiryTime = Date.now() + (expiresIn * 1000);
      
      // Encrypt tokens before storing
      const encryptedAccessToken = this.encryptToken(accessToken);
      const encryptedRefreshToken = this.encryptToken(refreshToken);
      
      localStorage.setItem(this.ACCESS_TOKEN_KEY, encryptedAccessToken);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, encryptedRefreshToken);
      localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
      localStorage.setItem(this.TOKEN_TYPE_KEY, 'Bearer');
      
      // Schedule automatic refresh
      this.scheduleTokenRefresh();
      
      console.log('Tokens stored successfully');
    } catch (error) {
      console.error('Failed to store tokens:', error);
      throw new Error('Token storage failed');
    }
  }

  /**
   * Get decrypted access token
   */
  public getAccessToken(): string | null {
    try {
      const encryptedToken = localStorage.getItem(this.ACCESS_TOKEN_KEY);
      if (!encryptedToken) return null;
      
      return this.decryptToken(encryptedToken);
    } catch (error) {
      console.error('Failed to get access token:', error);
      this.clearTokens();
      return null;
    }
  }

  /**
   * Get decrypted refresh token
   */
  public getRefreshToken(): string | null {
    try {
      const encryptedToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
      if (!encryptedToken) return null;
      
      return this.decryptToken(encryptedToken);
    } catch (error) {
      console.error('Failed to get refresh token:', error);
      this.clearTokens();
      return null;
    }
  }

  /**
   * Get token type (usually 'Bearer')
   */
  public getTokenType(): string {
    return localStorage.getItem(this.TOKEN_TYPE_KEY) || 'Bearer';
  }

  /**
   * Get token expiry timestamp
   */
  public getTokenExpiry(): number | null {
    const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    return expiry ? parseInt(expiry) : null;
  }

  /**
   * Check if access token is expired
   */
  public isTokenExpired(): boolean {
    const expiry = this.getTokenExpiry();
    if (!expiry) return true;
    
    // Add 30 second buffer to prevent edge cases
    return Date.now() > (expiry - 30000);
  }

  /**
   * Check if token will expire soon (within 5 minutes)
   */
  public isTokenExpiringSoon(): boolean {
    const expiry = this.getTokenExpiry();
    if (!expiry) return true;
    
    // Check if expires within 5 minutes
    return Date.now() > (expiry - 300000);
  }

  /**
   * Clear all stored tokens
   */
  public clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
    localStorage.removeItem(this.TOKEN_TYPE_KEY);
    
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    
    console.log('Tokens cleared');
  }

  /**
   * Refresh tokens automatically
   */
  public async refreshTokens(): Promise<boolean> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch('/api/oauth2/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Store new tokens
      this.setTokens(data.access_token, data.refresh_token, data.expires_in);
      
      console.log('Tokens refreshed successfully');
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearTokens();
      return false;
    }
  }

  /**
   * Schedule automatic token refresh
   */
  public scheduleTokenRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    const expiry = this.getTokenExpiry();
    if (!expiry) return;

    // Schedule refresh 5 minutes before expiry
    const refreshTime = expiry - Date.now() - 300000; // 5 minutes before expiry
    
    if (refreshTime > 0) {
      this.refreshTimer = setTimeout(async () => {
        console.log('Auto-refreshing tokens...');
        await this.refreshTokens();
      }, refreshTime);
      
      console.log(`Token refresh scheduled in ${Math.round(refreshTime / 1000)} seconds`);
    } else if (this.isTokenExpiringSoon()) {
      // If token is already expiring soon, refresh immediately
      setTimeout(() => this.refreshTokens(), 1000);
    }
  }

  /**
   * Decode JWT token payload (without verification)
   */
  public decodeTokenPayload(token: string): TokenPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const payload = JSON.parse(atob(parts[1]));
      return payload as TokenPayload;
    } catch (error) {
      console.error('Failed to decode token payload:', error);
      return null;
    }
  }

  /**
   * Get current user info from access token
   */
  public getCurrentUserFromToken(): TokenPayload | null {
    const accessToken = this.getAccessToken();
    if (!accessToken) return null;
    
    return this.decodeTokenPayload(accessToken);
  }

  /**
   * Validate token format and structure
   */
  public validateTokenFormat(token: string): boolean {
    if (!token || typeof token !== 'string') return false;
    
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    try {
      // Try to decode header and payload
      JSON.parse(atob(parts[0]));
      JSON.parse(atob(parts[1]));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get authorization header value
   */
  public getAuthorizationHeader(): string | null {
    const token = this.getAccessToken();
    if (!token) return null;
    
    return `${this.getTokenType()} ${token}`;
  }

  /**
   * Encrypt token using AES
   */
  private encryptToken(token: string): string {
    return CryptoJS.AES.encrypt(token, this.ENCRYPTION_KEY).toString();
  }

  /**
   * Decrypt token using AES
   */
  private decryptToken(encryptedToken: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedToken, this.ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  /**
   * Revoke current tokens on server
   */
  public async revokeTokens(): Promise<boolean> {
    try {
      const accessToken = this.getAccessToken();
      if (!accessToken) return true;

      await fetch('/api/oauth2/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthorizationHeader() || '',
        },
        body: JSON.stringify({
          token: accessToken,
          token_type_hint: 'access_token',
        }),
      });

      this.clearTokens();
      return true;
    } catch (error) {
      console.error('Token revocation failed:', error);
      // Clear tokens anyway for security
      this.clearTokens();
      return false;
    }
  }

  /**
   * Check if user has valid authentication
   */
  public isAuthenticated(): boolean {
    const token = this.getAccessToken();
    return !!(token && this.validateTokenFormat(token) && !this.isTokenExpired());
  }

  /**
   * Get token info for debugging
   */
  public getTokenInfo(): {
    hasAccessToken: boolean;
    hasRefreshToken: boolean;
    isExpired: boolean;
    isExpiringSoon: boolean;
    expiresAt: Date | null;
    tokenType: string;
  } {
    const expiry = this.getTokenExpiry();
    
    return {
      hasAccessToken: !!this.getAccessToken(),
      hasRefreshToken: !!this.getRefreshToken(),
      isExpired: this.isTokenExpired(),
      isExpiringSoon: this.isTokenExpiringSoon(),
      expiresAt: expiry ? new Date(expiry) : null,
      tokenType: this.getTokenType(),
    };
  }
}

// Export singleton instance
export const tokenManager = TokenManager.getInstance();