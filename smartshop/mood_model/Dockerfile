# Deploy on Railway / Render / Fly / Hugging Face Spaces (Docker).
# Do NOT deploy this service on Vercel.
#
# Set MODEL_URL to a public direct-download link for best_model_efficientnet_egypt_ft_v4.h5
# (Hugging Face resolve URL works well). Or mount/copy the file to MODEL_PATH.
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements-api.txt .
RUN pip install --no-cache-dir -r requirements-api.txt

COPY mood_api.py .

ENV HOST=0.0.0.0
ENV PORT=8001
ENV MODEL_PATH=/app/artifacts/models/best_model_efficientnet_egypt_ft_v4.h5

EXPOSE 8001

CMD ["sh", "-c", "uvicorn mood_api:app --host 0.0.0.0 --port ${PORT:-8001}"]
