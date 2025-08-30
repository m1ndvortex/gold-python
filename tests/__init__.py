"""
Test package initialization
"""
import sys
import os

# Add the backend directory to Python path
backend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)