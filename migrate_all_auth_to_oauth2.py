#!/usr/bin/env python3
"""
Comprehensive OAuth2 Migration Script
Migrates ALL remaining backend routers from legacy auth to OAuth2 middleware
"""

import os
import re
from pathlib import Path

def migrate_router_to_oauth2(file_path):
    """Migrate a single router file to OAuth2 middleware"""
    print(f"🔄 Processing: {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    changes_made = False
    
    # 1. Replace legacy auth imports
    patterns_to_replace = [
        (r'from auth import get_current_active_user, require_permission', 
         'from oauth2_middleware import get_current_user, require_permission'),
        (r'from auth import get_current_active_user', 
         'from oauth2_middleware import get_current_user'),
        (r'from auth import require_permission', 
         'from oauth2_middleware import require_permission'),
        (r'import auth\b', 
         'import oauth2_middleware'),
    ]
    
    for pattern, replacement in patterns_to_replace:
        if re.search(pattern, content):
            content = re.sub(pattern, replacement, content)
            changes_made = True
            print(f"  ✅ Updated import: {pattern}")
    
    # 2. Replace function calls
    function_replacements = [
        (r'\bget_current_active_user\b', 'get_current_user'),
        (r'\bauth\.get_current_active_user\b', 'oauth2_middleware.get_current_user'),
        (r'\bauth\.require_permission\b', 'oauth2_middleware.require_permission'),
    ]
    
    for pattern, replacement in function_replacements:
        if re.search(pattern, content):
            content = re.sub(pattern, replacement, content)
            changes_made = True
            print(f"  ✅ Updated function call: {pattern}")
    
    # 3. Update dependencies in router definitions
    dependency_patterns = [
        (r'dependencies=\[Depends\(get_current_active_user\)\]', 
         'dependencies=[Depends(get_current_user)]'),
        (r'dependencies=\[Depends\(auth\.get_current_active_user\)\]', 
         'dependencies=[Depends(oauth2_middleware.get_current_user)]'),
    ]
    
    for pattern, replacement in dependency_patterns:
        if re.search(pattern, content):
            content = re.sub(pattern, replacement, content)
            changes_made = True
            print(f"  ✅ Updated dependency: {pattern}")
    
    # Write back if changes were made
    if changes_made:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  💾 Saved changes to {file_path}")
        return True
    else:
        print(f"  ℹ️  No changes needed for {file_path}")
        return False

def main():
    """Main migration function"""
    print("🚀 Starting Comprehensive OAuth2 Migration...")
    print("=" * 60)
    
    # Files to migrate (based on grep results)
    files_to_migrate = [
        "backend/routers/roles.py",
        "backend/routers/profitability.py", 
        "backend/routers/kpi_dashboard.py",
        "backend/routers/inventory.py",
        "backend/routers/customer_intelligence.py",
        "backend/routers/analytics_data.py",
        "backend/routers/analytics.py"
    ]
    
    migrated_count = 0
    total_files = len(files_to_migrate)
    
    for file_path in files_to_migrate:
        full_path = Path(file_path)
        if full_path.exists():
            if migrate_router_to_oauth2(full_path):
                migrated_count += 1
        else:
            print(f"❌ File not found: {file_path}")
        print()
    
    print("=" * 60)
    print(f"🎉 Migration Complete!")
    print(f"📊 Migrated: {migrated_count}/{total_files} files")
    print(f"🔐 All routers should now use OAuth2 middleware")
    
    # Verify no legacy auth imports remain
    print("\n🔍 Verification: Checking for remaining legacy auth imports...")
    remaining_legacy = []
    
    routers_dir = Path("backend/routers")
    for py_file in routers_dir.glob("*.py"):
        if py_file.name in ["__init__.py", "auth.py", "oauth2_auth.py"]:
            continue  # Skip these files
            
        with open(py_file, 'r', encoding='utf-8') as f:
            content = f.read()
            if re.search(r'from auth import|import auth\b', content):
                remaining_legacy.append(py_file)
    
    if remaining_legacy:
        print(f"⚠️  Still found legacy auth in: {[str(f) for f in remaining_legacy]}")
    else:
        print("✅ No legacy auth imports found - migration successful!")

if __name__ == "__main__":
    main()
