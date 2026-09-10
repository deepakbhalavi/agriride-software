"""
AgriRide – SQLAlchemy ORM Models

Tables:
  1. users            – unified auth (FARMER | DRIVER | ADMIN)
  2. farmers          – farmer profile + location geopoint
  3. drivers          – driver profile + rating
  4. vehicles         – vehicle details (capacity, type, registration)
  5. bookings         – farmer transportation requests
  6. shared_trips     – grouped matched bookings
  7. trip_bookings    – N:M junction: booking ↔ shared_trip
  8. cost_allocations – per-farmer cost share per trip
  9. payments         – payment record per booking
 10. notifications    – system notifications
 11. matching_config  – admin-configurable matching parameters
"""

from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime,
    ForeignKey, Text, Enum as SAEnum
)
from sqlalchemy.orm import relationship
from database import Base
import enum


# ─────────────────────────────────────────────────────────────
# Enumerations
# ─────────────────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    FARMER = "FARMER"
    DRIVER = "DRIVER"
    ADMIN  = "ADMIN"


class BookingStatus(str, enum.Enum):
    REQUESTED         = "REQUESTED"
    MATCHED           = "MATCHED"
    DRIVER_ASSIGNED   = "DRIVER_ASSIGNED"
    DRIVER_ACCEPTED   = "DRIVER_ACCEPTED"
    PICKUP_IN_PROGRESS = "PICKUP_IN_PROGRESS"
    IN_TRANSIT        = "IN_TRANSIT"
    DELIVERED         = "DELIVERED"
    CANCELLED         = "CANCELLED"


class TripStatus(str, enum.Enum):
    REQUESTED         = "REQUESTED"
    MATCHED           = "MATCHED"
    DRIVER_ASSIGNED   = "DRIVER_ASSIGNED"
    DRIVER_ACCEPTED   = "DRIVER_ACCEPTED"
    PICKUP_IN_PROGRESS = "PICKUP_IN_PROGRESS"
    IN_TRANSIT        = "IN_TRANSIT"
    DELIVERED         = "DELIVERED"
    CANCELLED         = "CANCELLED"


class MatchResult(str, enum.Enum):
    MATCHED           = "MATCHED"
    PARTIALLY_MATCHED = "PARTIALLY_MATCHED"
    NOT_MATCHED       = "NOT_MATCHED"


class PaymentStatus(str, enum.Enum):
    PENDING  = "PENDING"
    SUCCESS  = "SUCCESS"
    FAILED   = "FAILED"
    REFUNDED = "REFUNDED"


class VehicleType(str, enum.Enum):
    MINI_TRUCK    = "MINI_TRUCK"
    PICKUP_TRUCK  = "PICKUP_TRUCK"
    TEMPO         = "TEMPO"
    TRACTOR       = "TRACTOR"
    LARGE_TRUCK   = "LARGE_TRUCK"


# ─────────────────────────────────────────────────────────────
# 1. Users (unified auth)
# ─────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    email           = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role            = Column(SAEnum(UserRole), nullable=False)
    full_name       = Column(String(255), nullable=False)
    phone           = Column(String(20))
    is_active       = Column(Boolean, default=True)
    created_at      = Column(DateTime, default=datetime.utcnow)
    updated_at      = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    farmer  = relationship("Farmer", back_populates="user", uselist=False)
    driver  = relationship("Driver", back_populates="user", uselist=False)


# ─────────────────────────────────────────────────────────────
# 2. Farmers
# ─────────────────────────────────────────────────────────────

class Farmer(Base):
    __tablename__ = "farmers"

    id            = Column(Integer, primary_key=True, index=True)
    user_id       = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    farm_name     = Column(String(255))
    address       = Column(Text)
    city          = Column(String(100))
    state         = Column(String(100))
    pincode       = Column(String(10))
    # Geopoint stored as two numeric fields (latitude, longitude)
    latitude      = Column(Float)
    longitude     = Column(Float)
    location_name = Column(String(255))  # Human-readable village/area name
    created_at    = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user     = relationship("User", back_populates="farmer")
    bookings = relationship("Booking", back_populates="farmer")


# ─────────────────────────────────────────────────────────────
# 3. Drivers
# ─────────────────────────────────────────────────────────────

class Driver(Base):
    __tablename__ = "drivers"

    id            = Column(Integer, primary_key=True, index=True)
    user_id       = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    license_no    = Column(String(50))
    experience    = Column(Integer, default=0)    # years
    rating        = Column(Float, default=5.0)
    # Current location geopoint
    latitude      = Column(Float)
    longitude     = Column(Float)
    location_name = Column(String(255))
    is_available  = Column(Boolean, default=True)
    created_at    = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user         = relationship("User", back_populates="driver")
    vehicles     = relationship("Vehicle", back_populates="driver")
    shared_trips = relationship("SharedTrip", back_populates="driver")


# ─────────────────────────────────────────────────────────────
# 4. Vehicles
# ─────────────────────────────────────────────────────────────

class Vehicle(Base):
    __tablename__ = "vehicles"

    id                  = Column(Integer, primary_key=True, index=True)
    driver_id           = Column(Integer, ForeignKey("drivers.id"), nullable=False)
    registration_number = Column(String(50), unique=True, nullable=False)
    vehicle_type        = Column(SAEnum(VehicleType), nullable=False)
    capacity_kg         = Column(Float, nullable=False)      # Maximum load in kg
    make_model          = Column(String(100))                # e.g. Tata Ace
    year                = Column(Integer)
    is_available        = Column(Boolean, default=True)
    created_at          = Column(DateTime, default=datetime.utcnow)

    # Relationships
    driver       = relationship("Driver", back_populates="vehicles")
    shared_trips = relationship("SharedTrip", back_populates="vehicle")


# ─────────────────────────────────────────────────────────────
# 5. Bookings
# ─────────────────────────────────────────────────────────────

class Booking(Base):
    __tablename__ = "bookings"

    id                    = Column(Integer, primary_key=True, index=True)
    farmer_id             = Column(Integer, ForeignKey("farmers.id"), nullable=False)
    produce_type          = Column(String(100), nullable=False)
    quantity_kg           = Column(Float, nullable=False)
    # Pickup location
    pickup_latitude       = Column(Float, nullable=False)
    pickup_longitude      = Column(Float, nullable=False)
    pickup_location_name  = Column(String(255), nullable=False)
    # Destination market
    destination_name      = Column(String(255), nullable=False)
    destination_latitude  = Column(Float)
    destination_longitude = Column(Float)
    # Time window
    preferred_date        = Column(String(20), nullable=False)   # YYYY-MM-DD
    earliest_pickup_time  = Column(String(10), nullable=False)   # HH:MM
    latest_pickup_time    = Column(String(10), nullable=False)   # HH:MM
    # Optional
    special_requirements  = Column(Text)
    status                = Column(SAEnum(BookingStatus), default=BookingStatus.REQUESTED)
    # Calculated after matching
    allocated_cost        = Column(Float)
    created_at            = Column(DateTime, default=datetime.utcnow)
    updated_at            = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    farmer        = relationship("Farmer", back_populates="bookings")
    trip_bookings = relationship("TripBooking", back_populates="booking")
    payment       = relationship("Payment", back_populates="booking", uselist=False)


# ─────────────────────────────────────────────────────────────
# 6. SharedTrip
# ─────────────────────────────────────────────────────────────

class SharedTrip(Base):
    __tablename__ = "shared_trips"

    id                    = Column(Integer, primary_key=True, index=True)
    driver_id             = Column(Integer, ForeignKey("drivers.id"))
    vehicle_id            = Column(Integer, ForeignKey("vehicles.id"))
    destination_name      = Column(String(255), nullable=False)
    destination_latitude  = Column(Float)
    destination_longitude = Column(Float)
    total_load_kg         = Column(Float, nullable=False)
    total_distance_km     = Column(Float)
    total_cost            = Column(Float)
    base_cost             = Column(Float)
    distance_cost         = Column(Float)
    handling_cost         = Column(Float)
    pickup_sequence       = Column(Text)   # JSON string of ordered pickup locations
    status                = Column(SAEnum(TripStatus), default=TripStatus.REQUESTED)
    match_result          = Column(SAEnum(MatchResult), default=MatchResult.MATCHED)
    compatibility_score   = Column(Float)  # 0-100 score
    scheduled_date        = Column(String(20))
    estimated_start_time  = Column(String(10))
    created_at            = Column(DateTime, default=datetime.utcnow)
    updated_at            = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    driver           = relationship("Driver", back_populates="shared_trips")
    vehicle          = relationship("Vehicle", back_populates="shared_trips")
    trip_bookings    = relationship("TripBooking", back_populates="shared_trip")
    cost_allocations = relationship("CostAllocation", back_populates="shared_trip")


# ─────────────────────────────────────────────────────────────
# 7. TripBooking – Junction table (Booking ↔ SharedTrip)
# ─────────────────────────────────────────────────────────────

class TripBooking(Base):
    __tablename__ = "trip_bookings"

    id             = Column(Integer, primary_key=True, index=True)
    shared_trip_id = Column(Integer, ForeignKey("shared_trips.id"), nullable=False)
    booking_id     = Column(Integer, ForeignKey("bookings.id"), nullable=False)
    pickup_order   = Column(Integer)   # Sequence position in optimized route
    pickup_eta     = Column(String(10))  # Estimated pickup time HH:MM

    # Relationships
    shared_trip = relationship("SharedTrip", back_populates="trip_bookings")
    booking     = relationship("Booking", back_populates="trip_bookings")


# ─────────────────────────────────────────────────────────────
# 8. CostAllocation
# ─────────────────────────────────────────────────────────────

class CostAllocation(Base):
    __tablename__ = "cost_allocations"

    id             = Column(Integer, primary_key=True, index=True)
    shared_trip_id = Column(Integer, ForeignKey("shared_trips.id"), nullable=False)
    booking_id     = Column(Integer, ForeignKey("bookings.id"), nullable=False)
    farmer_id      = Column(Integer, ForeignKey("farmers.id"), nullable=False)
    quantity_kg    = Column(Float)
    percentage     = Column(Float)   # Farmer's share percentage
    amount         = Column(Float)   # Allocated cost in ₹
    method         = Column(String(50), default="QUANTITY_PROPORTIONAL")
    created_at     = Column(DateTime, default=datetime.utcnow)

    # Relationships
    shared_trip = relationship("SharedTrip", back_populates="cost_allocations")


# ─────────────────────────────────────────────────────────────
# 9. Payments
# ─────────────────────────────────────────────────────────────

class Payment(Base):
    __tablename__ = "payments"

    id                    = Column(Integer, primary_key=True, index=True)
    booking_id            = Column(Integer, ForeignKey("bookings.id"), unique=True, nullable=False)
    amount                = Column(Float, nullable=False)
    payment_method        = Column(String(50))   # UPI | CASH | CARD | BANK_TRANSFER
    payment_status        = Column(SAEnum(PaymentStatus), default=PaymentStatus.PENDING)
    transaction_reference = Column(String(100))
    paid_at               = Column(DateTime)
    created_at            = Column(DateTime, default=datetime.utcnow)

    # Relationships
    booking = relationship("Booking", back_populates="payment")


# ─────────────────────────────────────────────────────────────
# 10. Notifications
# ─────────────────────────────────────────────────────────────

class Notification(Base):
    __tablename__ = "notifications"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    title      = Column(String(255), nullable=False)
    message    = Column(Text, nullable=False)
    notif_type = Column(String(50))   # BOOKING | TRIP | PAYMENT | SYSTEM
    is_read    = Column(Boolean, default=False)
    related_id = Column(Integer)      # e.g., booking_id or trip_id
    created_at = Column(DateTime, default=datetime.utcnow)


# ─────────────────────────────────────────────────────────────
# 11. MatchingConfiguration – Admin-configurable weights
# ─────────────────────────────────────────────────────────────

class MatchingConfig(Base):
    __tablename__ = "matching_config"

    id = Column(Integer, primary_key=True, index=True)

    # Scoring weights (must sum to 1.0)
    weight_destination  = Column(Float, default=0.30)   # 30%
    weight_proximity    = Column(Float, default=0.25)   # 25%
    weight_time         = Column(Float, default=0.20)   # 20%
    weight_capacity     = Column(Float, default=0.25)   # 25%

    # Thresholds
    max_pickup_distance_km  = Column(Float, default=15.0)  # Max distance between pickup points
    destination_radius_km   = Column(Float, default=5.0)   # Allow same-market if within radius
    min_time_overlap_min    = Column(Float, default=30.0)  # Minimum time-window overlap in minutes
    min_load_kg             = Column(Float, default=50.0)  # Minimum booking quantity
    max_load_kg             = Column(Float, default=5000.0)

    # Cost parameters
    base_vehicle_cost       = Column(Float, default=500.0)  # ₹ fixed base
    cost_per_km             = Column(Float, default=20.0)   # ₹ per km
    handling_cost           = Column(Float, default=200.0)  # ₹ optional

    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
