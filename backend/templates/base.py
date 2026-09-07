"""
Base Prompt Templating Module for SiteSafe RAG.
"""

from typing import List, Dict, Any, Optional
import re


class MissingTemplateVariableError(Exception):
    """Raised when one or more required template variables are missing during render."""
    pass


class PromptTemplate:
    def __init__(self, template_string: str, required_vars: List[str], optional_vars: Optional[List[str]] = None):
        self.template_string = template_string.strip()
        self.required_vars = required_vars
        self.optional_vars = optional_vars or []

    def render(self, **kwargs: Any) -> str:
        """
        Validates that all required variables are supplied and renders the template string safely.
        Raises MissingTemplateVariableError if any required variable is missing.
        """
        missing_vars = [var for var in self.required_vars if var not in kwargs or kwargs[var] is None]
        if missing_vars:
            raise MissingTemplateVariableError(
                f"Cannot render template. Missing required variable(s): {', '.join(missing_vars)}"
            )

        # Build format dict with defaults for optional vars if not provided
        format_dict = {}
        for var in self.required_vars:
            format_dict[var] = kwargs[var]
        for var in self.optional_vars:
            format_dict[var] = kwargs.get(var, "")

        try:
            return self.template_string.format(**format_dict)
        except KeyError as e:
            raise MissingTemplateVariableError(f"Template formatting key error: missing key {e}")
