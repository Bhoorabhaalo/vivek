import asyncio
import os
import json
import websockets
from typing import Callable, Dict


class PolygonLiveAdapter:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("POLYGON_API_KEY")
        self.subscribers = []
        self.ws_url = "wss://delayed.polygon.io/stocks"
        self.running = False
        self.latest_prices: Dict[str, float] = {}

    def add_subscriber(self, callback: Callable[[Dict[str, float]], None]):
        self.subscribers.append(callback)

    async def connect_and_stream(self):
        if not self.api_key:
            print("No Polygon API key provided. Live adapter is inactive.")
            return

        self.running = True
        try:
            async with websockets.connect(self.ws_url) as ws:
                await ws.send(json.dumps({"action": "auth", "params": self.api_key}))
                auth_res = await ws.recv()
                print("Polygon Auth:", auth_res)

                # Example hardcoded subscription matching our portfolio
                await ws.send(json.dumps({"action": "subscribe", "params": "A.AAPL,A.MSFT"}))

                while self.running:
                    msg = await ws.recv()
                    data = json.loads(msg)
                    for item in data:
                        if item.get("ev") == "A":  # Minute aggregate
                            sym = item.get("sym")
                            c = item.get("c")  # close price
                            if sym and c:
                                self.latest_prices[sym] = float(c)

                    # Push updates to subscribers
                    for sub in self.subscribers:
                        if asyncio.iscoroutinefunction(sub):
                            await sub(self.latest_prices)
                        else:
                            sub(self.latest_prices)

        except Exception as e:
            print(f"Polygon adapter error: {e}")
            self.running = False

    def stop(self):
        self.running = False


live_adapter = PolygonLiveAdapter()
