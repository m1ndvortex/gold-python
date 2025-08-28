#!/usr/bin/env python3
"""
Seed RBAC (Role-Based Access Control) data - Synchronous version
This script seeds the database with initial roles, permissions, and permission groups
"""

import sys
import os
from datetime import datetime, timezone
from sqlalchemy import select, and_, text

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models_rbac import (
    RBACRole, RBACPermission, RBACPermissionGroup, 
    role_permissions, permission_group_permissions, user_roles
)
from models import User

# System permissions for the gold shop management system
SYSTEM_PERMISSIONS = [
    # Dashboard permissions
    {"name": "dashboard:view", "display_name": "View Dashboard", "resource": "dashboard", "action": "view", "category": "operational", "description": "View main dashboard and KPI widgets"},
    {"name": "dashboard:export", "display_name": "Export Dashboard Data", "resource": "dashboard", "action": "export", "category": "operational", "description": "Export dashboard data and reports"},
    
    # Inventory permissions
    {"name": "inventory:view", "display_name": "View Inventory", "resource": "inventory", "action": "view", "category": "operational", "description": "View inventory items and stock levels"},
    {"name": "inventory:create", "display_name": "Create Inventory Items", "resource": "inventory", "action": "create", "category": "operational", "description": "Add new inventory items"},
    {"name": "inventory:update", "display_name": "Update Inventory", "resource": "inventory", "action": "update", "category": "operational", "description": "Edit inventory items and stock levels"},
    {"name": "inventory:delete", "display_name": "Delete Inventory Items", "resource": "inventory", "action": "delete", "category": "operational", "risk_level": "medium", "description": "Remove inventory items"},
    {"name": "inventory:manage_categories", "display_name": "Manage Categories", "resource": "inventory", "action": "manage_categories", "category": "operational", "description": "Create and manage inventory categories"},
    {"name": "inventory:stock_adjustment", "display_name": "Stock Adjustments", "resource": "inventory", "action": "stock_adjustment", "category": "operational", "risk_level": "medium", "description": "Adjust stock levels and quantities"},
    
    # Customer permissions
    {"name": "customers:view", "display_name": "View Customers", "resource": "customers", "action": "view", "category": "operational", "description": "View customer information and profiles"},
    {"name": "customers:create", "display_name": "Create Customers", "resource": "customers", "action": "create", "category": "operational", "description": "Add new customers"},
    {"name": "customers:update", "display_name": "Update Customers", "resource": "customers", "action": "update", "category": "operational", "description": "Edit customer information"},
    {"name": "customers:delete", "display_name": "Delete Customers", "resource": "customers", "action": "delete", "category": "operational", "risk_level": "medium", "description": "Remove customer records"},
    {"name": "customers:view_analytics", "display_name": "View Customer Analytics", "resource": "customers", "action": "view_analytics", "category": "analytical", "description": "View customer analytics and insights"},
    
    # Invoice permissions
    {"name": "invoices:view", "display_name": "View Invoices", "resource": "invoices", "action": "view", "category": "financial", "description": "View invoice details and history"},
    {"name": "invoices:create", "display_name": "Create Invoices", "resource": "invoices", "action": "create", "category": "financial", "description": "Create new invoices"},
    {"name": "invoices:update", "display_name": "Update Invoices", "resource": "invoices", "action": "update", "category": "financial", "description": "Edit invoice details"},
    {"name": "invoices:delete", "display_name": "Delete Invoices", "resource": "invoices", "action": "delete", "category": "financial", "risk_level": "high", "description": "Remove invoices"},
    {"name": "invoices:approve", "display_name": "Approve Invoices", "resource": "invoices", "action": "approve", "category": "financial", "risk_level": "medium", "description": "Approve invoices for processing"},
    {"name": "invoices:send", "display_name": "Send Invoices", "resource": "invoices", "action": "send", "category": "financial", "description": "Send invoices to customers"},
    {"name": "invoices:payment", "display_name": "Process Payments", "resource": "invoices", "action": "payment", "category": "financial", "risk_level": "high", "description": "Process invoice payments"},
    
    # Accounting permissions
    {"name": "accounting:view", "display_name": "View Accounting", "resource": "accounting", "action": "view", "category": "financial", "description": "View accounting entries and financial data"},
    {"name": "accounting:create_entries", "display_name": "Create Journal Entries", "resource": "accounting", "action": "create_entries", "category": "financial", "risk_level": "high", "description": "Create accounting journal entries"},
    {"name": "accounting:update_entries", "display_name": "Update Journal Entries", "resource": "accounting", "action": "update_entries", "category": "financial", "risk_level": "high", "description": "Edit accounting journal entries"},
    {"name": "accounting:delete_entries", "display_name": "Delete Journal Entries", "resource": "accounting", "action": "delete_entries", "category": "financial", "risk_level": "critical", "description": "Remove accounting journal entries"},
    {"name": "accounting:view_reports", "display_name": "View Financial Reports", "resource": "accounting", "action": "view_reports", "category": "financial", "description": "View financial reports and statements"},
    {"name": "accounting:chart_of_accounts", "display_name": "Manage Chart of Accounts", "resource": "accounting", "action": "chart_of_accounts", "category": "financial", "risk_level": "high", "description": "Manage chart of accounts"},
    
    # Reports permissions
    {"name": "reports:view", "display_name": "View Reports", "resource": "reports", "action": "view", "category": "analytical", "description": "View system reports"},
    {"name": "reports:create", "display_name": "Create Reports", "resource": "reports", "action": "create", "category": "analytical", "description": "Create custom reports"},
    {"name": "reports:export", "display_name": "Export Reports", "resource": "reports", "action": "export", "category": "analytical", "description": "Export reports to various formats"},
    {"name": "reports:schedule", "display_name": "Schedule Reports", "resource": "reports", "action": "schedule", "category": "analytical", "description": "Schedule automated report generation"},
    {"name": "reports:share", "display_name": "Share Reports", "resource": "reports", "action": "share", "category": "analytical", "description": "Share reports with other users"},
    
    # Analytics permissions
    {"name": "analytics:view", "display_name": "View Analytics", "resource": "analytics", "action": "view", "category": "analytical", "description": "View analytics dashboards and insights"},
    {"name": "analytics:advanced", "display_name": "Advanced Analytics", "resource": "analytics", "action": "advanced", "category": "analytical", "description": "Access advanced analytics features"},
    {"name": "analytics:forecasting", "display_name": "Forecasting", "resource": "analytics", "action": "forecasting", "category": "analytical", "description": "Access forecasting and predictive analytics"},
    {"name": "analytics:kpi", "display_name": "KPI Management", "resource": "analytics", "action": "kpi", "category": "analytical", "description": "Manage KPIs and performance metrics"},
    
    # Settings permissions
    {"name": "settings:view", "display_name": "View Settings", "resource": "settings", "action": "view", "category": "administrative", "description": "View system settings"},
    {"name": "settings:update", "display_name": "Update Settings", "resource": "settings", "action": "update", "category": "administrative", "risk_level": "high", "description": "Modify system settings"},
    {"name": "settings:user_management", "display_name": "User Management", "resource": "settings", "action": "user_management", "category": "administrative", "risk_level": "high", "description": "Manage user accounts and permissions"},
    {"name": "settings:system_config", "display_name": "System Configuration", "resource": "settings", "action": "system_config", "category": "administrative", "risk_level": "critical", "description": "Configure system-wide settings"},
    {"name": "settings:backup", "display_name": "Backup Management", "resource": "settings", "action": "backup", "category": "administrative", "risk_level": "high", "description": "Manage system backups"},
    
    # SMS permissions
    {"name": "sms:view", "display_name": "View SMS", "resource": "sms", "action": "view", "category": "communication", "description": "View SMS campaigns and messages"},
    {"name": "sms:send", "display_name": "Send SMS", "resource": "sms", "action": "send", "category": "communication", "description": "Send SMS messages"},
    {"name": "sms:manage_templates", "display_name": "Manage SMS Templates", "resource": "sms", "action": "manage_templates", "category": "communication", "description": "Create and manage SMS templates"},
    {"name": "sms:campaigns", "display_name": "SMS Campaigns", "resource": "sms", "action": "campaigns", "category": "communication", "description": "Create and manage SMS campaigns"},
    
    # System permissions
    {"name": "system:audit_logs", "display_name": "View Audit Logs", "resource": "system", "action": "audit_logs", "category": "administrative", "risk_level": "medium", "description": "View system audit logs"},
    {"name": "system:health_check", "display_name": "System Health Check", "resource": "system", "action": "health_check", "category": "administrative", "description": "View system health and status"},
    {"name": "system:maintenance", "display_name": "System Maintenance", "resource": "system", "action": "maintenance", "category": "administrative", "risk_level": "critical", "description": "Perform system maintenance tasks"},
]

# System roles with their permissions
SYSTEM_ROLES = [
    {
        "name": "super_admin",
        "display_name": "Super Administrator",
        "description": "Full system access with all permissions",
        "color": "#DC2626",
        "icon": "shield-check",
        "level": 0,
        "priority": 1000,
        "permissions": "all"  # Special case - gets all permissions
    },
    {
        "name": "admin",
        "display_name": "Administrator",
        "description": "Administrative access with most permissions",
        "color": "#EA580C",
        "icon": "user-cog",
        "level": 1,
        "priority": 900,
        "permissions": [
            "dashboard:view", "dashboard:export",
            "inventory:view", "inventory:create", "inventory:update", "inventory:delete", "inventory:manage_categories", "inventory:stock_adjustment",
            "customers:view", "customers:create", "customers:update", "customers:delete", "customers:view_analytics",
            "invoices:view", "invoices:create", "invoices:update", "invoices:delete", "invoices:approve", "invoices:send", "invoices:payment",
            "accounting:view", "accounting:create_entries", "accounting:update_entries", "accounting:view_reports", "accounting:chart_of_accounts",
            "reports:view", "reports:create", "reports:export", "reports:schedule", "reports:share",
            "analytics:view", "analytics:advanced", "analytics:forecasting", "analytics:kpi",
            "settings:view", "settings:update", "settings:user_management", "settings:backup",
            "sms:view", "sms:send", "sms:manage_templates", "sms:campaigns",
            "system:audit_logs", "system:health_check"
        ]
    },
    {
        "name": "manager",
        "display_name": "Manager",
        "description": "Management access with business operations permissions",
        "color": "#7C3AED",
        "icon": "briefcase",
        "level": 2,
        "priority": 700,
        "permissions": [
            "dashboard:view", "dashboard:export",
            "inventory:view", "inventory:create", "inventory:update", "inventory:manage_categories", "inventory:stock_adjustment",
            "customers:view", "customers:create", "customers:update", "customers:view_analytics",
            "invoices:view", "invoices:create", "invoices:update", "invoices:approve", "invoices:send", "invoices:payment",
            "accounting:view", "accounting:view_reports",
            "reports:view", "reports:create", "reports:export", "reports:schedule", "reports:share",
            "analytics:view", "analytics:advanced", "analytics:forecasting", "analytics:kpi",
            "sms:view", "sms:send", "sms:manage_templates", "sms:campaigns"
        ]
    },
    {
        "name": "accountant",
        "display_name": "Accountant",
        "description": "Financial and accounting access",
        "color": "#059669",
        "icon": "calculator",
        "level": 3,
        "priority": 600,
        "permissions": [
            "dashboard:view",
            "customers:view",
            "invoices:view", "invoices:create", "invoices:update", "invoices:approve", "invoices:send", "invoices:payment",
            "accounting:view", "accounting:create_entries", "accounting:update_entries", "accounting:view_reports", "accounting:chart_of_accounts",
            "reports:view", "reports:create", "reports:export",
            "analytics:view", "analytics:kpi"
        ]
    },
    {
        "name": "sales_rep",
        "display_name": "Sales Representative",
        "description": "Sales and customer management access",
        "color": "#2563EB",
        "icon": "user-tie",
        "level": 3,
        "priority": 500,
        "permissions": [
            "dashboard:view",
            "inventory:view",
            "customers:view", "customers:create", "customers:update", "customers:view_analytics",
            "invoices:view", "invoices:create", "invoices:update", "invoices:send",
            "reports:view", "reports:export",
            "analytics:view",
            "sms:view", "sms:send", "sms:campaigns"
        ]
    },
    {
        "name": "inventory_clerk",
        "display_name": "Inventory Clerk",
        "description": "Inventory management access",
        "color": "#7C2D12",
        "icon": "package",
        "level": 4,
        "priority": 400,
        "permissions": [
            "dashboard:view",
            "inventory:view", "inventory:create", "inventory:update", "inventory:manage_categories", "inventory:stock_adjustment",
            "reports:view", "reports:export"
        ]
    },
    {
        "name": "viewer",
        "display_name": "Viewer",
        "description": "Read-only access to basic information",
        "color": "#6B7280",
        "icon": "eye",
        "level": 5,
        "priority": 100,
        "permissions": [
            "dashboard:view",
            "inventory:view",
            "customers:view",
            "invoices:view",
            "reports:view"
        ]
    }
]

def create_permissions(db):
    """Create system permissions"""
    print("Creating permissions...")
    
    created_count = 0
    for perm_data in SYSTEM_PERMISSIONS:
        # Check if permission already exists
        result = db.execute(
            select(RBACPermission).where(RBACPermission.name == perm_data["name"])
        )
        existing = result.scalar_one_or_none()
        
        if not existing:
            permission = RBACPermission(
                name=perm_data["name"],
                display_name=perm_data["display_name"],
                description=perm_data["description"],
                resource=perm_data["resource"],
                action=perm_data["action"],
                category=perm_data["category"],
                risk_level=perm_data.get("risk_level", "low"),
                is_system_permission=True,
                is_active=True
            )
            db.add(permission)
            created_count += 1
    
    db.commit()
    print(f"✅ Created {created_count} permissions")

def create_roles(db):
    """Create system roles"""
    print("Creating roles...")
    
    created_count = 0
    for role_data in SYSTEM_ROLES:
        # Check if role already exists
        result = db.execute(
            select(RBACRole).where(RBACRole.name == role_data["name"])
        )
        existing = result.scalar_one_or_none()
        
        if not existing:
            role = RBACRole(
                name=role_data["name"],
                display_name=role_data["display_name"],
                description=role_data["description"],
                color=role_data["color"],
                icon=role_data["icon"],
                level=role_data["level"],
                priority=role_data["priority"],
                is_system_role=True,
                is_active=True
            )
            db.add(role)
            db.flush()  # Get the ID
            
            # Add permissions to role
            if role_data["permissions"] == "all":
                # Super admin gets all permissions
                all_perms_result = db.execute(select(RBACPermission))
                all_permissions = all_perms_result.scalars().all()
                for permission in all_permissions:
                    db.execute(
                        role_permissions.insert().values(
                            role_id=role.id,
                            permission_id=permission.id
                        )
                    )
            else:
                # Add specific permissions
                for perm_name in role_data["permissions"]:
                    perm_result = db.execute(
                        select(RBACPermission).where(RBACPermission.name == perm_name)
                    )
                    permission = perm_result.scalar_one_or_none()
                    if permission:
                        db.execute(
                            role_permissions.insert().values(
                                role_id=role.id,
                                permission_id=permission.id
                            )
                        )
            
            created_count += 1
    
    db.commit()
    print(f"✅ Created {created_count} roles")

def assign_default_roles(db):
    """Assign default roles to existing users"""
    print("Assigning default roles to users...")
    
    # Get the viewer role as default
    viewer_result = db.execute(
        select(RBACRole).where(RBACRole.name == "viewer")
    )
    viewer_role = viewer_result.scalar_one_or_none()
    
    if not viewer_role:
        print("⚠️ Viewer role not found, skipping user role assignment")
        return
    
    # Get users without RBAC roles - use simple query to avoid model mismatch
    users_result = db.execute(text("SELECT id FROM users"))
    user_ids = [row[0] for row in users_result.fetchall()]
    
    assigned_count = 0
    for user_id in user_ids:
        # Check if user already has RBAC roles
        existing_role_result = db.execute(
            select(user_roles).where(user_roles.c.user_id == user_id)
        )
        existing_role = existing_role_result.first()
        
        if not existing_role:
            db.execute(
                user_roles.insert().values(
                    user_id=user_id,
                    role_id=viewer_role.id
                )
            )
            assigned_count += 1
    
    db.commit()
    print(f"✅ Assigned viewer role to {assigned_count} users")

def seed_rbac_data():
    """Main function to seed all RBAC data"""
    print("🚀 Starting RBAC data seeding...")
    
    try:
        with SessionLocal() as db:
            # Create permissions first
            create_permissions(db)
            
            # Create roles with permissions
            create_roles(db)
            
            # Assign default roles to existing users
            assign_default_roles(db)
            
        print("🎉 RBAC data seeding completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error seeding RBAC data: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main function"""
    success = seed_rbac_data()
    
    if success:
        print("✅ RBAC seeding completed successfully!")
        return 0
    else:
        print("💥 RBAC seeding failed!")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)