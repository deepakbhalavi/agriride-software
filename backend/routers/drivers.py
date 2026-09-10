"""AgriRide – Drivers router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas
from utils.auth import get_current_user, require_role

router = APIRouter(prefix="/api/drivers", tags=["Drivers"])


@router.get("/profile", response_model=schemas.DriverOut)
def get_driver_profile(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("DRIVER"))
):
    driver = db.query(models.Driver).filter(models.Driver.user_id == current_user.id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver profile not found")
    driver.full_name = current_user.full_name
    driver.email     = current_user.email
    driver.phone     = current_user.phone
    return driver


@router.put("/profile", response_model=schemas.DriverOut)
def update_driver_profile(
    req: schemas.DriverProfileUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("DRIVER"))
):
    driver = db.query(models.Driver).filter(models.Driver.user_id == current_user.id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver profile not found")

    update_data = req.model_dump(exclude_unset=True)
    user_fields = {"full_name", "phone"}
    for key, val in update_data.items():
        if key in user_fields:
            setattr(current_user, key, val)
        else:
            setattr(driver, key, val)
    db.commit()
    db.refresh(driver)
    driver.full_name = current_user.full_name
    driver.email     = current_user.email
    driver.phone     = current_user.phone
    return driver


@router.get("/dashboard-stats")
def get_driver_dashboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("DRIVER"))
):
    driver = db.query(models.Driver).filter(models.Driver.user_id == current_user.id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver profile not found")

    trips = db.query(models.SharedTrip).filter(models.SharedTrip.driver_id == driver.id).all()
    active_trips    = [t for t in trips if t.status in [
        models.TripStatus.DRIVER_ACCEPTED, models.TripStatus.PICKUP_IN_PROGRESS, models.TripStatus.IN_TRANSIT
    ]]
    completed_trips = [t for t in trips if t.status == models.TripStatus.DELIVERED]
    pending_trips   = db.query(models.SharedTrip).filter(
        models.SharedTrip.status == models.TripStatus.DRIVER_ASSIGNED
    ).all()

    total_load_today = sum(t.total_load_kg for t in active_trips)
    total_earnings   = sum(t.total_cost or 0 for t in completed_trips)

    vehicles = db.query(models.Vehicle).filter(models.Vehicle.driver_id == driver.id).all()

    return {
        "available_trips":     len(pending_trips),
        "accepted_trips":      len(active_trips),
        "completed_trips":     len(completed_trips),
        "today_load_kg":       total_load_today,
        "total_earnings":      round(total_earnings, 2),
        "vehicle_count":       len(vehicles),
        "is_available":        driver.is_available,
        "rating":              driver.rating,
        "recent_trips": [
            {
                "id":          t.id,
                "destination": t.destination_name,
                "load_kg":     t.total_load_kg,
                "status":      t.status.value,
                "cost":        t.total_cost,
                "date":        t.scheduled_date,
            }
            for t in sorted(trips, key=lambda x: x.created_at, reverse=True)[:5]
        ]
    }


@router.get("/all", response_model=List[schemas.DriverOut])
def get_all_drivers(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("ADMIN"))
):
    drivers = db.query(models.Driver).all()
    result = []
    for d in drivers:
        d.full_name = d.user.full_name
        d.email     = d.user.email
        d.phone     = d.user.phone
        result.append(d)
    return result
