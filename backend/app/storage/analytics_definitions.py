from typing import Dict, List, Optional
from app.models.analytics import FunnelDefinition

# In-memory store: api_key -> list of definitions
_funnel_definitions: Dict[str, List[FunnelDefinition]] = {}


def save_funnel_definition(definition: FunnelDefinition) -> None:
    if definition.api_key not in _funnel_definitions:
        _funnel_definitions[definition.api_key] = []
    _funnel_definitions[definition.api_key].append(definition)


def list_funnel_definitions(api_key: str) -> List[FunnelDefinition]:
    return _funnel_definitions.get(api_key, [])


def get_funnel_definition(
    api_key: str,
    definition_id: str
) -> Optional[FunnelDefinition]:
    definitions = _funnel_definitions.get(api_key, [])
    for definition in definitions:
        if definition.id == definition_id:
            return definition
    return None
