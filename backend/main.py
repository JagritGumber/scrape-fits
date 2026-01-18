from contextlib import asynccontextmanager

from fastapi import FastAPI

from .db import db
from .routers.sessions import router as sessions_router


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await db.connect()
    yield
    await db.disconnect()


app = FastAPI(lifespan=lifespan)


app.include_router(sessions_router)


def main() -> None:
    print("Hello from backend!")


if __name__ == "__main__":
    main()
