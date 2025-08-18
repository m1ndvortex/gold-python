// Simple production test with authentication
export {};

const BACKEND_URL = 'http://backend:8000';

describe('Invoice Authentication Tests', () => {
  jest.setTimeout(30000);

  test('should authenticate with admin user and access invoice API', async () => {
    // Step 1: Wait for backend
    let backendReady = false;
    for (let i = 0; i < 30; i++) {
      try {
        const response = await fetch(`${BACKEND_URL}/health`);
        if (response.ok) {
          backendReady = true;
          break;
        }
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    expect(backendReady).toBe(true);

    // Step 2: Authenticate
    const loginResponse = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      }),
    });

    expect(loginResponse.ok).toBe(true);
    
    const loginData = await loginResponse.json();
    expect(loginData.access_token).toBeDefined();
    expect(loginData.token_type).toBe('bearer');

    const token = loginData.access_token;

    // Step 3: Verify user permissions
    const userResponse = await fetch(`${BACKEND_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    expect(userResponse.ok).toBe(true);
    
    const user = await userResponse.json();
    expect(user.username).toBe('admin');
    expect(user.role.name).toBe('Owner');
    expect(user.role.permissions.view_invoices).toBe(true);
    expect(user.role.permissions.create_invoices).toBe(true);

    // Step 4: Test invoice endpoints
    const invoicesResponse = await fetch(`${BACKEND_URL}/invoices/?limit=5`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    expect(invoicesResponse.ok).toBe(true);
    
    const invoices = await invoicesResponse.json();
    expect(Array.isArray(invoices)).toBe(true);

    // Step 5: Test invoice summary
    const summaryResponse = await fetch(`${BACKEND_URL}/invoices/reports/summary`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    expect(summaryResponse.ok).toBe(true);
    
    const summary = await summaryResponse.json();
    expect(summary).toHaveProperty('total_invoices');
    expect(summary).toHaveProperty('total_amount');

    console.log('✅ All authentication and API tests passed');
  });

  test('should reject unauthenticated requests', async () => {
    const response = await fetch(`${BACKEND_URL}/invoices/`);
    expect(response.status).toBe(401);

    const response2 = await fetch(`${BACKEND_URL}/invoices/`, {
      headers: {
        'Authorization': 'Bearer invalid-token',
      },
    });
    expect(response2.status).toBe(401);

    console.log('✅ Authentication properly enforced');
  });

  test('should test invoice calculation with real data', async () => {
    // Authenticate first
    const loginResponse = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      }),
    });

    const loginData = await loginResponse.json();
    const token = loginData.access_token;

    // Get customers and items
    const customersResponse = await fetch(`${BACKEND_URL}/customers/?limit=1`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const itemsResponse = await fetch(`${BACKEND_URL}/inventory/items/?limit=1`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (customersResponse.ok && itemsResponse.ok) {
      const customers = await customersResponse.json();
      const items = await itemsResponse.json();

      if (customers.length > 0 && items.length > 0) {
        const calculationData = {
          customer_id: customers[0].id,
          gold_price_per_gram: 2500,
          labor_cost_percentage: 10,
          profit_percentage: 15,
          vat_percentage: 9,
          items: [
            {
              inventory_item_id: items[0].id,
              quantity: 1,
              weight_grams: items[0].weight_grams || 5.0,
            }
          ]
        };

        const calcResponse = await fetch(`${BACKEND_URL}/invoices/calculate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(calculationData),
        });

        expect(calcResponse.ok).toBe(true);
        
        const calculation = await calcResponse.json();
        expect(calculation).toHaveProperty('grand_total');
        expect(calculation).toHaveProperty('items');
        expect(calculation.grand_total).toBeGreaterThan(0);

        console.log('✅ Invoice calculation working with real data');
      }
    }
  });
});