import array
import io
import os
import shutil
import subprocess
import tempfile
import wave

from fastapi import HTTPException

from app.config import get_settings
from app.schemas import PronunciationResult, WordError

_VALID_ERROR_TYPES = {"None", "Omission", "Insertion", "Mispronunciation"}


def _detect_audio_format(audio_bytes: bytes) -> str:
    if audio_bytes.startswith(b"RIFF") and audio_bytes[8:12] == b"WAVE":
        return "wav"
    if audio_bytes.startswith(b"ID3") or audio_bytes[:2] == b"\xff\xfb":
        return "mp3"
    if b"ftyp" in audio_bytes[:16]:
        return "mp4"
    if audio_bytes.startswith(b"\x1a\x45\xdf\xa3"):
        return "webm"
    return "unknown"


def _convert_to_wav_pcm(audio_bytes: bytes, audio_format: str, ffmpeg_binary: str) -> bytes:
    ffmpeg_path = shutil.which(ffmpeg_binary)
    if ffmpeg_path is None:
        raise HTTPException(
            status_code=415,
            detail=(
                "Compressed audio requires ffmpeg conversion before Azure pronunciation assessment. "
                f"Received {audio_format}, but ffmpeg was not found."
            ),
        )

    try:
        result = subprocess.run(
            [
                ffmpeg_path,
                "-hide_banner",
                "-loglevel",
                "error",
                "-i",
                "pipe:0",
                "-ac",
                "1",
                "-ar",
                "16000",
                "-acodec",
                "pcm_s16le",
                "-f",
                "wav",
                "pipe:1",
            ],
            input=audio_bytes,
            capture_output=True,
            check=True,
            timeout=20,
        )
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as exc:
        raise HTTPException(
            status_code=415,
            detail=f"Audio conversion to WAV failed for {audio_format} input.",
        ) from exc

    if not result.stdout.startswith(b"RIFF") or result.stdout[8:12] != b"WAVE":
        raise HTTPException(status_code=415, detail="Audio conversion did not produce a valid WAV file.")
    return result.stdout


def _prepare_wav_audio(audio_bytes: bytes, ffmpeg_binary: str) -> bytes:
    audio_format = _detect_audio_format(audio_bytes)
    if audio_format == "wav":
        return audio_bytes
    return _convert_to_wav_pcm(audio_bytes, audio_format, ffmpeg_binary)


def _inspect_wav_audio(audio_bytes: bytes) -> tuple[float, float]:
    try:
        with wave.open(io.BytesIO(audio_bytes), "rb") as wav:
            sample_width = wav.getsampwidth()
            frame_rate = wav.getframerate()
            frame_count = wav.getnframes()
            frames = wav.readframes(frame_count)
    except wave.Error as exc:
        raise HTTPException(status_code=415, detail="WAV 파일을 분석할 수 없습니다.") from exc

    if frame_rate <= 0:
        raise HTTPException(status_code=415, detail="WAV 샘플레이트가 올바르지 않습니다.")

    duration_sec = frame_count / frame_rate
    if sample_width != 2 or not frames:
        return duration_sec, 0.0

    samples = array.array("h")
    samples.frombytes(frames)
    if not samples:
        return duration_sec, 0.0

    rms = (sum(sample * sample for sample in samples) / len(samples)) ** 0.5
    return duration_sec, rms


def _validate_recording_for_speech(audio_bytes: bytes) -> None:
    duration_sec, rms = _inspect_wav_audio(audio_bytes)
    print(f"pronunciation_audio_check duration_sec={duration_sec:.2f} rms={rms:.2f}")
    if duration_sec < 1.0:
        raise HTTPException(
            status_code=422,
            detail=f"녹음이 너무 짧습니다. 2초 이상 또렷하게 말해 주세요. duration={duration_sec:.1f}s",
        )
    if rms < 20:
        raise HTTPException(
            status_code=422,
            detail=f"녹음 음량이 너무 작거나 음성이 없습니다. 마이크에 가까이 대고 다시 말해 주세요. volume={rms:.1f}",
        )


def assess_pronunciation(audio_bytes: bytes, reference_text: str) -> PronunciationResult:
    settings = get_settings()

    if not settings.azure_speech_key:
        return _mock_result(reference_text)

    audio_bytes = _prepare_wav_audio(audio_bytes, settings.ffmpeg_binary)
    _validate_recording_for_speech(audio_bytes)

    try:
        import azure.cognitiveservices.speech as speechsdk
    except ImportError:
        raise HTTPException(status_code=503, detail="azure-cognitiveservices-speech 패키지가 설치되지 않았습니다.")

    speech_config = speechsdk.SpeechConfig(
        subscription=settings.azure_speech_key,
        region=settings.azure_speech_region,
    )
    speech_config.speech_recognition_language = "en-US"

    pronunciation_config = speechsdk.PronunciationAssessmentConfig(
        reference_text=reference_text,
        grading_system=speechsdk.PronunciationAssessmentGradingSystem.HundredMark,
        granularity=speechsdk.PronunciationAssessmentGranularity.Phoneme,
        enable_miscue=True,
    )
    pronunciation_config.enable_prosody_assessment()

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        audio_config = speechsdk.audio.AudioConfig(filename=tmp_path)
        recognizer = speechsdk.SpeechRecognizer(
            speech_config=speech_config,
            language="en-US",
            audio_config=audio_config,
        )
        pronunciation_config.apply_to(recognizer)

        result = recognizer.recognize_once()
    finally:
        if tmp_path:
            os.unlink(tmp_path)

    if result.reason == speechsdk.ResultReason.NoMatch:
        raise HTTPException(status_code=422, detail="Azure Speech 인식 실패: 음성이 감지되지 않았습니다.")

    if result.reason == speechsdk.ResultReason.Canceled:
        cancellation = speechsdk.CancellationDetails(result)
        reason = getattr(cancellation, "reason", "unknown")
        error_details = getattr(cancellation, "error_details", "") or "no error details"
        raise HTTPException(
            status_code=503,
            detail=f"Azure Speech 인식 취소: {reason}. {error_details}",
        )

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
