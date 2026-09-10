"""AgriRide – Farmers router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas
from utils.auth import get_current_user, require_role

router = APIRouter(prefix="/api/farmers", tags=["Farmers"])


@router.get("/profile", response_model=schemas.FarmerOut)
def get_farmer_profile(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("FARMER"))
):
    farmer = db.query(models.Farmer).filter(models.Farmer.user_id == current_user.id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer profile not found")
    # Inject user fields for response
    farmer.full_name = current_user.full_name
    farmer.email     = current_user.email
    farmer.phone     = current_user.phone
    return farmer


@router.put("/profile", response_model=schemas.FarmerOut)
def update_farmer_profile(
    req: schemas.FarmerProfileUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("FARMER"))
):
    farmer = db.query(models.Farmer).filter(models.Farmer.user_id == current_user.id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer profile not found")

    update_data = req.model_dump(exclude_unset=True)
    user_fields = {"full_name", "phone"}
    for key, val in update_data.items():
        if key in user_fields:
            setattr(current_user, key, val)
        else:
            setattr(farmer, key, val)
    db.commit()
    db.refresh(farmer)
    farmer.full_name = current_user.full_name
    farmer.email     = current_user.email
    farmer.phone     = current_user.phone
    return farmer


@router.get("/dashboard-stats")
def get_farmer_dashboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("FARMER"))
):
    farmer = db.query(models.Farmer).filter(models.Farmer.user_id == current_user.id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer profile not found")

    bookings = db.query(models.Booking).filter(models.Booking.farmer_id == farmer.id).all()
    active    = [b for b in bookings if b.status in [
        models.BookingStatus.REQUESTED, models.BookingStatus.MATCHED,
        models.BookingStatus.DRIVER_ASSIGNED, models.BookingStatus.DRIVER_ACCEPTED,
        models.BookingStatus.PICKUP_IN_PROGRESS, models.BookingStatus.IN_TRANSIT
    ]]
    matched   = [b for b in bookings if b.status in [
        models.BookingStatus.MATCHED, models.BookingStatus.DRIVER_ASSIGNED,
        models.BookingStatus.DRIVER_ACCEPTED
    ]]
    completed = [b for b in bookings if b.status == models.BookingStatus.DELIVERED]

    # Calculate savings
    total_allocated = sum(b.allocated_cost or 0 for b in completed)

    notifications = db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id,
        models.Notification.is_read == False
    ).count()

    return {
        "total_bookings":       len(bookings),
        "active_bookings":      len(active),
        "matched_bookings":     len(matched),
        "completed_bookings":   len(completed),
        "total_cost_paid":      round(total_allocated, 2),
        "unread_notifications": notifications,
        "recent_bookings":      [
            {
                "id":           b.id,
                "produce":      b.produce_type,
                "quantity":     b.quantity_kg,
                "status":       b.status.value,
                "destination":  b.destination_name,
                "date":         b.preferred_date,
                "allocated_cost": b.allocated_cost,
            }
            for b in sorted(bookings, key=lambda x: x.created_at, reverse=True)[:5]
        ]
    }


@router.get("/all", response_model=List[schemas.FarmerOut])
def get_all_farmers(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("ADMIN"))
):
    """Admin: Get all farmers."""
    farmers = db.query(models.Farmer).all()
    result = []
    for f in farmers:
        f.full_name = f.user.full_name
        f.email     = f.user.email
        f.phone     = f.user.phone
        result.append(f)
    return result
