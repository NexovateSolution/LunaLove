from django.core.files.storage import FileSystemStorage
from django.conf import settings
from io import BytesIO


class EncryptedFileSystemStorage(FileSystemStorage):
    def _save(self, name, content):
        # Lazy import so project can start without cryptography installed
        try:
            from cryptography.fernet import Fernet  # type: ignore
        except Exception as e:  # pragma: no cover
            raise RuntimeError(
                "cryptography package is required for KYC file encryption. Install with 'pip install cryptography'."
            ) from e
        key = settings.KYC_ENCRYPTION_KEY
        if not key:
            raise RuntimeError('KYC_ENCRYPTION_KEY is not configured')
        f = Fernet(key)
        data = content.read()
        if isinstance(data, str):
            data = data.encode('utf-8')
        token = f.encrypt(data)
        encrypted = BytesIO(token)
        encrypted.size = len(token)
        encrypted.name = getattr(content, 'name', name)
        return super()._save(name, encrypted)

    def open(self, name, mode='rb'):
        """Decrypt on read so admin preview/download is human-readable."""
        file = super().open(name, mode)
        if 'r' in mode and 'b' not in mode:
            # text mode not supported for encrypted; force binary
            mode = 'rb'
        if 'b' in mode:
            try:
                from cryptography.fernet import Fernet  # type: ignore
            except Exception:
                # If cryptography isn't available, return raw file (best-effort)
                return file
            key = settings.KYC_ENCRYPTION_KEY
            if not key:
                return file
            f = Fernet(key)
            data = file.read()
            try:
                plain = f.decrypt(data)
            except Exception:
                # If not decryptable (e.g., legacy plain files), return original
                file.seek(0)
                return file
            stream = BytesIO(plain)
            stream.name = getattr(file, 'name', name)
            return stream
        return file
