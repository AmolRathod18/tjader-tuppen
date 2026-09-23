from fastapi import APIRouter, Depends, HTTPException
import httpx

from ..auth import require_admin
from ..schemas import TranslationRequest


router = APIRouter(prefix="/api", dependencies=[Depends(require_admin)], tags=["Translation"])


@router.post("/translate-to-swedish")
def translate_to_swedish(request: TranslationRequest):
    translations = []
    try:
        with httpx.Client(timeout=20) as client:
            for text in request.texts:
                response = client.get(
                    "https://api.mymemory.translated.net/get",
                    params={"q": text, "langpair": "en|sv"},
                )
                response.raise_for_status()
                payload = response.json()
                translated = payload.get("responseData", {}).get("translatedText")
                if not translated:
                    raise HTTPException(502, "Translation service returned no translation")
                translations.append(translated)
    except HTTPException:
        raise
    except (httpx.HTTPError, ValueError) as error:
        raise HTTPException(502, "Free Swedish translation service is unavailable") from error
    return {"translations": translations}