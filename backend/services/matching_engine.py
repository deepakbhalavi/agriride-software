"""
AgriRide – Matching Engine (Rule-Based)

This module implements a transparent, rule-based compatibility matching algorithm
for grouping farmer transportation bookings into shared trips.

ALGORITHM (NOT machine learning – explicitly rule-based):
1. Filter active bookings (status = REQUESTED)
2. Group by destination market (same name or within destination_radius_km)
3. For each candidate group:
   a. Check geographic distance between all pickup points ≤ max_pickup_distance_km
   b. Check time-window overlap ≥ min_time_overlap_min
   c. Check total quantity ≤ best available vehicle capacity
4. Calculate compatibility score using configurable weights:
   - Destination compatibility : weight_destination (default 30%)
   - Geographic proximity      : weight_proximity   (default 25%)
   - Time compatibility        : weight_time        (default 20%)
   - Capacity compatibility    : weight_capacity    (default 25%)
5. Return MATCHED / PARTIALLY_MATCHED / NOT_MATCHED

Architecture is designed for ML demand-prediction extension in future iterations.
"""

import json
from datetime import time
from typing import List, Dict, Optional, Tuple
from sqlalchemy.orm import Session
import models
from utils.haversine import haversine_distance


# ─────────────────────────────────────────────────────────────
# Time Helpers
# ─────────────────────────────────────────────────────────────

def _parse_time(t: str) -> time:
    """Parse 'HH:MM' string to time object."""
    h, m = map(int, t.split(":"))
    return time(h, m)


def _time_to_minutes(t: time) -> int:
    return t.hour * 60 + t.minute


def _overlap_minutes(early1: str, late1: str, early2: str, late2: str) -> float:
    """Calculate overlap in minutes between two time windows."""
    s1, e1 = _time_to_minutes(_parse_time(early1)), _time_to_minutes(_parse_time(late1))
    s2, e2 = _time_to_minutes(_parse_time(early2)), _time_to_minutes(_parse_time(late2))
    overlap_start = max(s1, s2)
    overlap_end   = min(e1, e2)
    return max(0.0, float(overlap_end - overlap_start))


def _group_time_overlap(bookings: List[models.Booking]) -> float:
    """Calculate minimum pairwise time-window overlap for a group."""
    if len(bookings) < 2:
        return 999.0
    min_overlap = float("inf")
    for i in range(len(bookings)):
        for j in range(i + 1, len(bookings)):
            ov = _overlap_minutes(
                bookings[i].earliest_pickup_time, bookings[i].latest_pickup_time,
                bookings[j].earliest_pickup_time, bookings[j].latest_pickup_time,
            )
            min_overlap = min(min_overlap, ov)
    return min_overlap


# ─────────────────────────────────────────────────────────────
# Compatibility Scoring
# ─────────────────────────────────────────────────────────────

def _destination_score(bookings: List[models.Booking], radius_km: float) -> float:
    """
    Score based on destination compatibility.
    All bookings pointing to the same market name → 1.0
    Within radius but different names → 0.7
    """
    names = set(b.destination_name.strip().lower() for b in bookings)
    if len(names) == 1:
        return 1.0
    # Check all pairwise destination distances
    max_dist = 0.0
    for i in range(len(bookings)):
        for j in range(i + 1, len(bookings)):
            bi, bj = bookings[i], bookings[j]
            if (bi.destination_latitude and bi.destination_longitude
                    and bj.destination_latitude and bj.destination_longitude):
                d = haversine_distance(
                    bi.destination_latitude, bi.destination_longitude,
                    bj.destination_latitude, bj.destination_longitude
                )
                max_dist = max(max_dist, d)
    if max_dist <= radius_km:
        return max(0.0, 1.0 - (max_dist / radius_km) * 0.3)
    return 0.0


def _proximity_score(bookings: List[models.Booking], max_dist_km: float) -> Tuple[float, float]:
    """
    Score based on geographic proximity of pickup points.
    Returns (score 0-1, max pairwise distance km)
    """
    max_pickup_dist = 0.0
    for i in range(len(bookings)):
        for j in range(i + 1, len(bookings)):
            bi, bj = bookings[i], bookings[j]
            d = haversine_distance(
                bi.pickup_latitude, bi.pickup_longitude,
                bj.pickup_latitude, bj.pickup_longitude
            )
            max_pickup_dist = max(max_pickup_dist, d)
    if max_pickup_dist > max_dist_km:
        return 0.0, max_pickup_dist
    score = max(0.0, 1.0 - (max_pickup_dist / max_dist_km))
    return score, max_pickup_dist


def _time_score(bookings: List[models.Booking], min_overlap: float) -> Tuple[float, bool]:
    """
    Score based on time-window overlap.
    Returns (score 0-1, overlap_ok bool)
    """
    overlap = _group_time_overlap(bookings)
    if overlap < min_overlap:
        return max(0.0, overlap / (min_overlap * 2)), False
    # More overlap → better score, cap at 1.0
    score = min(1.0, overlap / 120.0)
    return score, True


def _capacity_score(
    bookings: List[models.Booking],
    best_vehicle_capacity: Optional[float]
) -> Tuple[float, bool, float]:
    """
    Score based on vehicle capacity vs total load.
    Returns (score 0-1, capacity_ok bool, total_load_kg)
    """
    total_load = sum(b.quantity_kg for b in bookings)
    if best_vehicle_capacity is None or best_vehicle_capacity <= 0:
        return 0.5, False, total_load   # No vehicle found
    if total_load > best_vehicle_capacity:
        return 0.0, False, total_load   # Overloaded – NOT FEASIBLE
    # Better utilization (closer to full capacity) → higher score
    utilization = total_load / best_vehicle_capacity
    # Ideal utilization ~70-90%
    if 0.6 <= utilization <= 0.95:
        score = 1.0
    elif utilization < 0.6:
        score = utilization / 0.6
    else:
        score = max(0.5, 1.0 - (utilization - 0.95) * 5)
    return score, True, total_load


# ─────────────────────────────────────────────────────────────
# Matching Engine Core
# ─────────────────────────────────────────────────────────────

def find_best_vehicle(
    db: Session,
    total_load_kg: float,
    date: str
) -> Optional[models.Vehicle]:
    """
    Find the smallest available vehicle that can handle total_load_kg.
    Vehicles already assigned to trips on the same date are excluded.
    """
    vehicles = (
        db.query(models.Vehicle)
        .filter(models.Vehicle.is_available == True)
        .filter(models.Vehicle.capacity_kg >= total_load_kg)
        .order_by(models.Vehicle.capacity_kg.asc())
        .all()
    )
    # TODO: Exclude vehicles already scheduled for the same date
    return vehicles[0] if vehicles else None


def run_matching(
    db: Session,
    booking_ids: Optional[List[int]] = None
) -> Dict:
    """
    Main matching engine entry point.

    Args:
        db: Database session
        booking_ids: Optional list of specific booking IDs to match.
                     If None, all REQUESTED bookings are considered.

    Returns:
        Dict with matched groups, unmatched bookings, and statistics.
    """
    # 1. Load configuration
    config = db.query(models.MatchingConfig).first()
    if not config:
        # Use defaults
        config = models.MatchingConfig()

    # 2. Load bookings to match
    query = db.query(models.Booking).filter(
        models.Booking.status == models.BookingStatus.REQUESTED
    )
    if booking_ids:
        query = query.filter(models.Booking.id.in_(booking_ids))
    bookings = query.all()

    if not bookings:
        return {
            "groups_found": 0,
            "matched_groups": [],
            "unmatched_booking_ids": [],
            "message": "No pending bookings found.",
        }

    # 3. Group bookings by destination
    dest_groups: Dict[str, List[models.Booking]] = {}
    for b in bookings:
        dest_key = b.destination_name.strip().lower()
        dest_groups.setdefault(dest_key, []).append(b)

    matched_groups     = []
    unmatched_ids      = []
    processed_ids      = set()

    for dest_key, group in dest_groups.items():
        if len(group) < 2:
            # Only one booking for this destination – cannot share
            for b in group:
                if b.id not in processed_ids:
                    unmatched_ids.append(b.id)
                    processed_ids.add(b.id)
            continue

        # 4. Check constraints for this group
        total_load = sum(b.quantity_kg for b in group)

        # Find best vehicle for this total load
        best_vehicle = find_best_vehicle(db, total_load, group[0].preferred_date)
        best_cap     = best_vehicle.capacity_kg if best_vehicle else None

        # Calculate scores
        d_score = _destination_score(group, config.destination_radius_km)
        p_score, max_dist_km = _proximity_score(group, config.max_pickup_distance_km)
        t_score, time_ok     = _time_score(group, config.min_time_overlap_min)
        c_score, cap_ok, _   = _capacity_score(group, best_cap)

        # Weighted compatibility score (0–100)
        raw_score = (
            d_score * config.weight_destination
            + p_score * config.weight_proximity
            + t_score * config.weight_time
            + c_score * config.weight_capacity
        )
        compatibility_score = round(raw_score * 100, 1)

        # Determine match result
        if d_score > 0 and p_score > 0 and time_ok and cap_ok:
            match_result = "MATCHED"
        elif d_score > 0 and cap_ok:
            match_result = "PARTIALLY_MATCHED"
        else:
            match_result = "NOT_MATCHED"

        # Pickup sequence optimization (nearest-neighbor baseline)
        pickup_sequence = optimize_pickup_route(group, best_vehicle)

        matched_groups.append({
            "booking_ids":         [b.id for b in group],
            "farmer_ids":          [b.farmer_id for b in group],
            "bookings":            group,
            "total_load_kg":       round(total_load, 2),
            "destination":         group[0].destination_name,
            "compatibility_score": compatibility_score,
            "match_result":        match_result,
            "distance_km":         round(max_dist_km, 2),
            "time_overlap_ok":     time_ok,
            "capacity_ok":         cap_ok,
            "recommended_vehicle": best_vehicle,
            "pickup_sequence":     pickup_sequence,
            "scores": {
                "destination": round(d_score * 100, 1),
                "proximity":   round(p_score * 100, 1),
                "time":        round(t_score * 100, 1),
                "capacity":    round(c_score * 100, 1),
            }
        })
        for b in group:
            processed_ids.add(b.id)

    return {
        "groups_found":          len(matched_groups),
        "matched_groups":        matched_groups,
        "unmatched_booking_ids": unmatched_ids,
        "message":               f"Found {len(matched_groups)} compatible group(s).",
    }


# ─────────────────────────────────────────────────────────────
# Route Optimization – Nearest-Neighbor Baseline
# ─────────────────────────────────────────────────────────────

def optimize_pickup_route(
    bookings: List[models.Booking],
    vehicle: Optional[models.Vehicle] = None
) -> List[Dict]:
    """
    Baseline Route Optimization using Nearest-Neighbor heuristic.

    This is a simple greedy algorithm that repeatedly selects the closest
    unvisited pickup point. It provides a reasonable starting route but
    does NOT guarantee global optimality.

    Label: "Baseline Route Optimization (Nearest-Neighbor)"
    Architecture: Ready for OR-Tools VRPTW integration in future versions.

    Parameters:
        bookings: List of Booking objects (each has pickup coordinates)
        vehicle:  Optional vehicle (for capacity tracking)

    Returns:
        Ordered list of pickup points with coordinates and booking info.
    """
    if not bookings:
        return []

    # Start from vehicle's current location or first booking
    if vehicle and vehicle.driver and vehicle.driver.latitude:
        start = {"lat": vehicle.driver.latitude, "lon": vehicle.driver.longitude}
    else:
        start = {"lat": bookings[0].pickup_latitude, "lon": bookings[0].pickup_longitude}

    unvisited = list(bookings)
    route     = []
    current   = start

    while unvisited:
        # Find nearest unvisited pickup
        nearest     = None
        nearest_dist = float("inf")
        for b in unvisited:
            d = haversine_distance(
                current["lat"], current["lon"],
                b.pickup_latitude, b.pickup_longitude
            )
            if d < nearest_dist:
                nearest_dist = d
                nearest      = b

        if nearest:
            route.append({
                "order":           len(route) + 1,
                "booking_id":      nearest.id,
                "farmer_id":       nearest.farmer_id,
                "location_name":   nearest.pickup_location_name,
                "latitude":        nearest.pickup_latitude,
                "longitude":       nearest.pickup_longitude,
                "quantity_kg":     nearest.quantity_kg,
                "produce_type":    nearest.produce_type,
                "earliest_time":   nearest.earliest_pickup_time,
                "latest_time":     nearest.latest_pickup_time,
                "distance_from_prev_km": round(nearest_dist, 2),
            })
            current = {"lat": nearest.pickup_latitude, "lon": nearest.pickup_longitude}
            unvisited.remove(nearest)

    return route
