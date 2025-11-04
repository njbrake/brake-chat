import logging
import uuid
import base64
from typing import Optional

from open_webui.internal.db import Base, get_db
from open_webui.models.users import UserModel, Users
from open_webui.env import SRC_LOG_LEVELS
from pydantic import BaseModel
from sqlalchemy import Boolean, Column, String, Text
from open_webui.utils.auth import verify_password, get_password_hash
from open_webui.utils.encryption import (
    create_user_encryption_key,
    get_user_encryption_key,
    encrypt_user_key,
)
from open_webui.utils.encryption_keys import store_user_encryption_key

log = logging.getLogger(__name__)
log.setLevel(SRC_LOG_LEVELS["MODELS"])

####################
# DB MODEL
####################


class Auth(Base):
    __tablename__ = "auth"

    id = Column(String, primary_key=True)
    email = Column(String)
    password = Column(Text)
    active = Column(Boolean)
    encryption_key = Column(Text, nullable=True)
    encryption_salt = Column(Text, nullable=True)


class AuthModel(BaseModel):
    id: str
    email: str
    password: str
    active: bool = True
    encryption_key: Optional[str] = None
    encryption_salt: Optional[str] = None


####################
# Forms
####################


class Token(BaseModel):
    token: str
    token_type: str


class ApiKey(BaseModel):
    api_key: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    profile_image_url: str


class SigninResponse(Token, UserResponse):
    pass


class SigninForm(BaseModel):
    email: str
    password: str


class LdapForm(BaseModel):
    user: str
    password: str


class ProfileImageUrlForm(BaseModel):
    profile_image_url: str


class UpdatePasswordForm(BaseModel):
    password: str
    new_password: str


class SignupForm(BaseModel):
    name: str
    email: str
    password: str
    profile_image_url: Optional[str] = "/user.png"


class AddUserForm(SignupForm):
    role: Optional[str] = "pending"


class AuthsTable:
    def insert_new_auth(
        self,
        email: str,
        password: str,
        name: str,
        profile_image_url: str = "/user.png",
        role: str = "pending",
        oauth_sub: Optional[str] = None,
    ) -> Optional[UserModel]:
        with get_db() as db:
            log.info("insert_new_auth")

            id = str(uuid.uuid4())

            # Generate encryption key for the user from plaintext password
            salt, user_encryption_key, encrypted_key = create_user_encryption_key(password)

            # Convert salt to base64 for storage
            salt_b64 = base64.b64encode(salt).decode('utf-8')

            # Now hash the password for storage
            hashed_password = get_password_hash(password)

            auth = AuthModel(
                **{
                    "id": id,
                    "email": email,
                    "password": hashed_password,
                    "active": True,
                    "encryption_key": encrypted_key,
                    "encryption_salt": salt_b64
                }
            )
            result = Auth(**auth.model_dump())
            db.add(result)

            user = Users.insert_new_user(
                id, name, email, profile_image_url, role, oauth_sub
            )

            db.commit()
            db.refresh(result)

            if result and user:
                # Cache the encryption key for immediate use
                store_user_encryption_key(user.id, user_encryption_key)
                return user
            else:
                return None

    def authenticate_user(self, email: str, password: str) -> Optional[UserModel]:
        log.info(f"authenticate_user: {email}")

        user = Users.get_user_by_email(email)
        if not user:
            return None

        try:
            with get_db() as db:
                auth = db.query(Auth).filter_by(id=user.id, active=True).first()
                if auth:
                    if verify_password(password, auth.password):
                        # Decrypt and cache the user's encryption key for chat encryption
                        if auth.encryption_key and auth.encryption_salt:
                            try:
                                salt = base64.b64decode(auth.encryption_salt)
                                user_encryption_key = get_user_encryption_key(
                                    password, salt, auth.encryption_key
                                )
                                if user_encryption_key:
                                    store_user_encryption_key(user.id, user_encryption_key)
                                else:
                                    log.warning(f"Failed to decrypt encryption key for user {user.id}")
                            except Exception as e:
                                log.error(f"Error caching encryption key for user {user.id}: {e}")
                        return user
                    else:
                        return None
                else:
                    return None
        except Exception:
            return None

    def authenticate_user_by_api_key(self, api_key: str) -> Optional[UserModel]:
        log.info(f"authenticate_user_by_api_key: {api_key}")
        # if no api_key, return None
        if not api_key:
            return None

        try:
            user = Users.get_user_by_api_key(api_key)
            return user if user else None
        except Exception:
            return False

    def authenticate_user_by_email(self, email: str) -> Optional[UserModel]:
        log.info(f"authenticate_user_by_email: {email}")
        try:
            with get_db() as db:
                auth = db.query(Auth).filter_by(email=email, active=True).first()
                if auth:
                    user = Users.get_user_by_id(auth.id)
                    return user
        except Exception:
            return None

    def update_user_password_by_id(
        self, id: str, new_password: str, old_password: Optional[str] = None
    ) -> bool:
        """
        Update user password and re-encrypt their encryption key.

        Args:
            id: User ID
            new_password: New plaintext password
            old_password: Old plaintext password (if available)

        If old_password is provided, the encryption key is re-encrypted with the new password.
        If old_password is not provided (admin reset), a new encryption key is generated,
        which means existing encrypted chats will become unreadable.
        """
        try:
            with get_db() as db:
                auth = db.query(Auth).filter_by(id=id).first()
                if not auth:
                    return False

                # Hash the new password
                hashed_password = get_password_hash(new_password)

                # Handle encryption key re-encryption
                if old_password and auth.encryption_key and auth.encryption_salt:
                    # User changing their own password - re-encrypt the key
                    try:
                        salt = base64.b64decode(auth.encryption_salt)
                        user_encryption_key = get_user_encryption_key(
                            old_password, salt, auth.encryption_key
                        )
                        if user_encryption_key:
                            # Re-encrypt with new password
                            new_encrypted_key = encrypt_user_key(
                                user_encryption_key, new_password, salt
                            )
                            db.query(Auth).filter_by(id=id).update({
                                "password": hashed_password,
                                "encryption_key": new_encrypted_key
                            })
                        else:
                            log.error("Failed to decrypt encryption key during password update")
                            return False
                    except Exception as e:
                        log.error(f"Error re-encrypting user key: {e}")
                        return False
                else:
                    # Admin reset or user without encryption key - generate new key
                    # WARNING: This makes old encrypted chats unreadable
                    salt, user_encryption_key, encrypted_key = create_user_encryption_key(new_password)
                    salt_b64 = base64.b64encode(salt).decode('utf-8')

                    db.query(Auth).filter_by(id=id).update({
                        "password": hashed_password,
                        "encryption_key": encrypted_key,
                        "encryption_salt": salt_b64
                    })

                db.commit()
                return True
        except Exception as e:
            log.error(f"Error updating password: {e}")
            return False

    def update_email_by_id(self, id: str, email: str) -> bool:
        try:
            with get_db() as db:
                result = db.query(Auth).filter_by(id=id).update({"email": email})
                db.commit()
                return True if result == 1 else False
        except Exception:
            return False

    def delete_auth_by_id(self, id: str) -> bool:
        try:
            with get_db() as db:
                # Delete User
                result = Users.delete_user_by_id(id)

                if result:
                    db.query(Auth).filter_by(id=id).delete()
                    db.commit()

                    return True
                else:
                    return False
        except Exception:
            return False


Auths = AuthsTable()
