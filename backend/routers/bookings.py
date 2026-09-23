"""AgriRide – Bookings router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
import models, schemas
from utils.auth import get_current_user, require_role
from services.notification_service import create_notification

router = APIRouter(prefix="/api/bookings", tags=["Bookings"])


@router.post("", response_model=schemas.BookingOut)
def create_booking(
    req: schemas.BookingCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("FARMER"))
):
    """Create a new transportation booking."""
    farmer = db.query(models.Farmer).filter(models.Farmer.user_id == current_user.id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer profile not found")

    booking = models.Booking(
        farmer_id=farmer.id,
        produce_type=req.produce_type,
        quantity_kg=req.quantity_kg,
        pickup_latitude=req.pickup_latitude,
        pickup_longitude=req.pickup_longitude,
        pickup_location_name=req.pickup_location_name,
        destination_name=req.destination_name,
        destination_latitude=req.destination_latitude,
        destination_longitude=req.destination_longitude,
        preferred_date=req.preferred_date,
        earliest_pickup_time=req.earliest_pickup_time,
        latest_pickup_time=req.latest_pickup_time,
        special_requirements=req.special_requirements,
        status=models.BookingStatus.REQUESTED,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)

    # Notify farmer that their booking was received
    create_notification(
        db, current_user.id, "BOOKING_CREATED", related_id=booking.id,
        qty=booking.quantity_kg, produce=booking.produce_type
    )

    # ── Auto-matching ──────────────────────────────────────────
    # Run the matching engine immediately. If this booking forms a
    # compatible group with existing bookings, create the SharedTrip
    # automatically so the driver sees it right away.
    try:
        from services.trip_creator import try_auto_match_and_create
        try_auto_match_and_create(db, booking)
    except Exception:
        # Auto-match is best-effort — never fail the booking creation
        pass

    db.refresh(booking)  # Refresh to pick up any status change from auto-match
    return booking



@router.get("", response_model=List[schemas.BookingOut])
def get_my_bookings(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("FARMER"))
):
    """Get all bookings for the current farmer."""
    farmer = db.query(models.Farmer).filter(models.Farmer.user_id == current_user.id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer profile not found")
    return db.query(models.Booking).filter(
        models.Booking.farmer_id == farmer.id
    ).order_by(models.Booking.created_at.desc()).all()


@router.get("/all", response_model=List[schemas.BookingOut])
def get_all_bookings(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("ADMIN"))
):
    """Admin: Get all bookings."""
    return db.query(models.Booking).order_by(models.Booking.created_at.desc()).all()


@router.get("/{booking_id}", response_model=schemas.BookingOut)
def get_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


@router.put("/{booking_id}", response_model=schemas.BookingOut)
def update_booking(
    booking_id: int,
    req: schemas.BookingUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("FARMER"))
):
    """Update a booking (only if status is REQUESTED)."""
    farmer = db.query(models.Farmer).filter(models.Farmer.user_id == current_user.id).first()
    booking = db.query(models.Booking).filter(
        models.Booking.id == booking_id,
        models.Booking.farmer_id == farmer.id
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status not in [models.BookingStatus.REQUESTED]:
        raise HTTPException(status_code=400, detail="Cannot update a booking that is already matched or in progress")

    update_data = req.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(booking, key, val)
    db.commit()
    db.refresh(booking)
    return booking


@router.delete("/{booking_id}")
def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("FARMER"))
):
    """Cancel a booking before it is matched or confirmed."""
    farmer = db.query(models.Farmer).filter(models.Farmer.user_id == current_user.id).first()
    booking = db.query(models.Booking).filter(
        models.Booking.id == booking_id,
        models.Booking.farmer_id == farmer.id
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Block cancellation once the booking is matched or assigned to a driver
    non_cancellable = [
        models.BookingStatus.MATCHED,
        models.BookingStatus.DRIVER_ASSIGNED,
        models.BookingStatus.DRIVER_ACCEPTED,
        models.BookingStatus.PICKUP_IN_PROGRESS,
        models.BookingStatus.IN_TRANSIT,
        models.BookingStatus.DELIVERED,
    ]
    if booking.status in non_cancellable:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel a booking with status '{booking.status.value}'. "
                   f"The trip has already been matched or a driver has been assigned. "
                   f"Please contact support if you need to cancel."
        )

    booking.status = models.BookingStatus.CANCELLED
    db.commit()

    # If this booking was somehow part of a shared trip (edge case: MATCHED
    # status would have been caught above, but safety check), notify the driver.
    for tb in booking.trip_bookings:
        shared_trip = tb.shared_trip
        if shared_trip and shared_trip.driver:
            create_notification(
                db, shared_trip.driver.user_id, "DRIVER_REJECTED",
                related_id=shared_trip.id,
            )

    return {"message": "Booking cancelled successfully"}

