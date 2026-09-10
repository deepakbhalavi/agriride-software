"""AgriRide – Admin router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas
from utils.auth import require_role

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/dashboard", response_model=schemas.AdminDashboardStats)
def admin_dashboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("ADMIN"))
):
    total_farmers  = db.query(models.Farmer).count()
    total_drivers  = db.query(models.Driver).count()
    total_vehicles = db.query(models.Vehicle).count()
    total_bookings = db.query(models.Booking).count()

    active_trips    = db.query(models.SharedTrip).filter(
        models.SharedTrip.status.in_([
            models.TripStatus.DRIVER_ASSIGNED, models.TripStatus.DRIVER_ACCEPTED,
            models.TripStatus.PICKUP_IN_PROGRESS, models.TripStatus.IN_TRANSIT
        ])
    ).count()
    completed_trips = db.query(models.SharedTrip).filter(
        models.SharedTrip.status == models.TripStatus.DELIVERED
    ).count()
    cancelled_trips = db.query(models.SharedTrip).filter(
        models.SharedTrip.status == models.TripStatus.CANCELLED
    ).count()

    # Estimated savings: compare shared trip costs vs individual estimates
    completed = db.query(models.SharedTrip).filter(
        models.SharedTrip.status == models.TripStatus.DELIVERED
    ).all()
    config = db.query(models.MatchingConfig).first()
    if config:
        estimated_savings = 0.0
        for t in completed:
            n_farmers        = len(t.trip_bookings)
            individual_cost  = (t.total_cost or 0) * n_farmers
            shared_cost      = t.total_cost or 0
            estimated_savings += max(0, individual_cost - shared_cost)
    else:
        estimated_savings = 0.0

    # Vehicle utilization
    vehicles = db.query(models.Vehicle).all()
    if vehicles:
        busy = sum(1 for v in vehicles if not v.is_available)
        avg_util = (busy / len(vehicles)) * 100
    else:
        avg_util = 0.0

    matched_bookings = db.query(models.Booking).filter(
        models.Booking.status != models.BookingStatus.REQUESTED,
        models.Booking.status != models.BookingStatus.CANCELLED
    ).count()
    pending_bookings = db.query(models.Booking).filter(
        models.Booking.status == models.BookingStatus.REQUESTED
    ).count()

    return schemas.AdminDashboardStats(
        total_farmers=total_farmers,
        total_drivers=total_drivers,
        total_vehicles=total_vehicles,
        total_bookings=total_bookings,
        active_trips=active_trips,
        completed_trips=completed_trips,
        cancelled_trips=cancelled_trips,
        estimated_savings=round(estimated_savings, 2),
        avg_vehicle_util=round(avg_util, 1),
        matched_bookings=matched_bookings,
        pending_bookings=pending_bookings,
    )


@router.get("/reports")
def get_reports(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("ADMIN"))
):
    """Research evaluation metrics."""
    bookings       = db.query(models.Booking).all()
    shared_trips   = db.query(models.SharedTrip).all()
    completed      = [t for t in shared_trips if t.status == models.TripStatus.DELIVERED]

    total_bookings = len(bookings)
    matched        = [b for b in bookings if b.status != models.BookingStatus.REQUESTED
                      and b.status != models.BookingStatus.CANCELLED]
    match_rate     = (len(matched) / total_bookings * 100) if total_bookings else 0.0

    avg_farmer_cost = 0.0
    total_distance  = 0.0
    total_savings   = 0.0
    vehicles_needed_shared     = len(shared_trips)
    vehicles_needed_individual = sum(len(t.trip_bookings) for t in shared_trips)

    if completed:
        costs = [t.total_cost or 0 for t in completed]
        avg_farmer_cost = sum(costs) / len(completed)
        total_distance  = sum(t.total_distance_km or 0 for t in completed)
        for t in completed:
            n = len(t.trip_bookings)
            total_savings += max(0, (t.total_cost or 0) * n - (t.total_cost or 0))

    # Bookings per day (last 7 days)
    from collections import defaultdict
    daily_bookings = defaultdict(int)
    for b in bookings:
        day = b.created_at.strftime("%Y-%m-%d")
        daily_bookings[day] += 1

    return {
        "matching_success_rate":        round(match_rate, 1),
        "total_shared_trips":           len(shared_trips),
        "completed_trips":              len(completed),
        "avg_farmer_cost":              round(avg_farmer_cost, 2),
        "total_distance_km":            round(total_distance, 2),
        "estimated_total_savings":      round(total_savings, 2),
        "vehicles_needed_shared":       vehicles_needed_shared,
        "vehicles_needed_individual":   vehicles_needed_individual,
        "vehicle_reduction":            vehicles_needed_individual - vehicles_needed_shared,
        "daily_bookings":               dict(daily_bookings),
        "total_bookings":               total_bookings,
        "matched_bookings":             len(matched),
    }


@router.get("/config", response_model=schemas.MatchingConfigOut)
def get_config(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("ADMIN"))
):
    config = db.query(models.MatchingConfig).first()
    if not config:
        config = models.MatchingConfig()
        db.add(config)
        db.commit()
        db.refresh(config)
    return config


@router.put("/config", response_model=schemas.MatchingConfigOut)
def update_config(
    req: schemas.MatchingConfigUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("ADMIN"))
):
    config = db.query(models.MatchingConfig).first()
    if not config:
        config = models.MatchingConfig()
        db.add(config)

    update_data = req.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(config, key, val)

    # Validate weights sum
    total_weight = (
        (config.weight_destination or 0)
        + (config.weight_proximity or 0)
        + (config.weight_time or 0)
        + (config.weight_capacity or 0)
    )
    if abs(total_weight - 1.0) > 0.05:
        raise HTTPException(
            status_code=400,
            detail=f"Weights must sum to 1.0. Current sum: {round(total_weight, 3)}"
        )

    db.commit()
    db.refresh(config)
    return config


@router.put("/users/{user_id}/toggle-active")
def toggle_user_active(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("ADMIN"))
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = not user.is_active
    db.commit()
    return {"user_id": user_id, "is_active": user.is_active}


@router.get("/users")
def get_all_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("ADMIN"))
):
    users = db.query(models.User).all()
    return [
        {
            "id":        u.id,
            "email":     u.email,
            "full_name": u.full_name,
            "role":      u.role.value,
            "is_active": u.is_active,
            "phone":     u.phone,
            "created_at": u.created_at.isoformat(),
        }
        for u in users
    ]
