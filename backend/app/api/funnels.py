from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.models.pydantic_models import CreateFunnelDefinitionRequest, RunFunnelRequest
from app.db.models import FunnelDefinitionDB
from app.storage.funnel_definitions import (
    save_funnel_definition,
    list_funnel_definitions,
    get_funnel_definition
)
from app.analytics.funnel import run_funnel_for_steps
from app.db.deps import get_db

router = APIRouter(prefix="/analytics/definitions/funnel", tags=["funnels"])


@router.post("")
def create_funnel_definition_endpoint(
    request: CreateFunnelDefinitionRequest,
    db: Session = Depends(get_db)
):
    if not request.steps:
        raise HTTPException(status_code=400, detail="Funnel must have at least one step")

    definition = FunnelDefinitionDB(
        api_key=request.api_key,
        name=request.name,
        steps=request.steps
    )

    return save_funnel_definition(db, definition)


@router.post("/{definition_id}/run")
def run_funnel_definition(
    definition_id: str,
    request: RunFunnelRequest,
    db: Session = Depends(get_db)
):
    definition = get_funnel_definition(
        db,
        request.api_key,
        definition_id
    )

    if not definition:
        raise HTTPException(status_code=404, detail="Definition not found")

    result = run_funnel_for_steps(definition.steps, db, api_key=request.api_key)

    return {
        "definition_id": definition.id,
        "name": definition.name,
        **result
    }


@router.get("")
def list_funnel_definitions_endpoint(api_key: str, db: Session = Depends(get_db)):
    return list_funnel_definitions(db, api_key)


@router.get("/{definition_id}")
def get_funnel_definition_endpoint(
    definition_id: str,
    api_key: str,
    db: Session = Depends(get_db)
):
    definition = get_funnel_definition(db, api_key, definition_id)
    if not definition:
        return {"error": "Definition not found"}
    return definition

