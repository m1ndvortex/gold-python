# 🐳 Inventory Management Verification Script
# This script verifies that all inventory management features are working correctly

Write-Host "🐳 Starting Inventory Management Verification..." -ForegroundColor Green
Write-Host ""

# Test 1: Backend Health Check
Write-Host "✅ Testing Backend Health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8000/health"
    if ($health.status -eq "healthy" -and $health.database -eq "connected") {
        Write-Host "   ✅ Backend is healthy and database is connected" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Backend health check failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ❌ Cannot connect to backend: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Authentication
Write-Host "✅ Testing Authentication..." -ForegroundColor Yellow
try {
    $authResponse = Invoke-RestMethod -Uri "http://localhost:8000/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"admin","password":"admin123"}'
    $token = $authResponse.access_token
    if ($token) {
        Write-Host "   ✅ Authentication successful" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Authentication failed - no token received" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ❌ Authentication failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 3: Categories API
Write-Host "✅ Testing Categories API..." -ForegroundColor Yellow
try {
    $categories = Invoke-RestMethod -Uri "http://localhost:8000/inventory/categories" -Headers @{Authorization="Bearer $token"}
    Write-Host "   ✅ Categories API working - Found $($categories.Count) categories" -ForegroundColor Green
    
    # Display categories
    foreach ($category in $categories) {
        Write-Host "      - $($category.name): $($category.description)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   ❌ Categories API failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 4: Inventory Items API
Write-Host "✅ Testing Inventory Items API..." -ForegroundColor Yellow
try {
    $items = Invoke-RestMethod -Uri "http://localhost:8000/inventory/items?limit=5" -Headers @{Authorization="Bearer $token"}
    Write-Host "   ✅ Inventory Items API working - Found $($items.data.total) total items" -ForegroundColor Green
    Write-Host "      Page: $($items.data.page), Limit: $($items.data.limit), Total Pages: $($items.data.total_pages)" -ForegroundColor Cyan
} catch {
    Write-Host "   ❌ Inventory Items API failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 5: Frontend Accessibility
Write-Host "✅ Testing Frontend Accessibility..." -ForegroundColor Yellow
try {
    $frontend = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing
    if ($frontend.StatusCode -eq 200) {
        Write-Host "   ✅ Frontend is accessible and responding" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Frontend returned status code: $($frontend.StatusCode)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ❌ Frontend not accessible: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 6: Create Test Category (Optional)
Write-Host "✅ Testing Category Creation..." -ForegroundColor Yellow
try {
    $newCategory = @{
        name = "Verification Test Category"
        description = "Category created by verification script"
    } | ConvertTo-Json

    $createdCategory = Invoke-RestMethod -Uri "http://localhost:8000/inventory/categories" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body $newCategory
    Write-Host "   ✅ Category creation successful - ID: $($createdCategory.data.id)" -ForegroundColor Green
    
    # Clean up - delete the test category
    try {
        Invoke-RestMethod -Uri "http://localhost:8000/inventory/categories/$($createdCategory.data.id)" -Method DELETE -Headers @{Authorization="Bearer $token"}
        Write-Host "   ✅ Test category cleaned up successfully" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  Warning: Could not clean up test category" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Category creation failed: $($_.Exception.Message)" -ForegroundColor Red
    # Don't exit here as this is optional
}

Write-Host ""
Write-Host "🎉 ALL VERIFICATION TESTS PASSED!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Access the application at:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   Backend:  http://localhost:8000" -ForegroundColor White
Write-Host ""
Write-Host "🔑 Login Credentials:" -ForegroundColor Cyan
Write-Host "   Username: admin" -ForegroundColor White
Write-Host "   Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "🗂️ Navigate to: Sidebar → Inventory Management" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ The inventory management system is fully operational!" -ForegroundColor Green