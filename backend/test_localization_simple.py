"""
Simple Unit Tests for Enhanced Multi-Language and Localization Backend

This is a simplified test suite to verify basic localization functionality
using real PostgreSQL database in Docker environment.
"""

import pytest
import asyncio
from datetime import datetime
from decimal import Decimal
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient
import uuid

from main import app
from database import get_db, engine
from models_localization import LanguageConfiguration, Translation, CurrencyConfiguration
from services.localization_service import LocalizationService
from schemas_localization_simple import (
    LanguageConfigurationCreate, TranslationCreate, CurrencyConfigurationCreate,
    NumberFormatRequest, DateFormatRequest
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

class TestBasicLocalization:
    """Test basic localization functionality"""
    
    @pytest.mark.asyncio
    async def test_create_language_configuration(self, localization_service):
        """Test creating a basic language configuration"""
        language_data = LanguageConfigurationCreate(
            language_code="fa",
            language_name="Persian",
            native_name="فارسی",
            text_direction="rtl",
            is_rtl=True,
            locale_code="fa-IR",
            country_code="IR",
            is_active=True,
            is_default=False
        )
        
        result = await localization_service.create_language_configuration(language_data)
        
        assert result is not None
        assert result.language_code == "fa"
        assert result.language_name == "Persian"
        assert result.is_rtl == True
        print("✅ Language configuration creation test passed")
    
    @pytest.mark.asyncio
    async def test_create_translation(self, localization_service):
        """Test creating a basic translation"""
        # First create a language
        language_data = LanguageConfigurationCreate(
            language_code="ar",
            language_name="Arabic",
            native_name="العربية",
            text_direction="rtl",
            is_rtl=True,
            is_active=True
        )
        
        language = await localization_service.create_language_configuration(language_data)
        
        # Create translation
        translation_data = TranslationCreate(
            language_id=language.id,
            translation_key="welcome.message",
            context="greeting",
            namespace="ui",
            original_text="Welcome",
            translated_text="مرحبا",
            is_approved=True
        )
        
        result = await localization_service.create_translation(translation_data)
        
        assert result is not None
        assert result.translation_key == "welcome.message"
        assert result.translated_text == "مرحبا"
        assert result.is_approved == True
        print("✅ Translation creation test passed")
    
    @pytest.mark.asyncio
    async def test_create_currency_configuration(self, localization_service):
        """Test creating a basic currency configuration"""
        currency_data = CurrencyConfigurationCreate(
            currency_code="AED",
            currency_name="UAE Dirham",
            currency_symbol="د.إ",
            decimal_places=2,
            symbol_position="before",
            exchange_rate=Decimal("3.67"),
            is_active=True
        )
        
        result = await localization_service.create_currency_configuration(currency_data)
        
        assert result is not None
        assert result.currency_code == "AED"
        assert result.currency_name == "UAE Dirham"
        assert result.currency_symbol == "د.إ"
        print("✅ Currency configuration creation test passed")
    
    @pytest.mark.asyncio
    async def test_format_number(self, localization_service):
        """Test number formatting"""
        # Create a language first
        language_data = LanguageConfigurationCreate(
            language_code="en",
            language_name="English",
            native_name="English",
            text_direction="ltr",
            is_rtl=False,
            locale_code="en-US",
            is_active=True
        )
        
        await localization_service.create_language_configuration(language_data)
        
        # Format number
        format_request = NumberFormatRequest(
            number=1234.56,
            language_code="en",
            format_type="decimal"
        )
        
        result = await localization_service.format_number(format_request)
        
        assert "formatted_value" in result
        assert result["language_code"] == "en"
        print("✅ Number formatting test passed")
    
    @pytest.mark.asyncio
    async def test_format_date(self, localization_service):
        """Test date formatting"""
        # Create a language first
        language_data = LanguageConfigurationCreate(
            language_code="fr",
            language_name="French",
            native_name="Français",
            text_direction="ltr",
            is_rtl=False,
            locale_code="fr-FR",
            is_active=True
        )
        
        await localization_service.create_language_configuration(language_data)
        
        # Format date
        format_request = DateFormatRequest(
            date=datetime(2024, 3, 15),
            language_code="fr"
        )
        
        result = await localization_service.format_date(format_request)
        
        assert "formatted_value" in result
        assert result["language_code"] == "fr"
        print("✅ Date formatting test passed")

class TestAPIEndpoints:
    """Test basic API endpoints"""
    
    def test_health_check(self):
        """Test localization service health check"""
        response = client.get("/api/localization/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "localization"
        print("✅ Health check test passed")
    
    def test_supported_languages(self):
        """Test getting supported languages"""
        response = client.get("/api/localization/supported-languages")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        print("✅ Supported languages test passed")
    
    def test_supported_currencies(self):
        """Test getting supported currencies"""
        response = client.get("/api/localization/supported-currencies")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        print("✅ Supported currencies test passed")
    
    def test_rtl_languages(self):
        """Test getting RTL languages"""
        response = client.get("/api/localization/rtl-languages")
        assert response.status_code == 200
        
        data = response.json()
        assert "rtl_languages" in data
        assert "ar" in data["rtl_languages"]
        assert "fa" in data["rtl_languages"]
        print("✅ RTL languages test passed")

class TestRTLSupport:
    """Test RTL (Right-to-Left) language support"""
    
    @pytest.mark.asyncio
    async def test_persian_rtl_configuration(self, localization_service):
        """Test Persian RTL language configuration"""
        language_data = LanguageConfigurationCreate(
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
            is_active=True
        )
        
        result = await localization_service.create_language_configuration(language_data)
        
        assert result.is_rtl == True
        assert result.text_direction == "rtl"
        assert result.locale_code == "fa-IR"
        print("✅ Persian RTL configuration test passed")
    
    @pytest.mark.asyncio
    async def test_arabic_rtl_configuration(self, localization_service):
        """Test Arabic RTL language configuration"""
        language_data = LanguageConfigurationCreate(
            language_code="ar",
            language_name="Arabic",
            native_name="العربية",
            text_direction="rtl",
            is_rtl=True,
            locale_code="ar-SA",
            country_code="SA",
            is_active=True
        )
        
        result = await localization_service.create_language_configuration(language_data)
        
        assert result.is_rtl == True
        assert result.text_direction == "rtl"
        assert result.locale_code == "ar-SA"
        print("✅ Arabic RTL configuration test passed")

class TestMultiCurrencySupport:
    """Test multi-currency support"""
    
    @pytest.mark.asyncio
    async def test_multiple_currencies(self, localization_service):
        """Test creating multiple currency configurations"""
        currencies = [
            {
                "currency_code": "USD",
                "currency_name": "US Dollar",
                "currency_symbol": "$",
                "decimal_places": 2,
                "symbol_position": "before",
                "exchange_rate": Decimal("1.0"),
                "is_default": True
            },
            {
                "currency_code": "EUR",
                "currency_name": "Euro",
                "currency_symbol": "€",
                "decimal_places": 2,
                "symbol_position": "before",
                "exchange_rate": Decimal("0.85")
            },
            {
                "currency_code": "IRR",
                "currency_name": "Iranian Rial",
                "currency_symbol": "ریال",
                "decimal_places": 0,
                "symbol_position": "after",
                "exchange_rate": Decimal("42000.0")
            }
        ]
        
        created_currencies = []
        for currency_data in currencies:
            currency_config = CurrencyConfigurationCreate(**currency_data)
            result = await localization_service.create_currency_configuration(currency_config)
            created_currencies.append(result)
            assert result is not None
            assert result.currency_code == currency_data["currency_code"]
        
        assert len(created_currencies) == 3
        print("✅ Multiple currencies test passed")

if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v", "--tb=short"])