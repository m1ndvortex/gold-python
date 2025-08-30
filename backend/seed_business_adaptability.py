"""
Seed data for Universal Business Adaptability System
Populates the database with default business types, configurations, and templates.
"""

from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models_business_adaptability import (
    BusinessType, UnitOfMeasure, ReportTemplate, FeatureConfiguration
)
import json
from datetime import datetime

def seed_business_types(db: Session):
    """Seed default business types"""
    
    business_types_data = [
        {
            "type_code": "retail_general",
            "name": "General Retail Store",
            "name_persian": "فروشگاه عمومی",
            "description": "General retail business for various products",
            "icon": "store",
            "color": "#3B82F6",
            "industry_category": "retail",
            "default_configuration": {
                "inventory_tracking": True,
                "barcode_scanning": True,
                "pos_integration": True,
                "customer_management": True,
                "loyalty_program": False,
                "multi_location": False
            },
            "default_terminology": {
                "item": "product",
                "category": "product_category",
                "customer": "customer",
                "invoice": "receipt",
                "price": "selling_price"
            },
            "default_workflow_config": {
                "auto_reorder": False,
                "price_approval_required": False,
                "discount_approval_limit": 10
            },
            "default_feature_flags": {
                "inventory_tracking": True,
                "customer_management": True,
                "basic_reporting": True,
                "barcode_scanning": True,
                "tax_calculation": True
            },
            "default_units": [
                {"unit_code": "pcs", "unit_name": "Pieces", "unit_type": "count", "conversion_factor": 1},
                {"unit_code": "box", "unit_name": "Box", "unit_type": "count", "conversion_factor": 1},
                {"unit_code": "pack", "unit_name": "Pack", "unit_type": "count", "conversion_factor": 1}
            ],
            "default_pricing_models": [
                {
                    "rule_name": "Standard Retail Markup",
                    "rule_type": "markup",
                    "applies_to": "all",
                    "pricing_model": {"markup_percent": 30},
                    "priority": 5
                }
            ]
        },
        {
            "type_code": "jewelry_gold",
            "name": "Gold & Jewelry Store",
            "name_persian": "فروشگاه طلا و جواهرات",
            "description": "Specialized jewelry and precious metals retail",
            "icon": "jewelry",
            "color": "#FFD700",
            "industry_category": "retail",
            "default_configuration": {
                "weight_based_pricing": True,
                "purity_tracking": True,
                "certificate_management": True,
                "daily_price_updates": True,
                "precious_metals_inventory": True
            },
            "default_terminology": {
                "item": "jewelry_piece",
                "category": "jewelry_type",
                "customer": "customer",
                "invoice": "invoice",
                "price": "market_price"
            },
            "default_workflow_config": {
                "price_fluctuation_alerts": True,
                "certificate_required": True,
                "weight_verification": True
            },
            "default_feature_flags": {
                "weight_tracking": True,
                "purity_tracking": True,
                "certificate_management": True,
                "price_fluctuation": True,
                "advanced_reporting": True
            },
            "default_units": [
                {"unit_code": "gram", "unit_name": "Gram", "unit_type": "weight", "conversion_factor": 1, "decimal_places": 3},
                {"unit_code": "carat", "unit_name": "Carat", "unit_type": "weight", "conversion_factor": 0.2, "decimal_places": 2},
                {"unit_code": "tola", "unit_name": "Tola", "unit_type": "weight", "conversion_factor": 11.664, "decimal_places": 3},
                {"unit_code": "pcs", "unit_name": "Pieces", "unit_type": "count", "conversion_factor": 1}
            ],
            "default_pricing_models": [
                {
                    "rule_name": "Gold Weight Pricing",
                    "rule_type": "weight_based",
                    "applies_to": "gold_items",
                    "pricing_model": {
                        "base_price_per_gram": 60,
                        "purity_multiplier": True,
                        "making_charges": True
                    },
                    "priority": 10
                }
            ]
        },
        {
            "type_code": "restaurant",
            "name": "Restaurant",
            "name_persian": "رستوران",
            "description": "Food service and restaurant business",
            "icon": "restaurant",
            "color": "#EF4444",
            "industry_category": "service",
            "default_configuration": {
                "table_management": True,
                "kitchen_orders": True,
                "menu_management": True,
                "ingredient_tracking": True,
                "recipe_costing": True
            },
            "default_terminology": {
                "item": "menu_item",
                "category": "menu_category",
                "customer": "guest",
                "invoice": "bill",
                "price": "menu_price"
            },
            "default_workflow_config": {
                "order_to_kitchen": True,
                "table_service": True,
                "split_billing": True
            },
            "default_feature_flags": {
                "table_management": True,
                "kitchen_integration": True,
                "menu_management": True,
                "ingredient_tracking": True,
                "recipe_costing": True
            },
            "default_units": [
                {"unit_code": "portion", "unit_name": "Portion", "unit_type": "serving", "conversion_factor": 1},
                {"unit_code": "kg", "unit_name": "Kilogram", "unit_type": "weight", "conversion_factor": 1},
                {"unit_code": "liter", "unit_name": "Liter", "unit_type": "volume", "conversion_factor": 1}
            ],
            "default_pricing_models": [
                {
                    "rule_name": "Recipe Cost Plus Margin",
                    "rule_type": "margin",
                    "applies_to": "all",
                    "pricing_model": {"margin_percent": 65},
                    "priority": 5
                }
            ]
        },
        {
            "type_code": "pharmacy",
            "name": "Pharmacy",
            "name_persian": "داروخانه",
            "description": "Pharmaceutical and medical supplies",
            "icon": "pharmacy",
            "color": "#10B981",
            "industry_category": "healthcare",
            "default_configuration": {
                "prescription_management": True,
                "expiry_tracking": True,
                "batch_tracking": True,
                "controlled_substances": True,
                "insurance_billing": True
            },
            "default_terminology": {
                "item": "medication",
                "category": "drug_category",
                "customer": "patient",
                "invoice": "prescription_bill",
                "price": "medication_price"
            },
            "default_workflow_config": {
                "prescription_verification": True,
                "expiry_alerts": True,
                "controlled_substance_tracking": True
            },
            "default_feature_flags": {
                "prescription_management": True,
                "expiry_tracking": True,
                "batch_tracking": True,
                "insurance_integration": True,
                "regulatory_compliance": True
            },
            "default_units": [
                {"unit_code": "tablet", "unit_name": "Tablet", "unit_type": "count", "conversion_factor": 1},
                {"unit_code": "bottle", "unit_name": "Bottle", "unit_type": "count", "conversion_factor": 1},
                {"unit_code": "ml", "unit_name": "Milliliter", "unit_type": "volume", "conversion_factor": 0.001},
                {"unit_code": "mg", "unit_name": "Milligram", "unit_type": "weight", "conversion_factor": 0.000001}
            ],
            "default_pricing_models": [
                {
                    "rule_name": "Pharmaceutical Markup",
                    "rule_type": "markup",
                    "applies_to": "all",
                    "pricing_model": {"markup_percent": 20},
                    "priority": 5
                }
            ]
        },
        {
            "type_code": "automotive",
            "name": "Automotive Service",
            "name_persian": "خدمات خودرو",
            "description": "Auto repair and parts business",
            "icon": "car",
            "color": "#6366F1",
            "industry_category": "automotive",
            "default_configuration": {
                "service_scheduling": True,
                "parts_inventory": True,
                "labor_tracking": True,
                "vehicle_history": True,
                "warranty_management": True
            },
            "default_terminology": {
                "item": "part_or_service",
                "category": "service_category",
                "customer": "vehicle_owner",
                "invoice": "service_invoice",
                "price": "service_price"
            },
            "default_workflow_config": {
                "service_approval": True,
                "parts_ordering": True,
                "quality_check": True
            },
            "default_feature_flags": {
                "service_scheduling": True,
                "parts_inventory": True,
                "labor_tracking": True,
                "vehicle_database": True,
                "warranty_tracking": True
            },
            "default_units": [
                {"unit_code": "hour", "unit_name": "Hour", "unit_type": "time", "conversion_factor": 1},
                {"unit_code": "pcs", "unit_name": "Pieces", "unit_type": "count", "conversion_factor": 1},
                {"unit_code": "liter", "unit_name": "Liter", "unit_type": "volume", "conversion_factor": 1}
            ],
            "default_pricing_models": [
                {
                    "rule_name": "Labor Rate",
                    "rule_type": "time_based",
                    "applies_to": "services",
                    "pricing_model": {"price_per_hour": 85},
                    "priority": 10
                },
                {
                    "rule_name": "Parts Markup",
                    "rule_type": "markup",
                    "applies_to": "parts",
                    "pricing_model": {"markup_percent": 40},
                    "priority": 5
                }
            ]
        },
        {
            "type_code": "grocery",
            "name": "Grocery Store",
            "name_persian": "فروشگاه مواد غذایی",
            "description": "Grocery and food retail business",
            "icon": "grocery",
            "color": "#059669",
            "industry_category": "retail",
            "default_configuration": {
                "perishable_tracking": True,
                "weight_based_items": True,
                "bulk_pricing": True,
                "supplier_management": True,
                "freshness_dating": True
            },
            "default_terminology": {
                "item": "grocery_item",
                "category": "food_category",
                "customer": "shopper",
                "invoice": "receipt",
                "price": "retail_price"
            },
            "default_workflow_config": {
                "expiry_management": True,
                "weight_verification": True,
                "bulk_discounts": True
            },
            "default_feature_flags": {
                "perishable_tracking": True,
                "weight_based_pricing": True,
                "bulk_pricing": True,
                "supplier_integration": True,
                "freshness_alerts": True
            },
            "default_units": [
                {"unit_code": "kg", "unit_name": "Kilogram", "unit_type": "weight", "conversion_factor": 1},
                {"unit_code": "gram", "unit_name": "Gram", "unit_type": "weight", "conversion_factor": 0.001},
                {"unit_code": "liter", "unit_name": "Liter", "unit_type": "volume", "conversion_factor": 1},
                {"unit_code": "pcs", "unit_name": "Pieces", "unit_type": "count", "conversion_factor": 1}
            ],
            "default_pricing_models": [
                {
                    "rule_name": "Weight Based Pricing",
                    "rule_type": "weight_based",
                    "applies_to": "weight_items",
                    "pricing_model": {"price_per_unit": True},
                    "priority": 10
                },
                {
                    "rule_name": "Bulk Discount",
                    "rule_type": "tiered",
                    "applies_to": "bulk_items",
                    "pricing_model": {
                        "tiers": [
                            {"min_quantity": 1, "max_quantity": 4, "discount_percent": 0},
                            {"min_quantity": 5, "max_quantity": 9, "discount_percent": 5},
                            {"min_quantity": 10, "discount_percent": 10}
                        ]
                    },
                    "priority": 8
                }
            ]
        }
    ]
    
    for bt_data in business_types_data:
        # Check if business type already exists
        existing = db.query(BusinessType).filter(BusinessType.type_code == bt_data["type_code"]).first()
        if not existing:
            business_type = BusinessType(**bt_data)
            db.add(business_type)
            print(f"Created business type: {bt_data['name']}")
    
    db.commit()

def seed_global_units(db: Session):
    """Seed global units of measure"""
    
    global_units = [
        # Weight units
        {"unit_code": "kg", "unit_name": "Kilogram", "unit_type": "weight", "conversion_factor": 1, "industry_standard": True},
        {"unit_code": "g", "unit_name": "Gram", "unit_type": "weight", "conversion_factor": 0.001, "industry_standard": True},
        {"unit_code": "lb", "unit_name": "Pound", "unit_type": "weight", "conversion_factor": 0.453592, "industry_standard": True},
        {"unit_code": "oz", "unit_name": "Ounce", "unit_type": "weight", "conversion_factor": 0.0283495, "industry_standard": True},
        {"unit_code": "ton", "unit_name": "Ton", "unit_type": "weight", "conversion_factor": 1000, "industry_standard": True},
        
        # Volume units
        {"unit_code": "l", "unit_name": "Liter", "unit_type": "volume", "conversion_factor": 1, "industry_standard": True},
        {"unit_code": "ml", "unit_name": "Milliliter", "unit_type": "volume", "conversion_factor": 0.001, "industry_standard": True},
        {"unit_code": "gal", "unit_name": "Gallon", "unit_type": "volume", "conversion_factor": 3.78541, "industry_standard": True},
        {"unit_code": "qt", "unit_name": "Quart", "unit_type": "volume", "conversion_factor": 0.946353, "industry_standard": True},
        
        # Length units
        {"unit_code": "m", "unit_name": "Meter", "unit_type": "length", "conversion_factor": 1, "industry_standard": True},
        {"unit_code": "cm", "unit_name": "Centimeter", "unit_type": "length", "conversion_factor": 0.01, "industry_standard": True},
        {"unit_code": "mm", "unit_name": "Millimeter", "unit_type": "length", "conversion_factor": 0.001, "industry_standard": True},
        {"unit_code": "ft", "unit_name": "Foot", "unit_type": "length", "conversion_factor": 0.3048, "industry_standard": True},
        {"unit_code": "in", "unit_name": "Inch", "unit_type": "length", "conversion_factor": 0.0254, "industry_standard": True},
        
        # Count units
        {"unit_code": "pcs", "unit_name": "Pieces", "unit_type": "count", "conversion_factor": 1, "industry_standard": True},
        {"unit_code": "dozen", "unit_name": "Dozen", "unit_type": "count", "conversion_factor": 12, "industry_standard": True},
        {"unit_code": "pair", "unit_name": "Pair", "unit_type": "count", "conversion_factor": 2, "industry_standard": True},
        
        # Time units
        {"unit_code": "hour", "unit_name": "Hour", "unit_type": "time", "conversion_factor": 1, "industry_standard": True},
        {"unit_code": "min", "unit_name": "Minute", "unit_type": "time", "conversion_factor": 0.0166667, "industry_standard": True},
        {"unit_code": "day", "unit_name": "Day", "unit_type": "time", "conversion_factor": 24, "industry_standard": True},
        
        # Specialized units
        {"unit_code": "carat", "unit_name": "Carat", "unit_type": "weight", "conversion_factor": 0.0002, "applicable_business_types": ["jewelry_gold"], "industry_standard": True},
        {"unit_code": "tola", "unit_name": "Tola", "unit_type": "weight", "conversion_factor": 0.011664, "applicable_business_types": ["jewelry_gold"], "industry_standard": True},
        {"unit_code": "tablet", "unit_name": "Tablet", "unit_type": "count", "conversion_factor": 1, "applicable_business_types": ["pharmacy"], "industry_standard": True},
        {"unit_code": "capsule", "unit_name": "Capsule", "unit_type": "count", "conversion_factor": 1, "applicable_business_types": ["pharmacy"], "industry_standard": True},
        {"unit_code": "portion", "unit_name": "Portion", "unit_type": "serving", "conversion_factor": 1, "applicable_business_types": ["restaurant"], "industry_standard": True}
    ]
    
    for unit_data in global_units:
        # Check if unit already exists
        existing = db.query(UnitOfMeasure).filter(
            UnitOfMeasure.unit_code == unit_data["unit_code"],
            UnitOfMeasure.business_configuration_id.is_(None)
        ).first()
        
        if not existing:
            unit = UnitOfMeasure(**unit_data)
            db.add(unit)
            print(f"Created global unit: {unit_data['unit_name']}")
    
    db.commit()

def seed_report_templates(db: Session):
    """Seed default report templates"""
    
    report_templates = [
        {
            "template_name": "Sales Summary Report",
            "template_code": "sales_summary",
            "category": "financial",
            "template_config": {
                "period": "monthly",
                "grouping": ["category", "date"],
                "metrics": ["total_sales", "quantity_sold", "profit_margin"]
            },
            "data_sources": [
                {"table": "invoices", "fields": ["total_amount", "created_at"]},
                {"table": "invoice_items", "fields": ["quantity", "unit_price", "total_price"]}
            ],
            "calculations": {
                "total_sales": "SUM(total_amount)",
                "quantity_sold": "SUM(quantity)",
                "profit_margin": "(SUM(total_price) - SUM(cost_price)) / SUM(total_price) * 100"
            },
            "applicable_business_types": ["retail_general", "jewelry_gold", "grocery", "automotive"],
            "industry_standard": True,
            "kpi_definitions": [
                {"name": "Total Sales", "calculation": "total_sales", "format": "currency"},
                {"name": "Items Sold", "calculation": "quantity_sold", "format": "number"},
                {"name": "Profit Margin", "calculation": "profit_margin", "format": "percentage"}
            ]
        },
        {
            "template_name": "Inventory Status Report",
            "template_code": "inventory_status",
            "category": "operational",
            "template_config": {
                "grouping": ["category", "supplier"],
                "alerts": ["low_stock", "overstock", "expiring_soon"]
            },
            "data_sources": [
                {"table": "items", "fields": ["name", "category", "stock_quantity", "reorder_level"]},
                {"table": "categories", "fields": ["name", "description"]}
            ],
            "calculations": {
                "total_items": "COUNT(*)",
                "low_stock_items": "COUNT(CASE WHEN stock_quantity <= reorder_level THEN 1 END)",
                "total_value": "SUM(stock_quantity * unit_price)"
            },
            "applicable_business_types": ["retail_general", "jewelry_gold", "grocery", "pharmacy", "automotive"],
            "industry_standard": True,
            "kpi_definitions": [
                {"name": "Total Items", "calculation": "total_items", "format": "number"},
                {"name": "Low Stock Items", "calculation": "low_stock_items", "format": "number"},
                {"name": "Inventory Value", "calculation": "total_value", "format": "currency"}
            ]
        },
        {
            "template_name": "Customer Analysis Report",
            "template_code": "customer_analysis",
            "category": "customer",
            "template_config": {
                "period": "quarterly",
                "segmentation": ["purchase_frequency", "total_spent", "last_visit"]
            },
            "data_sources": [
                {"table": "customers", "fields": ["name", "email", "created_at"]},
                {"table": "invoices", "fields": ["customer_id", "total_amount", "created_at"]}
            ],
            "calculations": {
                "total_customers": "COUNT(DISTINCT customer_id)",
                "avg_order_value": "AVG(total_amount)",
                "repeat_customers": "COUNT(CASE WHEN purchase_count > 1 THEN 1 END)"
            },
            "applicable_business_types": ["retail_general", "jewelry_gold", "restaurant", "automotive"],
            "industry_standard": True,
            "kpi_definitions": [
                {"name": "Total Customers", "calculation": "total_customers", "format": "number"},
                {"name": "Average Order Value", "calculation": "avg_order_value", "format": "currency"},
                {"name": "Repeat Customers", "calculation": "repeat_customers", "format": "number"}
            ]
        },
        {
            "template_name": "Gold Price Fluctuation Report",
            "template_code": "gold_price_fluctuation",
            "category": "financial",
            "template_config": {
                "period": "daily",
                "price_tracking": ["24k", "22k", "18k"],
                "alerts": ["significant_change", "market_trend"]
            },
            "data_sources": [
                {"table": "gold_prices", "fields": ["date", "purity", "price_per_gram"]},
                {"table": "items", "fields": ["purity", "weight", "selling_price"]}
            ],
            "calculations": {
                "price_change": "(current_price - previous_price) / previous_price * 100",
                "inventory_impact": "SUM(weight * price_change)",
                "profit_margin": "(selling_price - (weight * current_gold_price)) / selling_price * 100"
            },
            "applicable_business_types": ["jewelry_gold"],
            "industry_standard": True,
            "kpi_definitions": [
                {"name": "Price Change %", "calculation": "price_change", "format": "percentage"},
                {"name": "Inventory Impact", "calculation": "inventory_impact", "format": "currency"},
                {"name": "Current Profit Margin", "calculation": "profit_margin", "format": "percentage"}
            ]
        },
        {
            "template_name": "Prescription Tracking Report",
            "template_code": "prescription_tracking",
            "category": "regulatory",
            "template_config": {
                "period": "monthly",
                "compliance": ["controlled_substances", "expiry_tracking", "batch_records"]
            },
            "data_sources": [
                {"table": "prescriptions", "fields": ["prescription_number", "patient_id", "medication", "quantity"]},
                {"table": "medications", "fields": ["name", "controlled_substance", "expiry_date", "batch_number"]}
            ],
            "calculations": {
                "total_prescriptions": "COUNT(*)",
                "controlled_prescriptions": "COUNT(CASE WHEN controlled_substance = true THEN 1 END)",
                "expiring_medications": "COUNT(CASE WHEN expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 1 END)"
            },
            "applicable_business_types": ["pharmacy"],
            "industry_standard": True,
            "kpi_definitions": [
                {"name": "Total Prescriptions", "calculation": "total_prescriptions", "format": "number"},
                {"name": "Controlled Substances", "calculation": "controlled_prescriptions", "format": "number"},
                {"name": "Expiring Soon", "calculation": "expiring_medications", "format": "number"}
            ]
        }
    ]
    
    for template_data in report_templates:
        # Check if template already exists
        existing = db.query(ReportTemplate).filter(
            ReportTemplate.template_code == template_data["template_code"],
            ReportTemplate.business_configuration_id.is_(None)
        ).first()
        
        if not existing:
            template = ReportTemplate(**template_data)
            db.add(template)
            print(f"Created report template: {template_data['template_name']}")
    
    db.commit()

def seed_business_adaptability_data():
    """Main function to seed all business adaptability data"""
    db = SessionLocal()
    
    try:
        print("Seeding business adaptability data...")
        
        # Seed business types
        print("Seeding business types...")
        seed_business_types(db)
        
        # Seed global units of measure
        print("Seeding global units of measure...")
        seed_global_units(db)
        
        # Seed report templates
        print("Seeding report templates...")
        seed_report_templates(db)
        
        print("Business adaptability data seeding completed successfully!")
        
    except Exception as e:
        print(f"Error seeding business adaptability data: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_business_adaptability_data()