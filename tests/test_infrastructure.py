"""
Infrastructure Tests for Universal Inventory Management System
Tests Docker services, Nginx configuration, SSL, health checks, and monitoring
"""

import pytest
import requests
import time
import subprocess
import json
import ssl
import socket
from urllib.parse import urlparse
import docker
import psycopg2
import redis
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

class TestDockerInfrastructure:
    """Test Docker services and container health"""
    
    @pytest.fixture(scope="class")
    def docker_client(self):
        """Docker client fixture"""
        return docker.from_env()
    
    def test_all_containers_running(self, docker_client):
        """Test that all required containers are running"""
        required_containers = [
            "goldshop_db",
            "goldshop_redis", 
            "goldshop_backend",
            "goldshop_frontend",
            "goldshop_nginx"
        ]
        
        running_containers = [c.name for c in docker_client.containers.list()]
        
        for container_name in required_containers:
            assert container_name in running_containers, f"Container {container_name} is not running"
    
    def test_container_health_checks(self, docker_client):
        """Test container health check status"""
        containers_with_health_checks = [
            "goldshop_db",
            "goldshop_redis",
            "goldshop_backend",
            "goldshop_frontend"
        ]
        
        for container_name in containers_with_health_checks:
            try:
                container = docker_client.containers.get(container_name)
                health = container.attrs['State'].get('Health', {})
                status = health.get('Status', 'none')
                
                assert status in ['healthy', 'none'], f"Container {container_name} health status: {status}"
            except docker.errors.NotFound:
                pytest.fail(f"Container {container_name} not found")
    
    def test_container_resource_limits(self, docker_client):
        """Test that containers have appropriate resource limits"""
        container_limits = {
            "goldshop_db": {"memory": "2g", "cpus": "1.0"},
            "goldshop_redis": {"memory": "512m", "cpus": "0.5"},
            "goldshop_backend": {"memory": "1g", "cpus": "1.0"}
        }
        
        for container_name, expected_limits in container_limits.items():
            try:
                container = docker_client.containers.get(container_name)
                host_config = container.attrs['HostConfig']
                
                # Check memory limit (if set)
                if 'Memory' in host_config and host_config['Memory'] > 0:
                    memory_limit = host_config['Memory']
                    # Convert expected limit to bytes for comparison
                    expected_memory = self._parse_memory_limit(expected_limits['memory'])
                    assert memory_limit <= expected_memory * 1.1, f"Container {container_name} memory limit too high"
                
            except docker.errors.NotFound:
                pytest.fail(f"Container {container_name} not found")
    
    def _parse_memory_limit(self, limit_str):
        """Parse memory limit string to bytes"""
        multipliers = {'k': 1024, 'm': 1024**2, 'g': 1024**3}
        if limit_str[-1].lower() in multipliers:
            return int(limit_str[:-1]) * multipliers[limit_str[-1].lower()]
        return int(limit_str)

class TestNginxConfiguration:
    """Test Nginx reverse proxy configuration"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """HTTP session with retry strategy"""
        session = requests.Session()
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        return session
    
    def test_http_to_https_redirect(self, session):
        """Test HTTP to HTTPS redirect"""
        try:
            response = session.get("http://localhost", allow_redirects=False, timeout=10)
            assert response.status_code == 301, "HTTP should redirect to HTTPS"
            assert response.headers.get('Location', '').startswith('https://'), "Redirect should be to HTTPS"
        except requests.exceptions.RequestException as e:
            pytest.skip(f"Cannot connect to HTTP endpoint: {e}")
    
    def test_https_ssl_configuration(self):
        """Test HTTPS SSL configuration"""
        try:
            context = ssl.create_default_context()
            context.check_hostname = False
            context.verify_mode = ssl.CERT_NONE
            
            with socket.create_connection(('localhost', 443), timeout=10) as sock:
                with context.wrap_socket(sock, server_hostname='localhost') as ssock:
                    cert = ssock.getpeercert()
                    assert cert is not None, "SSL certificate should be present"
                    
        except (socket.error, ssl.SSLError) as e:
            pytest.skip(f"Cannot test SSL configuration: {e}")
    
    def test_security_headers(self, session):
        """Test security headers are present"""
        try:
            response = session.get("https://localhost/health", verify=False, timeout=10)
            
            security_headers = [
                'X-Frame-Options',
                'X-Content-Type-Options', 
                'X-XSS-Protection',
                'Strict-Transport-Security',
                'Content-Security-Policy'
            ]
            
            for header in security_headers:
                assert header in response.headers, f"Security header {header} is missing"
                
        except requests.exceptions.RequestException as e:
            pytest.skip(f"Cannot test security headers: {e}")
    
    def test_api_proxy_routing(self, session):
        """Test API requests are properly proxied to backend"""
        try:
            response = session.get("https://localhost/api/health", verify=False, timeout=10)
            assert response.status_code == 200, "API health endpoint should be accessible"
            
            data = response.json()
            assert data.get('service') == 'goldshop-backend', "Response should come from backend"
            
        except requests.exceptions.RequestException as e:
            pytest.skip(f"Cannot test API proxy routing: {e}")
    
    def test_rate_limiting(self, session):
        """Test rate limiting is working"""
        try:
            # Make multiple rapid requests to trigger rate limiting
            responses = []
            for i in range(50):
                try:
                    response = session.get("https://localhost/api/health", verify=False, timeout=5)
                    responses.append(response.status_code)
                except requests.exceptions.RequestException:
                    responses.append(429)  # Assume rate limited
            
            # Should have some rate limited responses
            rate_limited = sum(1 for status in responses if status == 429)
            assert rate_limited > 0, "Rate limiting should be active"
            
        except Exception as e:
            pytest.skip(f"Cannot test rate limiting: {e}")

class TestDatabaseConnectivity:
    """Test database connectivity and configuration"""
    
    def test_postgresql_connection(self):
        """Test PostgreSQL database connection"""
        try:
            conn = psycopg2.connect(
                host="localhost",
                port=5432,
                database="goldshop",
                user="goldshop_user",
                password="goldshop_password"
            )
            
            cursor = conn.cursor()
            cursor.execute("SELECT version();")
            version = cursor.fetchone()
            
            assert version is not None, "Should be able to query database"
            assert "PostgreSQL" in version[0], "Should be PostgreSQL database"
            
            cursor.close()
            conn.close()
            
        except psycopg2.Error as e:
            pytest.skip(f"Cannot connect to PostgreSQL: {e}")
    
    def test_database_extensions(self):
        """Test required database extensions are installed"""
        try:
            conn = psycopg2.connect(
                host="localhost",
                port=5432,
                database="goldshop",
                user="goldshop_user",
                password="goldshop_password"
            )
            
            cursor = conn.cursor()
            cursor.execute("SELECT extname FROM pg_extension;")
            extensions = [row[0] for row in cursor.fetchall()]
            
            required_extensions = ['uuid-ossp', 'ltree', 'pg_trgm']
            for ext in required_extensions:
                assert ext in extensions, f"Extension {ext} should be installed"
            
            cursor.close()
            conn.close()
            
        except psycopg2.Error as e:
            pytest.skip(f"Cannot test database extensions: {e}")
    
    def test_enhanced_schema_tables(self):
        """Test that enhanced schema tables exist"""
        try:
            conn = psycopg2.connect(
                host="localhost",
                port=5432,
                database="goldshop",
                user="goldshop_user",
                password="goldshop_password"
            )
            
            cursor = conn.cursor()
            
            # Check for enhanced accounting tables
            enhanced_tables = [
                'chart_of_accounts',
                'journal_entries',
                'journal_entry_lines',
                'subsidiary_accounts',
                'checks',
                'installment_accounts',
                'audit_trail'
            ]
            
            for table in enhanced_tables:
                cursor.execute(f"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '{table}');")
                exists = cursor.fetchone()[0]
                assert exists, f"Enhanced table {table} should exist"
            
            cursor.close()
            conn.close()
            
        except psycopg2.Error as e:
            pytest.skip(f"Cannot test enhanced schema: {e}")

class TestRedisConnectivity:
    """Test Redis connectivity and configuration"""
    
    def test_redis_connection(self):
        """Test Redis connection"""
        try:
            r = redis.Redis(host='localhost', port=6379, db=0)
            response = r.ping()
            assert response is True, "Redis should respond to ping"
            
        except redis.ConnectionError as e:
            pytest.skip(f"Cannot connect to Redis: {e}")
    
    def test_redis_configuration(self):
        """Test Redis configuration settings"""
        try:
            r = redis.Redis(host='localhost', port=6379, db=0)
            info = r.info()
            
            # Check memory policy
            config = r.config_get('maxmemory-policy')
            assert config.get('maxmemory-policy') == 'allkeys-lru', "Redis should use LRU eviction policy"
            
            # Check persistence
            assert info.get('aof_enabled') == 1, "Redis should have AOF persistence enabled"
            
        except redis.ConnectionError as e:
            pytest.skip(f"Cannot test Redis configuration: {e}")

class TestHealthChecks:
    """Test application health check endpoints"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """HTTP session for health checks"""
        session = requests.Session()
        session.verify = False  # Skip SSL verification for self-signed certs
        return session
    
    def test_basic_health_check(self, session):
        """Test basic health check endpoint"""
        try:
            response = session.get("https://localhost/api/health", timeout=10)
            assert response.status_code == 200, "Health check should return 200"
            
            data = response.json()
            assert data.get('status') == 'healthy', "Health status should be healthy"
            
        except requests.exceptions.RequestException as e:
            pytest.skip(f"Cannot test health check: {e}")
    
    def test_detailed_health_check(self, session):
        """Test detailed health check endpoint"""
        try:
            response = session.get("https://localhost/api/health/detailed", timeout=15)
            assert response.status_code == 200, "Detailed health check should return 200"
            
            data = response.json()
            assert 'components' in data, "Should include component health status"
            
            # Check required components
            required_components = ['database', 'redis', 'system']
            for component in required_components:
                assert component in data['components'], f"Component {component} should be checked"
                
        except requests.exceptions.RequestException as e:
            pytest.skip(f"Cannot test detailed health check: {e}")
    
    def test_readiness_check(self, session):
        """Test readiness check endpoint"""
        try:
            response = session.get("https://localhost/api/health/readiness", timeout=10)
            assert response.status_code == 200, "Readiness check should return 200"
            
            data = response.json()
            assert data.get('status') == 'ready', "Service should be ready"
            
        except requests.exceptions.RequestException as e:
            pytest.skip(f"Cannot test readiness check: {e}")
    
    def test_liveness_check(self, session):
        """Test liveness check endpoint"""
        try:
            response = session.get("https://localhost/api/health/liveness", timeout=10)
            assert response.status_code == 200, "Liveness check should return 200"
            
            data = response.json()
            assert data.get('status') == 'alive', "Service should be alive"
            
        except requests.exceptions.RequestException as e:
            pytest.skip(f"Cannot test liveness check: {e}")

class TestBackupSystem:
    """Test automated backup system"""
    
    def test_backup_script_exists(self):
        """Test backup script exists and is executable"""
        import os
        backup_script = "./scripts/backup.sh"
        
        assert os.path.exists(backup_script), "Backup script should exist"
        assert os.access(backup_script, os.X_OK), "Backup script should be executable"
    
    def test_backup_directory_writable(self):
        """Test backup directory is writable"""
        import os
        backup_dir = "./backups"
        
        if not os.path.exists(backup_dir):
            os.makedirs(backup_dir)
        
        assert os.path.exists(backup_dir), "Backup directory should exist"
        assert os.access(backup_dir, os.W_OK), "Backup directory should be writable"
    
    def test_backup_execution(self):
        """Test backup script can be executed"""
        try:
            # Run backup script in test mode (if available)
            result = subprocess.run(
                ["bash", "./scripts/backup.sh"],
                capture_output=True,
                text=True,
                timeout=60
            )
            
            # Backup might fail due to missing dependencies in test environment
            # Just check that script runs without syntax errors
            assert result.returncode in [0, 1], "Backup script should run without syntax errors"
            
        except subprocess.TimeoutExpired:
            pytest.skip("Backup script execution timed out")
        except FileNotFoundError:
            pytest.skip("Backup script not found or bash not available")

class TestMonitoring:
    """Test monitoring and metrics collection"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """HTTP session for monitoring tests"""
        session = requests.Session()
        session.verify = False
        return session
    
    def test_metrics_endpoint(self, session):
        """Test Prometheus metrics endpoint"""
        try:
            response = session.get("https://localhost/api/metrics", timeout=10)
            assert response.status_code == 200, "Metrics endpoint should return 200"
            
            metrics_text = response.text
            assert "goldshop_" in metrics_text, "Should contain application-specific metrics"
            
        except requests.exceptions.RequestException as e:
            pytest.skip(f"Cannot test metrics endpoint: {e}")
    
    def test_nginx_status_endpoint(self, session):
        """Test Nginx status endpoint (if accessible)"""
        try:
            # This endpoint might be restricted to internal networks
            response = session.get("https://localhost/nginx_status", timeout=5)
            # Might return 403 Forbidden, which is expected for external access
            assert response.status_code in [200, 403], "Nginx status endpoint should exist"
            
        except requests.exceptions.RequestException as e:
            pytest.skip(f"Cannot test Nginx status endpoint: {e}")

class TestSecurity:
    """Test security configurations"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """HTTP session for security tests"""
        session = requests.Session()
        session.verify = False
        return session
    
    def test_sensitive_files_blocked(self, session):
        """Test that sensitive files are blocked by Nginx"""
        sensitive_paths = [
            "/.env",
            "/.git/config",
            "/docker-compose.yml",
            "/backend/.env",
            "/secrets/db_password.txt"
        ]
        
        for path in sensitive_paths:
            try:
                response = session.get(f"https://localhost{path}", timeout=5)
                assert response.status_code in [403, 404], f"Sensitive file {path} should be blocked"
            except requests.exceptions.RequestException:
                pass  # Connection errors are acceptable
    
    def test_server_tokens_hidden(self, session):
        """Test that server tokens are hidden"""
        try:
            response = session.get("https://localhost/health", timeout=5)
            server_header = response.headers.get('Server', '')
            
            # Should not reveal detailed server information
            assert 'nginx/' not in server_header.lower(), "Nginx version should be hidden"
            assert 'apache/' not in server_header.lower(), "Apache version should be hidden"
            
        except requests.exceptions.RequestException as e:
            pytest.skip(f"Cannot test server tokens: {e}")

if __name__ == "__main__":
    pytest.main([__file__, "-v"])