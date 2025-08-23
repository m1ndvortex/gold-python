"""
Analytics Background Tasks Package

This package contains Celery tasks for heavy analytics processing:
- KPI calculations and snapshot generation
- Demand forecasting and model training
- Report generation and scheduling

Requirements covered: 1.4, 3.4, 4.4
"""

from .kpi_tasks import *
from .forecasting_tasks import *
from .report_tasks import *