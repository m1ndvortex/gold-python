"""
Data Migration Script for Universal Business Platform
Handles backward compatibility for existing gold shop data
"""

import asyncio
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
import json
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class UniversalDataMigration:
    def __init__(self):
        DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://goldshop_user:goldshop_password@db:5432/goldshop")
        self.engine = create_engine(DATABASE_URL)
        self.SessionLocal = sessionmaker(bind=self.engine)
    
    def migrate_inventory_items(self):
        """Migrate existing inventory items to universal format"""
        logger.info("Starting inventory items migration...")
        
        with self.SessionLocal() as session:
            # Update existing inventory items with universal fields
            migration_queries = [
                # Set SKU for items that don't have one (use ID as fallback)
                """
                UPDATE inventory_items 
                SET sku = CONCAT('ITEM-', SUBSTRING(id::text, 1, 8))
                WHERE sku IS NULL;
                """,
                
                # Migrate pricing fields
                """
                UPDATE inventory_items 
                SET cost_price = purchase_price,
                    sale_price = sell_price
                WHERE cost_price IS NULL AND purchase_price IS NOT NULL;
                """,
                
                # Set default unit of measure for gold items
                """
                UPDATE inventory_items 
                SET unit_of_measure = 'grams'
                WHERE weight_grams IS NOT NULL AND unit_of_measure IS NULL;
                """,
                
                # Create gold-specific attributes for existing items
                """
                UPDATE inventory_items 
                SET gold_specific = jsonb_build_object(
                    'weight_grams', weight_grams,
                    'purity', COALESCE((attributes->>'purity')::decimal, 18.0),
                    'labor_cost', COALESCE((attributes->>'labor_cost')::decimal, 0),
                    'is_gold_item', true
                )
                WHERE weight_grams IS NOT NULL AND gold_specific IS NULL;
                """,
                
                # Set business type for existing categories
                """
                UPDATE categories 
                SET business_type = 'gold_shop'
                WHERE business_type IS NULL;
                """,
                
                # Initialize category paths for hierarchical structure
                """
                UPDATE categories 
                SET path = REPLACE(id::text, '-', '_')::ltree,
                    level = 0
                WHERE parent_id IS NULL AND path IS NULL;
                """,
                
                # Update child category paths (simplified)
                """
                UPDATE categories 
                SET path = REPLACE(id::text, '-', '_')::ltree,
                    level = 1
                WHERE parent_id IS NOT NULL AND path IS NULL;
                """
            ]
            
            for query in migration_queries:
                try:
                    session.execute(text(query))
                    session.commit()
                    logger.info(f"Executed migration query successfully")
                except Exception as e:
                    logger.error(f"Error executing migration query: {e}")
                    session.rollback()
                    raise
    
    def migrate_invoices(self):
        """Migrate existing invoices to universal format"""
        logger.info("Starting invoices migration...")
        
        with self.SessionLocal() as session:
            migration_queries = [
                # Set invoice type for existing invoices
                """
                UPDATE invoices 
                SET invoice_type = 'gold_shop'
                WHERE invoice_type = 'standard';
                """,
                
                # Set workflow stage for existing invoices
                """
                UPDATE invoices 
                SET workflow_stage = CASE 
                    WHEN status = 'paid' THEN 'paid'
                    WHEN status = 'pending' THEN 'approved'
                    ELSE 'approved'
                END
                WHERE workflow_stage = 'draft';
                """,
                
                # Migrate gold-specific invoice data
                """
                UPDATE invoices 
                SET gold_specific = jsonb_build_object(
                    'gold_price_per_gram', gold_price_per_gram,
                    'labor_cost_percentage', labor_cost_percentage,
                    'profit_percentage', profit_percentage,
                    'vat_percentage', vat_percentage,
                    'sood', COALESCE((total_amount * profit_percentage / 100), 0),
                    'ojrat', COALESCE((total_amount * labor_cost_percentage / 100), 0)
                )
                WHERE gold_specific IS NULL AND gold_price_per_gram IS NOT NULL;
                """,
                
                # Set subtotal and tax amounts
                """
                UPDATE invoices 
                SET subtotal = total_amount / (1 + COALESCE(vat_percentage, 0) / 100),
                    tax_amount = total_amount - (total_amount / (1 + COALESCE(vat_percentage, 0) / 100))
                WHERE subtotal IS NULL;
                """
            ]
            
            for query in migration_queries:
                try:
                    session.execute(text(query))
                    session.commit()
                    logger.info(f"Executed invoice migration query successfully")
                except Exception as e:
                    logger.error(f"Error executing invoice migration query: {e}")
                    session.rollback()
                    raise
    
    def create_default_business_configuration(self):
        """Create default business configuration for gold shop"""
        logger.info("Creating default business configuration...")
        
        gold_shop_config = {
            "business_type": "gold_shop",
            "business_name": "Gold Shop Management System",
            "industry": "jewelry_retail",
            "configuration": {
                "features": {
                    "weight_based_inventory": True,
                    "gold_price_tracking": True,
                    "labor_cost_calculation": True,
                    "profit_margin_tracking": True,
                    "sood_ojrat_fields": True
                },
                "default_settings": {
                    "currency": "USD",
                    "weight_unit": "grams",
                    "gold_purity_default": 18.0,
                    "labor_percentage_default": 10.0,
                    "profit_percentage_default": 15.0,
                    "vat_percentage_default": 5.0
                }
            },
            "terminology_mapping": {
                "inventory": "Gold Items",
                "customer": "Customer",
                "invoice": "Invoice",
                "weight": "Weight (grams)",
                "purity": "Gold Purity",
                "labor_cost": "Labor Cost (اجرت)",
                "profit": "Profit (سود)"
            },
            "workflow_settings": {
                "invoice_workflow": {
                    "stages": ["draft", "approved", "paid"],
                    "approval_required": False,
                    "auto_stock_deduction": True
                }
            },
            "feature_flags": {
                "advanced_analytics": True,
                "multi_currency": False,
                "multi_location": False,
                "barcode_scanning": True,
                "weight_tracking": True
            },
            "custom_fields_schema": {
                "inventory": [
                    {
                        "name": "purity",
                        "type": "number",
                        "label": "Gold Purity",
                        "required": True,
                        "default": 18.0
                    },
                    {
                        "name": "making_charges",
                        "type": "number", 
                        "label": "Making Charges",
                        "required": False
                    }
                ],
                "customer": [
                    {
                        "name": "preferred_gold_type",
                        "type": "enum",
                        "label": "Preferred Gold Type",
                        "options": ["18K", "21K", "22K", "24K"],
                        "required": False
                    }
                ]
            }
        }
        
        with self.SessionLocal() as session:
            try:
                # Check if configuration already exists
                existing_config = session.execute(
                    text("SELECT id FROM business_configurations WHERE business_type = 'gold_shop'")
                ).fetchone()
                
                if not existing_config:
                    session.execute(
                        text("""
                        INSERT INTO business_configurations 
                        (business_type, business_name, industry, configuration, 
                         terminology_mapping, workflow_settings, feature_flags, custom_fields_schema)
                        VALUES 
                        (:business_type, :business_name, :industry, :configuration,
                         :terminology_mapping, :workflow_settings, :feature_flags, :custom_fields_schema)
                        """),
                        {
                            "business_type": gold_shop_config["business_type"],
                            "business_name": gold_shop_config["business_name"],
                            "industry": gold_shop_config["industry"],
                            "configuration": json.dumps(gold_shop_config["configuration"]),
                            "terminology_mapping": json.dumps(gold_shop_config["terminology_mapping"]),
                            "workflow_settings": json.dumps(gold_shop_config["workflow_settings"]),
                            "feature_flags": json.dumps(gold_shop_config["feature_flags"]),
                            "custom_fields_schema": json.dumps(gold_shop_config["custom_fields_schema"])
                        }
                    )
                    session.commit()
                    logger.info("Created default gold shop business configuration")
                else:
                    logger.info("Gold shop business configuration already exists")
                    
            except Exception as e:
                logger.error(f"Error creating business configuration: {e}")
                session.rollback()
                raise
    
    def create_default_chart_of_accounts(self):
        """Create default chart of accounts for gold shop"""
        logger.info("Creating default chart of accounts...")
        
        default_accounts = [
            # Assets
            {"code": "1000", "name": "Assets", "type": "asset", "subtype": "header", "normal_balance": "debit"},
            {"code": "1100", "name": "Current Assets", "type": "asset", "subtype": "current_asset", "normal_balance": "debit", "parent": "1000"},
            {"code": "1110", "name": "Cash", "type": "asset", "subtype": "current_asset", "normal_balance": "debit", "parent": "1100"},
            {"code": "1120", "name": "Bank Account", "type": "asset", "subtype": "current_asset", "normal_balance": "debit", "parent": "1100"},
            {"code": "1130", "name": "Accounts Receivable", "type": "asset", "subtype": "current_asset", "normal_balance": "debit", "parent": "1100"},
            {"code": "1140", "name": "Inventory - Gold Items", "type": "asset", "subtype": "current_asset", "normal_balance": "debit", "parent": "1100"},
            
            # Liabilities
            {"code": "2000", "name": "Liabilities", "type": "liability", "subtype": "header", "normal_balance": "credit"},
            {"code": "2100", "name": "Current Liabilities", "type": "liability", "subtype": "current_liability", "normal_balance": "credit", "parent": "2000"},
            {"code": "2110", "name": "Accounts Payable", "type": "liability", "subtype": "current_liability", "normal_balance": "credit", "parent": "2100"},
            {"code": "2120", "name": "VAT Payable", "type": "liability", "subtype": "current_liability", "normal_balance": "credit", "parent": "2100"},
            
            # Equity
            {"code": "3000", "name": "Equity", "type": "equity", "subtype": "header", "normal_balance": "credit"},
            {"code": "3100", "name": "Owner's Equity", "type": "equity", "subtype": "owner_equity", "normal_balance": "credit", "parent": "3000"},
            {"code": "3200", "name": "Retained Earnings", "type": "equity", "subtype": "retained_earnings", "normal_balance": "credit", "parent": "3000"},
            
            # Revenue
            {"code": "4000", "name": "Revenue", "type": "revenue", "subtype": "header", "normal_balance": "credit"},
            {"code": "4100", "name": "Gold Sales Revenue", "type": "revenue", "subtype": "sales_revenue", "normal_balance": "credit", "parent": "4000"},
            {"code": "4200", "name": "Labor Revenue (اجرت)", "type": "revenue", "subtype": "service_revenue", "normal_balance": "credit", "parent": "4000"},
            {"code": "4300", "name": "Profit Revenue (سود)", "type": "revenue", "subtype": "other_revenue", "normal_balance": "credit", "parent": "4000"},
            
            # Expenses
            {"code": "5000", "name": "Expenses", "type": "expense", "subtype": "header", "normal_balance": "debit"},
            {"code": "5100", "name": "Cost of Goods Sold", "type": "expense", "subtype": "cogs", "normal_balance": "debit", "parent": "5000"},
            {"code": "5200", "name": "Operating Expenses", "type": "expense", "subtype": "operating_expense", "normal_balance": "debit", "parent": "5000"},
            {"code": "5210", "name": "Rent Expense", "type": "expense", "subtype": "operating_expense", "normal_balance": "debit", "parent": "5200"},
            {"code": "5220", "name": "Utilities Expense", "type": "expense", "subtype": "operating_expense", "normal_balance": "debit", "parent": "5200"},
            {"code": "5230", "name": "Insurance Expense", "type": "expense", "subtype": "operating_expense", "normal_balance": "debit", "parent": "5200"},
        ]
        
        with self.SessionLocal() as session:
            try:
                # Check if accounts already exist
                existing_accounts = session.execute(
                    text("SELECT COUNT(*) FROM chart_of_accounts")
                ).scalar()
                
                if existing_accounts == 0:
                    # Create accounts in order (parents first)
                    account_map = {}
                    
                    for account in default_accounts:
                        parent_id = None
                        if "parent" in account:
                            parent_id = account_map.get(account["parent"])
                        
                        result = session.execute(
                            text("""
                            INSERT INTO chart_of_accounts 
                            (account_code, account_name, account_type, account_subtype, 
                             parent_account_id, normal_balance, is_system_account)
                            VALUES 
                            (:code, :name, :type, :subtype, :parent_id, :normal_balance, true)
                            RETURNING id
                            """),
                            {
                                "code": account["code"],
                                "name": account["name"],
                                "type": account["type"],
                                "subtype": account["subtype"],
                                "parent_id": parent_id,
                                "normal_balance": account["normal_balance"]
                            }
                        )
                        account_id = result.fetchone()[0]
                        account_map[account["code"]] = account_id
                    
                    session.commit()
                    logger.info("Created default chart of accounts")
                else:
                    logger.info("Chart of accounts already exists")
                    
            except Exception as e:
                logger.error(f"Error creating chart of accounts: {e}")
                session.rollback()
                raise
    
    def create_default_payment_methods(self):
        """Create default payment methods"""
        logger.info("Creating default payment methods...")
        
        with self.SessionLocal() as session:
            try:
                # Get cash and bank account IDs
                cash_account = session.execute(
                    text("SELECT id FROM chart_of_accounts WHERE account_code = '1110'")
                ).fetchone()
                
                bank_account = session.execute(
                    text("SELECT id FROM chart_of_accounts WHERE account_code = '1120'")
                ).fetchone()
                
                default_methods = [
                    {
                        "name": "Cash",
                        "type": "cash",
                        "account_id": cash_account[0] if cash_account else None,
                        "configuration": {"requires_reference": False}
                    },
                    {
                        "name": "Bank Transfer",
                        "type": "bank_transfer",
                        "account_id": bank_account[0] if bank_account else None,
                        "configuration": {"requires_reference": True}
                    },
                    {
                        "name": "Credit Card",
                        "type": "card",
                        "account_id": bank_account[0] if bank_account else None,
                        "configuration": {"requires_reference": True, "fee_percentage": 2.5}
                    },
                    {
                        "name": "Check",
                        "type": "check",
                        "account_id": bank_account[0] if bank_account else None,
                        "configuration": {"requires_reference": True, "clearing_days": 3}
                    }
                ]
                
                existing_methods = session.execute(
                    text("SELECT COUNT(*) FROM payment_methods")
                ).scalar()
                
                if existing_methods == 0:
                    for method in default_methods:
                        session.execute(
                            text("""
                            INSERT INTO payment_methods (name, type, account_id, configuration)
                            VALUES (:name, :type, :account_id, :configuration)
                            """),
                            {
                                "name": method["name"],
                                "type": method["type"],
                                "account_id": method["account_id"],
                                "configuration": json.dumps(method["configuration"])
                            }
                        )
                    
                    session.commit()
                    logger.info("Created default payment methods")
                else:
                    logger.info("Payment methods already exist")
                    
            except Exception as e:
                logger.error(f"Error creating payment methods: {e}")
                session.rollback()
                raise
    
    def run_full_migration(self):
        """Run complete data migration"""
        logger.info("Starting full universal business platform migration...")
        
        try:
            # Step 1: Migrate inventory items
            self.migrate_inventory_items()
            
            # Step 2: Migrate invoices
            self.migrate_invoices()
            
            # Step 3: Create business configuration
            self.create_default_business_configuration()
            
            # Step 4: Create chart of accounts
            self.create_default_chart_of_accounts()
            
            # Step 5: Create payment methods
            self.create_default_payment_methods()
            
            logger.info("Universal business platform migration completed successfully!")
            
        except Exception as e:
            logger.error(f"Migration failed: {e}")
            raise

def main():
    """Main migration function"""
    migration = UniversalDataMigration()
    migration.run_full_migration()

if __name__ == "__main__":
    main()