import datetime
from jobspy import scrape_jobs
from pymongo import MongoClient
import re
import pandas as pd

# Multiple job titles to search for
search_terms = [
    "software engineer",
    "frontend developer",
    "backend developer",
    "full stack developer",
    "data scientist",
    "machine learning engineer",
    "devops engineer",
    "cloud engineer",
    "UI UX designer",
    "web developer",
    "react developer",
    "python developer",
    "nodejs developer",
    "cybersecurity analyst",
    "php developer",
    "java developer",
    "mobile app developer",
    "data analyst",
    "product manager"
]

def extract_salary(description):
    if not isinstance(description, str):
        return None
    salary_pattern = r"(?:₹|Rs\.?)\s*([\d,]+(?:\.\d+)?)\s*(?:-|to)?\s*(?:₹|Rs\.?)?\s*([\d,]+(?:\.\d+)?)?\s*(?:per|a)?\s*(month|year|hr|week)?"
    match = re.search(salary_pattern, description, re.IGNORECASE)
    if match:
        min_salary = match.group(1)
        max_salary = match.group(2) or min_salary
        interval = match.group(3) or "month"
        return {
            "salary_string": f"₹{min_salary} - ₹{max_salary} {interval}",
            "min_amount": min_salary.replace(",", ""),
            "max_amount": max_salary.replace(",", ""),
            "interval": interval
        }
    single_pattern = r"(?:₹|Rs\.?)\s*([\d,]+(?:\.\d+)?)\s*(?:per|a)?\s*(month|year|hr|week)?"
    match = re.search(single_pattern, description, re.IGNORECASE)
    if match:
        min_salary = match.group(1)
        interval = match.group(2) or "month"
        return {
            "salary_string": f"₹{min_salary} {interval}",
            "min_amount": min_salary.replace(",", ""),
            "max_amount": min_salary.replace(",", ""),
            "interval": interval
        }
    return None

def process_record(record):
    if 'date_posted' in record and isinstance(record['date_posted'], datetime.date):
        record['date_posted'] = datetime.datetime.combine(record['date_posted'], datetime.time.min)
    if not (record.get("min_amount") and record.get("salary_string")):
        salary = extract_salary(record.get("description"))
        if salary:
            record.update(salary)
    return record

all_jobs = []
for term in search_terms:
    jobs = scrape_jobs(
        site_name=["indeed", "linkedin", "naukri"],
        search_term=term,
        location="India",
        results_wanted=50,
        country_indeed='India'
    )
    print(f"Found {len(jobs)} jobs for '{term}'")
    all_jobs.append(jobs)

df = pd.concat(all_jobs, ignore_index=True)
print(f"Total jobs collected: {len(df)}")

# client = MongoClient("mongodb://localhost:27017")
# db = client.scraperjobs
# collection = db.jobs

# records = [process_record(job) for job in df.to_dict("records")]

# collection.insert_many(records)
# print("Jobs inserted into MongoDB (with salary info, if found)")


# Process each job record
records = [process_record(job) for job in df.to_dict("records")]

# Convert back to DataFrame for CSV export
cleaned_df = pd.DataFrame(records)

# Save cleaned data to CSV file
cleaned_df.to_csv("scraped_jobs_cleaned.csv", index=False)
print("Jobs saved to scraped_jobs_cleaned.csv (with salary info, if found)")
