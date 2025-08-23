"""
Report Engine Service for Advanced Analytics & Business Intelligence

This service provides dynamic report generation capabilities with:
- Dynamic query generation from report configurations
- Data source configuration and field mapping
- Filter and aggregation processing with SQL optimization
- Multi-format export support (PDF, Excel, CSV)
- Report scheduling and automation
"""

from typing import Dict, List, Any, Optional, Union
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import text, func, and_, or_, desc, asc, case
from sqlalchemy.sql import select
import pandas as pd
import json
import uuid
from decimal import Decimal
import logging

from database import get_db
import models
from schemas import User

logger = logging.getLogger(__name__)

class ReportEngineService:
    """
    Advanced report engine service for dynamic report generation
    """
    
    def __init__(self, db_session: Session):
        self.db = db_session
        self.supported_data_sources = {
            'invoices': models.Invoice,
            'customers': models.Customer,
            'inventory_items': models.InventoryItem,
            'categories': models.Category,
            'invoice_items': models.InvoiceItem,
            'payments': models.Payment,
            'accounting_entries': models.AccountingEntry,
            'analytics_data': models.AnalyticsData,
            'kpi_targets': models.KPITarget
        }
        
        self.supported_aggregations = {
            'sum': func.sum,
            'count': func.count,
            'avg': func.avg,
            'min': func.min,
            'max': func.max,
            'count_distinct': func.count().distinct()
        }
        
        self.supported_filters = {
            'equals': '=',
            'not_equals': '!=',
            'greater_than': '>',
            'less_than': '<',
            'greater_equal': '>=',
            'less_equal': '<=',
            'contains': 'ILIKE',
            'starts_with': 'ILIKE',
            'ends_with': 'ILIKE',
            'in': 'IN',
            'not_in': 'NOT IN',
            'between': 'BETWEEN',
            'is_null': 'IS NULL',
            'is_not_null': 'IS NOT NULL'
        }

    async def build_custom_report(self, report_config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Build a custom report based on configuration
        
        Args:
            report_config: Report configuration dictionary
            
        Returns:
            Dictionary containing report data and metadata
        """
        try:
            logger.info(f"Building custom report: {report_config.get('name', 'Unnamed')}")
            
            # Validate report configuration
            self._validate_report_config(report_config)
            
            # Build the base query
            query = self._build_base_query(report_config)
            
            # Apply filters
            query = self._apply_filters(query, report_config.get('filters', []))
            
            # Apply grouping and aggregations
            query = self._apply_grouping_and_aggregations(query, report_config)
            
            # Apply sorting
            query = self._apply_sorting(query, report_config.get('sorting', []))
            
            # Execute query and get results
            results = query.all()
            
            # Process results into report format
            report_data = self._process_query_results(results, report_config)
            
            # Generate summary statistics
            summary = self._generate_report_summary(report_data, report_config)
            
            return {
                'report_id': str(uuid.uuid4()),
                'name': report_config.get('name', 'Custom Report'),
                'description': report_config.get('description', ''),
                'generated_at': datetime.now().isoformat(),
                'data_sources': report_config.get('data_sources', []),
                'total_records': len(report_data),
                'summary': summary,
                'data': report_data,
                'metadata': {
                    'filters_applied': len(report_config.get('filters', [])),
                    'fields_selected': len(report_config.get('fields', [])),
                    'aggregations_used': len(report_config.get('aggregations', []))
                }
            }
            
        except Exception as e:
            logger.error(f"Error building custom report: {str(e)}")
            raise Exception(f"Failed to build custom report: {str(e)}")

    def _validate_report_config(self, config: Dict[str, Any]) -> None:
        """Validate report configuration"""
        required_fields = ['data_sources', 'fields']
        
        for field in required_fields:
            if field not in config:
                raise ValueError(f"Missing required field: {field}")
        
        # Validate data sources
        for data_source in config['data_sources']:
            source_name = data_source.get('name')
            if source_name not in self.supported_data_sources:
                raise ValueError(f"Unsupported data source: {source_name}")

    def _build_base_query(self, config: Dict[str, Any]):
        """Build the base query from data sources and joins"""
        data_sources = config['data_sources']
        
        if not data_sources:
            raise ValueError("At least one data source is required")
        
        # Start with the primary data source
        primary_source = data_sources[0]
        primary_model = self.supported_data_sources[primary_source['name']]
        
        query = self.db.query(primary_model)
        
        # Add joins for additional data sources
        for i, source in enumerate(data_sources[1:], 1):
            source_model = self.supported_data_sources[source['name']]
            join_config = source.get('join', {})
            
            if join_config:
                # Apply join based on configuration
                join_type = join_config.get('type', 'inner')
                join_condition = self._build_join_condition(
                    primary_model, source_model, join_config
                )
                
                if join_type == 'left':
                    query = query.outerjoin(source_model, join_condition)
                elif join_type == 'right':
                    query = query.join(source_model, join_condition, isouter=True)
                else:  # inner join
                    query = query.join(source_model, join_condition)
        
        return query

    def _build_join_condition(self, primary_model, secondary_model, join_config):
        """Build join condition based on configuration"""
        primary_field = join_config.get('primary_field')
        secondary_field = join_config.get('secondary_field')
        
        if not primary_field or not secondary_field:
            # Try to infer common join patterns
            if hasattr(primary_model, 'id') and hasattr(secondary_model, f"{primary_model.__tablename__[:-1]}_id"):
                return primary_model.id == getattr(secondary_model, f"{primary_model.__tablename__[:-1]}_id")
            elif hasattr(secondary_model, 'id') and hasattr(primary_model, f"{secondary_model.__tablename__[:-1]}_id"):
                return getattr(primary_model, f"{secondary_model.__tablename__[:-1]}_id") == secondary_model.id
        
        primary_attr = getattr(primary_model, primary_field)
        secondary_attr = getattr(secondary_model, secondary_field)
        
        return primary_attr == secondary_attr

    def _apply_filters(self, query, filters: List[Dict[str, Any]]):
        """Apply filters to the query"""
        for filter_config in filters:
            field = filter_config.get('field')
            operator = filter_config.get('operator')
            value = filter_config.get('value')
            
            if not all([field, operator]):
                continue
            
            # Parse field to get model and attribute
            model_attr = self._parse_field_reference(field)
            
            if operator == 'equals':
                query = query.filter(model_attr == value)
            elif operator == 'not_equals':
                query = query.filter(model_attr != value)
            elif operator == 'greater_than':
                query = query.filter(model_attr > value)
            elif operator == 'less_than':
                query = query.filter(model_attr < value)
            elif operator == 'greater_equal':
                query = query.filter(model_attr >= value)
            elif operator == 'less_equal':
                query = query.filter(model_attr <= value)
            elif operator == 'contains':
                query = query.filter(model_attr.ilike(f'%{value}%'))
            elif operator == 'starts_with':
                query = query.filter(model_attr.ilike(f'{value}%'))
            elif operator == 'ends_with':
                query = query.filter(model_attr.ilike(f'%{value}'))
            elif operator == 'in':
                query = query.filter(model_attr.in_(value))
            elif operator == 'not_in':
                query = query.filter(~model_attr.in_(value))
            elif operator == 'between':
                if isinstance(value, list) and len(value) == 2:
                    query = query.filter(model_attr.between(value[0], value[1]))
            elif operator == 'is_null':
                query = query.filter(model_attr.is_(None))
            elif operator == 'is_not_null':
                query = query.filter(model_attr.isnot(None))
        
        return query

    def _apply_grouping_and_aggregations(self, query, config: Dict[str, Any]):
        """Apply grouping and aggregations to the query"""
        fields = config.get('fields', [])
        aggregations = config.get('aggregations', [])
        group_by = config.get('group_by', [])
        
        # Build select fields
        select_fields = []
        
        # Add regular fields
        for field in fields:
            if isinstance(field, str):
                model_attr = self._parse_field_reference(field)
                select_fields.append(model_attr.label(field.split('.')[-1]))
            elif isinstance(field, dict):
                field_name = field.get('name')
                alias = field.get('alias', field_name)
                model_attr = self._parse_field_reference(field_name)
                select_fields.append(model_attr.label(alias))
        
        # Add aggregation fields
        for agg in aggregations:
            field_name = agg.get('field')
            agg_type = agg.get('type')
            alias = agg.get('alias', f"{agg_type}_{field_name}")
            
            if agg_type in self.supported_aggregations:
                model_attr = self._parse_field_reference(field_name)
                agg_func = self.supported_aggregations[agg_type]
                
                if agg_type == 'count_distinct':
                    select_fields.append(func.count(model_attr.distinct()).label(alias))
                else:
                    select_fields.append(agg_func(model_attr).label(alias))
        
        # Apply select fields to query
        if select_fields:
            query = query.with_entities(*select_fields)
        
        # Apply grouping
        if group_by:
            group_fields = []
            for group_field in group_by:
                model_attr = self._parse_field_reference(group_field)
                group_fields.append(model_attr)
            query = query.group_by(*group_fields)
        
        return query

    def _apply_sorting(self, query, sorting: List[Dict[str, Any]]):
        """Apply sorting to the query"""
        for sort_config in sorting:
            field = sort_config.get('field')
            direction = sort_config.get('direction', 'asc')
            
            if field:
                model_attr = self._parse_field_reference(field)
                if direction.lower() == 'desc':
                    query = query.order_by(desc(model_attr))
                else:
                    query = query.order_by(asc(model_attr))
        
        return query

    def _parse_field_reference(self, field_ref: str):
        """Parse field reference like 'invoices.total_amount' to model attribute"""
        parts = field_ref.split('.')
        
        if len(parts) == 2:
            model_name, field_name = parts
            if model_name in self.supported_data_sources:
                model = self.supported_data_sources[model_name]
                return getattr(model, field_name)
        
        # If no model specified, try to find in available models
        # This is a simplified approach - in production, you'd want more robust field resolution
        for model in self.supported_data_sources.values():
            if hasattr(model, field_ref):
                return getattr(model, field_ref)
        
        raise ValueError(f"Field reference '{field_ref}' could not be resolved")

    def _process_query_results(self, results, config: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Process query results into report format"""
        processed_data = []
        
        for row in results:
            row_data = {}
            
            # Handle different result formats
            if hasattr(row, '_asdict'):
                # Named tuple from query with labels
                row_data = row._asdict()
            elif hasattr(row, '__dict__'):
                # SQLAlchemy model instance
                row_data = {
                    key: self._serialize_value(value) 
                    for key, value in row.__dict__.items() 
                    if not key.startswith('_')
                }
            else:
                # Tuple or other format
                fields = config.get('fields', [])
                for i, value in enumerate(row):
                    field_name = fields[i] if i < len(fields) else f'field_{i}'
                    row_data[field_name] = self._serialize_value(value)
            
            processed_data.append(row_data)
        
        return processed_data

    def _serialize_value(self, value) -> Any:
        """Serialize values for JSON compatibility"""
        if isinstance(value, Decimal):
            return float(value)
        elif isinstance(value, (date, datetime)):
            return value.isoformat()
        elif isinstance(value, uuid.UUID):
            return str(value)
        else:
            return value

    def _generate_report_summary(self, data: List[Dict[str, Any]], config: Dict[str, Any]) -> Dict[str, Any]:
        """Generate summary statistics for the report"""
        if not data:
            return {'total_records': 0}
        
        summary = {
            'total_records': len(data),
            'generated_at': datetime.now().isoformat()
        }
        
        # Calculate basic statistics for numeric fields
        numeric_fields = []
        for row in data[:1]:  # Check first row for numeric fields
            for key, value in row.items():
                if isinstance(value, (int, float)):
                    numeric_fields.append(key)
        
        for field in numeric_fields:
            values = [row.get(field, 0) for row in data if row.get(field) is not None]
            if values:
                summary[f'{field}_sum'] = sum(values)
                summary[f'{field}_avg'] = sum(values) / len(values)
                summary[f'{field}_min'] = min(values)
                summary[f'{field}_max'] = max(values)
        
        return summary

    async def get_available_data_sources(self) -> Dict[str, Any]:
        """Get available data sources and their fields"""
        data_sources = {}
        
        for source_name, model in self.supported_data_sources.items():
            fields = []
            
            # Get model columns
            if hasattr(model, '__table__'):
                for column in model.__table__.columns:
                    fields.append({
                        'name': column.name,
                        'type': str(column.type),
                        'nullable': column.nullable,
                        'primary_key': column.primary_key
                    })
            
            data_sources[source_name] = {
                'name': source_name,
                'table_name': model.__tablename__ if hasattr(model, '__tablename__') else source_name,
                'fields': fields,
                'relationships': self._get_model_relationships(model)
            }
        
        return data_sources

    def _get_model_relationships(self, model) -> List[Dict[str, Any]]:
        """Get model relationships for join suggestions"""
        relationships = []
        
        if hasattr(model, '__mapper__'):
            for rel in model.__mapper__.relationships:
                relationships.append({
                    'name': rel.key,
                    'target_model': rel.mapper.class_.__name__,
                    'type': 'one_to_many' if rel.uselist else 'many_to_one'
                })
        
        return relationships

    async def validate_report_config(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Validate a report configuration and return validation results"""
        validation_result = {
            'valid': True,
            'errors': [],
            'warnings': []
        }
        
        try:
            self._validate_report_config(config)
        except ValueError as e:
            validation_result['valid'] = False
            validation_result['errors'].append(str(e))
        
        # Additional validation checks
        if 'fields' in config and not config['fields']:
            validation_result['warnings'].append('No fields specified - report may be empty')
        
        if 'filters' in config:
            for i, filter_config in enumerate(config['filters']):
                if 'field' not in filter_config:
                    validation_result['errors'].append(f'Filter {i+1}: Missing field specification')
                if 'operator' not in filter_config:
                    validation_result['errors'].append(f'Filter {i+1}: Missing operator specification')
        
        if validation_result['errors']:
            validation_result['valid'] = False
        
        return validation_result