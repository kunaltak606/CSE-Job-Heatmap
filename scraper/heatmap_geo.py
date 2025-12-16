import pandas as pd
import random
from pymongo import MongoClient

INDIA_CITIES = {
    "Delhi": [28.6139, 77.2090],
    "Noida": [28.5355, 77.3910],
    "Bangalore": [12.9716, 77.5946],
    "Hyderabad": [17.3850, 78.4867],
    "Pune": [18.5204, 73.8567],
    "Mumbai": [19.0760, 72.8777],
    "Chennai": [13.0827, 80.2707],
    "Gurgaon": [28.4595, 77.0266],
    "Kolkata": [22.5726, 88.3639],
    "Ahmedabad": [23.0225, 72.5714],
}

def get_geo_coords(location):
    loc = str(location).lower()
    for city, (lat, lng) in INDIA_CITIES.items():
        if city.lower() in loc:
            return (
                lat + random.uniform(-0.015, 0.015),
                lng + random.uniform(-0.015, 0.015),
            )
    return (
        20.5937 + random.uniform(-1, 1),
        78.9629 + random.uniform(-1, 1),
    )

df = pd.read_csv("scraped_jobs_cleaned.csv")
print(f"Loaded {len(df)} rows")

# Clean text fields and map to consistent names
df["job_title"] = df.get("title", "").fillna("Untitled").astype(str)
df["company_name"] = df.get("company", "").fillna("Unknown").astype(str)
df["location"] = df.get("location", "").fillna("India").astype(str)
df["salary_string"] = df.get("salary_string", "").fillna("").astype(str)

# Add GEO + weight
lats, lngs = [], []
for loc in df["location"]:
    lat, lng = get_geo_coords(loc)
    lats.append(lat)
    lngs.append(lng)

df["lat"] = lats
df["lng"] = lngs
# After df created in heatmap_geo.py
df["job_weight"] = 1.0  # base weight

# Boost weight slightly by salary if available
try:
    min_amt = df["min_amount"].astype(float)
    df["job_weight"] += (min_amt / min_amt.max()).fillna(0) * 0.5
except Exception:
    pass


records = df[
    ["job_title", "company_name", "location", "lat", "lng", "salary_string", "job_weight"]
].to_dict("records")

client = MongoClient("mongodb://localhost:27017")
db = client.jobheatmap
col = db.jobs
col.delete_many({})
col.insert_many(records)

print(f"Inserted {len(records)} jobs into jobheatmap.jobs")
