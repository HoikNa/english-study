import os
import tempfile

from fastapi import HTTPException

from app.config import get_settings
from app.schemas import PronunciationResult, WordError

_VALID_ERROR_TYPES = {"None", "Omission", "Insertion", "Mispronunciation"}


def assess_pronunciation(audio_bytes: bytes, reference_text: str) -> PronunciationResult:
    settings = get_settings()

    if not settings.azure_speech_key:
        return _mock_result(reference_text)

    try:
        import azure.cognitiveservices.speech as speechsdk
    except ImportError:
        raise HTTPException(status_code=503, detail="azure-cognitiveservices-speech 패키지가 설치되지 않았습니다.")

    speech_config = speechsdk.SpeechConfig(
        subscription=settings.azure_speech_key,
        region=settings.azure_speech_region,
    )

    pronunciation_config = speechsdk.PronunciationAssessmentConfig(
        reference_text=reference_text,
        grading_system=speechsdk.PronunciationAssessmentGradingSystem.HundredMark,
        granularity=speechsdk.PronunciationAssessmentGranularity.Word,
        enable_miscue=True,
    )

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        audio_config = speechsdk.audio.AudioConfig(filename=tmp_path)
        recognizer = speechsdk.SpeechRecognizer(
            speech_config=speech_config,
            audio_config=audio_config,
        )
        pronunciation_config.apply_to(recognizer)

        result = recognizer.recognize_once()
    finally:
        if tmp_path:
            os.unlink(tmp_path)

    if result.reason != speechsdk.ResultReason.RecognizedSpeech:
        raise HTTPException(status_code=503, detail=f"Azure Speech 인식 실패: {result.reason}")

    pr = speechsdk.PronunciationAssessmentResult(result)

    word_errors = [
        WordError(
            word=w.word,
            accuracy_score=w.accuracy_score or 0.0,
            error_type=w.error_type if w.error_type in _VALID_ERROR_TYPES else "None",
        )
        for w in pr.words
    ]

    pron = pr.pronunciation_score or 0.0
    fluency = pr.fluency_score or 0.0
    prosody = pr.prosody_score or 0.0
    completeness = pr.completeness_score or 0.0
    total = pron * 0.4 + fluency * 0.3 + prosody * 0.2 + completeness * 0.1

    return PronunciationResult(
        pron_score=pron,
        fluency_score=fluency,
        prosody_score=prosody,
        completeness_score=completeness,
        total_score=round(total, 1),
        word_errors=word_errors,
        recognized_text=result.text,
    )


def _mock_result(reference_text: str) -> PronunciationResult:
    words = reference_text.replace(".", "").replace(",", "").split()
    word_errors = [
        WordError(
            word=word,
            accuracy_score=52.0 if word.lower().strip("'") in {"clarify", "acceptance"} else 88.0,
            error_type="Mispronunciation" if word.lower().strip("'") in {"clarify", "acceptance"} else "None",
        )
        for word in words
    ]
    pron, fluency, prosody, completeness = 82.0, 71.0, 68.0, 92.0
    total = pron * 0.4 + fluency * 0.3 + prosody * 0.2 + completeness * 0.1
    return PronunciationResult(
        pron_score=pron,
        fluency_score=fluency,
        prosody_score=prosody,
        completeness_score=completeness,
        total_score=round(total, 1),
        word_errors=word_errors,
        recognized_text=reference_text,
    )
