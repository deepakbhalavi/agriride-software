"""
AgriRide – Notification Service

Creates in-app notifications for key system events.
"""
from sqlalchemy.orm import Session
import models


NOTIFICATION_TEMPLATES = {
    "BOOKING_CREATED":  ("Booking Created", "Your booking for {qty}kg of {produce} has been submitted successfully."),
    "BOOKING_MATCHED":  ("Shared Trip Found!", "Great news! Your booking has been matched with {count} other farmer(s) for a shared trip to {destination}."),
    "DRIVER_ASSIGNED":  ("Driver Assigned", "Driver {driver_name} has been assigned to your shared trip. Vehicle: {vehicle}."),
    "DRIVER_ACCEPTED":  ("Driver Accepted Trip", "Your driver has accepted the trip. Get ready for pickup!"),
    "DRIVER_REJECTED":  ("Driver Rejected Trip", "Your assigned driver could not accept the trip. Finding a new driver..."),
    "PICKUP_APPROACHING": ("Pickup Soon", "Your pickup is scheduled in the next 30 minutes. Please be ready."),
    "TRIP_STARTED":     ("Trip Started", "Your produce is now in transit to {destination}."),
    "TRIP_COMPLETED":   ("Trip Completed", "Your produce has been delivered to {destination}. Thank you!"),
    "PAYMENT_SUCCESS":  ("Payment Successful", "Payment of ₹{amount} received successfully. Transaction ID: {txn_id}"),
    "TRIP_REQUEST":     ("New Shared Trip Request", "You have a new shared trip request. Total load: {load}kg. Tap to view details."),
}


def create_notification(
    db: Session,
    user_id: int,
    notif_type: str,
    related_id: int = None,
    **kwargs
) -> models.Notification:
    """
    Create a notification for a user.

    Parameters:
        db:         Database session
        user_id:    Recipient user ID
        notif_type: Key from NOTIFICATION_TEMPLATES
        related_id: Optional ID of related entity (booking, trip)
        **kwargs:   Template substitution variables
    """
    title_tmpl, msg_tmpl = NOTIFICATION_TEMPLATES.get(
        notif_type, ("Notification", "You have a new notification.")
    )
    try:
        title   = title_tmpl.format(**kwargs)
        message = msg_tmpl.format(**kwargs)
    except KeyError:
        title   = title_tmpl
        message = msg_tmpl

    notif = models.Notification(
        user_id=user_id,
        title=title,
        message=message,
        notif_type=notif_type,
        related_id=related_id,
        is_read=False,
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


def mark_read(db: Session, notif_id: int, user_id: int) -> bool:
    notif = db.query(models.Notification).filter(
        models.Notification.id == notif_id,
        models.Notification.user_id == user_id
    ).first()
    if notif:
        notif.is_read = True
        db.commit()
        return True
    return False
