import pytest
from app.sarvam_engine import sarvam_engine

def test_sarvam_live_tts():
    """Test live Sarvam AI Text-to-Speech (bulbul:v2) synthesis."""
    res = sarvam_engine.text_to_speech(
        text="आपकी जन शिकायत याचिका CPGRAMS पोर्टल पर सफलतापूर्वक पंजीकृत कर ली गई है।",
        target_language_code="hi-IN"
    )
    print("\n[SARVAM LIVE TTS RES]:", res["engine"], "Audio Base64 len:", len(res["audio_base64"]))
    assert res["engine"] == "Sarvam AI (bulbul:v2)"
    assert len(res["audio_base64"]) > 1000

def test_sarvam_live_stt():
    """Test Sarvam AI Speech-to-Text transcription fallback."""
    dummy_wav = b"RIFF....WAVEfmt ....data...."
    res = sarvam_engine.transcribe_audio(dummy_wav, language_code="hi-IN")
    print("\n[SARVAM LIVE STT RES]:", res["engine"], "Transcript:", res["transcript"])
    assert res["transcript"] != ""

if __name__ == "__main__":
    test_sarvam_live_tts()
    test_sarvam_live_stt()
    print("SARVAM LIVE TEST PASSED!")
