"""
AgriRide – Haversine distance formula.

Calculates the great-circle distance between two geographic points
using the Haversine formula.

Reference: https://en.wikipedia.org/wiki/Haversine_formula
"""
import math


EARTH_RADIUS_KM = 6371.0


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate distance (km) between two coordinates using Haversine formula.

    Parameters:
        lat1, lon1: Latitude and longitude of point 1 (degrees)
        lat2, lon2: Latitude and longitude of point 2 (degrees)

    Returns:
        Distance in kilometres (float)

    Formula:
        distance = 2R * asin(sqrt(
            sin²((lat2-lat1)/2) +
            cos(lat1)*cos(lat2)*sin²((lon2-lon1)/2)
        ))
    """
    # Convert degrees to radians
    phi1    = math.radians(lat1)
    phi2    = math.radians(lat2)
    d_phi   = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)

    a = (math.sin(d_phi / 2) ** 2
         + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2)

    c = 2 * math.asin(math.sqrt(a))

    return EARTH_RADIUS_KM * c


def total_route_distance(points: list) -> float:
    """
    Calculate total distance of a sequential route.

    Parameters:
        points: List of dicts with 'lat' and 'lon' keys

    Returns:
        Total distance in km
    """
    if len(points) < 2:
        return 0.0
    total = 0.0
    for i in range(len(points) - 1):
        total += haversine_distance(
            points[i]["lat"],  points[i]["lon"],
            points[i+1]["lat"], points[i+1]["lon"]
        )
    return round(total, 2)
