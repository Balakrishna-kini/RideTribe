"""
Custom JSON renderer that converts snake_case keys to camelCase.
This allows the backend to use Django's snake_case convention while
the React frontend receives camelCase field names.
"""
import re
from rest_framework.renderers import JSONRenderer
import json


def snake_to_camel(name):
    """Convert snake_case to camelCase."""
    components = name.split('_')
    return components[0] + ''.join(x.title() for x in components[1:])


def convert_keys_to_camel(data):
    """Recursively convert all dictionary keys from snake_case to camelCase."""
    if isinstance(data, dict):
        return {snake_to_camel(k): convert_keys_to_camel(v) for k, v in data.items()}
    elif isinstance(data, (list, tuple)):
        return [convert_keys_to_camel(item) for item in data]
    return data


class CamelCaseJSONRenderer(JSONRenderer):
    """Renders JSON with camelCase keys instead of snake_case."""

    def render(self, data, accepted_media_type=None, renderer_context=None):
        if data is not None:
            data = convert_keys_to_camel(data)
        return super().render(data, accepted_media_type, renderer_context)
