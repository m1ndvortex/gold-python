"""
Universal Business Adaptability Service
Comprehensive service for business type configuration, workflow adaptation, terminology mapping,
custom field schemas, feature configuration, unit management, pricing models, and reporting templates.
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, text
from typing import List, Dict, Any, Optional, Union
from uuid import UUID
import uuid
from datetime import datetime, timedelta
import json
import logging
from decimal import Decimal

from models_business_adaptability import (
    BusinessType, EnhancedBusinessConfiguration, WorkflowRule, CustomFieldDefinition,
    UnitOfMeasure, PricingRule, ReportTemplate, BusinessMigrationLog, FeatureConfiguration
)
from schemas_business_adaptability import (
    BusinessTypeCreate, BusinessTypeUpdate, EnhancedBusinessConfigurationCreate,
    EnhancedBusinessConfigurationUpdate, WorkflowRuleCreate, WorkflowRuleUpdate,
    CustomFieldDefinitionCreate, CustomFieldDefinitionUpdate, UnitOfMeasureCreate,
    UnitOfMeasureUpdate, PricingRuleCreate, PricingRuleUpdate, ReportTemplateCreate,
    ReportTemplateUpdate, BusinessMigrationRequest, FeatureConfigurationCreate,
    FeatureConfigurationUpdate
)

logger = logging.getLogger(__name__)

class BusinessAdaptabilityService:
    """Service for managing business adaptability features"""
    
    def __init__(self, db: Session):
        self.db = db
    
    # Business Type Management
    async def create_business_type(self, business_type_data: BusinessTypeCreate) -> BusinessType:
        """Create a new business type template"""
        try:
            business_type = BusinessType(**business_type_data.dict())
            self.db.add(business_type)
            self.db.commit()
            self.db.refresh(business_type)
            
            logger.info(f"Created business type: {business_type.type_code}")
            return business_type
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating business type: {str(e)}")
            raise
    
    async def get_business_types(self, active_only: bool = True) -> List[BusinessType]:
        """Get all business types"""
        query = self.db.query(BusinessType)
        if active_only:
            query = query.filter(BusinessType.is_active == True)
        return query.order_by(BusinessType.name).all()
    
    async def get_business_type(self, type_id: UUID) -> Optional[BusinessType]:
        """Get business type by ID"""
        return self.db.query(BusinessType).filter(BusinessType.id == type_id).first()
    
    async def get_business_type_by_code(self, type_code: str) -> Optional[BusinessType]:
        """Get business type by code"""
        return self.db.query(BusinessType).filter(BusinessType.type_code == type_code).first()
    
    # Business Configuration Management
    async def create_business_configuration(self, config_data: EnhancedBusinessConfigurationCreate) -> EnhancedBusinessConfiguration:
        """Create a new business configuration"""
        try:
            # Get business type to inherit defaults
            business_type = await self.get_business_type(config_data.business_type_id)
            if not business_type:
                raise ValueError("Business type not found")
            
            # Merge with defaults from business type
            config_dict = config_data.dict()
            config_dict['configuration'] = {**business_type.default_configuration, **config_dict.get('configuration', {})}
            config_dict['terminology_mapping'] = {**business_type.default_terminology, **config_dict.get('terminology_mapping', {})}
            config_dict['workflow_config'] = {**business_type.default_workflow_config, **config_dict.get('workflow_config', {})}
            config_dict['feature_flags'] = {**business_type.default_feature_flags, **config_dict.get('feature_flags', {})}
            config_dict['units_of_measure'] = config_dict.get('units_of_measure') or business_type.default_units
            config_dict['pricing_models'] = config_dict.get('pricing_models') or business_type.default_pricing_models
            
            business_config = EnhancedBusinessConfiguration(**config_dict)
            self.db.add(business_config)
            self.db.commit()
            self.db.refresh(business_config)
            
            logger.info(f"Created business configuration: {business_config.business_name}")
            return business_config
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating business configuration: {str(e)}")
            raise
    
    async def get_business_configuration(self, config_id: UUID) -> Optional[EnhancedBusinessConfiguration]:
        """Get business configuration by ID"""
        return self.db.query(EnhancedBusinessConfiguration).filter(
            EnhancedBusinessConfiguration.id == config_id
        ).first()
    
    # Workflow Rule Management
    async def create_workflow_rule(self, rule_data: WorkflowRuleCreate) -> WorkflowRule:
        """Create a new workflow rule"""
        try:
            workflow_rule = WorkflowRule(**rule_data.dict())
            self.db.add(workflow_rule)
            self.db.commit()
            self.db.refresh(workflow_rule)
            
            logger.info(f"Created workflow rule: {workflow_rule.rule_name}")
            return workflow_rule
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating workflow rule: {str(e)}")
            raise
    
    async def get_workflow_rules(self, business_config_id: UUID, rule_type: Optional[str] = None, 
                                entity_type: Optional[str] = None, active_only: bool = True) -> List[WorkflowRule]:
        """Get workflow rules for a business configuration"""
        query = self.db.query(WorkflowRule).filter(
            WorkflowRule.business_configuration_id == business_config_id
        )
        
        if rule_type:
            query = query.filter(WorkflowRule.rule_type == rule_type)
        if entity_type:
            query = query.filter(WorkflowRule.entity_type == entity_type)
        if active_only:
            query = query.filter(WorkflowRule.is_active == True)
        
        return query.order_by(WorkflowRule.priority.desc(), WorkflowRule.rule_name).all()
    
    # Custom Field Management
    async def create_custom_field(self, field_data: CustomFieldDefinitionCreate) -> CustomFieldDefinition:
        """Create a new custom field definition"""
        try:
            custom_field = CustomFieldDefinition(**field_data.dict())
            self.db.add(custom_field)
            self.db.commit()
            self.db.refresh(custom_field)
            
            logger.info(f"Created custom field: {custom_field.field_name}")
            return custom_field
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating custom field: {str(e)}")
            raise
    
    async def get_custom_fields(self, business_config_id: UUID, entity_type: Optional[str] = None, 
                               active_only: bool = True) -> List[CustomFieldDefinition]:
        """Get custom fields for a business configuration"""
        query = self.db.query(CustomFieldDefinition).filter(
            CustomFieldDefinition.business_configuration_id == business_config_id
        )
        
        if entity_type:
            query = query.filter(CustomFieldDefinition.entity_type == entity_type)
        if active_only:
            query = query.filter(CustomFieldDefinition.is_active == True)
        
        return query.order_by(CustomFieldDefinition.display_order, CustomFieldDefinition.field_name).all()
    
    # Unit of Measure Management
    async def create_unit_of_measure(self, unit_data: UnitOfMeasureCreate) -> UnitOfMeasure:
        """Create a new unit of measure"""
        try:
            unit = UnitOfMeasure(**unit_data.dict())
            self.db.add(unit)
            self.db.commit()
            self.db.refresh(unit)
            
            logger.info(f"Created unit of measure: {unit.unit_code}")
            return unit
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating unit of measure: {str(e)}")
            raise
    
    async def get_units_of_measure(self, business_config_id: Optional[UUID] = None, 
                                  unit_type: Optional[str] = None, active_only: bool = True) -> List[UnitOfMeasure]:
        """Get units of measure"""
        query = self.db.query(UnitOfMeasure)
        
        if business_config_id:
            query = query.filter(UnitOfMeasure.business_configuration_id == business_config_id)
        if unit_type:
            query = query.filter(UnitOfMeasure.unit_type == unit_type)
        if active_only:
            query = query.filter(UnitOfMeasure.is_active == True)
        
        return query.order_by(UnitOfMeasure.unit_name).all()
    
    # Pricing Rule Management
    async def create_pricing_rule(self, rule_data: PricingRuleCreate) -> PricingRule:
        """Create a new pricing rule"""
        try:
            pricing_rule = PricingRule(**rule_data.dict())
            self.db.add(pricing_rule)
            self.db.commit()
            self.db.refresh(pricing_rule)
            
            logger.info(f"Created pricing rule: {pricing_rule.rule_name}")
            return pricing_rule
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating pricing rule: {str(e)}")
            raise
    
    async def get_pricing_rules(self, business_config_id: UUID, rule_type: Optional[str] = None, 
                               applies_to: Optional[str] = None, active_only: bool = True) -> List[PricingRule]:
        """Get pricing rules for a business configuration"""
        query = self.db.query(PricingRule).filter(
            PricingRule.business_configuration_id == business_config_id
        )
        
        if rule_type:
            query = query.filter(PricingRule.rule_type == rule_type)
        if applies_to:
            query = query.filter(PricingRule.applies_to == applies_to)
        if active_only:
            query = query.filter(PricingRule.is_active == True)
        
        return query.order_by(PricingRule.priority.desc(), PricingRule.rule_name).all()
    
    # Business Migration Management
    async def migrate_business_type(self, config_id: UUID, migration_request: BusinessMigrationRequest) -> BusinessMigrationLog:
        """Migrate business from one type to another"""
        try:
            business_config = await self.get_business_configuration(config_id)
            if not business_config:
                raise ValueError("Business configuration not found")
            
            target_business_type = await self.get_business_type(migration_request.to_business_type_id)
            if not target_business_type:
                raise ValueError("Target business type not found")
            
            # Create migration log
            migration_log = BusinessMigrationLog(
                business_configuration_id=config_id,
                from_business_type=business_config.business_type.type_code,
                to_business_type=target_business_type.type_code,
                migration_reason=migration_request.migration_reason,
                migration_steps=[],
                data_mapping=migration_request.data_mapping,
                status='completed',  # Simplified for basic implementation
                started_at=datetime.utcnow(),
                completed_at=datetime.utcnow(),
                progress_percentage=100
            )
            
            self.db.add(migration_log)
            
            # Update business configuration
            business_config.business_type_id = target_business_type.id
            business_config.migrated_from_type = migration_log.from_business_type
            business_config.migration_date = datetime.utcnow()
            business_config.migration_notes = migration_request.migration_reason
            
            self.db.commit()
            self.db.refresh(migration_log)
            
            return migration_log
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error starting business migration: {str(e)}")
            raise
    
    # Terminology and Localization
    async def get_terminology_mapping(self, business_config_id: UUID) -> Dict[str, str]:
        """Get terminology mapping for a business"""
        business_config = await self.get_business_configuration(business_config_id)
        if business_config:
            return business_config.terminology_mapping
        return {}
    
    async def update_terminology_mapping(self, business_config_id: UUID, 
                                       terminology_updates: Dict[str, str]) -> Dict[str, str]:
        """Update terminology mapping for a business"""
        try:
            business_config = await self.get_business_configuration(business_config_id)
            if not business_config:
                raise ValueError("Business configuration not found")
            
            # Merge with existing terminology
            current_terminology = business_config.terminology_mapping or {}
            current_terminology.update(terminology_updates)
            
            business_config.terminology_mapping = current_terminology
            business_config.updated_at = datetime.utcnow()
            
            self.db.commit()
            
            logger.info(f"Updated terminology mapping for business {business_config.business_name}")
            return current_terminology
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating terminology mapping: {str(e)}")
            raise
    
    async def translate_term(self, business_config_id: UUID, term: str, 
                           target_language: Optional[str] = None) -> str:
        """Translate a term using business-specific terminology mapping"""
        try:
            business_config = await self.get_business_configuration(business_config_id)
            if not business_config:
                return term
            
            terminology = business_config.terminology_mapping or {}
            
            # Try direct translation first
            if term in terminology:
                return terminology[term]
            
            # Try case-insensitive match
            term_lower = term.lower()
            for key, value in terminology.items():
                if key.lower() == term_lower:
                    return value
            
            # Return original term if no translation found
            return term
        except Exception as e:
            logger.error(f"Error translating term: {str(e)}")
            return term