"""
Business Configuration Service

This service handles business type configuration management, including
adaptive business type detection, workflow customization, terminology mapping,
and industry-specific feature configuration.
"""

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func
from typing import List, Dict, Any, Optional, Tuple
import uuid
import json
from datetime import datetime

from models_business_config import (
    BusinessTypeConfiguration, TerminologyMapping, WorkflowConfiguration,
    CustomFieldSchema, FeatureConfiguration, ReportTemplate, KPIDefinition,
    ServiceCatalog, BillOfMaterials, ProductionTracking,
    BusinessTypeEnum, WorkflowTypeEnum, FieldTypeEnum
)
from schemas_business_config import (
    BusinessTypeConfigurationCreate, BusinessTypeConfigurationUpdate,
    TerminologyMappingCreate, TerminologyMappingUpdate,
    WorkflowConfigurationCreate, WorkflowConfigurationUpdate,
    CustomFieldSchemaCreate, CustomFieldSchemaUpdate,
    FeatureConfigurationCreate, FeatureConfigurationUpdate,
    ReportTemplateCreate, ReportTemplateUpdate,
    KPIDefinitionCreate, KPIDefinitionUpdate,
    ServiceCatalogCreate, ServiceCatalogUpdate,
    BillOfMaterialsCreate, BillOfMaterialsUpdate,
    ProductionTrackingCreate, ProductionTrackingUpdate,
    BusinessTypeDetectionRequest, BusinessTypeDetectionResponse,
    BusinessSetupWizardRequest
)

class BusinessConfigurationService:
    """Service for managing business type configurations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    # Business Type Configuration CRUD
    def create_business_configuration(self, config_data: BusinessTypeConfigurationCreate) -> BusinessTypeConfiguration:
        """Create a new business type configuration"""
        # Check if business type already exists
        existing = self.db.query(BusinessTypeConfiguration).filter(
            BusinessTypeConfiguration.business_type == config_data.business_type
        ).first()
        
        if existing:
            raise ValueError(f"Business type {config_data.business_type} already exists")
        
        # If this is set as default, unset other defaults
        if config_data.is_default:
            self.db.query(BusinessTypeConfiguration).update({"is_default": False})
        
        db_config = BusinessTypeConfiguration(**config_data.dict())
        self.db.add(db_config)
        self.db.commit()
        self.db.refresh(db_config)
        
        # Initialize default configurations for this business type
        self._initialize_default_configurations(db_config)
        
        return db_config
    
    def get_business_configuration(self, config_id: uuid.UUID) -> Optional[BusinessTypeConfiguration]:
        """Get business configuration by ID"""
        return self.db.query(BusinessTypeConfiguration).options(
            joinedload(BusinessTypeConfiguration.terminology_mappings),
            joinedload(BusinessTypeConfiguration.workflow_configurations),
            joinedload(BusinessTypeConfiguration.custom_field_schemas),
            joinedload(BusinessTypeConfiguration.feature_configurations),
            joinedload(BusinessTypeConfiguration.report_templates),
            joinedload(BusinessTypeConfiguration.kpi_definitions)
        ).filter(BusinessTypeConfiguration.id == config_id).first()
    
    def get_business_configuration_by_type(self, business_type: BusinessTypeEnum) -> Optional[BusinessTypeConfiguration]:
        """Get business configuration by business type"""
        return self.db.query(BusinessTypeConfiguration).options(
            joinedload(BusinessTypeConfiguration.terminology_mappings),
            joinedload(BusinessTypeConfiguration.workflow_configurations),
            joinedload(BusinessTypeConfiguration.custom_field_schemas),
            joinedload(BusinessTypeConfiguration.feature_configurations),
            joinedload(BusinessTypeConfiguration.report_templates),
            joinedload(BusinessTypeConfiguration.kpi_definitions)
        ).filter(BusinessTypeConfiguration.business_type == business_type).first()
    
    def list_business_configurations(self, skip: int = 0, limit: int = 100) -> List[BusinessTypeConfiguration]:
        """List all business configurations"""
        return self.db.query(BusinessTypeConfiguration).offset(skip).limit(limit).all()
    
    def update_business_configuration(self, config_id: uuid.UUID, update_data: BusinessTypeConfigurationUpdate) -> Optional[BusinessTypeConfiguration]:
        """Update business configuration"""
        db_config = self.db.query(BusinessTypeConfiguration).filter(
            BusinessTypeConfiguration.id == config_id
        ).first()
        
        if not db_config:
            return None
        
        # If setting as default, unset other defaults
        if update_data.is_default:
            self.db.query(BusinessTypeConfiguration).filter(
                BusinessTypeConfiguration.id != config_id
            ).update({"is_default": False})
        
        update_dict = update_data.dict(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(db_config, field, value)
        
        self.db.commit()
        self.db.refresh(db_config)
        return db_config
    
    def delete_business_configuration(self, config_id: uuid.UUID) -> bool:
        """Delete business configuration"""
        db_config = self.db.query(BusinessTypeConfiguration).filter(
            BusinessTypeConfiguration.id == config_id
        ).first()
        
        if not db_config:
            return False
        
        self.db.delete(db_config)
        self.db.commit()
        return True
    
    # Terminology Mapping CRUD
    def create_terminology_mapping(self, mapping_data: TerminologyMappingCreate) -> TerminologyMapping:
        """Create terminology mapping"""
        db_mapping = TerminologyMapping(**mapping_data.dict())
        self.db.add(db_mapping)
        self.db.commit()
        self.db.refresh(db_mapping)
        return db_mapping
    
    def get_terminology_mappings(self, business_config_id: uuid.UUID, language_code: str = "en") -> List[TerminologyMapping]:
        """Get terminology mappings for a business configuration"""
        return self.db.query(TerminologyMapping).filter(
            and_(
                TerminologyMapping.business_config_id == business_config_id,
                TerminologyMapping.language_code == language_code
            )
        ).all()
    
    def update_terminology_mapping(self, mapping_id: uuid.UUID, update_data: TerminologyMappingUpdate) -> Optional[TerminologyMapping]:
        """Update terminology mapping"""
        db_mapping = self.db.query(TerminologyMapping).filter(
            TerminologyMapping.id == mapping_id
        ).first()
        
        if not db_mapping:
            return None
        
        update_dict = update_data.dict(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(db_mapping, field, value)
        
        self.db.commit()
        self.db.refresh(db_mapping)
        return db_mapping
    
    # Workflow Configuration CRUD
    def create_workflow_configuration(self, workflow_data: WorkflowConfigurationCreate) -> WorkflowConfiguration:
        """Create workflow configuration"""
        # Convert Pydantic models to JSON for database storage
        workflow_dict = workflow_data.dict()
        workflow_dict['stages'] = [stage.dict() if hasattr(stage, 'dict') else stage for stage in workflow_dict.get('stages', [])]
        workflow_dict['rules'] = [rule.dict() if hasattr(rule, 'dict') else rule for rule in workflow_dict.get('rules', [])]
        workflow_dict['approvals'] = [approval.dict() if hasattr(approval, 'dict') else approval for approval in workflow_dict.get('approvals', [])]
        workflow_dict['notifications'] = [notif.dict() if hasattr(notif, 'dict') else notif for notif in workflow_dict.get('notifications', [])]
        
        db_workflow = WorkflowConfiguration(**workflow_dict)
        self.db.add(db_workflow)
        self.db.commit()
        self.db.refresh(db_workflow)
        return db_workflow
    
    def get_workflow_configurations(self, business_config_id: uuid.UUID, workflow_type: Optional[WorkflowTypeEnum] = None) -> List[WorkflowConfiguration]:
        """Get workflow configurations for a business configuration"""
        query = self.db.query(WorkflowConfiguration).filter(
            WorkflowConfiguration.business_config_id == business_config_id
        )
        
        if workflow_type:
            query = query.filter(WorkflowConfiguration.workflow_type == workflow_type)
        
        return query.all()
    
    # Custom Field Schema CRUD
    def create_custom_field_schema(self, field_data: CustomFieldSchemaCreate) -> CustomFieldSchema:
        """Create custom field schema"""
        # Convert validation rules to JSON format
        field_dict = field_data.dict()
        if field_dict.get('validation_rules'):
            field_dict['validation_rules'] = [rule.dict() if hasattr(rule, 'dict') else rule for rule in field_dict['validation_rules']]
        
        db_field = CustomFieldSchema(**field_dict)
        self.db.add(db_field)
        self.db.commit()
        self.db.refresh(db_field)
        return db_field
    
    def get_custom_field_schemas(self, business_config_id: uuid.UUID, entity_type: Optional[str] = None) -> List[CustomFieldSchema]:
        """Get custom field schemas for a business configuration"""
        query = self.db.query(CustomFieldSchema).filter(
            CustomFieldSchema.business_config_id == business_config_id,
            CustomFieldSchema.is_active == True
        )
        
        if entity_type:
            query = query.filter(CustomFieldSchema.entity_type == entity_type)
        
        return query.order_by(CustomFieldSchema.display_order).all()
    
    # Feature Configuration CRUD
    def create_feature_configuration(self, feature_data: FeatureConfigurationCreate) -> FeatureConfiguration:
        """Create feature configuration"""
        db_feature = FeatureConfiguration(**feature_data.dict())
        self.db.add(db_feature)
        self.db.commit()
        self.db.refresh(db_feature)
        return db_feature
    
    def get_feature_configurations(self, business_config_id: uuid.UUID) -> List[FeatureConfiguration]:
        """Get feature configurations for a business configuration"""
        return self.db.query(FeatureConfiguration).filter(
            FeatureConfiguration.business_config_id == business_config_id
        ).all()
    
    def is_feature_enabled(self, business_config_id: uuid.UUID, feature_name: str) -> bool:
        """Check if a feature is enabled for a business configuration"""
        feature = self.db.query(FeatureConfiguration).filter(
            and_(
                FeatureConfiguration.business_config_id == business_config_id,
                FeatureConfiguration.feature_name == feature_name,
                FeatureConfiguration.is_enabled == True
            )
        ).first()
        
        return feature is not None
    
    # Report Template CRUD
    def create_report_template(self, template_data: ReportTemplateCreate) -> ReportTemplate:
        """Create report template"""
        db_template = ReportTemplate(**template_data.dict())
        self.db.add(db_template)
        self.db.commit()
        self.db.refresh(db_template)
        return db_template
    
    def get_report_templates(self, business_config_id: uuid.UUID, report_type: Optional[str] = None) -> List[ReportTemplate]:
        """Get report templates for a business configuration"""
        query = self.db.query(ReportTemplate).filter(
            and_(
                ReportTemplate.business_config_id == business_config_id,
                ReportTemplate.is_active == True
            )
        )
        
        if report_type:
            query = query.filter(ReportTemplate.report_type == report_type)
        
        return query.all()
    
    # KPI Definition CRUD
    def create_kpi_definition(self, kpi_data: KPIDefinitionCreate) -> KPIDefinition:
        """Create KPI definition"""
        db_kpi = KPIDefinition(**kpi_data.dict())
        self.db.add(db_kpi)
        self.db.commit()
        self.db.refresh(db_kpi)
        return db_kpi
    
    def get_kpi_definitions(self, business_config_id: uuid.UUID, kpi_category: Optional[str] = None) -> List[KPIDefinition]:
        """Get KPI definitions for a business configuration"""
        query = self.db.query(KPIDefinition).filter(
            and_(
                KPIDefinition.business_config_id == business_config_id,
                KPIDefinition.is_active == True
            )
        )
        
        if kpi_category:
            query = query.filter(KPIDefinition.kpi_category == kpi_category)
        
        return query.all()
    
    # Service Catalog CRUD (for service businesses)
    def create_service_catalog_item(self, service_data: ServiceCatalogCreate) -> ServiceCatalog:
        """Create service catalog item"""
        db_service = ServiceCatalog(**service_data.dict())
        self.db.add(db_service)
        self.db.commit()
        self.db.refresh(db_service)
        return db_service
    
    def get_service_catalog(self, business_config_id: uuid.UUID, category: Optional[str] = None) -> List[ServiceCatalog]:
        """Get service catalog for a business configuration"""
        query = self.db.query(ServiceCatalog).filter(
            and_(
                ServiceCatalog.business_config_id == business_config_id,
                ServiceCatalog.is_active == True
            )
        )
        
        if category:
            query = query.filter(ServiceCatalog.category == category)
        
        return query.all()
    
    # Bill of Materials CRUD (for manufacturing businesses)
    def create_bill_of_materials(self, bom_data: BillOfMaterialsCreate) -> BillOfMaterials:
        """Create bill of materials"""
        # Convert components and production steps to JSON format
        bom_dict = bom_data.dict()
        
        # Convert components, ensuring UUIDs are strings
        components = []
        for comp in bom_dict.get('components', []):
            if hasattr(comp, 'dict'):
                comp_dict = comp.dict()
            else:
                comp_dict = comp
            # Convert UUID to string if present
            if 'component_id' in comp_dict and hasattr(comp_dict['component_id'], '__str__'):
                comp_dict['component_id'] = str(comp_dict['component_id'])
            components.append(comp_dict)
        bom_dict['components'] = components
        
        # Convert production steps
        bom_dict['production_steps'] = [step.dict() if hasattr(step, 'dict') else step for step in bom_dict.get('production_steps', [])]
        
        db_bom = BillOfMaterials(**bom_dict)
        self.db.add(db_bom)
        self.db.commit()
        self.db.refresh(db_bom)
        return db_bom
    
    def get_bills_of_materials(self, business_config_id: uuid.UUID, product_id: Optional[uuid.UUID] = None) -> List[BillOfMaterials]:
        """Get bills of materials for a business configuration"""
        query = self.db.query(BillOfMaterials).filter(
            and_(
                BillOfMaterials.business_config_id == business_config_id,
                BillOfMaterials.is_active == True
            )
        )
        
        if product_id:
            query = query.filter(BillOfMaterials.product_id == product_id)
        
        return query.all()
    
    # Production Tracking CRUD (for manufacturing businesses)
    def create_production_tracking(self, tracking_data: ProductionTrackingCreate) -> ProductionTracking:
        """Create production tracking record"""
        # Convert tracking data to JSON format
        tracking_dict = tracking_data.dict()
        tracking_dict['production_steps'] = [step.dict() if hasattr(step, 'dict') else step for step in tracking_dict.get('production_steps', [])]
        tracking_dict['quality_checks'] = [check.dict() if hasattr(check, 'dict') else check for check in tracking_dict.get('quality_checks', [])]
        
        db_tracking = ProductionTracking(**tracking_dict)
        self.db.add(db_tracking)
        self.db.commit()
        self.db.refresh(db_tracking)
        return db_tracking
    
    def get_production_tracking(self, business_config_id: uuid.UUID, status: Optional[str] = None) -> List[ProductionTracking]:
        """Get production tracking records for a business configuration"""
        query = self.db.query(ProductionTracking).filter(
            ProductionTracking.business_config_id == business_config_id
        )
        
        if status:
            query = query.filter(ProductionTracking.status == status)
        
        return query.order_by(ProductionTracking.created_at.desc()).all()
    
    # Business Type Detection and Setup
    def detect_business_type(self, detection_request: BusinessTypeDetectionRequest) -> BusinessTypeDetectionResponse:
        """Detect business type based on description and activities"""
        business_description = detection_request.business_description.lower()
        industry = detection_request.industry.lower() if detection_request.industry else ""
        activities = [activity.lower() for activity in detection_request.primary_activities]
        customer_types = [customer.lower() for customer in detection_request.customer_types]
        
        # Business type detection logic
        detection_scores = {}
        
        # Gold shop detection
        gold_keywords = ["gold", "jewelry", "precious metals", "سکه", "طلا", "جواهر"]
        gold_score = sum(1 for keyword in gold_keywords if keyword in business_description or keyword in industry)
        if gold_score > 0:
            detection_scores[BusinessTypeEnum.GOLD_SHOP] = min(gold_score * 0.3, 0.9)
        
        # Restaurant detection
        restaurant_keywords = ["restaurant", "food", "dining", "cafe", "kitchen", "menu", "cooking"]
        restaurant_score = sum(1 for keyword in restaurant_keywords if keyword in business_description or keyword in industry)
        if restaurant_score > 0:
            detection_scores[BusinessTypeEnum.RESTAURANT] = min(restaurant_score * 0.25, 0.9)
        
        # Retail store detection
        retail_keywords = ["retail", "store", "shop", "sell", "products", "merchandise", "customer"]
        retail_score = sum(1 for keyword in retail_keywords if keyword in business_description or keyword in industry)
        if retail_score > 0:
            detection_scores[BusinessTypeEnum.RETAIL_STORE] = min(retail_score * 0.2, 0.8)
        
        # Service business detection
        service_keywords = ["service", "consulting", "repair", "maintenance", "support", "professional"]
        service_score = sum(1 for keyword in service_keywords if keyword in business_description or keyword in industry)
        if service_score > 0:
            detection_scores[BusinessTypeEnum.SERVICE_BUSINESS] = min(service_score * 0.25, 0.9)
        
        # Manufacturing detection
        manufacturing_keywords = ["manufacturing", "production", "factory", "assembly", "components", "materials"]
        manufacturing_score = sum(1 for keyword in manufacturing_keywords if keyword in business_description or keyword in industry)
        if manufacturing_score > 0:
            detection_scores[BusinessTypeEnum.MANUFACTURING] = min(manufacturing_score * 0.3, 0.9)
        
        # Wholesale detection
        wholesale_keywords = ["wholesale", "distributor", "bulk", "supplier", "b2b", "business to business"]
        wholesale_score = sum(1 for keyword in wholesale_keywords if keyword in business_description or keyword in industry)
        if wholesale_score > 0:
            detection_scores[BusinessTypeEnum.WHOLESALE] = min(wholesale_score * 0.3, 0.9)
        
        # Pharmacy detection
        pharmacy_keywords = ["pharmacy", "medicine", "drugs", "prescription", "health", "medical"]
        pharmacy_score = sum(1 for keyword in pharmacy_keywords if keyword in business_description or keyword in industry)
        if pharmacy_score > 0:
            detection_scores[BusinessTypeEnum.PHARMACY] = min(pharmacy_score * 0.4, 0.95)
        
        # Automotive detection
        automotive_keywords = ["automotive", "car", "vehicle", "auto", "mechanic", "repair", "parts"]
        automotive_score = sum(1 for keyword in automotive_keywords if keyword in business_description or keyword in industry)
        if automotive_score > 0:
            detection_scores[BusinessTypeEnum.AUTOMOTIVE] = min(automotive_score * 0.3, 0.9)
        
        # Default to retail if no specific type detected
        if not detection_scores:
            detection_scores[BusinessTypeEnum.RETAIL_STORE] = 0.5
        
        # Get the highest scoring business type
        suggested_type = max(detection_scores.keys(), key=lambda k: detection_scores[k])
        confidence_score = detection_scores[suggested_type]
        
        # Create alternative suggestions
        alternatives = []
        for business_type, score in sorted(detection_scores.items(), key=lambda x: x[1], reverse=True)[1:3]:
            alternatives.append({
                "business_type": business_type,
                "confidence_score": score,
                "reasoning": f"Detected based on keywords and industry context"
            })
        
        reasoning = f"Detected {suggested_type} based on keywords in description and industry. Confidence: {confidence_score:.2f}"
        
        return BusinessTypeDetectionResponse(
            suggested_business_type=suggested_type,
            confidence_score=confidence_score,
            reasoning=reasoning,
            alternative_suggestions=alternatives
        )
    
    def setup_business_wizard(self, setup_request: BusinessSetupWizardRequest) -> BusinessTypeConfiguration:
        """Set up business configuration using wizard"""
        # Create business configuration
        config_data = BusinessTypeConfigurationCreate(
            business_type=setup_request.business_type,
            name=setup_request.business_name,
            industry=setup_request.industry,
            is_active=True,
            is_default=True
        )
        
        business_config = self.create_business_configuration(config_data)
        
        # Apply custom terminology if provided
        if setup_request.custom_terminology:
            for standard_term, business_term in setup_request.custom_terminology.items():
                terminology_data = TerminologyMappingCreate(
                    business_config_id=business_config.id,
                    standard_term=standard_term,
                    business_term=business_term,
                    context="general",
                    category="field_label"
                )
                self.create_terminology_mapping(terminology_data)
        
        # Enable requested features
        if setup_request.features_to_enable:
            for feature_name in setup_request.features_to_enable:
                feature_data = FeatureConfigurationCreate(
                    business_config_id=business_config.id,
                    feature_name=feature_name,
                    is_enabled=True
                )
                self.create_feature_configuration(feature_data)
        
        return business_config
    
    def _initialize_default_configurations(self, business_config: BusinessTypeConfiguration):
        """Initialize default configurations for a business type"""
        business_type = business_config.business_type
        
        # Initialize default terminology mappings
        self._initialize_default_terminology(business_config)
        
        # Initialize default workflows
        self._initialize_default_workflows(business_config)
        
        # Initialize default features
        self._initialize_default_features(business_config)
        
        # Initialize default report templates
        self._initialize_default_report_templates(business_config)
        
        # Initialize default KPIs
        self._initialize_default_kpis(business_config)
        
        # Initialize business-specific configurations
        if business_type == BusinessTypeEnum.SERVICE_BUSINESS:
            self._initialize_service_business_config(business_config)
        elif business_type == BusinessTypeEnum.MANUFACTURING:
            self._initialize_manufacturing_config(business_config)
    
    def _initialize_default_terminology(self, business_config: BusinessTypeConfiguration):
        """Initialize default terminology mappings"""
        business_type = business_config.business_type
        
        # Common terminology mappings
        common_mappings = [
            ("inventory", "Products", "inventory", "field_label"),
            ("customer", "Customer", "customer", "field_label"),
            ("invoice", "Invoice", "invoice", "field_label"),
            ("payment", "Payment", "payment", "field_label"),
        ]
        
        # Business-specific terminology
        if business_type == BusinessTypeEnum.GOLD_SHOP:
            business_mappings = [
                ("inventory", "Gold Items", "inventory", "field_label"),
                ("customer", "Customer", "customer", "field_label"),
                ("invoice", "Gold Invoice", "invoice", "field_label"),
                ("weight", "Weight (گرم)", "inventory", "field_label"),
                ("purity", "Purity (عیار)", "inventory", "field_label"),
            ]
        elif business_type == BusinessTypeEnum.RESTAURANT:
            business_mappings = [
                ("inventory", "Menu Items", "inventory", "field_label"),
                ("customer", "Guest", "customer", "field_label"),
                ("invoice", "Order", "invoice", "field_label"),
                ("category", "Menu Category", "inventory", "field_label"),
            ]
        elif business_type == BusinessTypeEnum.SERVICE_BUSINESS:
            business_mappings = [
                ("inventory", "Services", "inventory", "field_label"),
                ("customer", "Client", "customer", "field_label"),
                ("invoice", "Service Invoice", "invoice", "field_label"),
                ("duration", "Service Duration", "service", "field_label"),
            ]
        elif business_type == BusinessTypeEnum.MANUFACTURING:
            business_mappings = [
                ("inventory", "Products & Components", "inventory", "field_label"),
                ("customer", "Customer", "customer", "field_label"),
                ("invoice", "Production Order", "invoice", "field_label"),
                ("bom", "Bill of Materials", "manufacturing", "field_label"),
            ]
        else:
            business_mappings = common_mappings
        
        # Create terminology mappings
        for standard_term, business_term, context, category in business_mappings:
            mapping_data = TerminologyMappingCreate(
                business_config_id=business_config.id,
                standard_term=standard_term,
                business_term=business_term,
                context=context,
                category=category
            )
            self.create_terminology_mapping(mapping_data)
    
    def _initialize_default_workflows(self, business_config: BusinessTypeConfiguration):
        """Initialize default workflow configurations"""
        # Default invoice workflow
        invoice_workflow = WorkflowConfigurationCreate(
            business_config_id=business_config.id,
            workflow_type=WorkflowTypeEnum.INVOICE_WORKFLOW,
            workflow_name="Standard Invoice Workflow",
            stages=[
                {"name": "Draft", "order": 1, "is_required": True},
                {"name": "Approved", "order": 2, "is_required": True},
                {"name": "Paid", "order": 3, "is_required": False}
            ],
            rules=[
                {
                    "name": "Stock Deduction",
                    "condition": {"stage": "approved"},
                    "action": {"type": "deduct_stock"},
                    "is_active": True
                }
            ],
            is_active=True
        )
        self.create_workflow_configuration(invoice_workflow)
    
    def _initialize_default_features(self, business_config: BusinessTypeConfiguration):
        """Initialize default feature configurations"""
        business_type = business_config.business_type
        
        # Common features
        common_features = [
            "inventory_management",
            "invoice_management",
            "customer_management",
            "basic_reporting"
        ]
        
        # Business-specific features
        if business_type == BusinessTypeEnum.GOLD_SHOP:
            specific_features = ["gold_calculations", "weight_tracking", "purity_management"]
        elif business_type == BusinessTypeEnum.SERVICE_BUSINESS:
            specific_features = ["time_tracking", "service_catalog", "appointment_booking"]
        elif business_type == BusinessTypeEnum.MANUFACTURING:
            specific_features = ["bill_of_materials", "production_tracking", "component_management"]
        elif business_type == BusinessTypeEnum.RESTAURANT:
            specific_features = ["menu_management", "table_management", "order_tracking"]
        else:
            specific_features = []
        
        all_features = common_features + specific_features
        
        for feature_name in all_features:
            feature_data = FeatureConfigurationCreate(
                business_config_id=business_config.id,
                feature_name=feature_name,
                is_enabled=True
            )
            self.create_feature_configuration(feature_data)
    
    def _initialize_default_report_templates(self, business_config: BusinessTypeConfiguration):
        """Initialize default report templates"""
        business_type = business_config.business_type
        
        # Common report templates
        common_templates = [
            {
                "template_name": "Sales Summary",
                "template_category": "sales",
                "report_type": "financial",
                "template_config": {"period": "monthly", "groupBy": "category"}
            },
            {
                "template_name": "Inventory Report",
                "template_category": "inventory",
                "report_type": "inventory",
                "template_config": {"includeStockLevels": True, "includeCosts": True}
            }
        ]
        
        # Business-specific templates
        if business_type == BusinessTypeEnum.GOLD_SHOP:
            specific_templates = [
                {
                    "template_name": "Gold Weight Report",
                    "template_category": "gold",
                    "report_type": "inventory",
                    "template_config": {"groupBy": "purity", "includeWeight": True}
                }
            ]
        elif business_type == BusinessTypeEnum.SERVICE_BUSINESS:
            specific_templates = [
                {
                    "template_name": "Service Performance",
                    "template_category": "service",
                    "report_type": "operational",
                    "template_config": {"includeTimeTracking": True, "groupBy": "service"}
                }
            ]
        else:
            specific_templates = []
        
        all_templates = common_templates + specific_templates
        
        for template_config in all_templates:
            template_data = ReportTemplateCreate(
                business_config_id=business_config.id,
                **template_config
            )
            self.create_report_template(template_data)
    
    def _initialize_default_kpis(self, business_config: BusinessTypeConfiguration):
        """Initialize default KPI definitions"""
        business_type = business_config.business_type
        
        # Common KPIs
        common_kpis = [
            {
                "kpi_name": "Total Revenue",
                "kpi_category": "financial",
                "calculation_method": "sum",
                "calculation_config": {"field": "total_amount", "period": "monthly"},
                "display_format": "currency"
            },
            {
                "kpi_name": "Customer Count",
                "kpi_category": "customer",
                "calculation_method": "count",
                "calculation_config": {"entity": "customers", "period": "monthly"},
                "display_format": "number"
            }
        ]
        
        # Business-specific KPIs
        if business_type == BusinessTypeEnum.GOLD_SHOP:
            specific_kpis = [
                {
                    "kpi_name": "Gold Weight Sold",
                    "kpi_category": "inventory",
                    "calculation_method": "sum",
                    "calculation_config": {"field": "weight", "period": "monthly"},
                    "display_format": "number"
                }
            ]
        elif business_type == BusinessTypeEnum.SERVICE_BUSINESS:
            specific_kpis = [
                {
                    "kpi_name": "Service Hours",
                    "kpi_category": "operational",
                    "calculation_method": "sum",
                    "calculation_config": {"field": "duration", "period": "monthly"},
                    "display_format": "number"
                }
            ]
        else:
            specific_kpis = []
        
        all_kpis = common_kpis + specific_kpis
        
        for kpi_config in all_kpis:
            kpi_data = KPIDefinitionCreate(
                business_config_id=business_config.id,
                **kpi_config
            )
            self.create_kpi_definition(kpi_data)
    
    def _initialize_service_business_config(self, business_config: BusinessTypeConfiguration):
        """Initialize service business specific configurations"""
        # Create sample service catalog items
        sample_services = [
            {
                "service_name": "Consultation",
                "service_code": "CONSULT",
                "description": "Professional consultation service",
                "category": "Consulting",
                "base_price": "100.00",
                "estimated_duration": 60,
                "billing_method": "hourly",
                "is_time_tracked": True
            },
            {
                "service_name": "Maintenance",
                "service_code": "MAINT",
                "description": "Equipment maintenance service",
                "category": "Maintenance",
                "base_price": "75.00",
                "estimated_duration": 120,
                "billing_method": "fixed",
                "is_time_tracked": True
            }
        ]
        
        for service_config in sample_services:
            service_data = ServiceCatalogCreate(
                business_config_id=business_config.id,
                **service_config
            )
            self.create_service_catalog_item(service_data)
    
    def _initialize_manufacturing_config(self, business_config: BusinessTypeConfiguration):
        """Initialize manufacturing business specific configurations"""
        # This would typically create sample BOM templates
        # For now, we'll just ensure the feature is enabled
        pass