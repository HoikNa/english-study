from types import SimpleNamespace

from app.services.openai_tts import _upload_to_supabase


def test_upload_to_supabase_returns_data_url_when_bucket_upload_fails(monkeypatch):
    settings = SimpleNamespace(
        supabase_url="https://example.supabase.co",
        supabase_service_key="service-key",
        supabase_storage_bucket="tts-cache",
    )

    class BrokenBucket:
        def upload(self, **kwargs):
            raise RuntimeError("Bucket not found")

    class BrokenStorage:
        def from_(self, bucket):
            return BrokenBucket()

    class BrokenClient:
        storage = BrokenStorage()

    monkeypatch.setattr("supabase.create_client", lambda url, key: BrokenClient())

    url = _upload_to_supabase("sample.mp3", b"audio-bytes", settings)

    assert url.startswith("data:audio/mpeg;base64,")
