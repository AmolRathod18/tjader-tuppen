from fastapi import APIRouter, Depends, HTTPException
import httpx

from ..auth import require_admin
from ..schemas import TranslationRequest


router = APIRouter(prefix="/api", dependencies=[Depends(require_admin)], tags=["Translation"])


def translate_with_libretranslate(client: httpx.Client, text: str) -> str:
    response = client.post(
        "https://translate.astian.org/translate",
        data={"q": text, "source": "en", "target": "sv", "format": "text"},
    )
    response.raise_for_status()
    translated = response.json().get("translatedText")
    if not translated:
        raise ValueError("LibreTranslate returned no translation")
    return str(translated)


def translate_with_mymemory(client: httpx.Client, text: str) -> str:
    response = client.get(
        "https://api.mymemory.translated.net/get",
        params={"q": text, "langpair": "en|sv"},
    )
    response.raise_for_status()
    translated = response.json().get("responseData", {}).get("translatedText")
    if not translated:
        raise ValueError("MyMemory returned no translation")
    return str(translated)


@router.post("/translate-to-swedish")
def translate_to_swedish(request: TranslationRequest):
    translations = []
    failures = []
    with httpx.Client(timeout=20) as client:
        for text in request.texts:
            translated = None
            for provider in (translate_with_libretranslate, translate_with_mymemory):
                try:
                    translated = provider(client, text)
                    break
                except (httpx.HTTPError, ValueError):
                    continue
            if translated is None:
                failures.append(text)
                translations.append(text)
            else:
                translations.append(translated)

    if failures and len(failures) == len(request.texts):
        raise HTTPException(502, "Free Swedish translation services are unavailable")
    return {"translations": translations}