"""
AgriRide – Pydantic Schemas for request/response validation.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field
from models import (
    UserRole, BookingStatus, TripStatus, MatchResult,
    PaymentStatus, VehicleType
)


# ─────────────────────────────────────────────────────────────
# Auth
# ─────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email:     EmailStr
    password:  str = Field(min_length=6)
    full_name: str
    phone:     Optional[str] = None
    role:      UserRole

class LoginRequest(BaseModel):
    email:    EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    role:         UserRole
    user_id:      int
    full_name:    str

class UserOut(BaseModel):
    id:        int
    email:     str
    role:      UserRole
    full_name: str
    phone:     Optional[str]
    is_active: bool
    created_at: datetime
    class Config:
        from_attributes = True


# ─────────────────────────────────────────────────────────────
# Farmer
# ─────────────────────────────────────────────────────────────

class FarmerProfileUpdate(BaseModel):
    farm_name:     Optional[str]  = None
    address:       Optional[str]  = None
    city:          Optional[str]  = None
    state:         Optional[str]  = None
    pincode:       Optional[str]  = None
    latitude:      Optional[float] = None
    longitude:     Optional[float] = None
    location_name: Optional[str]  = None
    full_name:     Optional[str]  = None
    phone:         Optional[str]  = None

class FarmerOut(BaseModel):
    id:            int
    user_id:       int
    farm_name:     Optional[str]
    address:       Optional[str]
    city:          Optional[str]
    state:         Optional[str]
    latitude:      Optional[float]
    longitude:     Optional[float]
    location_name: Optional[str]
    full_name:     str
    email:         str
    phone:         Optional[str]
    class Config:
        from_attributes = True


# ─────────────────────────────────────────────────────────────
# Driver
# ─────────────────────────────────────────────────────────────

class DriverProfileUpdate(BaseModel):
    license_no:    Optional[str]   = None
    experience:    Optional[int]   = None
    latitude:      Optional[float] = None
    longitude:     Optional[float] = None
    location_name: Optional[str]   = None
    is_available:  Optional[bool]  = None
    full_name:     Optional[str]   = None
    phone:         Optional[str]   = None

class DriverOut(BaseModel):
    id:            int
    user_id:       int
    license_no:    Optional[str]
    experience:    Optional[int]
    rating:        float
    latitude:      Optional[float]
    longitude:     Optional[float]
    location_name: Optional[str]
    is_available:  bool
    full_name:     str
    email:         str
    phone:         Optional[str]
    class Config:
        from_attributes = True


# ─────────────────────────────────────────────────────────────
# Vehicle
# ─────────────────────────────────────────────────────────────

class VehicleCreate(BaseModel):
    registration_number: str
    vehicle_type:        VehicleType
    capacity_kg:         float
    make_model:          Optional[str] = None
    year:                Optional[int] = None

class VehicleUpdate(BaseModel):
    vehicle_type:  Optional[VehicleType] = None
    capacity_kg:   Optional[float]       = None
    make_model:    Optional[str]         = None
    is_available:  Optional[bool]        = None

class VehicleOut(BaseModel):
    id:                  int
    driver_id:           int
    registration_number: str
    vehicle_type:        VehicleType
    capacity_kg:         float
    make_model:          Optional[str]
    year:                Optional[int]
    is_available:        bool
    class Config:
        from_attributes = True


# ─────────────────────────────────────────────────────────────
# Booking
# ─────────────────────────────────────────────────────────────

class BookingCreate(BaseModel):
    produce_type:          str
    quantity_kg:           float = Field(gt=0)
    pickup_latitude:       float
    pickup_longitude:      float
    pickup_location_name:  str
    destination_name:      str
    destination_latitude:  Optional[float] = None
    destination_longitude: Optional[float] = None
    preferred_date:        str   # YYYY-MM-DD
    earliest_pickup_time:  str   # HH:MM
    latest_pickup_time:    str   # HH:MM
    special_requirements:  Optional[str] = None

class BookingUpdate(BaseModel):
    produce_type:         Optional[str]   = None
    quantity_kg:          Optional[float] = None
    pickup_location_name: Optional[str]   = None
    preferred_date:       Optional[str]   = None
    earliest_pickup_time: Optional[str]   = None
    latest_pickup_time:   Optional[str]   = None
    special_requirements: Optional[str]   = None
    status:               Optional[BookingStatus] = None

class BookingOut(BaseModel):
    id:                    int
    farmer_id:             int
    produce_type:          str
    quantity_kg:           float
    pickup_latitude:       float
    pickup_longitude:      float
    pickup_location_name:  str
    destination_name:      str
    destination_latitude:  Optional[float]
    destination_longitude: Optional[float]
    preferred_date:        str
    earliest_pickup_time:  str
    latest_pickup_time:    str
    special_requirements:  Optional[str]
    status:                BookingStatus
    allocated_cost:        Optional[float]
    created_at:            datetime
    class Config:
        from_attributes = True


# ─────────────────────────────────────────────────────────────
# Shared Trip
# ─────────────────────────────────────────────────────────────

class SharedTripOut(BaseModel):
    id:                    int
    driver_id:             Optional[int]
    vehicle_id:            Optional[int]
    destination_name:      str
    total_load_kg:         float
    total_distance_km:     Optional[float]
    total_cost:            Optional[float]
    base_cost:             Optional[float]
    distance_cost:         Optional[float]
    handling_cost:         Optional[float]
    pickup_sequence:       Optional[str]
    status:                TripStatus
    match_result:          MatchResult
    compatibility_score:   Optional[float]
    scheduled_date:        Optional[str]
    estimated_start_time:  Optional[str]
    created_at:            datetime
    class Config:
        from_attributes = True


# ─────────────────────────────────────────────────────────────
# Cost Allocation
# ─────────────────────────────────────────────────────────────

class CostAllocationOut(BaseModel):
    id:             int
    shared_trip_id: int
    booking_id:     int
    farmer_id:      int
    quantity_kg:    Optional[float]
    percentage:     Optional[float]
    amount:         Optional[float]
    method:         Optional[str]
    class Config:
        from_attributes = True


# ─────────────────────────────────────────────────────────────
# Payment
# ─────────────────────────────────────────────────────────────

class PaymentCreate(BaseModel):
    booking_id:     int
    payment_method: str   # UPI | CASH | CARD | BANK_TRANSFER

class PaymentOut(BaseModel):
    id:                    int
    booking_id:            int
    amount:                float
    payment_method:        Optional[str]
    payment_status:        PaymentStatus
    transaction_reference: Optional[str]
    paid_at:               Optional[datetime]
    created_at:            datetime
    class Config:
        from_attributes = True


# ─────────────────────────────────────────────────────────────
# Notification
# ─────────────────────────────────────────────────────────────

class NotificationOut(BaseModel):
    id:         int
    user_id:    int
    title:      str
    message:    str
    notif_type: Optional[str]
    is_read:    bool
    related_id: Optional[int]
    created_at: datetime
    class Config:
        from_attributes = True


# ─────────────────────────────────────────────────────────────
# Matching Configuration
# ─────────────────────────────────────────────────────────────

class MatchingConfigOut(BaseModel):
    id:                     int
    weight_destination:     float
    weight_proximity:       float
    weight_time:            float
    weight_capacity:        float
    max_pickup_distance_km: float
    destination_radius_km:  float
    min_time_overlap_min:   float
    min_load_kg:            float
    max_load_kg:            float
    base_vehicle_cost:      float
    cost_per_km:            float
    handling_cost:          float
    class Config:
        from_attributes = True

class MatchingConfigUpdate(BaseModel):
    weight_destination:     Optional[float] = None
    weight_proximity:       Optional[float] = None
    weight_time:            Optional[float] = None
    weight_capacity:        Optional[float] = None
    max_pickup_distance_km: Optional[float] = None
    destination_radius_km:  Optional[float] = None
    min_time_overlap_min:   Optional[float] = None
    min_load_kg:            Optional[float] = None
    max_load_kg:            Optional[float] = None
    base_vehicle_cost:      Optional[float] = None
    cost_per_km:            Optional[float] = None
    handling_cost:          Optional[float] = None


# ─────────────────────────────────────────────────────────────
# Matching Engine Response
# ─────────────────────────────────────────────────────────────

class CompatibleGroup(BaseModel):
    booking_ids:         List[int]
    farmer_names:        List[str]
    total_load_kg:       float
    destination:         str
    compatibility_score: float
    match_result:        str
    distance_km:         float
    time_overlap_ok:     bool
    capacity_ok:         bool
    recommended_vehicle_id: Optional[int] = None
    recommended_vehicle_capacity: Optional[float] = None

class MatchingRunResponse(BaseModel):
    groups_found:        int
    matched_groups:      List[CompatibleGroup]
    unmatched_bookings:  List[int]
    message:             str


# ─────────────────────────────────────────────────────────────
# Admin Dashboard
# ─────────────────────────────────────────────────────────────

class AdminDashboardStats(BaseModel):
    total_farmers:       int
    total_drivers:       int
    total_vehicles:      int
    total_bookings:      int
    active_trips:        int
    completed_trips:     int
    cancelled_trips:     int
    estimated_savings:   float
    avg_vehicle_util:    float
    matched_bookings:    int
    pending_bookings:    int
