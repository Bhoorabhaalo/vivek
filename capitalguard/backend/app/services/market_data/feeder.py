import pandas as pd
import numpy as np
from datetime import datetime, timezone
import asyncio
from typing import Dict, List, Callable, Any


class MarketDataFeeder:
    def __init__(self):
        self.running = False
        self.subscribers: List[Callable[[Dict[str, float]], Any]] = []
        self.current_prices: Dict[str, float] = {}
        self.history: pd.DataFrame = pd.DataFrame()

    def add_subscriber(self, callback: Callable[[Dict[str, float]], Any]):
        self.subscribers.append(callback)

    def generate_synthetic_history(
            self, asset_ids: List[str], days: int = 252 * 3):
        """Generates realistic correlated random walk data for given assets"""
        dates = pd.date_range(
            end=datetime.now(
                timezone.utc),
            periods=days,
            freq='B')

        # Simple generation for demo: Start all at 100
        data = {asset: [100.0] for asset in asset_ids}

        # Add basic drift and vol
        for i in range(1, days):
            for asset in asset_ids:
                prev = data[asset][i - 1]
                # small drift + random shock
                ret = np.random.normal(0.0002, 0.015)
                data[asset].append(prev * (1 + ret))

        self.history = pd.DataFrame(data, index=dates)
        self.current_prices = self.history.iloc[-1].to_dict()
        return self.history

    async def run_replay(self, speed_factor: float = 1.0,
                         interval_seconds: float = 1.0):
        """
        Replays the history to simulate live ticks.
        In a real scenario, this would step through historical data quickly.
        Here we generate new ticks based on the last historical price.
        """
        self.running = True
        while self.running:
            # Generate next tick
            new_prices = {}
            for asset, price in self.current_prices.items():
                ret = np.random.normal(0, 0.005)  # intraday vol
                new_price = price * (1 + ret)
                new_prices[asset] = new_price

            self.current_prices = new_prices

            # Append to history
            new_row = pd.DataFrame(
                [new_prices], index=[
                    datetime.now(
                        timezone.utc)])
            self.history = pd.concat([self.history, new_row])

            # Notify subscribers
            for sub in self.subscribers:
                if asyncio.iscoroutinefunction(sub):
                    await sub(self.current_prices)
                else:
                    sub(self.current_prices)

            await asyncio.sleep(interval_seconds / speed_factor)

    def stop(self):
        self.running = False


feeder = MarketDataFeeder()
