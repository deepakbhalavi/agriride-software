"""AgriRide – Shared Trips router."""
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas
from utils.auth import get_current_user, require_role
from services.notification_service import create_notification

router = APIRouter(prefix="/api/shared-trips", tags=["Shared Trips"])


@router.get("", response_model=List[schemas.SharedTripOut])
def get_shared_trips(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get shared trips relevant to the current user's role."""
    if current_user.role == models.UserRole.FARMER:
        farmer = db.query(models.Farmer).filter(models.Farmer.user_id == current_user.id).first()
        if not farmer:
            return []
        # Get trips where farmer has a booking
        trip_ids = db.query(models.TripBooking.shared_trip_id).join(models.Booking).filter(
            models.Booking.farmer_id == farmer.id
        ).subquery()
        return db.query(models.SharedTrip).filter(
            models.SharedTrip.id.in_(trip_ids)
        ).order_by(models.SharedTrip.created_at.desc()).all()

    elif current_user.role == models.UserRole.DRIVER:
        driver = db.query(models.Driver).filter(models.Driver.user_id == current_user.id).first()
        if not driver:
            return []
        # Trips assigned to this driver OR awaiting any driver (MATCHED or DRIVER_ASSIGNED)
        return db.query(models.SharedTrip).filter(
            (models.SharedTrip.driver_id == driver.id) |
            (models.SharedTrip.status == models.TripStatus.DRIVER_ASSIGNED) |
            (models.SharedTrip.status == models.TripStatus.MATCHED)
        ).order_by(models.SharedTrip.created_at.desc()).all()


    else:  # ADMIN
        return db.query(models.SharedTrip).order_by(models.SharedTrip.created_at.desc()).all()


@router.get("/{trip_id}")
def get_trip_detail(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get detailed shared trip with bookings, route, and cost allocations."""
    trip = db.query(models.SharedTrip).filter(models.SharedTrip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Shared trip not found")

    # Trip bookings + farmer details
    trip_bookings = db.query(models.TripBooking).filter(
        models.TripBooking.shared_trip_id == trip_id
    ).all()

    bookings_data = []
    for tb in trip_bookings:
        b = tb.booking
        farmer = b.farmer
        bookings_data.append({
            "booking_id":       b.id,
            "farmer_id":        farmer.id,
            "farmer_name":      farmer.user.full_name,
            "produce_type":     b.produce_type,
            "quantity_kg":      b.quantity_kg,
            "pickup_location":  b.pickup_location_name,
            "pickup_latitude":  b.pickup_latitude,
            "pickup_longitude": b.pickup_longitude,
            "earliest_time":    b.earliest_pickup_time,
            "latest_time":      b.latest_pickup_time,
            "pickup_order":     tb.pickup_order,
            "allocated_cost":   b.allocated_cost,
            "status":           b.status.value,
        })

    cost_allocations = db.query(models.CostAllocation).filter(
        models.CostAllocation.shared_trip_id == trip_id
    ).all()

    # Driver info
    driver_info = None
    if trip.driver:
        d = trip.driver
        driver_info = {
            "id":           d.id,
            "name":         d.user.full_name,
            "phone":        d.user.phone,
            "rating":       d.rating,
            "license_no":   d.license_no,
        }

    # Vehicle info
    vehicle_info = None
    if trip.vehicle:
        v = trip.vehicle
        vehicle_info = {
            "id":                  v.id,
            "registration":        v.registration_number,
            "type":                v.vehicle_type.value,
            "capacity_kg":         v.capacity_kg,
            "make_model":          v.make_model,
        }

    pickup_sequence = []
    if trip.pickup_sequence:
        try:
            pickup_sequence = json.loads(trip.pickup_sequence)
        except:
            pickup_sequence = []

    return {
        "id":                  trip.id,
        "status":              trip.status.value,
        "match_result":        trip.match_result.value,
        "destination_name":    trip.destination_name,
        "destination_latitude":  trip.destination_latitude,
        "destination_longitude": trip.destination_longitude,
        "total_load_kg":       trip.total_load_kg,
        "total_distance_km":   trip.total_distance_km,
        "total_cost":          trip.total_cost,
        "base_cost":           trip.base_cost,
        "distance_cost":       trip.distance_cost,
        "handling_cost":       trip.handling_cost,
        "scheduled_date":      trip.scheduled_date,
        "estimated_start_time": trip.estimated_start_time,
        "compatibility_score": trip.compatibility_score,
        "pickup_sequence":     pickup_sequence,
        "bookings":            bookings_data,
        "cost_allocations":    [{"farmer_id": ca.farmer_id, "amount": ca.amount, "percentage": ca.percentage} for ca in cost_allocations],
        "driver":              driver_info,
        "vehicle":             vehicle_info,
        "created_at":          trip.created_at.isoformat(),
    }


@router.post("/{trip_id}/accept")
def driver_accept_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("DRIVER"))
):
    """Driver accepts a shared trip."""
    driver = db.query(models.Driver).filter(models.Driver.user_id == current_user.id).first()
    trip   = db.query(models.SharedTrip).filter(models.SharedTrip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if trip.status not in [models.TripStatus.DRIVER_ASSIGNED, models.TripStatus.MATCHED]:
        raise HTTPException(status_code=400, detail="Trip is not available for acceptance")

    trip.driver_id = driver.id
    trip.status    = models.TripStatus.DRIVER_ACCEPTED

    # Update booking statuses
    for tb in trip.trip_bookings:
        tb.booking.status = models.BookingStatus.DRIVER_ACCEPTED

    db.commit()

    # Notify all farmers
    for tb in trip.trip_bookings:
        farmer = tb.booking.farmer
        vehicle = trip.vehicle
        veh_str = f"{vehicle.vehicle_type.value} ({vehicle.registration_number})" if vehicle else "TBD"
        create_notification(
            db, farmer.user_id, "DRIVER_ACCEPTED", related_id=trip_id,
            driver_name=current_user.full_name, vehicle=veh_str
        )

    return {"message": "Trip accepted successfully", "trip_id": trip_id}


@router.post("/{trip_id}/reject")
def driver_reject_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("DRIVER"))
):
    """Driver rejects a shared trip."""
    trip = db.query(models.SharedTrip).filter(models.SharedTrip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    # Reset to MATCHED so another driver can be assigned
    trip.status    = models.TripStatus.MATCHED
    trip.driver_id = None
    db.commit()

    # Notify farmers
    for tb in trip.trip_bookings:
        create_notification(db, tb.booking.farmer.user_id, "DRIVER_REJECTED", related_id=trip_id)

    return {"message": "Trip rejected"}


@router.put("/{trip_id}/status")
def update_trip_status(
    trip_id: int,
    new_status: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update trip status (Driver or Admin only)."""
    if current_user.role not in [models.UserRole.DRIVER, models.UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")

    trip = db.query(models.SharedTrip).filter(models.SharedTrip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    try:
        trip.status = models.TripStatus(new_status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {new_status}")

    # Sync booking statuses
    booking_status_map = {
        "PICKUP_IN_PROGRESS": models.BookingStatus.PICKUP_IN_PROGRESS,
        "IN_TRANSIT":          models.BookingStatus.IN_TRANSIT,
        "DELIVERED":           models.BookingStatus.DELIVERED,
        "CANCELLED":           models.BookingStatus.CANCELLED,
    }
    if new_status in booking_status_map:
        for tb in trip.trip_bookings:
            tb.booking.status = booking_status_map[new_status]

    db.commit()

    # Notify farmers on key status changes
    if new_status == "DELIVERED":
        for tb in trip.trip_bookings:
            create_notification(
                db, tb.booking.farmer.user_id, "TRIP_COMPLETED",
                related_id=trip_id, destination=trip.destination_name
            )

    return {"message": f"Trip status updated to {new_status}"}
