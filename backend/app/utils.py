"""
Utility Functions
Helper functions for validation, error handling, and responses
"""
from flask import jsonify
import re

def validate_request(data, config):
    """
    Validate request data
    Returns error message if invalid, None if valid
    """
    # Required fields validation
    required = ['state', 'season', 'land_area', 'soil_type', 'budget']
    for field in required:
        if field not in data or data[field] is None:
            return f"Missing required field: {field}"

    # State validation
    state = data['state'].lower()
    if state not in config.SUPPORTED_STATES:
        return f"Invalid state. Supported: {', '.join(config.SUPPORTED_STATES)}"

    # Season validation
    season = data['season'].lower()
    if season not in config.SUPPORTED_SEASONS:
        return f"Invalid season. Supported: {', '.join(config.SUPPORTED_SEASONS)}"

    # Land area validation
    try:
        land_area = float(data['land_area'])
        if land_area <= 0 or land_area > 1000:
            return "Land area must be between 0.1 and 1000 acres"
    except (ValueError, TypeError):
        return "Invalid land area value"

    # Budget validation
    try:
        budget = float(data['budget'])
        if budget < 1000 or budget > 100000000:
            return "Budget must be between ₹1,000 and ₹10 crore"
    except (ValueError, TypeError):
        return "Invalid budget value"

    # Soil type validation
    soil = data['soil_type'].lower()
    if soil not in config.SOIL_TYPES:
        return f"Invalid soil type. Supported: {', '.join(config.SOIL_TYPES)}"

    # Optional: Irrigation validation
    if 'irrigation' in data:
        irrigation = data['irrigation'].lower()
        if irrigation not in config.IRRIGATION_TYPES:
            return f"Invalid irrigation. Supported: {', '.join(config.IRRIGATION_TYPES)}"

    # pH validation
    if 'ph' in data:
        try:
            ph = float(data['ph'])
            if ph < 3 or ph > 10:
                return "pH must be between 3 and 10"
        except (ValueError, TypeError):
            return "Invalid pH value"

    return None  # All valid

def error_response(message, status_code=400):
    """Standard error response"""
    return jsonify({
        'status': 'error',
        'message': message,
        'code': status_code
    }), status_code

def success_response(data, message='Success'):
    """Standard success response"""
    return jsonify({
        'status': 'success',
        'message': message,
        'data': data
    }), 200

def validate_pincode(pincode):
    """Validate Indian pincode format"""
    if not pincode:
        return False
    return bool(re.match(r'^[1-9][0-9]{5}$', str(pincode)))

def sanitize_input(text):
    """Sanitize user input"""
    if not isinstance(text, str):
        return text
    # Remove special characters, keep only alphanumeric and basic punctuation
    return re.sub(r'[^\w\s\-.,]', '', text)

def format_currency(amount):
    """Format amount in Indian currency format"""
    if amount >= 10000000:  # 1 crore
        return f"₹{amount/10000000:.2f} Cr"
    elif amount >= 100000:  # 1 lakh
        return f"₹{amount/100000:.2f} L"
    elif amount >= 1000:  # 1 thousand
        return f"₹{amount/1000:.2f} K"
    else:
        return f"₹{amount:.2f}"

def calculate_percentile(value, min_val, max_val):
    """Calculate percentile (0-100)"""
    if max_val == min_val:
        return 50
    percentile = ((value - min_val) / (max_val - min_val)) * 100
    return max(0, min(100, percentile))


def normalize_text(value):
    """Normalize user-provided text for tolerant matching."""
    if value is None:
        return ""
    normalized = str(value).strip().lower()
    return " ".join(normalized.split())
