"""
AgriRide – Trip Creator Service

Shared logic for creating a SharedTrip from a matched group of bookings.
Called by:
  - matching router  (manual "Create Shared Trip" button)
  - bookings router  (auto-matching when a new booking arrives)
"""
import json
from sqlalchemy.orm import Session
import models
from services.matching_engine import run_matching, find_best_vehicle, optimize_pickup_route
from services.cost_allocator import calculate_trip_cost, allocate_cost_by_quantity
from services.notification_service import create_notification
from utils.haversine import total_route_distance


def try_auto_match_and_create(db: Session, new_booking: models.Booking) -> models.SharedTrip | None:
    """
    Called right after a booking is saved.
    Runs the matching engine over all REQUESTED bookings. If the new booking
    lands in a fully-MATCHED compatible group (≥ 2 bookings), a SharedTrip is
    created automatically and all parties are notified.

    Returns the created SharedTrip, or None if no match was found.
    """
    # Run matching on all pending bookings
    result = run_matching(db)

    config = db.query(models.MatchingConfig).first()
    if not config:
        config = models.MatchingConfig()

    for grp in result.get("matched_groups", []):
        booking_ids = grp["booking_ids"]

        # Only act if the new booking is in this group and match is full
        if new_booking.id not in booking_ids:
            continue
        if grp.get("match_result") != "MATCHED":
            continue
        if len(booking_ids) < 2:
            continue

        return create_shared_trip(db, booking_ids, config)

    return None


def create_shared_trip(
    db: Session,
    booking_ids: list[int],
    config: models.MatchingConfig | None = None,
) -> models.SharedTrip | None:
    """
    Create a SharedTrip from a list of booking IDs that have already been
    determined to be compatible by the matching engine.

    - Updates each booking status to MATCHED (or DRIVER_ASSIGNED if a vehicle exists).
    - Creates CostAllocation records.
    - Sends notifications to farmers and the driver (if a vehicle with a driver is found).
    """
    if config is None:
        config = db.query(models.MatchingConfig).first()
        if not config:
            config = models.MatchingConfig()

    bookings = db.query(models.Booking).filter(
        models.Booking.id.in_(booking_ids),
        models.Booking.status == models.BookingStatus.REQUESTED,
    ).all()

    if len(bookings) < 2:
        return None

    total_load = sum(b.quantity_kg for b in bookings)

    # Find the best available vehicle
    vehicle = find_best_vehicle(db, total_load, bookings[0].preferred_date)

    # Build optimized route
    route_seq   = optimize_pickup_route(bookings, vehicle)
    route_pts   = [{"lat": b.pickup_latitude, "lon": b.pickup_longitude} for b in bookings]
    if bookings[0].destination_latitude:
        route_pts.append({
            "lat": bookings[0].destination_latitude,
            "lon": bookings[0].destination_longitude,
        })
    distance_km = total_route_distance(route_pts)

    # Cost calculation
    cost_data   = calculate_trip_cost(distance_km, config)
    allocations = allocate_cost_by_quantity(bookings, cost_data["total_cost"])

    # Create SharedTrip record
    trip = models.SharedTrip(
        destination_name      = bookings[0].destination_name,
        destination_latitude  = bookings[0].destination_latitude,
        destination_longitude = bookings[0].destination_longitude,
        total_load_kg         = total_load,
        total_distance_km     = round(distance_km, 2),
        total_cost            = cost_data["total_cost"],
        base_cost             = cost_data["base_cost"],
        distance_cost         = cost_data["distance_cost"],
        handling_cost         = cost_data["handling_cost"],
        pickup_sequence       = json.dumps(route_seq),
        status                = models.TripStatus.MATCHED,
        match_result          = models.MatchResult.MATCHED,
        vehicle_id            = vehicle.id if vehicle else None,
        scheduled_date        = bookings[0].preferred_date,
        estimated_start_time  = bookings[0].earliest_pickup_time,
    )
    db.add(trip)
    db.commit()
    db.refresh(trip)

    # Create junction records, cost allocations, update booking statuses
    for i, b in enumerate(bookings):
        order = route_seq[i]["order"] if i < len(route_seq) else i + 1
        db.add(models.TripBooking(
            shared_trip_id = trip.id,
            booking_id     = b.id,
            pickup_order   = order,
        ))
        b.status         = models.BookingStatus.MATCHED
        b.allocated_cost = allocations[i]["amount"]

        db.add(models.CostAllocation(
            shared_trip_id = trip.id,
            booking_id     = b.id,
            farmer_id      = b.farmer_id,
            quantity_kg    = b.quantity_kg,
            percentage     = allocations[i]["percentage"],
            amount         = allocations[i]["amount"],
        ))

    # If a vehicle is available → upgrade to DRIVER_ASSIGNED
    # IMPORTANT: Set driver_id here, in the same commit as status,
    # so when the driver gets the notification and polls, the record is consistent.
    if vehicle:
        trip.status    = models.TripStatus.DRIVER_ASSIGNED
        if vehicle.driver:
            trip.driver_id = vehicle.driver.id
        for b in bookings:
            b.status = models.BookingStatus.DRIVER_ASSIGNED

    db.commit()

    # Notify each farmer
    for b in bookings:
        create_notification(
            db, b.farmer.user_id, "BOOKING_MATCHED",
            related_id  = trip.id,
            count       = len(bookings) - 1,
            destination = trip.destination_name,
        )

    # Notify the driver AFTER commit so the DB row is ready when they poll
    if vehicle and vehicle.driver:
        create_notification(
            db, vehicle.driver.user_id, "TRIP_REQUEST",
            related_id = trip.id,
            load       = total_load,
        )

    return trip
