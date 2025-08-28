#!/usr/bin/env python3
"""
Production Authentication Fix Script
Updates all backend routers to use OAuth2 middleware consistently
"""
import os
import re

# List of router files that need to be updated
ROUTER_FILES = [
    "backend/routers/sms.py",
    "backend/routers/settings.py", 
    "backend/routers/localization.py",
    "backend/routers/invoices_universal.py",
    "backend/routers/inventory_intelligence.py",
    "backend/routers/image_management.py",
    "backend/routers/custom_reports.py",
    "backend/routers/cache_management.py",
    "backend/routers/alerts.py",
    "backend/routers/advanced_analytics.py"
]

def fix_router_authentication(file_path):
    """Fix authentication imports in a router file"""
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        return False
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace old auth imports
        original_content = content
        
        # Pattern 1: from auth import get_current_user
        content = re.sub(
            r'from auth import get_current_user',
            'from oauth2_middleware import get_current_user',
            content
        )
        
        # Pattern 2: from auth import get_current_user, require_permission
        content = re.sub(
            r'from auth import get_current_user, require_permission',
            'from oauth2_middleware import get_current_user, require_permission',
            content
        )
        
        # Pattern 3: from auth import require_permission, get_current_user
        content = re.sub(
            r'from auth import require_permission, get_current_user',
            'from oauth2_middleware import get_current_user, require_permission',
            content
        )
        
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ Fixed authentication in: {file_path}")
            return True
        else:
            print(f"ℹ️  No changes needed: {file_path}")
            return False
            
    except Exception as e:
        print(f"❌ Error fixing {file_path}: {e}")
        return False

def main():
    """Main function to fix all router authentication"""
    print("🔧 Production Authentication Fix - Starting...")
    print("=" * 60)
    
    fixed_count = 0
    total_count = len(ROUTER_FILES)
    
    for router_file in ROUTER_FILES:
        if fix_router_authentication(router_file):
            fixed_count += 1
    
    print("=" * 60)
    print(f"🎯 Production Fix Complete!")
    print(f"📊 Fixed: {fixed_count}/{total_count} routers")
    
    if fixed_count > 0:
        print("\n🚀 Next Steps:")
        print("1. Restart the backend container: docker-compose restart backend")
        print("2. Test authentication endpoints")
        print("3. Verify dashboard loads correctly")
    else:
        print("\n✅ All routers already using OAuth2 middleware")

if __name__ == "__main__":
    main()
