FROM python:3.11-slim

WORKDIR /app

# Install build deps, then clean up
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY ./app ./app

# Non-root user for production
RUN adduser --disabled-password --no-create-home appuser
USER appuser

ENV PORT=8080
ENV ENVIRONMENT=production
ENV PYTHONUNBUFFERED=1

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:${PORT}/health')" || exit 1

# Cloud Run: 1 worker (async handles concurrency); keep-alive > 60s so
# Cloud Run's load balancer doesn't close connections mid-request.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "1", "--timeout-keep-alive", "75"]
