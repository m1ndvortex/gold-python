"""
Comprehensive Unit Tests for Enhanced Multi-Language and Localization Backend

This test suite covers all localization functionality including:
- Language configuration management
- Translation management with memory
- Currency and exchange rate management
- Business terminology customization
- Document template localization
- Multilingual data handling
- Search capabilities
- Number, date, and currency formatting

All tests use real PostgreSQL database in Docker environment.
"""

import pytest
import asyncio
from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient
import uuid
import json

from main import app
from database import get_db, engine
from models_localization import (
    LanguageConfiguration, Translation, BusinessTerminology,
    CurrencyConfiguration, ExchangeRateHistory, DocumentTemplate,
    LocalizationSettings, MultilingualData, SearchIndex, TranslationMemory
)
from services.localization_service import LocalizationService
from schemas_localization import (
    LanguageConfigurationCreate, TranslationCreate, BusinessTerminologyCreate,
    CurrencyConfigurationCreate, DocumentTemplateCreate, MultilingualDataCreate,
    SearchRequest, NumberFormatRequest, DateFormatRequest,
    TranslationMemoryCreate, BulkTranslationRequest
)

# Test client
client = TestClient(app)

@pytest.fixture
def db_session():
    """Create a database session for testing"""
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def localization_service(db_session):
    """Create localization service instance"""
    return LocalizationService(db_session)

@pytest.fixture
def sample_language_config():
    """Sample language configuration data"""
    return LanguageConfigurationCreate(
        language_code="fa",
        language_name="Persian",
        native_name="فارسی",
        text_direction="rtl",
        is_rtl=True,
        locale_code="fa-IR",
        country_code="IR",
        number_format={
            "decimal_separator": ".",
            "thousands_separator": ",",
            "currency_symbol": "ریال"
        },
        date_format={
            "short": "YYYY/MM/DD",
            "long": "DD MMMM YYYY"
        },
        currency_format={
            "symbol_position": "after",
            "decimal_places": 0
        },
        is_active=True,
        is_default=False,
        completion_percentage=Decimal("85.5")
    )

@pytest.fixture
def sample_translation():
    """Sample translation data"""
    return TranslationCreate(
        language_id=uuid.uuid4(),  # Will be replaced with actual language ID
        translation_key="dashboard.welcome",
        context="dashboard",
        namespace="ui",
        original_text="Welcome to the Dashboard",
        translated_text="به داشبورد خوش آمدید",
        is_approved=True,
        is_fuzzy=False,
        translator_notes="Standard welcome message",
        plural_forms=None,
        version=1
    )

@pytest.fixture
def sample_currency_config():
    """Sample currency configuration data"""
    return CurrencyConfigurationCreate(
        currency_code="IRR",
        currency_name="Iranian Rial",
        currency_symbol="ریال",
        decimal_places=0,
        is_crypto=False,
        symbol_position="after",
        thousands_separator=",",
        decimal_separator=".",
        base_currency="USD",
        exchange_rate=Decimal("42000.0"),
        auto_update_enabled=True,
        rate_source="exchangerate",
        update_frequency_hours=24,
        is_active=True,
        is_default=False
    )

class TestLanguageConfiguration:
    """Test language configuration management"""
    
    @pytest.mark.asyncio
    async def test_create_language_configuration(self, localization_service, sample_language_config):
        """Test creating a new language configuration"""
        result = await localization_service.create_language_configuration(sample_language_config)
        
        assert result is not None
        assert result.language_code == "fa"
        assert result.language_name == "Persian"
        assert result.native_name == "فارسی"
        assert result.is_rtl == True
        assert result.text_direction == "rtl"
        assert result.locale_code == "fa-IR"
        assert result.country_code == "IR"
        assert result.completion_percentage == Decimal("85.5")
    
    @pytest.mark.asyncio
    async def test_create_duplicate_language_configuration(self, localization_service, sample_language_config):
        """Test creating duplicate language configuration should fail"""
        # Create first language
        await localization_service.create_language_configuration(sample_language_config)
        
        # Try to create duplicate
        with pytest.raises(Exception):
            await localization_service.create_language_configuration(sample_language_config)
    
    @pytest.mark.asyncio
    async def test_get_language_configurations(self, localization_service, sample_language_config):
        """Test retrieving language configurations"""
        # Create test language
        created = await localization_service.create_language_configuration(sample_language_config)
        
        # Get all languages
        languages = await localization_service.get_language_configurations()
        
        assert len(languages) >= 1
        assert any(lang.id == created.id for lang in languages)
    
    @pytest.mark.asyncio
    async def test_get_language_by_code(self, localization_service, sample_language_config):
        """Test retrieving language by code"""
        # Create test language
        created = await localization_service.create_language_configuration(sample_language_config)
        
        # Get by code
        result = await localization_service.get_language_by_code("fa")
        
        assert result is not None
        assert result.id == created.id
        assert result.language_code == "fa"
    
    @pytest.mark.asyncio
    async def test_update_language_configuration(self, localization_service, sample_language_config):
        """Test updating language configuration"""
        # Create test language
        created = await localization_service.create_language_configuration(sample_language_config)
        
        # Update
        from schemas_localization import LanguageConfigurationUpdate
        update_data = LanguageConfigurationUpdate(
            completion_percentage=Decimal("90.0"),
            is_active=False
        )
        
        result = await localization_service.update_language_configuration(
            created.id, update_data
        )
        
        assert result is not None
        assert result.completion_percentage == Decimal("90.0")
        assert result.is_active == False
    
    @pytest.mark.asyncio
    async def test_delete_language_configuration(self, localization_service, sample_language_config):
        """Test deleting language configuration"""
        # Create test language
        created = await localization_service.create_language_configuration(sample_language_config)
        
        # Delete
        success = await localization_service.delete_language_configuration(created.id)
        
        assert success == True
        
        # Verify deletion
        result = await localization_service.get_language_configuration(created.id)
        assert result is None

class TestTranslationManagement:
    """Test translation management functionality"""
    
    @pytest.mark.asyncio
    async def test_create_translation(self, localization_service, sample_language_config, sample_translation):
        """Test creating a new translation"""
        # Create language first
        language = await localization_service.create_language_configuration(sample_language_config)
        
        # Update translation with actual language ID
        sample_translation.language_id = language.id
        
        # Create translation
        result = await localization_service.create_translation(sample_translation)
        
        assert result is not None
        assert result.language_id == language.id
        assert result.translation_key == "dashboard.welcome"
        assert result.original_text == "Welcome to the Dashboard"
        assert result.translated_text == "به داشبورد خوش آمدید"
        assert result.is_approved == True
        assert result.context == "dashboard"
        assert result.namespace == "ui"
    
    @pytest.mark.asyncio
    async def test_get_translations(self, localization_service, sample_language_config, sample_translation):
        """Test retrieving translations"""
        # Create language and translation
        language = await localization_service.create_language_configuration(sample_language_config)
        sample_translation.language_id = language.id
        created = await localization_service.create_translation(sample_translation)
        
        # Get translations
        translations = await localization_service.get_translations(language_id=language.id)
        
        assert len(translations) >= 1
        assert any(t.id == created.id for t in translations)
    
    @pytest.mark.asyncio
    async def test_get_translation_by_key(self, localization_service, sample_language_config, sample_translation):
        """Test retrieving translation by key"""
        # Create language and translation
        language = await localization_service.create_language_configuration(sample_language_config)
        sample_translation.language_id = language.id
        created = await localization_service.create_translation(sample_translation)
        
        # Get by key
        result = await localization_service.get_translation_by_key(
            language.id, "dashboard.welcome", "dashboard"
        )
        
        assert result is not None
        assert result.id == created.id
        assert result.translation_key == "dashboard.welcome"
    
    @pytest.mark.asyncio
    async def test_update_translation(self, localization_service, sample_language_config, sample_translation):
        """Test updating translation"""
        # Create language and translation
        language = await localization_service.create_language_configuration(sample_language_config)
        sample_translation.language_id = language.id
        created = await localization_service.create_translation(sample_translation)
        
        # Update
        from schemas_localization import TranslationUpdate
        update_data = TranslationUpdate(
            translated_text="به پنل مدیریت خوش آمدید",
            is_approved=False,
            translator_notes="Updated translation"
        )
        
        result = await localization_service.update_translation(created.id, update_data)
        
        assert result is not None
        assert result.translated_text == "به پنل مدیریت خوش آمدید"
        assert result.is_approved == False
        assert result.translator_notes == "Updated translation"
        assert result.version == 2  # Version should increment
    
    @pytest.mark.asyncio
    async def test_bulk_create_translations(self, localization_service, sample_language_config):
        """Test bulk translation creation"""
        # Create language
        language = await localization_service.create_language_configuration(sample_language_config)
        
        # Prepare bulk data
        from schemas_localization import TranslationBulkCreate, TranslationBase
        bulk_data = TranslationBulkCreate(
            language_id=language.id,
            translations=[
                TranslationBase(
                    translation_key="menu.dashboard",
                    context="menu",
                    namespace="ui",
                    original_text="Dashboard",
                    translated_text="داشبورد",
                    is_approved=True
                ),
                TranslationBase(
                    translation_key="menu.inventory",
                    context="menu",
                    namespace="ui",
                    original_text="Inventory",
                    translated_text="موجودی",
                    is_approved=True
                ),
                TranslationBase(
                    translation_key="menu.reports",
                    context="menu",
                    namespace="ui",
                    original_text="Reports",
                    translated_text="گزارشات",
                    is_approved=True
                )
            ]
        )
        
        # Create bulk translations
        result = await localization_service.bulk_create_translations(bulk_data)
        
        assert result["created_count"] == 3
        assert result["error_count"] == 0
        assert len(result["errors"]) == 0

class TestBusinessTerminology:
    """Test business terminology customization"""
    
    @pytest.mark.asyncio
    async def test_create_business_terminology(self, localization_service, sample_language_config):
        """Test creating business terminology"""
        # Create language
        language = await localization_service.create_language_configuration(sample_language_config)
        
        # Create terminology
        terminology_data = BusinessTerminologyCreate(
            language_id=language.id,
            standard_term="customer",
            business_term="مشتری",
            term_category="entity",
            usage_context="form_label",
            industry="retail",
            business_type="gold_shop",
            is_custom=True,
            is_active=True,
            priority=1
        )
        
        result = await localization_service.create_business_terminology(terminology_data)
        
        assert result is not None
        assert result.language_id == language.id
        assert result.standard_term == "customer"
        assert result.business_term == "مشتری"
        assert result.term_category == "entity"
        assert result.industry == "retail"
        assert result.business_type == "gold_shop"
        assert result.is_custom == True
        assert result.priority == 1
    
    @pytest.mark.asyncio
    async def test_get_business_terminology(self, localization_service, sample_language_config):
        """Test retrieving business terminology"""
        # Create language and terminology
        language = await localization_service.create_language_configuration(sample_language_config)
        
        terminology_data = BusinessTerminologyCreate(
            language_id=language.id,
            standard_term="invoice",
            business_term="فاکتور",
            term_category="document",
            usage_context="menu_item",
            industry="retail",
            business_type="gold_shop"
        )
        
        created = await localization_service.create_business_terminology(terminology_data)
        
        # Get terminology
        terminology_list = await localization_service.get_business_terminology(
            language_id=language.id
        )
        
        assert len(terminology_list) >= 1
        assert any(t.id == created.id for t in terminology_list)

class TestCurrencyManagement:
    """Test currency and exchange rate management"""
    
    @pytest.mark.asyncio
    async def test_create_currency_configuration(self, localization_service, sample_currency_config):
        """Test creating currency configuration"""
        result = await localization_service.create_currency_configuration(sample_currency_config)
        
        assert result is not None
        assert result.currency_code == "IRR"
        assert result.currency_name == "Iranian Rial"
        assert result.currency_symbol == "ریال"
        assert result.decimal_places == 0
        assert result.symbol_position == "after"
        assert result.exchange_rate == Decimal("42000.0")
        assert result.auto_update_enabled == True
    
    @pytest.mark.asyncio
    async def test_get_currency_configurations(self, localization_service, sample_currency_config):
        """Test retrieving currency configurations"""
        # Create currency
        created = await localization_service.create_currency_configuration(sample_currency_config)
        
        # Get currencies
        currencies = await localization_service.get_currency_configurations()
        
        assert len(currencies) >= 1
        assert any(c.id == created.id for c in currencies)
    
    @pytest.mark.asyncio
    async def test_update_exchange_rates(self, localization_service, sample_currency_config):
        """Test updating exchange rates"""
        # Create currency with auto-update enabled
        created = await localization_service.create_currency_configuration(sample_currency_config)
        
        # Update exchange rates (this will use mock data since we don't have real API access in tests)
        result = await localization_service.update_exchange_rates(
            currency_code="IRR",
            force_update=True
        )
        
        # Check result structure
        assert "updated_count" in result
        assert "error_count" in result
        assert "errors" in result

class TestDocumentTemplates:
    """Test document template localization"""
    
    @pytest.mark.asyncio
    async def test_create_document_template(self, localization_service, sample_language_config):
        """Test creating document template"""
        # Create language
        language = await localization_service.create_language_configuration(sample_language_config)
        
        # Create template
        template_data = DocumentTemplateCreate(
            language_id=language.id,
            template_name="Persian Invoice Template",
            template_type="invoice",
            document_category="sales",
            template_content="""
            <div dir="rtl">
                <h1>فاکتور فروش</h1>
                <p>شماره فاکتور: {{invoice_number}}</p>
                <p>تاریخ: {{date}}</p>
                <p>مشتری: {{customer_name}}</p>
                <table>
                    <tr>
                        <th>کالا</th>
                        <th>تعداد</th>
                        <th>قیمت واحد</th>
                        <th>مجموع</th>
                    </tr>
                    {{#items}}
                    <tr>
                        <td>{{name}}</td>
                        <td>{{quantity}}</td>
                        <td>{{unit_price}}</td>
                        <td>{{total}}</td>
                    </tr>
                    {{/items}}
                </table>
                <p>جمع کل: {{total_amount}} ریال</p>
            </div>
            """,
            template_variables={
                "invoice_number": "string",
                "date": "date",
                "customer_name": "string",
                "items": "array",
                "total_amount": "number"
            },
            page_format="A4",
            orientation="portrait",
            font_family="Tahoma",
            font_size=12,
            text_alignment="right",
            date_format="YYYY/MM/DD",
            is_active=True,
            is_default=True,
            version="1.0"
        )
        
        result = await localization_service.create_document_template(template_data)
        
        assert result is not None
        assert result.language_id == language.id
        assert result.template_name == "Persian Invoice Template"
        assert result.template_type == "invoice"
        assert result.text_alignment == "right"
        assert result.font_family == "Tahoma"
        assert result.is_default == True
    
    @pytest.mark.asyncio
    async def test_get_document_templates(self, localization_service, sample_language_config):
        """Test retrieving document templates"""
        # Create language and template
        language = await localization_service.create_language_configuration(sample_language_config)
        
        template_data = DocumentTemplateCreate(
            language_id=language.id,
            template_name="Test Template",
            template_type="receipt",
            template_content="<div>Test content</div>"
        )
        
        created = await localization_service.create_document_template(template_data)
        
        # Get templates
        templates = await localization_service.get_document_templates(
            language_id=language.id,
            template_type="receipt"
        )
        
        assert len(templates) >= 1
        assert any(t.id == created.id for t in templates)

class TestMultilingualData:
    """Test multilingual data handling"""
    
    @pytest.mark.asyncio
    async def test_create_multilingual_data(self, localization_service, sample_language_config):
        """Test creating multilingual data"""
        # Create language
        language = await localization_service.create_language_configuration(sample_language_config)
        
        # Create multilingual data
        entity_id = uuid.uuid4()
        data = MultilingualDataCreate(
            language_id=language.id,
            entity_type="product",
            entity_id=entity_id,
            field_name="name",
            field_content="طلای 18 عیار",
            is_auto_translated=False,
            translation_confidence=None,
            is_active=True,
            needs_review=False
        )
        
        result = await localization_service.create_multilingual_data(data)
        
        assert result is not None
        assert result.language_id == language.id
        assert result.entity_type == "product"
        assert result.entity_id == entity_id
        assert result.field_name == "name"
        assert result.field_content == "طلای 18 عیار"
        assert result.is_auto_translated == False
    
    @pytest.mark.asyncio
    async def test_get_multilingual_data(self, localization_service, sample_language_config):
        """Test retrieving multilingual data"""
        # Create language and data
        language = await localization_service.create_language_configuration(sample_language_config)
        
        entity_id = uuid.uuid4()
        data = MultilingualDataCreate(
            language_id=language.id,
            entity_type="category",
            entity_id=entity_id,
            field_name="description",
            field_content="دسته‌بندی طلا و جواهرات"
        )
        
        created = await localization_service.create_multilingual_data(data)
        
        # Get data
        result = await localization_service.get_multilingual_data(
            "category", entity_id, language.id
        )
        
        assert len(result) >= 1
        assert any(d.id == created.id for d in result)

class TestSearchFunctionality:
    """Test multilingual search capabilities"""
    
    @pytest.mark.asyncio
    async def test_search_multilingual(self, localization_service, sample_language_config):
        """Test multilingual search"""
        # Create language and some searchable data
        language = await localization_service.create_language_configuration(sample_language_config)
        
        # Create multilingual data
        entity_id = uuid.uuid4()
        data = MultilingualDataCreate(
            language_id=language.id,
            entity_type="product",
            entity_id=entity_id,
            field_name="name",
            field_content="گردنبند طلای زنانه"
        )
        
        await localization_service.create_multilingual_data(data)
        
        # Search
        search_request = SearchRequest(
            query="طلا",
            language_id=language.id,
            entity_types=["product"],
            limit=10,
            offset=0
        )
        
        result = await localization_service.search_multilingual(search_request)
        
        assert "results" in result
        assert "total_count" in result
        assert result["query"] == "طلا"
        assert result["language_id"] == language.id

class TestFormattingFunctions:
    """Test number, date, and currency formatting"""
    
    @pytest.mark.asyncio
    async def test_format_number(self, localization_service, sample_language_config):
        """Test number formatting"""
        # Create language
        language = await localization_service.create_language_configuration(sample_language_config)
        
        # Format number
        format_request = NumberFormatRequest(
            number=1234567.89,
            language_code="fa",
            format_type="decimal"
        )
        
        result = await localization_service.format_number(format_request)
        
        assert "formatted_value" in result
        assert "language_code" in result
        assert "format_pattern" in result
        assert result["language_code"] == "fa"
    
    @pytest.mark.asyncio
    async def test_format_currency(self, localization_service, sample_language_config, sample_currency_config):
        """Test currency formatting"""
        # Create language and currency
        language = await localization_service.create_language_configuration(sample_language_config)
        currency = await localization_service.create_currency_configuration(sample_currency_config)
        
        # Format currency
        format_request = NumberFormatRequest(
            number=1500000,
            language_code="fa",
            currency_code="IRR",
            format_type="currency"
        )
        
        result = await localization_service.format_number(format_request)
        
        assert "formatted_value" in result
        assert result["language_code"] == "fa"
    
    @pytest.mark.asyncio
    async def test_format_date(self, localization_service, sample_language_config):
        """Test date formatting"""
        # Create language
        language = await localization_service.create_language_configuration(sample_language_config)
        
        # Format date
        format_request = DateFormatRequest(
            date=datetime(2024, 3, 15, 14, 30, 0),
            language_code="fa",
            format_pattern="YYYY/MM/DD"
        )
        
        result = await localization_service.format_date(format_request)
        
        assert "formatted_value" in result
        assert "language_code" in result
        assert "format_pattern" in result
        assert result["language_code"] == "fa"
        assert result["format_pattern"] == "YYYY/MM/DD"

class TestTranslationMemory:
    """Test translation memory functionality"""
    
    @pytest.mark.asyncio
    async def test_create_translation_memory(self, localization_service):
        """Test creating translation memory entry"""
        memory_data = TranslationMemoryCreate(
            source_language="en",
            target_language="fa",
            source_text="Welcome to our store",
            target_text="به فروشگاه ما خوش آمدید",
            context="greeting",
            domain="retail",
            quality_score=Decimal("0.95"),
            source_type="manual"
        )
        
        result = await localization_service.create_translation_memory(memory_data)
        
        assert result is not None
        assert result.source_language == "en"
        assert result.target_language == "fa"
        assert result.source_text == "Welcome to our store"
        assert result.target_text == "به فروشگاه ما خوش آمدید"
        assert result.quality_score == Decimal("0.95")

class TestAPIEndpoints:
    """Test API endpoints through HTTP requests"""
    
    def test_get_supported_languages(self):
        """Test getting supported languages"""
        response = client.get("/api/localization/supported-languages")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert all("code" in item and "name" in item for item in data)
    
    def test_get_supported_currencies(self):
        """Test getting supported currencies"""
        response = client.get("/api/localization/supported-currencies")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert all("code" in item and "name" in item for item in data)
    
    def test_get_rtl_languages(self):
        """Test getting RTL languages"""
        response = client.get("/api/localization/rtl-languages")
        assert response.status_code == 200
        
        data = response.json()
        assert "rtl_languages" in data
        assert "description" in data
        assert isinstance(data["rtl_languages"], list)
        assert "ar" in data["rtl_languages"]
        assert "fa" in data["rtl_languages"]
    
    def test_health_check(self):
        """Test localization service health check"""
        response = client.get("/api/localization/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "localization"
        assert "timestamp" in data
        assert "features" in data
        assert isinstance(data["features"], list)
        assert len(data["features"]) > 0

class TestIntegrationScenarios:
    """Test complete integration scenarios"""
    
    @pytest.mark.asyncio
    async def test_complete_localization_workflow(self, localization_service):
        """Test complete localization workflow from setup to usage"""
        
        # 1. Create language configuration
        language_config = LanguageConfigurationCreate(
            language_code="ar",
            language_name="Arabic",
            native_name="العربية",
            text_direction="rtl",
            is_rtl=True,
            locale_code="ar-SA",
            country_code="SA",
            is_active=True,
            is_default=False
        )
        
        language = await localization_service.create_language_configuration(language_config)
        assert language is not None
        
        # 2. Create currency configuration
        currency_config = CurrencyConfigurationCreate(
            currency_code="SAR",
            currency_name="Saudi Riyal",
            currency_symbol="ر.س",
            decimal_places=2,
            symbol_position="before",
            exchange_rate=Decimal("3.75"),
            is_active=True
        )
        
        currency = await localization_service.create_currency_configuration(currency_config)
        assert currency is not None
        
        # 3. Create business terminology
        terminology = BusinessTerminologyCreate(
            language_id=language.id,
            standard_term="product",
            business_term="منتج",
            term_category="entity",
            usage_context="form_label",
            industry="retail",
            business_type="general"
        )
        
        term = await localization_service.create_business_terminology(terminology)
        assert term is not None
        
        # 4. Create translations
        translations = [
            TranslationCreate(
                language_id=language.id,
                translation_key="menu.dashboard",
                context="menu",
                namespace="ui",
                original_text="Dashboard",
                translated_text="لوحة التحكم",
                is_approved=True
            ),
            TranslationCreate(
                language_id=language.id,
                translation_key="menu.products",
                context="menu",
                namespace="ui",
                original_text="Products",
                translated_text="المنتجات",
                is_approved=True
            )
        ]
        
        for translation_data in translations:
            translation = await localization_service.create_translation(translation_data)
            assert translation is not None
        
        # 5. Create document template
        template = DocumentTemplateCreate(
            language_id=language.id,
            template_name="Arabic Invoice Template",
            template_type="invoice",
            template_content="""
            <div dir="rtl">
                <h1>فاتورة</h1>
                <p>رقم الفاتورة: {{invoice_number}}</p>
                <p>التاريخ: {{date}}</p>
                <p>العميل: {{customer_name}}</p>
                <p>المجموع: {{total_amount}} ر.س</p>
            </div>
            """,
            text_alignment="right",
            font_family="Arial",
            is_active=True
        )
        
        doc_template = await localization_service.create_document_template(template)
        assert doc_template is not None
        
        # 6. Create multilingual data
        entity_id = uuid.uuid4()
        multilingual_data = MultilingualDataCreate(
            language_id=language.id,
            entity_type="product",
            entity_id=entity_id,
            field_name="name",
            field_content="ذهب عيار 21"
        )
        
        ml_data = await localization_service.create_multilingual_data(multilingual_data)
        assert ml_data is not None
        
        # 7. Test formatting
        number_format = NumberFormatRequest(
            number=1234.56,
            language_code="ar",
            currency_code="SAR",
            format_type="currency"
        )
        
        formatted_number = await localization_service.format_number(number_format)
        assert formatted_number is not None
        assert formatted_number["language_code"] == "ar"
        
        # 8. Test search
        search_request = SearchRequest(
            query="ذهب",
            language_id=language.id,
            entity_types=["product"],
            limit=10
        )
        
        search_results = await localization_service.search_multilingual(search_request)
        assert search_results is not None
        assert "results" in search_results
        
        print("✅ Complete localization workflow test passed!")

# Performance and Load Tests
class TestPerformance:
    """Test performance with larger datasets"""
    
    @pytest.mark.asyncio
    async def test_bulk_translation_performance(self, localization_service, sample_language_config):
        """Test performance with bulk translations"""
        # Create language
        language = await localization_service.create_language_configuration(sample_language_config)
        
        # Create bulk translations (100 translations)
        from schemas_localization import TranslationBulkCreate, TranslationBase
        
        translations = []
        for i in range(100):
            translations.append(TranslationBase(
                translation_key=f"test.key_{i}",
                context="test",
                namespace="performance",
                original_text=f"Test text {i}",
                translated_text=f"متن آزمایشی {i}",
                is_approved=True
            ))
        
        bulk_data = TranslationBulkCreate(
            language_id=language.id,
            translations=translations
        )
        
        # Measure time
        import time
        start_time = time.time()
        
        result = await localization_service.bulk_create_translations(bulk_data)
        
        end_time = time.time()
        duration = end_time - start_time
        
        assert result["created_count"] == 100
        assert result["error_count"] == 0
        assert duration < 10  # Should complete within 10 seconds
        
        print(f"✅ Bulk translation performance test: {duration:.2f} seconds for 100 translations")

if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v", "--tb=short"])