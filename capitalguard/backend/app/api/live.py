from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.engine_coordinator import coordinator
import json

router = APIRouter()


@router.websocket("/stream")
async def websocket_endpoint(websocket: WebSocket, token: str = None):
    if not token:
        await websocket.close(code=1008)
        return
    try:
        from app.api.auth import get_current_user
        await get_current_user(token)
    except Exception:
        await websocket.close(code=1008)
        return

    await websocket.accept()
    coordinator.clients.add(websocket)
    try:
        await websocket.send_json(coordinator.state)
        while True:
            data = await websocket.receive_text()
            try:
                payload = json.loads(data)
                if isinstance(payload, dict):
                    cmd = payload.get("command")
                    if cmd == "shock":
                        coordinator.set_demo_state("shock")
                    elif cmd == "calm":
                        coordinator.set_demo_state("calm")
                    elif cmd == "run_scenario":
                        await coordinator.run_scenario(
                            payload.get("scenario_id"),
                            params=payload.get("params")
                        )
            except json.JSONDecodeError:
                # Fallback to plain text logic for backward compatibility
                if data == "shock":
                    coordinator.set_demo_state("shock")
                elif data == "calm":
                    coordinator.set_demo_state("calm")
    except WebSocketDisconnect:
        coordinator.clients.discard(websocket)
    except Exception:
        coordinator.clients.discard(websocket)
