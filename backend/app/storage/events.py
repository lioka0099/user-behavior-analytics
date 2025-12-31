from typing import List
from app.models import Event

_EVENTS: List[Event] = []


def save_events(events: List[Event]) -> None:
    _EVENTS.extend(events)


def get_all_events() -> List[Event]:
    return _EVENTS

