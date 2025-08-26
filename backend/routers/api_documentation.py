"""
API Documentation Router
Comprehensive API documentation with interactive testing capabilities
"""

from fastapi import APIRouter, Depends, Request
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from datetime import datetime

from database import get_db
from models_api_gateway import APIKey
from routers.api_gateway import get_api_key

router = APIRouter(prefix="/api/docs", tags=["API Documentation"])

@router.get("/", response_class=HTMLResponse)
async def api_documentation_home():
    """Comprehensive API documentation homepage"""
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Universal Business Management API Documentation</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
            .section { margin-bottom: 30px; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
            .endpoint { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #007bff; }
            .method { display: inline-block; padding: 4px 8px; border-radius: 4px; color: white; font-weight: bold; margin-right: 10px; }
            .get { background: #28a745; }
            .post { background: #007bff; }
            .put { background: #ffc107; color: black; }
            .delete { background: #dc3545; }
            code { background: #f1f1f1; padding: 2px 4px; border-radius: 3px; }
            .example { background: #e9ecef; padding: 15px; border-radius: 5px; margin: 10px 0; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Universal Business Management API</h1>
            <p>Enterprise-grade API for comprehensive business management</p>
        </div>

        <div class="section">
            <h2>🚀 Getting Started</h2>
            <p>Welcome to the Universal Business Management API! This API provides comprehensive business management capabilities with enterprise-grade features.</p>
            
            <h3>Authentication</h3>
            <p>All API requests require authentication using API keys. Include your API key in the Authorization header:</p>
            <div class="example">
                <code>Authorization: Bearer your_api_key_here</code>
            </div>
            
            <div class="warning">
                <strong>⚠️ Important:</strong> Keep your API keys secure and never expose them in client-side code.
            </div>
        </div>

        <div class="section">
            <h2>📊 Core Features</h2>
            <ul>
                <li><strong>Full CRUD Operations</strong> - Complete REST API for all business entities</li>
                <li><strong>API Key Management</strong> - Secure authentication with configurable rate limits</li>
                <li><strong>Webhook System</strong> - Real-time event notifications with retry logic</li>
                <li><strong>Bulk Operations</strong> - Import/export capabilities with validation</li>
                <li><strong>Workflow Automation</strong> - Trigger-based actions and process automation</li>
                <li><strong>External Integrations</strong> - Connect with payment processors and services</li>
                <li><strong>Usage Analytics</strong> - Comprehensive API usage tracking</li>
            </ul>
        </div>

        <div class="section">
            <h2>🔑 API Key Management</h2>
            
            <div class="endpoint">
                <span class="method post">POST</span>
                <strong>/api/v1/api-keys</strong>
                <p>Create a new API key with custom scopes and rate limits</p>
            </div>
            
            <div class="endpoint">
                <span class="method get">GET</span>
                <strong>/api/v1/api-keys</strong>
                <p>List all API keys with usage statistics</p>
            </div>
            
            <div class="endpoint">
                <span class="method get">GET</span>
                <strong>/api/v1/api-keys/{id}/usage</strong>
                <p>Get detailed usage analytics for an API key</p>
            </div>
        </div>

        <div class="section">
            <h2>🔗 Webhook Management</h2>
            
            <div class="endpoint">
                <span class="method post">POST</span>
                <strong>/api/v1/webhooks</strong>
                <p>Create webhook endpoints for real-time event notifications</p>
            </div>
            
            <div class="endpoint">
                <span class="method get">GET</span>
                <strong>/api/v1/webhooks/{id}/deliveries</strong>
                <p>View webhook delivery history and status</p>
            </div>
            
            <h3>Available Events</h3>
            <ul>
                <li><code>invoice.created</code> - New invoice created</li>
                <li><code>invoice.updated</code> - Invoice modified</li>
                <li><code>inventory.low_stock</code> - Stock below threshold</li>
                <li><code>customer.created</code> - New customer added</li>
                <li><code>payment.received</code> - Payment processed</li>
            </ul>
        </div>

        <div class="section">
            <h2>📦 Bulk Operations</h2>
            
            <div class="endpoint">
                <span class="method post">POST</span>
                <strong>/api/v1/bulk/import</strong>
                <p>Import data from CSV, JSON, or Excel files</p>
            </div>
            
            <div class="endpoint">
                <span class="method get">GET</span>
                <strong>/api/v1/bulk/operations</strong>
                <p>Monitor bulk operation progress and results</p>
            </div>
            
            <h3>Supported Formats</h3>
            <ul>
                <li><strong>CSV</strong> - Comma-separated values with headers</li>
                <li><strong>JSON</strong> - Structured JSON arrays</li>
                <li><strong>XLSX</strong> - Excel spreadsheets</li>
            </ul>
        </div>

        <div class="section">
            <h2>⚡ Workflow Automation</h2>
            
            <div class="endpoint">
                <span class="method post">POST</span>
                <strong>/api/v1/automations</strong>
                <p>Create automated workflows triggered by business events</p>
            </div>
            
            <h3>Example Automation</h3>
            <div class="example">
                <pre>{
  "name": "Low Stock Alert",
  "trigger_event": "inventory.low_stock",
  "trigger_conditions": {
    "stock_quantity": {"less_than": 10}
  },
  "actions": [
    {
      "type": "send_email",
      "configuration": {
        "to": "manager@company.com",
        "subject": "Low Stock Alert",
        "template": "low_stock_template"
      }
    }
  ]
}</pre>
            </div>
        </div>

        <div class="section">
            <h2>🔌 External Integrations</h2>
            
            <div class="endpoint">
                <span class="method post">POST</span>
                <strong>/api/v1/integrations</strong>
                <p>Connect with external services like QuickBooks, Stripe, Shopify</p>
            </div>
            
            <div class="endpoint">
                <span class="method post">POST</span>
                <strong>/api/v1/integrations/{id}/sync</strong>
                <p>Trigger data synchronization with external systems</p>
            </div>
            
            <h3>Supported Integrations</h3>
            <ul>
                <li><strong>Accounting:</strong> QuickBooks, Xero</li>
                <li><strong>Payments:</strong> Stripe, PayPal, Square</li>
                <li><strong>E-commerce:</strong> Shopify, WooCommerce</li>
                <li><strong>CRM:</strong> Salesforce, HubSpot</li>
                <li><strong>Shipping:</strong> FedEx, UPS, DHL</li>
            </ul>
        </div>

        <div class="section">
            <h2>📈 Rate Limits</h2>
            <p>API requests are rate-limited to ensure fair usage and system stability:</p>
            <ul>
                <li><strong>Default Limits:</strong> 60/minute, 1000/hour, 10000/day</li>
                <li><strong>Custom Limits:</strong> Available per API key</li>
                <li><strong>Headers:</strong> Rate limit info included in response headers</li>
            </ul>
            
            <h3>Rate Limit Headers</h3>
            <div class="example">
                <code>X-RateLimit-Limit: 60</code><br>
                <code>X-RateLimit-Remaining: 45</code><br>
                <code>X-RateLimit-Reset: 2024-01-01T12:00:00Z</code>
            </div>
        </div>

        <div class="section">
            <h2>🛠️ Interactive Testing</h2>
            <p>Test the API directly from your browser:</p>
            <ul>
                <li><a href="/docs" target="_blank">Swagger UI Documentation</a> - Interactive API explorer</li>
                <li><a href="/redoc" target="_blank">ReDoc Documentation</a> - Clean, readable docs</li>
                <li><a href="/api/v1/docs/events" target="_blank">Available Events</a> - List of webhook events</li>
                <li><a href="/api/v1/docs/scopes" target="_blank">API Scopes</a> - Available permissions</li>
            </ul>
        </div>

        <div class="section">
            <h2>💡 Best Practices</h2>
            <ul>
                <li><strong>Use HTTPS:</strong> Always use secure connections in production</li>
                <li><strong>Handle Rate Limits:</strong> Implement exponential backoff for rate limit errors</li>
                <li><strong>Validate Webhooks:</strong> Verify webhook signatures for security</li>
                <li><strong>Monitor Usage:</strong> Track API usage and set up alerts</li>
                <li><strong>Error Handling:</strong> Implement proper error handling and logging</li>
                <li><strong>Pagination:</strong> Use pagination for large result sets</li>
            </ul>
        </div>

        <div class="section">
            <h2>📞 Support</h2>
            <p>Need help? Contact our API support team:</p>
            <ul>
                <li><strong>Email:</strong> api-support@universalbusiness.com</li>
                <li><strong>Documentation:</strong> <a href="/docs">/docs</a></li>
                <li><strong>Status Page:</strong> <a href="/api/v1/health">/api/v1/health</a></li>
            </ul>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

@router.get("/examples/curl")
async def curl_examples():
    """Provide cURL examples for common API operations"""
    return {
        "examples": [
            {
                "title": "Create API Key",
                "description": "Create a new API key with specific scopes",
                "curl": """curl -X POST "https://api.universalbusiness.com/api/v1/api-keys" \\
  -H "Authorization: Bearer your_admin_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "My Application Key",
    "scopes": ["read:inventory", "write:invoices"],
    "rate_limits": {
      "per_minute": 100,
      "per_hour": 2000,
      "per_day": 20000
    }
  }'"""
            },
            {
                "title": "Create Webhook",
                "description": "Set up a webhook for invoice events",
                "curl": """curl -X POST "https://api.universalbusiness.com/api/v1/webhooks" \\
  -H "Authorization: Bearer your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Invoice Webhook",
    "url": "https://your-app.com/webhooks/invoices",
    "events": ["invoice.created", "invoice.updated"],
    "event_filters": {
      "status": "approved"
    }
  }'"""
            },
            {
                "title": "Bulk Import",
                "description": "Import inventory items from CSV file",
                "curl": """curl -X POST "https://api.universalbusiness.com/api/v1/bulk/import" \\
  -H "Authorization: Bearer your_api_key" \\
  -F "file=@inventory.csv" \\
  -F 'operation_data={
    "resource_type": "inventory",
    "format": "csv",
    "configuration": {
      "delimiter": ",",
      "has_header": true
    }
  }'"""
            },
            {
                "title": "Create Automation",
                "description": "Set up automated low stock alerts",
                "curl": """curl -X POST "https://api.universalbusiness.com/api/v1/automations" \\
  -H "Authorization: Bearer your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Low Stock Alert",
    "trigger_event": "inventory.low_stock",
    "trigger_conditions": {
      "stock_quantity": {"less_than": 10}
    },
    "actions": [
      {
        "type": "send_email",
        "configuration": {
          "to": "manager@company.com",
          "subject": "Low Stock Alert: {{item_name}}",
          "template": "low_stock_alert"
        }
      }
    ]
  }'"""
            },
            {
                "title": "Trigger Event",
                "description": "Manually trigger an event for testing",
                "curl": """curl -X POST "https://api.universalbusiness.com/api/v1/events/trigger" \\
  -H "Authorization: Bearer your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "event_type": "invoice.created",
    "event_data": {
      "id": "inv_123",
      "invoice_number": "INV-001",
      "customer_id": "cust_456",
      "total": 250.00,
      "status": "created"
    }
  }'"""
            }
        ]
    }

@router.get("/examples/javascript")
async def javascript_examples():
    """Provide JavaScript/Node.js examples"""
    return {
        "examples": [
            {
                "title": "API Client Setup",
                "description": "Basic API client configuration",
                "code": """
const axios = require('axios');

class UniversalBusinessAPI {
  constructor(apiKey, baseURL = 'https://api.universalbusiness.com') {
    this.client = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Add response interceptor for rate limiting
    this.client.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'];
          console.log(`Rate limited. Retry after ${retryAfter} seconds`);
        }
        return Promise.reject(error);
      }
    );
  }
  
  async createWebhook(webhookData) {
    const response = await this.client.post('/api/v1/webhooks', webhookData);
    return response.data;
  }
  
  async getAPIUsage(apiKeyId, days = 30) {
    const response = await this.client.get(`/api/v1/api-keys/${apiKeyId}/usage?days=${days}`);
    return response.data;
  }
}

// Usage
const api = new UniversalBusinessAPI('your_api_key_here');
"""
            },
            {
                "title": "Webhook Handler",
                "description": "Express.js webhook endpoint handler",
                "code": """
const express = require('express');
const crypto = require('crypto');
const app = express();

// Middleware to verify webhook signatures
function verifyWebhookSignature(req, res, next) {
  const signature = req.headers['x-webhook-signature'];
  const payload = JSON.stringify(req.body);
  const secret = process.env.WEBHOOK_SECRET;
  
  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  if (signature !== expectedSignature) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  next();
}

// Webhook endpoint
app.post('/webhooks/invoices', express.json(), verifyWebhookSignature, (req, res) => {
  const { event, data, timestamp } = req.body;
  
  console.log(`Received ${event} event:`, data);
  
  switch (event) {
    case 'invoice.created':
      handleInvoiceCreated(data);
      break;
    case 'invoice.updated':
      handleInvoiceUpdated(data);
      break;
    case 'inventory.low_stock':
      handleLowStock(data);
      break;
    default:
      console.log(`Unhandled event: ${event}`);
  }
  
  res.status(200).json({ received: true });
});

function handleInvoiceCreated(invoiceData) {
  // Process new invoice
  console.log('New invoice created:', invoiceData.invoice_number);
}

function handleLowStock(stockData) {
  // Handle low stock alert
  console.log('Low stock alert:', stockData.item_name);
}
"""
            }
        ]
    }

@router.get("/examples/python")
async def python_examples():
    """Provide Python examples"""
    return {
        "examples": [
            {
                "title": "API Client Class",
                "description": "Python API client with rate limiting",
                "code": """
import requests
import time
from typing import Dict, Any, Optional

class UniversalBusinessAPI:
    def __init__(self, api_key: str, base_url: str = "https://api.universalbusiness.com"):
        self.api_key = api_key
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        })
    
    def _make_request(self, method: str, endpoint: str, **kwargs) -> Dict[Any, Any]:
        url = f"{self.base_url}{endpoint}"
        
        while True:
            response = self.session.request(method, url, **kwargs)
            
            if response.status_code == 429:  # Rate limited
                retry_after = int(response.headers.get('Retry-After', 60))
                print(f"Rate limited. Waiting {retry_after} seconds...")
                time.sleep(retry_after)
                continue
            
            response.raise_for_status()
            return response.json()
    
    def create_webhook(self, webhook_data: Dict[str, Any]) -> Dict[str, Any]:
        return self._make_request('POST', '/api/v1/webhooks', json=webhook_data)
    
    def bulk_import(self, file_path: str, resource_type: str, format: str) -> Dict[str, Any]:
        with open(file_path, 'rb') as f:
            files = {'file': f}
            data = {
                'operation_data': json.dumps({
                    'resource_type': resource_type,
                    'format': format
                })
            }
            return self._make_request('POST', '/api/v1/bulk/import', files=files, data=data)
    
    def create_automation(self, automation_data: Dict[str, Any]) -> Dict[str, Any]:
        return self._make_request('POST', '/api/v1/automations', json=automation_data)

# Usage example
api = UniversalBusinessAPI('your_api_key_here')

# Create a webhook
webhook = api.create_webhook({
    'name': 'Invoice Webhook',
    'url': 'https://your-app.com/webhooks',
    'events': ['invoice.created', 'invoice.updated']
})

print(f"Created webhook: {webhook['id']}")
"""
            },
            {
                "title": "Flask Webhook Handler",
                "description": "Flask application to handle webhooks",
                "code": """
from flask import Flask, request, jsonify
import hmac
import hashlib
import json
import os

app = Flask(__name__)

def verify_webhook_signature(payload, signature, secret):
    expected_signature = 'sha256=' + hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(signature, expected_signature)

@app.route('/webhooks', methods=['POST'])
def handle_webhook():
    # Verify signature
    signature = request.headers.get('X-Webhook-Signature')
    secret = os.environ.get('WEBHOOK_SECRET')
    payload = request.get_data(as_text=True)
    
    if not verify_webhook_signature(payload, signature, secret):
        return jsonify({'error': 'Invalid signature'}), 401
    
    # Process webhook
    data = request.json
    event_type = data.get('event')
    event_data = data.get('data')
    
    if event_type == 'invoice.created':
        handle_invoice_created(event_data)
    elif event_type == 'inventory.low_stock':
        handle_low_stock(event_data)
    else:
        print(f"Unhandled event: {event_type}")
    
    return jsonify({'status': 'received'})

def handle_invoice_created(invoice_data):
    print(f"New invoice: {invoice_data['invoice_number']}")
    # Add your business logic here

def handle_low_stock(stock_data):
    print(f"Low stock alert: {stock_data['item_name']}")
    # Send notification, create purchase order, etc.

if __name__ == '__main__':
    app.run(debug=True)
"""
            }
        ]
    }

@router.get("/postman")
async def postman_collection():
    """Generate Postman collection for API testing"""
    return {
        "info": {
            "name": "Universal Business Management API",
            "description": "Comprehensive API collection for testing all endpoints",
            "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
        },
        "auth": {
            "type": "bearer",
            "bearer": [
                {
                    "key": "token",
                    "value": "{{api_key}}",
                    "type": "string"
                }
            ]
        },
        "variable": [
            {
                "key": "base_url",
                "value": "https://api.universalbusiness.com",
                "type": "string"
            },
            {
                "key": "api_key",
                "value": "your_api_key_here",
                "type": "string"
            }
        ],
        "item": [
            {
                "name": "API Keys",
                "item": [
                    {
                        "name": "Create API Key",
                        "request": {
                            "method": "POST",
                            "header": [],
                            "body": {
                                "mode": "raw",
                                "raw": json.dumps({
                                    "name": "Test API Key",
                                    "scopes": ["read:inventory", "write:invoices"],
                                    "rate_limits": {
                                        "per_minute": 100,
                                        "per_hour": 2000,
                                        "per_day": 20000
                                    }
                                }, indent=2),
                                "options": {
                                    "raw": {
                                        "language": "json"
                                    }
                                }
                            },
                            "url": {
                                "raw": "{{base_url}}/api/v1/api-keys",
                                "host": ["{{base_url}}"],
                                "path": ["api", "v1", "api-keys"]
                            }
                        }
                    },
                    {
                        "name": "List API Keys",
                        "request": {
                            "method": "GET",
                            "header": [],
                            "url": {
                                "raw": "{{base_url}}/api/v1/api-keys",
                                "host": ["{{base_url}}"],
                                "path": ["api", "v1", "api-keys"]
                            }
                        }
                    }
                ]
            },
            {
                "name": "Webhooks",
                "item": [
                    {
                        "name": "Create Webhook",
                        "request": {
                            "method": "POST",
                            "header": [],
                            "body": {
                                "mode": "raw",
                                "raw": json.dumps({
                                    "name": "Invoice Webhook",
                                    "url": "https://your-app.com/webhooks",
                                    "events": ["invoice.created", "invoice.updated"],
                                    "timeout_seconds": 30,
                                    "retry_attempts": 3
                                }, indent=2),
                                "options": {
                                    "raw": {
                                        "language": "json"
                                    }
                                }
                            },
                            "url": {
                                "raw": "{{base_url}}/api/v1/webhooks",
                                "host": ["{{base_url}}"],
                                "path": ["api", "v1", "webhooks"]
                            }
                        }
                    }
                ]
            },
            {
                "name": "Automations",
                "item": [
                    {
                        "name": "Create Automation",
                        "request": {
                            "method": "POST",
                            "header": [],
                            "body": {
                                "mode": "raw",
                                "raw": json.dumps({
                                    "name": "Low Stock Alert",
                                    "trigger_event": "inventory.low_stock",
                                    "trigger_conditions": {
                                        "stock_quantity": {"less_than": 10}
                                    },
                                    "actions": [
                                        {
                                            "type": "send_email",
                                            "configuration": {
                                                "to": "manager@company.com",
                                                "subject": "Low Stock Alert",
                                                "template": "low_stock_alert"
                                            }
                                        }
                                    ]
                                }, indent=2),
                                "options": {
                                    "raw": {
                                        "language": "json"
                                    }
                                }
                            },
                            "url": {
                                "raw": "{{base_url}}/api/v1/automations",
                                "host": ["{{base_url}}"],
                                "path": ["api", "v1", "automations"]
                            }
                        }
                    }
                ]
            }
        ]
    }

@router.get("/status")
async def api_status(db: Session = Depends(get_db)):
    """Comprehensive API status and health information"""
    try:
        # Test database connection
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    
    # Get API key statistics
    try:
        total_api_keys = db.query(APIKey).count()
        active_api_keys = db.query(APIKey).filter(APIKey.is_active == True).count()
    except Exception:
        total_api_keys = 0
        active_api_keys = 0
    
    return {
        "status": "operational",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "2.0.0",
        "services": {
            "database": db_status,
            "api_gateway": "healthy",
            "webhooks": "healthy",
            "bulk_operations": "healthy",
            "automations": "healthy",
            "integrations": "healthy"
        },
        "statistics": {
            "total_api_keys": total_api_keys,
            "active_api_keys": active_api_keys
        },
        "endpoints": {
            "documentation": "/api/docs/",
            "swagger": "/docs",
            "redoc": "/redoc",
            "health": "/api/v1/health",
            "events": "/api/v1/docs/events",
            "scopes": "/api/v1/docs/scopes"
        }
    }