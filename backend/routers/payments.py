"""AgriRide – Payments router (mock payment flow for research prototype)."""
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from utils.auth import get_current_user, require_role
from services.notification_service import create_notification

router = APIRouter(prefix="/api/payments", tags=["Payments"])


@router.post("", response_model=schemas.PaymentOut)
def initiate_payment(
    req: schemas.PaymentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("FARMER"))
):
    """
    Initiate a mock payment for a booking.
    NOTE: This is a research prototype – no real financial transactions are processed.
    """
    booking = db.query(models.Booking).filter(models.Booking.id == req.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.allocated_cost is None:
        raise HTTPException(status_code=400, detail="Cost not yet calculated for this booking")

    # Check if payment already exists
    existing = db.query(models.Payment).filter(models.Payment.booking_id == req.booking_id).first()
    if existing and existing.payment_status == models.PaymentStatus.SUCCESS:
        raise HTTPException(status_code=400, detail="Payment already completed")

    payment = models.Payment(
        booking_id=req.booking_id,
        amount=booking.allocated_cost,
        payment_method=req.payment_method,
        payment_status=models.PaymentStatus.PENDING,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


@router.post("/{payment_id}/process", response_model=schemas.PaymentOut)
def process_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("FARMER"))
):
    """
    Process (confirm) a mock payment.
    In a real system this would call a payment gateway.
    For this research prototype, it immediately marks as SUCCESS.
    """
    payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    payment.payment_status        = models.PaymentStatus.SUCCESS
    payment.transaction_reference = f"AGR-{uuid.uuid4().hex[:10].upper()}"
    payment.paid_at               = datetime.utcnow()
    db.commit()
    db.refresh(payment)

    # Notify farmer
    create_notification(
        db, current_user.id, "PAYMENT_SUCCESS", related_id=payment.id,
        amount=payment.amount, txn_id=payment.transaction_reference
    )
    return payment


@router.get("/{payment_id}", response_model=schemas.PaymentOut)
def get_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment


@router.get("/booking/{booking_id}", response_model=schemas.PaymentOut)
def get_payment_by_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    payment = db.query(models.Payment).filter(models.Payment.booking_id == booking_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="No payment found for this booking")
    return payment
