import json
import logging
import math
import os
import random
import time
import uuid
from typing import Dict, Any, List, Tuple
import numpy as np

from app.config import settings
from app.services.radar_client import radar_client
from app.services.abuseipdb import abuseipdb_service

logger = logging.getLogger("synthesizer")


def haversine_angular_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes angular distance (in radians) between two lat/lng coordinates on a sphere.
    """
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
    a = min(1.0, max(0.0, a))
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return c


class ThreatSynthesizer:
    """
    Macro-to-Micro Stochastic Synthesizer calibrated against Cloudflare Radar
    and AbuseIPDB telemetry.
    """

    def __init__(self):
        self.geo_data = self._load_geo_data()
        self.countries = self.geo_data.get("countries", [])
        self.order_counter = 1000
        self.current_lambda = 4.5  # Dynamic Poisson arrival rate in [POISSON_MIN_RATE, POISSON_MAX_RATE]
        self.peak_gbps = 142.8
        self.total_attacks_generated = 0
        self.recent_history: List[Dict[str, Any]] = []
        self.max_history = 60

    def _load_geo_data(self) -> Dict[str, Any]:
        cur_dir = os.path.dirname(os.path.abspath(__file__))
        path = os.path.join(cur_dir, "..", "static_data", "country_geo.json")
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error loading country_geo.json: {e}")
            return {"countries": []}

    def _select_origin_and_destination(self) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        """
        Selects Origin & Destination based on live/empirical weights:
        P(Origin = i) = W_i / sum(W_k)
        """
        # Dynamic weights with slight live perturbation
        origin_weights = []
        for c in self.countries:
            w = c.get("origin_weight", 0.05)
            origin_weights.append(w)

        total_origin = sum(origin_weights)
        origin_probs = [w / total_origin for w in origin_weights]
        src_idx = np.random.choice(len(self.countries), p=origin_probs)
        src = self.countries[src_idx]

        # Select target with P(Target = j) where j != i
        target_indices = [idx for idx in range(len(self.countries)) if idx != src_idx]
        target_weights = [self.countries[idx].get("target_weight", 0.05) for idx in target_indices]
        total_target = sum(target_weights)
        target_probs = [w / total_target for w in target_weights]
        dst_idx = np.random.choice(target_indices, p=target_probs)
        dst = self.countries[dst_idx]

        return src, dst

    def _apply_jitter(self, lat: float, lng: float) -> Tuple[float, float]:
        """
        Applies geographic jitter:
        lat_actual = lat_centroid + delta_lat, delta ~ U(-2.5, 2.5)
        lng_actual = lng_centroid + delta_lng, delta ~ U(-2.5, 2.5)
        """
        r = settings.GEO_JITTER_RANGE
        d_lat = float(np.random.uniform(-r, r))
        d_lng = float(np.random.uniform(-r, r))

        actual_lat = max(-85.0, min(85.0, lat + d_lat))
        actual_lng = ((lng + d_lng + 180.0) % 360.0) - 180.0
        return round(actual_lat, 4), round(actual_lng, 4)

    def _calculate_volume(self) -> float:
        """
        Attack volume follows shifted exponential distribution:
        V ~ Exp(1/mu) + V_floor, with mu = 25.0 Gbps and V_floor = 1.5 Gbps
        """
        mu = settings.EXP_VOLUME_MU
        floor = settings.VOLUME_FLOOR
        volume = float(np.random.exponential(scale=mu) + floor)
        return round(volume, 1)

    def _select_vector(self) -> Dict[str, Any]:
        """
        Selects attack vector according to Cloudflare Radar distribution.
        """
        summary = radar_client.get_summary()
        vectors = summary.get("vectors", [])
        weights = [v.get("weight", 0.25) for v in vectors]
        total = sum(weights) or 1.0
        probs = [w / total for w in weights]
        chosen_idx = np.random.choice(len(vectors), p=probs)
        return vectors[chosen_idx]

    def _calculate_arc_altitude(self, start_lat: float, start_lng: float, end_lat: float, end_lng: float) -> float:
        """
        Computes dynamic altitude proportional to spherical distance.
        """
        ang_dist = haversine_angular_distance(start_lat, start_lng, end_lat, end_lng)
        # ang_dist ranges from 0 to pi
        normalized = ang_dist / math.pi
        alt = 0.14 + (0.32 * normalized)
        return round(alt, 3)

    def generate_event(self) -> Dict[str, Any]:
        """
        Generates a discrete micro-event complying with Section 4 WebSocket Payload Specification.
        """
        self.order_counter += 1
        self.total_attacks_generated += 1

        # Periodically oscillate lambda arrival rate slightly to simulate real-world diurnal wave
        # lambda in [2.5, 10.0]
        drift = np.random.uniform(-0.4, 0.4)
        self.current_lambda = max(settings.POISSON_MIN_RATE, min(settings.POISSON_MAX_RATE, self.current_lambda + drift))

        src_country, dst_country = self._select_origin_and_destination()
        start_lat, start_lng = self._apply_jitter(src_country["lat"], src_country["lng"])
        end_lat, end_lng = self._apply_jitter(dst_country["lat"], dst_country["lng"])

        vector_info = self._select_vector()
        volume_gbps = self._calculate_volume()
        if volume_gbps > self.peak_gbps:
            self.peak_gbps = volume_gbps

        arc_alt = self._calculate_arc_altitude(start_lat, start_lng, end_lat, end_lng)

        industries = radar_client.get_summary().get("industries", ["Telecommunications"])
        target_industry = random.choice(industries)

        node_info = abuseipdb_service.get_source_node(src_country["iso"])
        event_id = f"atk_{uuid.uuid4().hex[:8]}"
        timestamp_ms = int(time.time() * 1000)

        payload = {
            "order": self.order_counter,
            "startLat": start_lat,
            "startLng": start_lng,
            "endLat": end_lat,
            "endLng": end_lng,
            "arcAlt": arc_alt,
            "color": vector_info["color"],
            "meta": {
                "id": event_id,
                "timestamp": timestamp_ms,
                "vector": vector_info["vector"],
                "protocol": vector_info["protocol"],
                "volumeGbps": volume_gbps,
                "src": src_country["iso"],
                "srcCountryName": src_country["name"],
                "dst": dst_country["iso"],
                "dstCountryName": dst_country["name"],
                "targetIndustry": target_industry,
                "srcIp": node_info.get("ip", "192.0.2.1"),
                "asn": node_info.get("asn", "AS13335 CLOUDFLARE"),
                "botnet": node_info.get("botnet", "Mirai-Cluster"),
            },
        }

        # Keep rolling history buffer for fast sync on fresh connection
        self.recent_history.append(payload)
        if len(self.recent_history) > self.max_history:
            self.recent_history.pop(0)

        return payload

    def get_next_sleep_duration(self) -> float:
        """
        Draws the next inter-arrival interval from the exponential distribution:
        Delta_t ~ Exp(lambda)
        """
        # scale parameter in numpy exponential is 1 / lambda (mean interval in seconds)
        interval = float(np.random.exponential(scale=1.0 / self.current_lambda))
        # Clamp to realistic bounds (0.05s to 0.9s)
        return max(0.08, min(0.85, interval))

    def get_telemetry_metrics(self) -> Dict[str, Any]:
        radar_sum = radar_client.get_summary()
        return {
            "arrival_rate_lambda": round(self.current_lambda, 2),
            "peak_gbps": round(self.peak_gbps, 1),
            "total_attacks_generated": self.total_attacks_generated,
            "vectors": radar_sum.get("vectors", []),
            "industries": radar_sum.get("industries", []),
            "live_radar": radar_sum.get("live_telemetry_active", False),
            "active_buffer_size": len(self.recent_history),
        }


synthesizer = ThreatSynthesizer()

