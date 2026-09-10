"""AgriRide – Matching Engine router."""
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
import models
from utils.auth import get_current_user, require_role
from services.matching_engine import run_matching, optimize_pickup_route
from services.cost_allocator import calculate_trip_cost, allocate_cost_by_quantity, calculate_savings, estimate_individual_cost
from services.notification_service import create_notification
from utils.haversine import total_route_distance

router = APIRouter(prefix="/api/matching", tags=["Matching Engine"])


@router.post("/run")
def run_matching_engine(
    booking_ids: Optional[List[int]] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Run the rule-based matching engine on pending bookings.
    
    Returns compatible groups with scores, recommended vehicle,
    pickup sequence, and cost breakdown.
    
    Note: This is a rule-based algorithm, NOT machine learning.
    """
    result = run_matching(db, booking_ids)
    config = db.query(models.MatchingConfig).first()
    if not config:
        config = models.MatchingConfig()

    # Enrich groups with cost data
    enriched_groups = []
    for grp in result["matched_groups"]:
        bookings = grp["bookings"]
        vehicle  = grp.get("recommended_vehicle")

        # Calculate route distance
        route_points = [{"lat": b.pickup_latitude, "lon": b.pickup_longitude} for b in bookings]
        if bookings and bookings[0].destination_latitude:
            route_points.append({
                "lat": bookings[0].destination_latitude,
                "lon": bookings[0].destination_longitude
            })
        distance_km = total_route_distance(route_points)

        # Cost breakdown
        cost_data   = calculate_trip_cost(distance_km, config)
        allocations = allocate_cost_by_quantity(bookings, cost_data["total_cost"])

        # Individual cost estimates for savings comparison
        individual_costs = [
            estimate_individual_cost(distance_km, config)
            for _ in bookings
        ]
        savings = calculate_savings(individual_costs, allocations)

        farmer_details = []
        for i, b in enumerate(bookings):
            alloc = allocations[i]
            farmer_details.append({
                "booking_id":       b.id,
                "farmer_id":        b.farmer_id,
                "produce":          b.produce_type,
                "quantity_kg":      b.quantity_kg,
                "pickup_location":  b.pickup_location_name,
                "allocated_amount": alloc["amount"],
                "percentage":       alloc["percentage"],
            })

        enriched_groups.append({
            "booking_ids":                grp["booking_ids"],
            "destination":                grp["destination"],
            "total_load_kg":              grp["total_load_kg"],
            "compatibility_score":        grp["compatibility_score"],
            "match_result":               grp["match_result"],
            "distance_km":                round(distance_km, 2),
            "route_distance_km":          round(distance_km, 2),
            "time_overlap_ok":            grp["time_overlap_ok"],
            "capacity_ok":                grp["capacity_ok"],
            "scores":                     grp.get("scores", {}),
            "recommended_vehicle_id":     vehicle.id if vehicle else None,
            "recommended_vehicle_cap":    vehicle.capacity_kg if vehicle else None,
            "recommended_vehicle_type":   vehicle.vehicle_type.value if vehicle else None,
            "recommended_vehicle_reg":    vehicle.registration_number if vehicle else None,
            "cost_breakdown":             cost_data,
            "farmer_allocations":         farmer_details,
            "pickup_sequence":            grp.get("pickup_sequence", []),
            "savings_vs_individual":      savings,
        })

    return {
        "algorithm":             "Rule-Based Compatibility Matching (NOT machine learning)",
        "groups_found":          result["groups_found"],
        "matched_groups":        enriched_groups,
        "unmatched_booking_ids": result["unmatched_booking_ids"],
        "message":               result["message"],
    }


@router.post("/create-trip/{group_index}")
def create_shared_trip_from_match(
    group_index: int,
    booking_ids: List[int],
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Officially create a SharedTrip record from a matched group.
    Updates booking statuses to MATCHED.
    """
    config = db.query(models.MatchingConfig).first()
    if not config:
        config = models.MatchingConfig()

    bookings = db.query(models.Booking).filter(
        models.Booking.id.in_(booking_ids),
        models.Booking.status == models.BookingStatus.REQUESTED
    ).all()

    if len(bookings) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 bookings to create a shared trip")

    total_load = sum(b.quantity_kg for b in bookings)

    # Find suitable vehicle
    from services.matching_engine import find_best_vehicle
    vehicle = find_best_vehicle(db, total_load, bookings[0].preferred_date)

    # Build route and distance
    route_seq = optimize_pickup_route(bookings, vehicle)
    route_points = [{"lat": b.pickup_latitude, "lon": b.pickup_longitude} for b in bookings]
    if bookings[0].destination_latitude:
        route_points.append({
            "lat": bookings[0].destination_latitude,
            "lon": bookings[0].destination_longitude
        })
    distance_km = total_route_distance(route_points)

    # Cost
    cost_data   = calculate_trip_cost(distance_km, config)
    allocations = allocate_cost_by_quantity(bookings, cost_data["total_cost"])

    # Create SharedTrip
    trip = models.SharedTrip(
        destination_name=bookings[0].destination_name,
        destination_latitude=bookings[0].destination_latitude,
        destination_longitude=bookings[0].destination_longitude,
        total_load_kg=total_load,
        total_distance_km=round(distance_km, 2),
        total_cost=cost_data["total_cost"],
        base_cost=cost_data["base_cost"],
        distance_cost=cost_data["distance_cost"],
        handling_cost=cost_data["handling_cost"],
        pickup_sequence=json.dumps(route_seq),
        status=models.TripStatus.MATCHED,
        match_result=models.MatchResult.MATCHED,
        vehicle_id=vehicle.id if vehicle else None,
        scheduled_date=bookings[0].preferred_date,
        estimated_start_time=bookings[0].earliest_pickup_time,
    )
    db.add(trip)
    db.commit()
    db.refresh(trip)

    # Create TripBooking junctions and CostAllocation records
    for i, b in enumerate(bookings):
        tb = models.TripBooking(
            shared_trip_id=trip.id,
            booking_id=b.id,
            pickup_order=route_seq[i]["order"] if i < len(route_seq) else i + 1,
        )
        db.add(tb)
        b.status         = models.BookingStatus.MATCHED
        b.allocated_cost = allocations[i]["amount"]

        alloc = models.CostAllocation(
            shared_trip_id=trip.id,
            booking_id=b.id,
            farmer_id=b.farmer_id,
            quantity_kg=b.quantity_kg,
            percentage=allocations[i]["percentage"],
            amount=allocations[i]["amount"],
        )
        db.add(alloc)

        # Assign vehicle if available
    if vehicle:
        trip.status = models.TripStatus.DRIVER_ASSIGNED
        for b in bookings:
            b.status = models.BookingStatus.DRIVER_ASSIGNED

    db.commit()

    # Notifications for farmers
    for b in bookings:
        farmer = b.farmer
        create_notification(
            db, farmer.user_id, "BOOKING_MATCHED", related_id=trip.id,
            count=len(bookings) - 1,
            destination=trip.destination_name,
        )

    # Notify driver if assigned vehicle has a driver
    if vehicle and vehicle.driver:
        create_notification(
            db, vehicle.driver.user_id, "TRIP_REQUEST", related_id=trip.id,
            load=total_load
        )
        trip.driver_id = vehicle.driver.id
        db.commit()

    return {"trip_id": trip.id, "message": f"Shared trip created successfully with {len(bookings)} bookings"}
