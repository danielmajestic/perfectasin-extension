# TitlePerfect — GCP Cloud Run Deployment Runbook

**Project:** `titleperfect-e3a1c`
**Service:** `titleperfect-api`
**Region:** `us-central1`
**Domain:** `api.titleperfect.app` (auto-HTTPS via Cloud Run)

> **Status: CONFIGS READY — awaiting Dan approval before first deploy.**
> Run steps 1–4 (one-time setup), then step 5 triggers CI/CD automatically.

---

## Prerequisites

```bash
gcloud auth login
gcloud config set project titleperfect-e3a1c
```

---

## Step 1 — Enable APIs (one-time)

```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com
```

---

## Step 2 — Create Artifact Registry repo (one-time)

```bash
gcloud artifacts repositories create titleperfect \
  --repository-format=docker \
  --location=us-central1 \
  --description="TitlePerfect container images"
```

---

## Step 3 — Upload secrets to Secret Manager (one-time)

### 3a. Anthropic API key

```bash
echo -n "sk-ant-api03-YOUR-KEY-HERE" | \
  gcloud secrets create anthropic-api-key \
    --data-file=- \
    --replication-policy=automatic
```

### 3b. Firebase service account JSON

```bash
gcloud secrets create firebase-service-account \
  --data-file=./firebase-service-account.json \
  --replication-policy=automatic
```

> ⚠️  `firebase-service-account.json` is in .gitignore and .dockerignore — it is NEVER committed or baked into the image.

### 3c. Grant Cloud Build + Cloud Run access to secrets

```bash
# Get the Cloud Build service account
CB_SA="$(gcloud projects describe titleperfect-e3a1c --format='value(projectNumber)')@cloudbuild.gserviceaccount.com"

# Get the Cloud Run service account (default compute SA)
CR_SA="$(gcloud projects describe titleperfect-e3a1c --format='value(projectNumber)')-compute@developer.gserviceaccount.com"

for SA in "$CB_SA" "$CR_SA"; do
  gcloud secrets add-iam-policy-binding anthropic-api-key \
    --member="serviceAccount:$SA" --role="roles/secretmanager.secretAccessor"
  gcloud secrets add-iam-policy-binding firebase-service-account \
    --member="serviceAccount:$SA" --role="roles/secretmanager.secretAccessor"
done

# Cloud Build also needs Cloud Run Admin to deploy
gcloud projects add-iam-policy-binding titleperfect-e3a1c \
  --member="serviceAccount:$CB_SA" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding titleperfect-e3a1c \
  --member="serviceAccount:$CB_SA" \
  --role="roles/iam.serviceAccountUser"
```

---

## Step 4 — Domain mapping for api.titleperfect.app (one-time)

### 4a. Deploy service once first (no domain yet)

```bash
gcloud run deploy titleperfect-api \
  --project titleperfect-e3a1c \
  --image us-central1-docker.pkg.dev/titleperfect-e3a1c/titleperfect/api:latest \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --min-instances 0 \
  --max-instances 10
```

### 4b. Create domain mapping

```bash
gcloud run domain-mappings create \
  --service titleperfect-api \
  --domain api.titleperfect.app \
  --region us-central1 \
  --project titleperfect-e3a1c
```

### 4c. Add DNS record

Cloud Run will output a CNAME target. Add to Squarespace / DNS provider:

```
Type:  CNAME
Name:  api
Value: ghs.googlehosted.com.
```

Auto-HTTPS (Let's Encrypt) provisions within ~15 minutes after DNS propagates.

---

## Step 5 — Connect Cloud Build trigger (one-time)

In GCP Console → Cloud Build → Triggers:

1. **Connect repository:** `danielmajestic/titleperfect` (GitHub)
2. **Trigger config:**
   - Event: Push to branch `main`
   - Config: `backend/cloudbuild.yaml`
3. **Substitution variables:**
   - `_CHROME_EXTENSION_ID` = (set after Chrome Web Store publish)
   - `_FRONTEND_URL` = `https://titleperfect.app`
   - `_REGION` = `us-central1`

After connecting, every push to `main` auto-deploys. ✅

---

## Step 6 — Verify after first deploy

```bash
# Health check
curl https://api.titleperfect.app/health
# → {"status": "healthy"}

# Detailed health
curl https://api.titleperfect.app/api/health
# → {"status":"healthy","version":"1.0.0","environment":"production","integrations":{...}}

# Confirm scale-to-zero (wait 15 min idle, then check instance count)
gcloud run services describe titleperfect-api \
  --region us-central1 \
  --format='value(status.observedGeneration)'
```

---

## Architecture Notes

| Setting | Value | Why |
|---------|-------|-----|
| `--workers 1` | Single uvicorn worker | Cloud Run handles concurrency at service level; async FastAPI handles concurrent requests within one worker |
| `--concurrency 80` | 80 req/instance | Default; lowers if memory pressure |
| `--min-instances 0` | Scale to zero | Cost savings; ~2s cold start acceptable |
| `--timeout 300` | 5 min request timeout | Covers worst-case 90s analysis + retries |
| `--timeout-keep-alive 75` | 75s keep-alive | > Cloud Run's 60s LB timeout to prevent mid-request drops |
| Firebase secret | Mounted at `/run/secrets/firebase.json` | Never in image, rotatable |
| ANTHROPIC_API_KEY | Secret Manager env injection | Never in image, rotatable |

---

## Updating secrets

```bash
# Rotate Anthropic key
echo -n "sk-ant-api03-NEW-KEY" | \
  gcloud secrets versions add anthropic-api-key --data-file=-

# Rotate Firebase SA
gcloud secrets versions add firebase-service-account \
  --data-file=./new-firebase-service-account.json
```

Secret Manager versions are immutable. Cloud Run picks up `:latest` on next deploy.
