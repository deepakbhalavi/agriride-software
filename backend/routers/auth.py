"""AgriRide – Authentication router (register, login)."""
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from utils.auth import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=schemas.TokenResponse)
def register(req: schemas.RegisterRequest, db: Session = Depends(get_db)):
    """Register a new Farmer or Driver account."""
    # Check duplicate email
    if db.query(models.User).filter(models.User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Admin self-registration is not allowed
    if req.role == models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin accounts cannot self-register")

    user = models.User(
        email=req.email,
        hashed_password=hash_password(req.password),
        role=req.role,
        full_name=req.full_name,
        phone=req.phone,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Create role-specific profile
    if req.role == models.UserRole.FARMER:
        farmer = models.Farmer(user_id=user.id)
        db.add(farmer)
    elif req.role == models.UserRole.DRIVER:
        driver = models.Driver(user_id=user.id)
        db.add(driver)
    db.commit()

    token = create_access_token({"sub": str(user.id), "role": req.role.value})
    return schemas.TokenResponse(
        access_token=token,
        role=user.role,
        user_id=user.id,
        full_name=user.full_name,
    )


@router.post("/login", response_model=schemas.TokenResponse)
def login(req: schemas.LoginRequest, db: Session = Depends(get_db)):
    """Login and receive a JWT token."""
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return schemas.TokenResponse(
        access_token=token,
        role=user.role,
        user_id=user.id,
        full_name=user.full_name,
    )


@router.get("/me", response_model=schemas.UserOut)
def get_me(db: Session = Depends(get_db), current_user: models.User = Depends(
    __import__("utils.auth", fromlist=["get_current_user"]).get_current_user
)):
    """Return current logged-in user info."""
    return current_user
