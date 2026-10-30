import asyncio
import json
import logging
from contextlib import asynccontextmanager
from typing import Set, List, Dict, Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.services.radar_client import radar_client
from app.services.abuseipdb import abuseipdb_service
from app.services.synthesizer import synthesizer

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("main")


class ConnectionManager:
    """
    Manages active WebSocket connections and broadcasts stochastic threat events.
    """

    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        async with self._lock:
            self.active_connections.add(websocket)
        logger.info(f"WebSocket client connected. Active: {len(self.active_connections)}")

    async def disconnect(self, websocket: WebSocket):
        async with self._lock:
            self.active_connections.discard(websocket)
        logger.info(f"WebSocket client disconnected. Active: {len(self.active_connections)}")

    async def broadcast(self, data: Dict[str, Any]):
        async with self._lock:
            if not self.active_connections:
                return
            message = json.dumps(data)
            stale_connections = []
            for connection in self.active_connections:
                try:
                    await connection.send_text(message)
                except Exception as e:
                    logger.debug(f"Broadcast send failed: {e}")
                    stale_connections.append(connection)

            for stale in stale_connections:
                self.active_connections.discard(stale)


manager = ConnectionManager()


async def radar_cron_worker():
    """
    Background worker: Refreshes Radar aggregation cache every 10 minutes.
    """
    while True:
        try:
            await asyncio.sleep(settings.RADAR_CACHE_TTL_SEC)
            logger.info("Executing periodic Cloudflare Radar cache refresh...")
            await radar_client.fetch_radar_data()
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Error in radar_cron_worker: {e}")


async def threat_stream_broadcaster():
    """
    Asynchronous micro-event stochastic arrival loop.
    Generates discrete DDoS events according to Poisson arrival rate (lambda in [2.5, 10.0] /sec)
    and broadcasts to all connected WebSockets.
    """
    logger.info("Threat stream broadcaster initialized.")
    while True:
        try:
            event = synthesizer.generate_event()
            await manager.broadcast(event)
            sleep_duration = synthesizer.get_next_sleep_duration()
            await asyncio.sleep(sleep_duration)
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Error in threat_stream_broadcaster: {e}")
            await asyncio.sleep(0.5)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup tasks
    logger.info("Starting Global Live DDoS Attack Map backend...")
    await radar_client.fetch_radar_data()
    await abuseipdb_service.sync_blacklist()

    radar_task = asyncio.create_task(radar_cron_worker())
    stream_task = asyncio.create_task(threat_stream_broadcaster())

    yield

    # Shutdown tasks
    logger.info("Shutting down background workers...")
    radar_task.cancel()
    stream_task.cancel()
    await asyncio.gather(radar_task, stream_task, return_exceptions=True)


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="FastAPI WebSocket Streaming Gateway & Stochastic Real-Time Emulation Engine",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "ONLINE",
        "websocket_endpoint": "/ws/threat-stream",
        "active_clients": len(manager.active_connections),
    }


@app.get("/api/health")
async def health():
    return {
        "status": "healthy",
        "active_clients": len(manager.active_connections),
        "total_attacks": synthesizer.total_attacks_generated,
        "lambda": synthesizer.current_lambda,
    }


@app.get("/api/telemetry/summary")
async def get_telemetry_summary():
    return synthesizer.get_telemetry_metrics()


@app.get("/api/vectors")
async def get_recent_vectors():
    return {
        "count": len(synthesizer.recent_history),
        "vectors": synthesizer.recent_history[-35:],
    }


@app.websocket("/ws/threat-stream")
async def websocket_threat_stream(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Pre-seed initial recent batch (up to 15 arcs) so the globe is immediately active upon load
        if synthesizer.recent_history:
            seed_batch = synthesizer.recent_history[-15:]
            for seed in seed_batch:
                await websocket.send_text(json.dumps(seed))

        # Keep connection alive; incoming client pings or heartbeats
        while True:
            # Client can send control messages or keep-alive pings
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
    except WebSocketDisconnect:
        await manager.disconnect(websocket)
    except Exception as e:
        logger.debug(f"WebSocket session terminated: {e}")
        await manager.disconnect(websocket)

