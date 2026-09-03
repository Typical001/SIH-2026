FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY backend/ /app/

# Expose Render web service port
EXPOSE 10000

# Run FastAPI backend application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "10000"]
