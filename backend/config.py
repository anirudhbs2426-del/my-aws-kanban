import os

from dotenv import load_dotenv


load_dotenv()


def parse_frontend_origins():
    raw_value = os.getenv("FRONTEND_ORIGIN", "*").strip()
    if raw_value == "*":
        return "*"

    origins = [origin.strip() for origin in raw_value.split(",") if origin.strip()]
    return origins or "*"


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "phase1-dev-secret")
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "sqlite:///kanban.db",
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    FRONTEND_ORIGIN = parse_frontend_origins()