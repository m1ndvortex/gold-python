"""
Universal Business Adaptability Router
FastAPI router for business type configuration, workflow adaptation, terminology mapping,
custom field schemas, feature configuration, unit management, pricing models, and reporting templates.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from uuid import UUID
from decimal import Decimal

from database import get_db
from services.business_adaptability_service_minimal import BusinessAdaptabilityService
from schemas_business_adaptability import (
    BusinessType, BusinessTypeCreate, BusinessTypeUpdate,
    EnhancedBusinessConfiguration, EnhancedBusinessConfigurationCreate, EnhancedBusinessConfigurationUpdate,
    WorkflowRule, WorkflowRuleCreate, WorkflowRuleUpdate,
    CustomFieldDefinition, CustomFieldDefinitionCreate, CustomFieldDefinitionUpdate,
    UnitOfMeasure, UnitOfMeasureCreate, UnitOfMeasureUpdate,
    PricingRule, PricingRuleCreate, PricingRuleUpdate,
    ReportTemplate, ReportTemplateCreate, ReportTemplateUpdate,
    BusinessMigrationRequest, BusinessMigrationLog,
    FeatureConfiguration, FeatureConfigurationCreate, FeatureConfigurationUpdate,
    BusinessAdaptabilityStatus, BusinessTypeCompatibility
)

router = APIRouter(prefix="/api/business-adaptability", tags=["Business Adaptability"])

def get_service(db: Session = Depends(get_db)) -> BusinessAdaptabilityService:
    """Get business adaptability service instance"""
    return BusinessAdaptabilityService(db)

# Business Type Management Endpoints
@router.post("/business-types", response_model=BusinessType)
async def create_business_type(
    business_type_data: BusinessTypeCreate,
    service: BusinessAdaptabilityService = Depends(get_service)
):
    """Create a new business type template"""
    try:
        return await service.create_business_type(business_type_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/business-types", response_model=List[BusinessType])
async def get_business_types(
    active_only: bool = Query(True, description="Filter active business types only"),
    service: BusinessAdaptabilityService = Depends(get_service)
):
    """Get all business types"""
    return await service.get_business_types(active_only)

@router.get("/business-types/{type_id}", response_model=BusinessType)
async def get_business_type(
    type_id: UUID = Path(..., description="Business type ID"),
    service: BusinessAdaptabilityService = Depends(get_service)
):
    """Get business type by ID"""
    business_type = await service.get_business_type(type_id)
    if not business_type:
        raise HTTPException(status_code=404, detail="Business type not found")
    return business_type

@router.get("/business-types/code/{type_code}", response_model=BusinessType)
async def get_business_type_by_code(
    type_code: str = Path(..., description="Business type code"),
    service: BusinessAdaptabilityService = Depends(get_service)
):
    """Get business type by code"""
    business_type = await service.get_business_type_by_code(type_code)
    if not business_type:
        raise HTTPException(status_code=404, detail="Business type not found")
    return business_type

@router.put("/business-types/{type_id}", response_model=BusinessType)
async def update_business_type(
    type_id: UUID = Path(..., description="Business type ID"),
    update_data: BusinessTypeUpdate = ...,
    service: BusinessAdaptabilityService = Depends(get_service)
):
    """Update business type"""
    business_type = await service.update_business_type(type_id, update_data)
    if not business_type:
        raise HTTPException(status_code=404, detail="Business type not found")
    return business_type

# Business Configuration Management Endpoints
@router.post("/configurations", response_model=EnhancedBusinessConfiguration)
async def create_business_configuration(
    config_data: EnhancedBusinessConfigurationCreate,
    service: BusinessAdaptabilityService = Depends(get_service)
):
    """Create a new business configuration"""
    try:
        return await service.create_business_configuration(config_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/configurations", response_model=List[EnhancedBusinessConfiguration])
async def get_business_configurations(
    active_only: bool = Query(True, description="Filter active configurations only"),
    service: BusinessAdaptabilityService = Depends(get_service)
):
    """Get all business configurations"""
    return await service.get_business_configurations(active_only)

@router.get("/configurations/{config_id}", response_model=EnhancedBusinessConfiguration)
async def get_business_configuration(
    config_id: UUID = Path(..., description="Business configuration ID"),
    service: BusinessAdaptabilityService = Depends(get_service)
):
    """Get business configuration by ID"""
    config = await service.get_business_configuration(config_id)
    if not config:
        raise HTTPException(status_code=404, detail="Business configuration not found")
    return config

@router.put("/configurations/{config_id}", response_model=EnhancedBusinessConfiguration)
async def update_business_configuration(
    config_id: UUID = Path(..., description="Business configuration ID"),
    update_data: EnhancedBusinessConfigurationUpdate = ...,
    service: BusinessAdaptabilityService = Depends(get_service)
):
    """Update business configuration"""
    config = await service.update_business_configuration(config_id, update_data)
    if not config:
        raise HTTPException(status_code=404, detail="Business configuration not found")
    return config

# Workflow Rule Management Endpoints
@router.post("/configurations/{config_id}/workflow-rules", response_model=WorkflowRule)
async def create_workflow_rule(
    config_id: UUID = Path(..., description="Business configuration ID"),
    rule_data: WorkflowRuleCreate = ...,
    service: BusinessAdaptabilityService = Depends(get_service)
):
    """Create a new workflow rule"""
    try:
        rule_data.business_configuration_id = config_id
        return await service.create_workflow_rule(rule_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/configurations/{config_id}/workflow-rules", response_model=List[WorkflowRule])
async def get_workflow_rules(
    config_id: UUID = Path(..., description="Business configuration ID"),
    rule_type: Optional[str] = Query(None, description="Filter by rule type"),
    entity_type: Optional[str] = Query(None, description="Filter by entity type"),
    active_only: bool = Query(True, description="Filter active rules only"),
    service: BusinessAdaptabilityService = Depends(get_service)
):
    """Get workflow rules for a business configuration"""
    return await service.get_workflow_rules(config_id, rule_type, entity_type, active_only)

@router.post("/configurations/{config_id}/workflow-rules/execute")
async def execute_workflow_rules(
    config_id: UUID = Path(..., description="Business configuration ID"),
    rule_type: str = Query(..., description="Rule type to execute"),
    entity_type: str = Query(..., description="Entity type"),
    entity_data: Dict[str, Any] = ...,
    service: BusinessAdaptabilityService = Depends(get_service)
):
    """Execute applicable workflow rules for an entity"""
    try:
        return await service.execute_workflow_rules(config_id, rule_type, entity_type, entity_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Custom Field Management Endpoints
@router.post("/configurations/{config_id}/custom-fields", response_model=CustomFieldDefinition)
async def create_custom_field(
    config_id: UUID = Path(..., description="Business configuration ID"),
    field_data: CustomFieldDefinitionCreate = ...,
    service: BusinessAdaptabilityService = Depends(get_service)
):
    """Create a new custom field definition"""
    try:
        field_data.business_configuration_id = config_id
        return await service.create_custom_field(field_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/configurations/{config_id}/custom-fields", response_model=List[CustomFieldDefinition])
async def get_custom_fields(
    config_id: UUID = Path(..., description="Business configuration ID"),
    entity_type: Optional[str] = Query(None, description="Filter by entity type"),
    active_only: bool = Query(True, description="Filter active fields only"),
    service: BusinessAdaptabilityService = Depends(get_service)
):
    """Get custom fields for a business configuration"""
    return await service.get_custom_fields(config_id, entity_type, active_only)

@router.post("/configurations/{config_id}/custom-fields/validate")
async def validate_custom_field_data(
    config_id: UUID = Path(..., description="Business configuration ID"),
    entity_type: str = Query(..., description="Entity type"),
    field_data: Dict[str, Any] = ...,
    service: BusinessAdaptabilityService = Depends(get_service)
):
    """Validate custom field data against field definitions"""
    try:
        return await service.validate_custom_field_data(config_id, entity_type, field_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Unit of Measure Management Endpoints
@router.post("/units-of-measure", response_model=UnitOfMeasure)
async def create_unit_of_measure(
    unit_data: UnitOfMeasureCreate,
    service: BusinessAdaptabilityService = Depends(get_service)
):
    """Create a new unit of measure"""
    try:
        return await service.create_unit_of_measure(unit_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/units-of-measure", response_model=List[UnitOfMeasure])
async def get_units_of_measure(
    business_config_id: Optional[UUID] = Query(None, description="Filter by business configuration"),
    unit_type: Optional[str] = Query(None, description="Filter by unit type"),
    active_only: bool = Query(True, description="Filter active units only"),
    service: BusinessAdaptabilityService = Depends(get_service)
):
    """Get units of measure"""
    return await service.get_units_of_measure(business_config_id, unit_type, active_only)

@router.post("/units-of-measure/convert")
async def convert_units(
    value: Decimal = Query(..., description="Value to convert"),
    from_unit: str = Query(..., description="Source unit code"),
    to_unit: str = Query(..., description="Target unit code"),
    business_config_id: Optional[UUID] = Query(None, description="Business configuration ID"),
    service: BusinessAdaptabilityService = Depends(get_service)
):
    """Convert value between units of measure"""
    try:
        converted_value = await service.convert_units(value, from_unit, to_unit, business_config_id)
        return {
            "original_value": value,
            "from_unit": from_unit,
            "to_unit": to_unit,
            "converted_value": converted_value
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Pricing Rule Management Endpoints
@router.post("/configurations/{config_id}/pricing-rules", response_model=PricingRule)
async def create_pricing_rule(
    config_id: UUID = Path(..., description="Business configuration ID"),
    rule_data: PricingRuleCreate = ...,
    service: BusinessAdaptabilityService = Depends(get_service)
):
    """Create a new pricing rule"""
    try:
        rule_data.business_configuration_id = config_id
        return await service.create_pricing_rule(rule_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/configurations/{config_id}/pricing-rules", response_model=List[PricingRule])
async def get_pricing_rules(
    config_id: UUID = Path(..., description="Business configuration ID"),
    rule_type: Optional[str] = Query(None, description="Filter by rule type"),
    applies_to: Optional[str] = Query(None, description="Filter by applies to"),
    active_only: bool = Query(True, description="Filter active rules only"),
    service: BusinessAdaptabilityService = Depends(get_service)
):
    """Get pricing rules for a business configuration"""
    return await service.get_pricing_rules(config_id, rule_type, applies_to, active_only)

@router.post("/configurations/{config_id}/pricing-rules/calculate")
async def calculate_price(
    config_id: UUID = Path(..., description="Business configuration ID"),
    entity_type: str = Query(..., description="Entity type"),
    entity_id: UUID = Query(..., description="Entity ID"),
    base_price: Decimal = Query(..., description="Base price"),
    quantity: Decimal = Query(1, description="Quantity"),
    context: Optional[Dict[str, Any]] = None,
    service: BusinessAdaptabilityService = Depends(get_service)
):
    """Calculate price using applicable pricing rules"""
    try:
        if context is None:
            context = {}
        return await service.calculate_price(config_id, entity_type, entity_id, base_price, quantity, context)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Business Migration Endpoints
@router.post("/configurations/{config_id}/migrate", response_model=BusinessMigrationLog)
async def migrate_business_type(
    config_id: UUID = Path(..., description="Business configuration ID"),
    migration_request: BusinessMigrationRequest = ...,
    service: BusinessAdaptabilityService = Depends(get_service)
):
    """Migrate business from one type to another"""
    try:
        return await service.migrate_business_type(config_id, migration_request)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Terminology and Localization Endpoints
@router.get("/configurations/{config_id}/terminology", response_model=Dict[str, str])
async def get_terminology_mapping(
    config_id: UUID = Path(..., description="Business configuration ID"),
    service: BusinessAdaptabilityService = Depends(get_service)
):
    """Get terminology mapping for a business"""
    return await service.get_terminology_mapping(config_id)

@router.put("/configurations/{config_id}/terminology", response_model=Dict[str, str])
async def update_terminology_mapping(
    config_id: UUID = Path(..., description="Business configuration ID"),
    terminology_updates: Dict[str, str] = ...,
    service: BusinessAdaptabilityService = Depends(get_service)
):
    """Update terminology mapping for a business"""
    try:
        return await service.update_terminology_mapping(config_id, terminology_updates)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/configurations/{config_id}/terminology/translate")
async def translate_term(
    config_id: UUID = Path(..., description="Business configuration ID"),
    term: str = Query(..., description="Term to translate"),
    target_language: Optional[str] = Query(None, description="Target language"),
    service: BusinessAdaptabilityService = Depends(get_service)
):
    """Translate a term using business-specific terminology mapping"""
    translated_term = await service.translate_term(config_id, term, target_language)
    return {
        "original_term": term,
        "translated_term": translated_term,
        "target_language": target_language
    }

# Business Adaptability Status and Analytics
@router.get("/configurations/{config_id}/status", response_model=BusinessAdaptabilityStatus)
async def get_business_adaptability_status(
    config_id: UUID = Path(..., description="Business configuration ID"),
    service: BusinessAdaptabilityService = Depends(get_service)
):
    """Get business adaptability status and metrics"""
    try:
        config = await service.get_business_configuration(config_id)
        if not config:
            raise HTTPException(status_code=404, detail="Business configuration not found")
        
        # Get counts of various components
        custom_fields = await service.get_custom_fields(config_id)
        workflow_rules = await service.get_workflow_rules(config_id)
        pricing_rules = await service.get_pricing_rules(config_id)
        units = await service.get_units_of_measure(config_id)
        
        # Get active features
        from database import get_db
        from models_business_adaptability import FeatureConfiguration
        db = next(get_db())
        features = db.query(FeatureConfiguration).filter(
            FeatureConfiguration.business_configuration_id == config_id,
            FeatureConfiguration.is_enabled == True,
            FeatureConfiguration.is_active == True
        ).all()
        
        return BusinessAdaptabilityStatus(
            business_configuration_id=config_id,
            business_type=config.business_type.type_code,
            setup_completed=config.setup_completed,
            active_features=[f.feature_code for f in features],
            configured_units=len(units),
            pricing_rules=len(pricing_rules),
            custom_fields=len(custom_fields),
            workflow_rules=len(workflow_rules),
            last_migration=config.migration_date
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Business Type Compatibility Analysis
@router.get("/business-types/{source_type_id}/compatibility/{target_type_id}", response_model=BusinessTypeCompatibility)
async def analyze_business_type_compatibility(
    source_type_id: UUID = Path(..., description="Source business type ID"),
    target_type_id: UUID = Path(..., description="Target business type ID"),
    service: BusinessAdaptabilityService = Depends(get_service)
):
    """Analyze compatibility between two business types"""
    try:
        source_type = await service.get_business_type(source_type_id)
        target_type = await service.get_business_type(target_type_id)
        
        if not source_type or not target_type:
            raise HTTPException(status_code=404, detail="Business type not found")
        
        compatibility = await service._analyze_migration_compatibility(source_type, target_type)
        
        return BusinessTypeCompatibility(
            source_type=source_type.type_code,
            target_type=target_type.type_code,
            compatibility_score=compatibility['compatibility_score'],
            migration_complexity=compatibility['migration_complexity'],
            data_preservation=compatibility['data_preservation'],
            required_changes=compatibility['required_changes'],
            recommended_steps=compatibility['recommended_steps']
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Bulk Operations
@router.post("/configurations/{config_id}/bulk-operations/initialize-defaults")
async def initialize_business_defaults(
    config_id: UUID = Path(..., description="Business configuration ID"),
    service: BusinessAdaptabilityService = Depends(get_service)
):
    """Initialize default features, units, and pricing rules for a business"""
    try:
        config = await service.get_business_configuration(config_id)
        if not config:
            raise HTTPException(status_code=404, detail="Business configuration not found")
        
        await service._initialize_business_defaults(config)
        return {"message": "Business defaults initialized successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/configurations/{config_id}/bulk-operations/export-configuration")
async def export_business_configuration(
    config_id: UUID = Path(..., description="Business configuration ID"),
    service: BusinessAdaptabilityService = Depends(get_service)
):
    """Export complete business configuration"""
    try:
        config = await service.get_business_configuration(config_id)
        if not config:
            raise HTTPException(status_code=404, detail="Business configuration not found")
        
        # Get all related data
        custom_fields = await service.get_custom_fields(config_id, active_only=False)
        workflow_rules = await service.get_workflow_rules(config_id, active_only=False)
        pricing_rules = await service.get_pricing_rules(config_id, active_only=False)
        units = await service.get_units_of_measure(config_id, active_only=False)
        
        export_data = {
            "business_configuration": {
                "id": str(config.id),
                "business_name": config.business_name,
                "business_type": config.business_type.type_code,
                "configuration": config.configuration,
                "terminology_mapping": config.terminology_mapping,
                "workflow_config": config.workflow_config,
                "feature_flags": config.feature_flags,
                "created_at": config.created_at.isoformat(),
                "updated_at": config.updated_at.isoformat()
            },
            "custom_fields": [
                {
                    "field_name": field.field_name,
                    "field_key": field.field_key,
                    "entity_type": field.entity_type,
                    "field_type": field.field_type,
                    "field_config": field.field_config,
                    "validation_rules": field.validation_rules,
                    "display_name": field.display_name,
                    "is_required": field.is_required
                }
                for field in custom_fields
            ],
            "workflow_rules": [
                {
                    "rule_name": rule.rule_name,
                    "rule_type": rule.rule_type,
                    "entity_type": rule.entity_type,
                    "conditions": rule.conditions,
                    "actions": rule.actions,
                    "priority": rule.priority
                }
                for rule in workflow_rules
            ],
            "pricing_rules": [
                {
                    "rule_name": rule.rule_name,
                    "rule_type": rule.rule_type,
                    "applies_to": rule.applies_to,
                    "pricing_model": rule.pricing_model,
                    "formula": rule.formula,
                    "priority": rule.priority
                }
                for rule in pricing_rules
            ],
            "units_of_measure": [
                {
                    "unit_code": unit.unit_code,
                    "unit_name": unit.unit_name,
                    "unit_type": unit.unit_type,
                    "conversion_factor": float(unit.conversion_factor),
                    "decimal_places": unit.decimal_places
                }
                for unit in units
            ]
        }
        
        return export_data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))