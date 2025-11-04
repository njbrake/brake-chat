"""
Encryption utilities for securing user chat data.

This module provides functions for encrypting and decrypting chat data
using AES-256-GCM encryption. Each user has a unique encryption key that
is itself encrypted using a key derived from their password.
"""

import os
import logging
import base64
import hashlib
from typing import Optional, Tuple
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend

log = logging.getLogger(__name__)

# Constants for encryption
KEY_SIZE = 32  # 256 bits for AES-256
NONCE_SIZE = 12  # 96 bits (recommended for GCM)
SALT_SIZE = 32  # 256 bits for salt
KDF_ITERATIONS = 600000  # OWASP recommendation for PBKDF2-HMAC-SHA256


def derive_key_from_password(password: str, salt: bytes) -> bytes:
    """
    Derive a 256-bit encryption key from a password using PBKDF2-HMAC-SHA256.

    Args:
        password: The user's password
        salt: A unique salt for this user (32 bytes)

    Returns:
        A 32-byte encryption key
    """
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=KEY_SIZE,
        salt=salt,
        iterations=KDF_ITERATIONS,
        backend=default_backend()
    )
    return kdf.derive(password.encode('utf-8'))


def generate_encryption_key() -> bytes:
    """
    Generate a random 256-bit encryption key for encrypting user chats.

    Returns:
        A 32-byte random key
    """
    return os.urandom(KEY_SIZE)


def generate_salt() -> bytes:
    """
    Generate a random salt for password-based key derivation.

    Returns:
        A 32-byte random salt
    """
    return os.urandom(SALT_SIZE)


def encrypt_data(data: str, key: bytes) -> str:
    """
    Encrypt data using AES-256-GCM.

    Args:
        data: The plaintext data to encrypt
        key: The 32-byte encryption key

    Returns:
        Base64-encoded string containing: nonce + ciphertext + tag
    """
    if not data:
        return ""

    try:
        aesgcm = AESGCM(key)
        nonce = os.urandom(NONCE_SIZE)
        ciphertext = aesgcm.encrypt(nonce, data.encode('utf-8'), None)

        # Combine nonce and ciphertext (ciphertext already includes auth tag)
        encrypted_data = nonce + ciphertext

        # Return as base64 for storage
        return base64.b64encode(encrypted_data).decode('utf-8')
    except Exception as e:
        log.error(f"Encryption error: {e}")
        raise


def decrypt_data(encrypted_data: str, key: bytes) -> str:
    """
    Decrypt data that was encrypted with AES-256-GCM.

    Args:
        encrypted_data: Base64-encoded string containing nonce + ciphertext + tag
        key: The 32-byte encryption key

    Returns:
        The decrypted plaintext data
    """
    if not encrypted_data:
        return ""

    try:
        # Decode from base64
        encrypted_bytes = base64.b64decode(encrypted_data)

        # Extract nonce and ciphertext
        nonce = encrypted_bytes[:NONCE_SIZE]
        ciphertext = encrypted_bytes[NONCE_SIZE:]

        # Decrypt
        aesgcm = AESGCM(key)
        plaintext = aesgcm.decrypt(nonce, ciphertext, None)

        return plaintext.decode('utf-8')
    except Exception as e:
        log.error(f"Decryption error: {e}")
        raise


def encrypt_user_key(user_encryption_key: bytes, password: str, salt: bytes) -> str:
    """
    Encrypt a user's encryption key using a key derived from their password.

    Args:
        user_encryption_key: The user's 32-byte encryption key
        password: The user's password
        salt: The salt for key derivation

    Returns:
        Base64-encoded encrypted key
    """
    password_key = derive_key_from_password(password, salt)
    return encrypt_data(base64.b64encode(user_encryption_key).decode('utf-8'), password_key)


def decrypt_user_key(encrypted_key: str, password: str, salt: bytes) -> bytes:
    """
    Decrypt a user's encryption key using their password.

    Args:
        encrypted_key: The base64-encoded encrypted key
        password: The user's password
        salt: The salt for key derivation

    Returns:
        The decrypted 32-byte encryption key
    """
    password_key = derive_key_from_password(password, salt)
    decrypted = decrypt_data(encrypted_key, password_key)
    return base64.b64decode(decrypted)


def create_user_encryption_key(password: str) -> Tuple[bytes, bytes, str]:
    """
    Create a new encryption key for a user and encrypt it with their password.

    This should be called during user signup.

    Args:
        password: The user's password

    Returns:
        Tuple of (salt, user_encryption_key, encrypted_key)
        - salt: The salt used for password-based key derivation (store in DB)
        - user_encryption_key: The actual encryption key (don't store, return to caller)
        - encrypted_key: The encrypted encryption key (store in DB)
    """
    # Generate a new encryption key for the user's chats
    user_encryption_key = generate_encryption_key()

    # Generate a salt for this user
    salt = generate_salt()

    # Encrypt the user's encryption key with their password
    encrypted_key = encrypt_user_key(user_encryption_key, password, salt)

    return salt, user_encryption_key, encrypted_key


def get_user_encryption_key(password: str, salt: bytes, encrypted_key: str) -> Optional[bytes]:
    """
    Retrieve and decrypt a user's encryption key.

    This should be called during user login.

    Args:
        password: The user's password
        salt: The user's salt from the database
        encrypted_key: The encrypted encryption key from the database

    Returns:
        The decrypted encryption key, or None if decryption fails
    """
    try:
        return decrypt_user_key(encrypted_key, password, salt)
    except Exception as e:
        log.error(f"Failed to decrypt user encryption key: {e}")
        return None


def hash_encryption_key(key: bytes) -> str:
    """
    Create a hash of the encryption key for verification purposes.
    Can be stored in JWT tokens to verify the key hasn't changed.

    Args:
        key: The encryption key

    Returns:
        Hex-encoded SHA256 hash of the key
    """
    return hashlib.sha256(key).hexdigest()
