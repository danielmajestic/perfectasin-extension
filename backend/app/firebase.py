"""
Firebase Admin SDK initialization for TitlePerfect.

Exports:
    db: Firestore client (or None in dev mode)
    firebase_auth: firebase_admin.auth module (or None in dev mode)

Set GOOGLE_APPLICATION_CREDENTIALS env var to the path of your
Firebase service account JSON file. If missing, runs in dev mode
with Firebase features disabled.
"""
import logging
import os

import firebase_admin
from firebase_admin import credentials, firestore, auth as _firebase_auth

logger = logging.getLogger(__name__)

db = None
firebase_auth = None

_cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

if _cred_path and os.path.exists(_cred_path):
    try:
        cred = credentials.Certificate(_cred_path)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        firebase_auth = _firebase_auth
        logger.info("Firebase Admin SDK initialized successfully")
    except Exception as e:
        logger.error(f"Firebase init failed: {e}")
else:
    logger.warning(
        "GOOGLE_APPLICATION_CREDENTIALS not set or file not found. "
        "Running in dev mode — Firebase features disabled."
    )
