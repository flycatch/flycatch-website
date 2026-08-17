FROM python:3.12-slim AS base
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

FROM base AS build
COPY pyproject.toml ./
COPY src ./src
RUN pip install --no-cache-dir .

FROM base
COPY --from=build /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=build /usr/local/bin /usr/local/bin
COPY alembic ./alembic
COPY alembic.ini ./
COPY src ./src
EXPOSE 8000
CMD ["sh", "-c", "alembic upgrade head && uvicorn flycatch_api.main:app --host 0.0.0.0 --port 8000"]
