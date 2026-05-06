"""
Custom JSON parser that converts camelCase keys from the frontend
back to snake_case for Django processing.
"""
import re
from rest_framework.parsers import JSONParser
import json


def camel_to_snake(name):
    """Convert camelCase to snake_case."""
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()


def convert_keys_to_snake(data):
    """Recursively convert all dictionary keys from camelCase to snake_case."""
    if isinstance(data, dict):
        return {camel_to_snake(k): convert_keys_to_snake(v) for k, v in data.items()}
    elif isinstance(data, (list, tuple)):
        return [convert_keys_to_snake(item) for item in data]
    return data


class CamelCaseJSONParser(JSONParser):
    """Parses JSON with camelCase keys and converts them to snake_case."""

    def parse(self, stream, media_type=None, parser_context=None):
        data = super().parse(stream, media_type, parser_context)
        return convert_keys_to_snake(data)
