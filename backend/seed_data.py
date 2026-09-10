"""
AgriRide – Seed / Demo Data Script

Creates sample data for research demonstration:
  - 1 Admin
  - 10 Farmers (with varied produce, quantities, locations, time windows)
  - 3 Drivers
  - 4 Vehicles (different capacities)
  - Sample bookings for MATCHED and NOT MATCHED demonstration cases
  - Default matching configuration

Usage:
    cd backend
    python seed_data.py

IMPORTANT: Demo Dataset – all coordinates and values are simulated.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine
import models
from utils.auth import hash_password

models.Base.metadata.create_all(bind=engine)
db = SessionLocal()


def clear_data():
    """Remove existing seed data (non-destructive to user-created records)."""
    print("Clearing existing data...")
    db.query(models.Notification).delete()
    db.query(models.Payment).delete()
    db.query(models.CostAllocation).delete()
    db.query(models.TripBooking).delete()
    db.query(models.SharedTrip).delete()
    db.query(models.Booking).delete()
    db.query(models.Vehicle).delete()
    db.query(models.Driver).delete()
    db.query(models.Farmer).delete()
    db.query(models.MatchingConfig).delete()
    db.query(models.User).delete()
    db.commit()
    print("✓ Data cleared")


def seed_config():
    config = models.MatchingConfig(
        weight_destination=0.30,
        weight_proximity=0.25,
        weight_time=0.20,
        weight_capacity=0.25,
        max_pickup_distance_km=15.0,
        destination_radius_km=5.0,
        min_time_overlap_min=30.0,
        min_load_kg=50.0,
        max_load_kg=5000.0,
        base_vehicle_cost=500.0,
        cost_per_km=20.0,
        handling_cost=200.0,
    )
    db.add(config)
    db.commit()
    print("✓ Matching configuration seeded")
    return config


def seed_admin():
    admin_user = models.User(
        email="admin@agriride.com",
        hashed_password=hash_password("Admin@123"),
        role=models.UserRole.ADMIN,
        full_name="System Administrator",
        phone="9000000001",
        is_active=True,
    )
    db.add(admin_user)
    db.commit()
    print(f"✓ Admin: admin@agriride.com / Admin@123")
    return admin_user


# ─────────────────────────────────────────────────────────────
# Demo Farmer Data
# 10 farmers across 3 market groups to demonstrate MATCHED / NOT MATCHED
# All coordinates are simulated (near Pune, Maharashtra for demo)
# ─────────────────────────────────────────────────────────────

FARMER_DATA = [
    # Group 1 – Market X (Pune Mandai) – should MATCH (compatible time + location + capacity)
    {
        "email": "farmer1@agriride.com", "full_name": "Ramesh Patil",    "phone": "9111111111",
        "farm_name": "Patil Farm", "city": "Pune", "state": "Maharashtra",
        "lat": 18.5204, "lon": 73.8567, "location_name": "Village Aakurdi",
        "bookings": [{
            "produce": "Cauliflower", "qty": 300, "dest": "Pune Mandai Market",
            "dest_lat": 18.5088, "dest_lon": 73.8756,
            "pickup_name": "Village Aakurdi", "date": "2026-09-15",
            "early": "06:00", "late": "07:00",
        }]
    },
    {
        "email": "farmer2@agriride.com", "full_name": "Sunita Bhosale",  "phone": "9111111112",
        "farm_name": "Bhosale Sheti", "city": "Pune", "state": "Maharashtra",
        "lat": 18.5310, "lon": 73.8412, "location_name": "Village Bhosari",
        "bookings": [{
            "produce": "Tomato", "qty": 200, "dest": "Pune Mandai Market",
            "dest_lat": 18.5088, "dest_lon": 73.8756,
            "pickup_name": "Village Bhosari", "date": "2026-09-15",
            "early": "06:15", "late": "07:15",
        }]
    },
    {
        "email": "farmer3@agriride.com", "full_name": "Vijay Shinde",    "phone": "9111111113",
        "farm_name": "Shinde Farms", "city": "Pune", "state": "Maharashtra",
        "lat": 18.5260, "lon": 73.8500, "location_name": "Village Chikhali",
        "bookings": [{
            "produce": "Potato", "qty": 250, "dest": "Pune Mandai Market",
            "dest_lat": 18.5088, "dest_lon": 73.8756,
            "pickup_name": "Village Chikhali", "date": "2026-09-15",
            "early": "06:10", "late": "07:00",
        }]
    },
    # Group 2 – Market Y (Nashik Sabzi Mandi) – should MATCH
    {
        "email": "farmer4@agriride.com", "full_name": "Priya Desai",     "phone": "9111111114",
        "farm_name": "Desai Vegetables", "city": "Nashik", "state": "Maharashtra",
        "lat": 19.9975, "lon": 73.7898, "location_name": "Village Dindori",
        "bookings": [{
            "produce": "Onion", "qty": 400, "dest": "Nashik Sabzi Mandi",
            "dest_lat": 20.0059, "dest_lon": 73.7898,
            "pickup_name": "Village Dindori", "date": "2026-09-15",
            "early": "07:00", "late": "08:00",
        }]
    },
    {
        "email": "farmer5@agriride.com", "full_name": "Anil Jadhav",     "phone": "9111111115",
        "farm_name": "Jadhav Agriculture", "city": "Nashik", "state": "Maharashtra",
        "lat": 20.0040, "lon": 73.7750, "location_name": "Village Sinnar",
        "bookings": [{
            "produce": "Garlic", "qty": 180, "dest": "Nashik Sabzi Mandi",
            "dest_lat": 20.0059, "dest_lon": 73.7898,
            "pickup_name": "Village Sinnar", "date": "2026-09-15",
            "early": "07:00", "late": "08:30",
        }]
    },
    {
        "email": "farmer6@agriride.com", "full_name": "Kavitha Rao",     "phone": "9111111116",
        "farm_name": "Rao Farms", "city": "Nashik", "state": "Maharashtra",
        "lat": 20.0100, "lon": 73.7820, "location_name": "Village Ozar",
        "bookings": [{
            "produce": "Capsicum", "qty": 150, "dest": "Nashik Sabzi Mandi",
            "dest_lat": 20.0059, "dest_lon": 73.7898,
            "pickup_name": "Village Ozar", "date": "2026-09-15",
            "early": "06:45", "late": "08:00",
        }]
    },
    # Group 3 – Different destinations & wide time gaps → NOT MATCHED example
    {
        "email": "farmer7@agriride.com", "full_name": "Mahesh Kumar",    "phone": "9111111117",
        "farm_name": "Kumar Kisan", "city": "Kolhapur", "state": "Maharashtra",
        "lat": 16.7050, "lon": 74.2433, "location_name": "Village Hatkanangle",
        "bookings": [{
            "produce": "Sugarcane Juice", "qty": 600, "dest": "Kolhapur Market",
            "dest_lat": 16.7000, "dest_lon": 74.2333,
            "pickup_name": "Village Hatkanangle", "date": "2026-09-15",
            "early": "05:00", "late": "06:00",
        }]
    },
    {
        "email": "farmer8@agriride.com", "full_name": "Geeta Chavan",    "phone": "9111111118",
        "farm_name": "Chavan Sheti", "city": "Satara", "state": "Maharashtra",
        "lat": 17.6805, "lon": 73.9986, "location_name": "Village Karad",
        "bookings": [{
            "produce": "Strawberry", "qty": 80, "dest": "Satara Market",
            "dest_lat": 17.6805, "dest_lon": 74.0000,
            "pickup_name": "Village Karad", "date": "2026-09-15",
            "early": "10:00", "late": "11:00",   # Very different time window
        }]
    },
    # Extra farmers for diversity
    {
        "email": "farmer9@agriride.com", "full_name": "Suresh Nair",     "phone": "9111111119",
        "farm_name": "Nair Organics", "city": "Pune", "state": "Maharashtra",
        "lat": 18.5350, "lon": 73.8600, "location_name": "Village Pimpri",
        "bookings": [{
            "produce": "Spinach", "qty": 120, "dest": "Pune Mandai Market",
            "dest_lat": 18.5088, "dest_lon": 73.8756,
            "pickup_name": "Village Pimpri", "date": "2026-09-16",
            "early": "06:00", "late": "07:30",
        }]
    },
    {
        "email": "farmer10@agriride.com", "full_name": "Anita Sawant",   "phone": "9111111120",
        "farm_name": "Sawant Farms", "city": "Pune", "state": "Maharashtra",
        "lat": 18.5280, "lon": 73.8450, "location_name": "Village Wakad",
        "bookings": [{
            "produce": "Green Beans", "qty": 90, "dest": "Pune Mandai Market",
            "dest_lat": 18.5088, "dest_lon": 73.8756,
            "pickup_name": "Village Wakad", "date": "2026-09-16",
            "early": "06:00", "late": "07:00",
        }]
    },
]


def seed_farmers():
    farmers = []
    for fd in FARMER_DATA:
        user = models.User(
            email=fd["email"],
            hashed_password=hash_password("Farmer@123"),
            role=models.UserRole.FARMER,
            full_name=fd["full_name"],
            phone=fd["phone"],
            is_active=True,
        )
        db.add(user)
        db.flush()

        farmer = models.Farmer(
            user_id=user.id,
            farm_name=fd["farm_name"],
            city=fd["city"],
            state=fd["state"],
            latitude=fd["lat"],
            longitude=fd["lon"],
            location_name=fd["location_name"],
        )
        db.add(farmer)
        db.flush()

        # Seed bookings for this farmer
        for bd in fd["bookings"]:
            booking = models.Booking(
                farmer_id=farmer.id,
                produce_type=bd["produce"],
                quantity_kg=bd["qty"],
                pickup_latitude=fd["lat"],
                pickup_longitude=fd["lon"],
                pickup_location_name=bd["pickup_name"],
                destination_name=bd["dest"],
                destination_latitude=bd.get("dest_lat"),
                destination_longitude=bd.get("dest_lon"),
                preferred_date=bd["date"],
                earliest_pickup_time=bd["early"],
                latest_pickup_time=bd["late"],
                status=models.BookingStatus.REQUESTED,
            )
            db.add(booking)

        farmers.append((user, farmer))

    db.commit()
    print(f"✓ {len(FARMER_DATA)} farmers seeded (all with password: Farmer@123)")
    return farmers


# ─────────────────────────────────────────────────────────────
# Drivers + Vehicles
# ─────────────────────────────────────────────────────────────

DRIVER_DATA = [
    {
        "email": "driver1@agriride.com", "full_name": "Ravi Transporter", "phone": "9222222221",
        "license_no": "MH12-2024-001", "experience": 5, "rating": 4.8,
        "lat": 18.5180, "lon": 73.8540, "location_name": "Pimpri-Chinchwad",
        "vehicles": [{
            "reg": "MH12-AB-1234", "type": "PICKUP_TRUCK", "cap": 800,
            "make": "Tata Ace Gold", "year": 2022,
        }]
    },
    {
        "email": "driver2@agriride.com", "full_name": "Sunil Logistics",  "phone": "9222222222",
        "license_no": "MH15-2022-007", "experience": 8, "rating": 4.6,
        "lat": 19.9900, "lon": 73.7700, "location_name": "Nashik West",
        "vehicles": [
            {
                "reg": "MH15-CD-5678", "type": "MINI_TRUCK", "cap": 1000,
                "make": "Mahindra Jeeto", "year": 2021,
            },
            {
                "reg": "MH15-EF-9012", "type": "TEMPO", "cap": 500,
                "make": "Eicher Pro 1049", "year": 2023,
            }
        ]
    },
    {
        "email": "driver3@agriride.com", "full_name": "Deepak Carriers",  "phone": "9222222223",
        "license_no": "KA09-2020-012", "experience": 12, "rating": 4.9,
        "lat": 16.7100, "lon": 74.2400, "location_name": "Kolhapur",
        "vehicles": [{
            "reg": "KA09-GH-3456", "type": "LARGE_TRUCK", "cap": 2000,
            "make": "Tata 1109", "year": 2019,
        }]
    },
]


def seed_drivers():
    for dd in DRIVER_DATA:
        user = models.User(
            email=dd["email"],
            hashed_password=hash_password("Driver@123"),
            role=models.UserRole.DRIVER,
            full_name=dd["full_name"],
            phone=dd["phone"],
            is_active=True,
        )
        db.add(user)
        db.flush()

        driver = models.Driver(
            user_id=user.id,
            license_no=dd["license_no"],
            experience=dd["experience"],
            rating=dd["rating"],
            latitude=dd["lat"],
            longitude=dd["lon"],
            location_name=dd["location_name"],
            is_available=True,
        )
        db.add(driver)
        db.flush()

        for vd in dd["vehicles"]:
            vehicle = models.Vehicle(
                driver_id=driver.id,
                registration_number=vd["reg"],
                vehicle_type=models.VehicleType(vd["type"]),
                capacity_kg=vd["cap"],
                make_model=vd["make"],
                year=vd["year"],
                is_available=True,
            )
            db.add(vehicle)

    db.commit()
    print(f"✓ {len(DRIVER_DATA)} drivers seeded (password: Driver@123)")


def main():
    print("\n" + "="*60)
    print(" AgriRide – Seeding Demo Data")
    print("="*60)
    clear_data()
    seed_config()
    seed_admin()
    seed_farmers()
    seed_drivers()
    print("\n" + "="*60)
    print(" SEED COMPLETE!")
    print("="*60)
    print("\nSample Credentials:")
    print("  Admin:   admin@agriride.com    / Admin@123")
    print("  Farmer:  farmer1@agriride.com  / Farmer@123")
    print("  Driver:  driver1@agriride.com  / Driver@123")
    print("\nNote: All data is for DEMO purposes only.")
    print("      Coordinates are simulated.\n")


if __name__ == "__main__":
    main()
