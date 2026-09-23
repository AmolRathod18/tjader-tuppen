import json

from fastapi import APIRouter, Depends, HTTPException
from openai import OpenAI

from ..auth import require_admin
from ..config import get_settings
from ..schemas import TranslationRequest


router = APIRouter(prefix="/api", dependencies=[Depends(require_admin)], tags=["Translation"])


@router.post("/translate-to-swedish")
def translate_to_swedish(request: TranslationRequest):
    settings = get_settings()
    if not settings.openai_api_key:
        raise HTTPException(503, "Swedish translation is not configured on the backend")

    client = OpenAI(api_key=settings.openai_api_key)
    response = client.chat.completions.create(
        model=settings.openai_model,
        temperature=0,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "Translate each work or travel description into natural Swedish. "
                    "Preserve names, numbers, codes, and line meaning. Return JSON only "
                    "with a translations array in the same order as the input."
                ),
            },
            {"role": "user", "content": json.dumps({"texts": request.texts}, ensure_ascii=False)},
        ],
    )

    try:
        result = json.loads(response.choices[0].message.content or "{}")
        translations = result["translations"]
    except (KeyError, TypeError, json.JSONDecodeError) as error:
        raise HTTPException(502, "Translation service returned an invalid response") from error

    if not isinstance(translations, list) or len(translations) != len(request.texts):
        raise HTTPException(502, "Translation service returned an incomplete response")
    return {"translations": [str(value) for value in translations]}