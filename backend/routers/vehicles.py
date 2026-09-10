"""AgriRide – Vehicles router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas
from utils.auth import get_current_user, require_role

router = APIRouter(prefix="/api/vehicles", tags=["Vehicles"])


@router.post("", response_model=schemas.VehicleOut)
def add_vehicle(
    req: schemas.VehicleCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("DRIVER"))
):
    driver = db.query(models.Driver).filter(models.Driver.user_id == current_user.id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver profile not found")

    # Check duplicate registration
    existing = db.query(models.Vehicle).filter(
        models.Vehicle.registration_number == req.registration_number
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Vehicle with this registration already exists")

    vehicle = models.Vehicle(
        driver_id=driver.id,
        registration_number=req.registration_number,
        vehicle_type=req.vehicle_type,
        capacity_kg=req.capacity_kg,
        make_model=req.make_model,
        year=req.year,
    )
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.get("/my", response_model=List[schemas.VehicleOut])
def get_my_vehicles(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("DRIVER"))
):
    driver = db.query(models.Driver).filter(models.Driver.user_id == current_user.id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver profile not found")
    return db.query(models.Vehicle).filter(models.Vehicle.driver_id == driver.id).all()


@router.get("", response_model=List[schemas.VehicleOut])
def get_all_vehicles(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("ADMIN"))
):
    return db.query(models.Vehicle).all()


@router.put("/{vehicle_id}", response_model=schemas.VehicleOut)
def update_vehicle(
    vehicle_id: int,
    req: schemas.VehicleUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("DRIVER"))
):
    driver  = db.query(models.Driver).filter(models.Driver.user_id == current_user.id).first()
    vehicle = db.query(models.Vehicle).filter(
        models.Vehicle.id == vehicle_id,
        models.Vehicle.driver_id == driver.id
    ).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    update_data = req.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(vehicle, key, val)
    db.commit()
    db.refresh(vehicle)
    return vehicle
