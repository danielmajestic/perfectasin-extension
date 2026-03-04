#!/usr/bin/env python3
"""
Admin script: grant Pro tier to a user by email.

Usage:
    python admin_set_pro.py user@email.com

Requires GOOGLE_APPLICATION_CREDENTIALS to point to the Firebase service account JSON.
Can also set GOOGLE_APPLICATION_CREDENTIALS in the environment before running:
    export GOOGLE_APPLICATION_CREDENTIALS=/path/to/firebase-service-account.json
    python admin_set_pro.py user@email.com
"""
import sys
import os
from datetime import datetime


def main():
    if len(sys.argv) != 2:
        print("Usage: python admin_set_pro.py <email>")
        sys.exit(1)

    email = sys.argv[1].strip()
    if "@" not in email:
        print(f"Error: '{email}' does not look like a valid email address")
        sys.exit(1)

    # Load Firebase credentials from local env or try the project default
    cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if not cred_path:
        # Try project root fallback
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(os.path.dirname(script_dir))
        fallback = os.path.join(project_root, "firebase-service-account.json")
        if os.path.exists(fallback):
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = fallback
            print(f"Using credentials: {fallback}")
        else:
            print("Error: GOOGLE_APPLICATION_CREDENTIALS not set and no fallback found")
            print("  Set: export GOOGLE_APPLICATION_CREDENTIALS=/path/to/firebase-service-account.json")
            sys.exit(1)

    import firebase_admin
    from firebase_admin import credentials, firestore, auth

    if not firebase_admin._apps:
        cred = credentials.Certificate(os.environ["GOOGLE_APPLICATION_CREDENTIALS"])
        firebase_admin.initialize_app(cred)

    db = firestore.client()

    # Look up Firebase Auth user by email
    print(f"Looking up user: {email}")
    try:
        user = auth.get_user_by_email(email)
    except auth.UserNotFoundError:
        print(f"Error: No Firebase Auth user found with email '{email}'")
        sys.exit(1)

    uid = user.uid
    now = datetime.utcnow()

    # Update users doc (tier field)
    db.collection("users").document(uid).set(
        {"tier": "pro", "updated_at": now},
        merge=True,
    )

    # Set subscription doc
    db.collection("subscriptions").document(uid).set({
        "uid": uid,
        "tier": "pro",
        "status": "active",
        "source": "admin_grant",
        "granted_by": "dan",
        "granted_at": now,
        "monthly_limit": 1000,
        "updated_at": now,
    })

    print(f"✅ Pro granted successfully")
    print(f"   uid:   {uid}")
    print(f"   email: {email}")
    print(f"   tier:  pro | limit: 1000/month | source: admin_grant")


if __name__ == "__main__":
    main()
