"""
Server-side encryption key cache for chat encryption.

This module manages decrypted user encryption keys in memory,
populated during login and used for chat encryption/decryption operations.
"""

import logging
import base64
from typing import Optional, Dict
from threading import Lock
from open_webui.env import SRC_LOG_LEVELS
from open_webui.utils.encryption import encrypt_data, decrypt_data, generate_encryption_key
from open_webui.env import WEBUI_SECRET_KEY

log = logging.getLogger(__name__)
log.setLevel(SRC_LOG_LEVELS["MODELS"])

# In-memory cache for user encryption keys
# Key: user_id, Value: encrypted key (encrypted with server secret for security)
_encryption_key_cache: Dict[str, str] = {}
_cache_lock = Lock()

# Use the WEBUI_SECRET_KEY as the server-side encryption key
# This ensures keys in memory are encrypted at rest
SERVER_ENCRYPTION_KEY = WEBUI_SECRET_KEY.encode('utf-8')[:32].ljust(32, b'0')


def store_user_encryption_key(user_id: str, encryption_key: bytes) -> None:
    """
    Store a user's encryption key in the server-side cache.

    The key is encrypted with the server secret before caching for additional security.

    Args:
        user_id: User ID
        encryption_key: The user's decrypted 32-byte encryption key
    """
    try:
        # Encrypt the key with server secret before caching
        key_b64 = base64.b64encode(encryption_key).decode('utf-8')
        encrypted_key = encrypt_data(key_b64, SERVER_ENCRYPTION_KEY)

        with _cache_lock:
            _encryption_key_cache[user_id] = encrypted_key

        log.debug(f"Stored encryption key for user {user_id}")
    except Exception as e:
        log.error(f"Error storing encryption key for user {user_id}: {e}")


def get_user_encryption_key(user_id: str) -> Optional[bytes]:
    """
    Retrieve a user's encryption key from the server-side cache.

    Args:
        user_id: User ID

    Returns:
        The user's 32-byte encryption key, or None if not found
    """
    try:
        with _cache_lock:
            encrypted_key = _encryption_key_cache.get(user_id)

        if not encrypted_key:
            log.warning(f"Encryption key not found in cache for user {user_id}")
            return None

        # Decrypt the key from cache
        key_b64 = decrypt_data(encrypted_key, SERVER_ENCRYPTION_KEY)
        return base64.b64decode(key_b64)
    except Exception as e:
        log.error(f"Error retrieving encryption key for user {user_id}: {e}")
        return None


def remove_user_encryption_key(user_id: str) -> None:
    """
    Remove a user's encryption key from the cache (e.g., on logout).

    Args:
        user_id: User ID
    """
    try:
        with _cache_lock:
            if user_id in _encryption_key_cache:
                del _encryption_key_cache[user_id]
                log.debug(f"Removed encryption key for user {user_id}")
    except Exception as e:
        log.error(f"Error removing encryption key for user {user_id}: {e}")


def clear_all_encryption_keys() -> None:
    """
    Clear all encryption keys from the cache.
    Useful for server shutdown or security events.
    """
    with _cache_lock:
        _encryption_key_cache.clear()
        log.info("Cleared all encryption keys from cache")


def has_encryption_key(user_id: str) -> bool:
    """
    Check if a user's encryption key is cached.

    Args:
        user_id: User ID

    Returns:
        True if the key is cached, False otherwise
    """
    with _cache_lock:
        return user_id in _encryption_key_cache
