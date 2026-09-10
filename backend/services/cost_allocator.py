"""
AgriRide – Cost Allocation Module

Calculates total trip cost and allocates it fairly among farmers
based on their produce quantity (proportional allocation).

Cost Formula:
    Total Cost = Base Vehicle Cost + (Distance × Cost/km) + Handling Cost

Farmer Share:
    Farmer Cost = (Farmer Quantity / Total Quantity) × Total Trip Cost

This allocation method is transparent and reproducible.
Architecture is extensible for future methods:
  - Distance-weighted allocation (future)
  - Pickup-effort weighted (future)
"""

from typing import List, Dict, Optional
from sqlalchemy.orm import Session
import models


# ─────────────────────────────────────────────────────────────
# Cost Calculation
# ─────────────────────────────────────────────────────────────

def calculate_trip_cost(
    distance_km: float,
    config: models.MatchingConfig
) -> Dict:
    """
    Calculate total transportation cost for a shared trip.

    Parameters:
        distance_km: Total route distance in kilometres
        config:      MatchingConfig with cost parameters

    Returns:
        Dict with cost breakdown:
            base_cost, distance_cost, handling_cost, total_cost
    """
    base_cost     = config.base_vehicle_cost
    distance_cost = distance_km * config.cost_per_km
    handling_cost = config.handling_cost
    total_cost    = base_cost + distance_cost + handling_cost

    return {
        "base_cost":     round(base_cost, 2),
        "distance_cost": round(distance_cost, 2),
        "handling_cost": round(handling_cost, 2),
        "total_cost":    round(total_cost, 2),
    }


# ─────────────────────────────────────────────────────────────
# Quantity-Proportional Allocation
# ─────────────────────────────────────────────────────────────

def allocate_cost_by_quantity(
    bookings: List[models.Booking],
    total_cost: float
) -> List[Dict]:
    """
    Allocate total trip cost among farmers proportional to their quantity.

    Formula:
        Farmer Share = (Farmer Quantity / Total Quantity) × Total Cost

    Example:
        Farmer A: 300 kg, Farmer B: 200 kg, Farmer C: 250 kg
        Total: 750 kg, Total Cost: ₹2,400

        Farmer A: 300/750 × 2400 = ₹960
        Farmer B: 200/750 × 2400 = ₹640
        Farmer C: 250/750 × 2400 = ₹800

    Parameters:
        bookings:   List of Booking objects
        total_cost: Total trip cost in ₹

    Returns:
        List of allocation dicts with farmer_id, booking_id, amount, percentage
    """
    total_qty = sum(b.quantity_kg for b in bookings)
    allocations = []

    for b in bookings:
        if total_qty > 0:
            percentage = (b.quantity_kg / total_qty) * 100
            amount     = (b.quantity_kg / total_qty) * total_cost
        else:
            percentage = 0.0
            amount     = 0.0

        allocations.append({
            "booking_id":  b.id,
            "farmer_id":   b.farmer_id,
            "quantity_kg": b.quantity_kg,
            "percentage":  round(percentage, 2),
            "amount":      round(amount, 2),
            "method":      "QUANTITY_PROPORTIONAL",
        })

    return allocations


# ─────────────────────────────────────────────────────────────
# Individual Booking Cost Estimate (for "savings" comparison)
# ─────────────────────────────────────────────────────────────

def estimate_individual_cost(
    distance_km: float,
    config: models.MatchingConfig
) -> float:
    """
    Estimate cost if a farmer booked a vehicle individually (not shared).
    Used for before/after comparison in research demonstration.

    Note: This is a demo estimate using the same cost formula.
    Actual individual vehicle costs may vary.
    """
    costs = calculate_trip_cost(distance_km, config)
    return costs["total_cost"]


def calculate_savings(
    individual_costs: List[float],
    shared_allocations: List[Dict]
) -> Dict:
    """
    Calculate estimated transportation savings from shared trip vs individual trips.

    Parameters:
        individual_costs:   List of estimated costs per farmer if booked individually
        shared_allocations: List of allocated costs in shared trip

    Returns:
        Dict with total_individual, total_shared, total_saved, pct_saved
    """
    total_individual = sum(individual_costs)
    total_shared     = sum(a["amount"] for a in shared_allocations)
    total_saved      = max(0.0, total_individual - total_shared)
    pct_saved        = (total_saved / total_individual * 100) if total_individual > 0 else 0.0

    return {
        "total_individual_cost": round(total_individual, 2),
        "total_shared_cost":     round(total_shared, 2),
        "total_saved":           round(total_saved, 2),
        "pct_saved":             round(pct_saved, 1),
    }
