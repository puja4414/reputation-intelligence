from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import random
import pandas as pd
import io
from datetime import datetime, timedelta
from nlp_engine import nlp_engine

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import json
import os

# Global data store for uploaded companies
CUSTOM_COMPANIES: Dict[str, List] = {}
DATA_FILE = "custom_data.json"

class Review(BaseModel):
    id: int
    company: str
    text: str
    rating: int
    sentiment: float
    category: str
    timestamp: datetime

def save_custom_data():
    serializable = {}
    for name, reviews in CUSTOM_COMPANIES.items():
        serializable[name] = [r.dict() for r in reviews]
    with open(DATA_FILE, "w") as f:
        json.dump(serializable, f, default=str)
    print(f"DEBUG: Saved {len(CUSTOM_COMPANIES)} companies to disk.")

def load_custom_data():
    global CUSTOM_COMPANIES
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r") as f:
                data = json.load(f)
                for name, reviews in data.items():
                    CUSTOM_COMPANIES[name] = [
                        Review(
                            id=r['id'],
                            company=r['company'],
                            text=r['text'],
                            rating=r['rating'],
                            sentiment=r['sentiment'],
                            category=r['category'],
                            timestamp=datetime.fromisoformat(r['timestamp']) if isinstance(r['timestamp'], str) else datetime.now()
                        ) for r in reviews
                    ]
            print(f"DEBUG: Loaded {len(CUSTOM_COMPANIES)} companies from disk: {list(CUSTOM_COMPANIES.keys())}")
        except Exception as e:
            print(f"DEBUG: Error loading data: {e}")

@app.on_event("startup")
async def startup_event():
    load_custom_data()

COMPANIES = ["Amazon", "Zomato", "Swiggy", "Netflix"]
CATEGORIES = ["Delivery", "Pricing", "Support", "Quality", "Refund", "App Exp", "UI/UX", "Communication", "Reliability", "Value"]

def generate_mock_data(n=1000):
    data = []
    # Real-ish review snippets for better NLP analysis
    snippets = {
        "Delivery": [
            "The delivery was late by 2 hours.", "Fast delivery, very happy with the service!", 
            "Food was cold when it arrived, packaging was poor.", "Delivery agent was polite and on time.",
            "Package was left at the wrong door.", "Express shipping actually worked this time."
        ],
        "Refund": [
            "Refund process is very slow, still waiting for my money.", "Got my refund quickly within 24 hours.", 
            "They refused my refund request for a damaged item.", "Smooth refund experience.",
            "Impossible to get a refund for this subscription.", "Partial refund received without explanation."
        ],
        "App Exp": [
            "App keeps crashing on my phone every time I open the menu.", "Smooth experience, no crashes so far.", 
            "The app is very buggy and slow.", "Great performance, very snappy.",
            "Frequent errors while checking out.", "App takes forever to load on mobile data."
        ],
        "Support": [
            "Support was very helpful and resolved my issue.", "Terrible customer service, no one responded to my chat.", 
            "Had to wait 30 minutes to talk to an agent.", "Excellent support staff.",
            "The agent was rude and unhelpful.", "Chat support is useless, it's just a bot."
        ],
        "Pricing": [
            "Price is too high for the service provided.", "Good value for money, very affordable.", 
            "Hidden charges found in the final bill.", "Best prices in the market.",
            "Subscription cost increased without notice.", "Delivery fees are getting ridiculous."
        ],
        "Quality": [
            "Great shows to watch, highly recommended!", "Not enough variety in content, very boring.", 
            "Video quality is excellent even on slow internet.", "The content library is very outdated.",
            "Product quality is much worse than expected.", "High quality materials used, very durable."
        ],
        "UI/UX": [
            "Interface is very clean and easy to navigate.", "The new layout is confusing and hard to use.",
            "Beautiful design, love the dark mode.", "Menu options are hard to find.",
            "Navigation is seamless on the website.", "Too many ads cluttering the interface."
        ],
        "Communication": [
            "Received constant email updates about my order.", "No response to my multiple emails.",
            "The call center agent was very clear and polite.", "They don't communicate delays at all.",
            "Excellent communication throughout the process.", "Automated messages are not helpful."
        ],
        "Reliability": [
            "Always reliable, never had an issue.", "The service is consistently broken.",
            "Trustworthy brand, always delivers.", "Failed to provide service three times in a row.",
            "Reliability has gone down recently.", "Can always count on them for urgent needs."
        ],
        "Value": [
            "Worth every penny, amazing value.", "Complete waste of money, do not buy.",
            "Great deals available for members.", "Affordable premium features.",
            "Expensive but worth it for the quality.", "Cheaper alternatives are better."
        ]
    }
    
    for i in range(n):
        company = random.choice(COMPANIES)
        category = random.choice(CATEGORIES)
        text = random.choice(snippets[category])
        rating = random.randint(1, 5)
        # Use actual NLP engine for sentiment during data generation
        sentiment = nlp_engine.analyze_sentiment(text)
        
        data.append(Review(
            id=i,
            company=company,
            text=text,
            rating=rating,
            sentiment=sentiment,
            category=category,
            timestamp=datetime.now() - timedelta(days=random.randint(0, 30))
        ))
    return data

MOCK_DATA = generate_mock_data(1000)

@app.get("/")
def read_root():
    return {"message": "Welcome to Company Reputation API", "companies": COMPANIES + [k.capitalize() for k in CUSTOM_COMPANIES.keys()]}

@app.post("/upload")
async def upload_dataset(name: str = Form(...), file: UploadFile = File(...)):
    content = await file.read()
    
    def try_parse(data, skip=0):
        try:
            sample = data.decode('utf-8')[:2048]
            if '\t' in sample:
                return pd.read_csv(io.BytesIO(data), sep='\t', skiprows=skip)
            elif '  ' in sample:
                return pd.read_csv(io.BytesIO(data), sep=r'\s+', engine='python', skiprows=skip)
            else:
                return pd.read_csv(io.BytesIO(data), skiprows=skip)
        except:
            return None

    # Try different offsets to find headers (0 to 5 rows)
    df = None
    text_col = None
    
    for skip in range(5):
        temp_df = try_parse(content, skip)
        if temp_df is not None:
            cols = [c.lower() for c in temp_df.columns]
            if 'review_text' in cols or 'text' in cols:
                df = temp_df
                # Find the actual case-sensitive column name
                text_col = next(c for c in df.columns if c.lower() in ['review_text', 'text'])
                print(f"DEBUG: Found headers at row {skip}. Columns: {list(df.columns)}")
                break
    
    if df is None or text_col is None:
        raise HTTPException(status_code=400, detail="CSV must contain a 'review_text' or 'text' column. Please check the file headers.")
    
    processed_reviews = []
    for idx, row in df.iterrows():
        text = str(row[text_col])
        if not text or text.lower() == 'nan': continue
        
        rating = int(row['rating']) if 'rating' in df.columns and pd.notnull(row['rating']) else 3
        sentiment = nlp_engine.analyze_sentiment(text)
        
        # Handle date if present
        ts = datetime.now()
        if 'review_date' in df.columns and pd.notnull(row['review_date']):
            try:
                ts = pd.to_datetime(row['review_date']).to_pydatetime()
            except:
                pass
        
        processed_reviews.append(Review(
            id=idx,
            company=name,
            text=text,
            rating=rating,
            sentiment=sentiment,
            category="General", 
            timestamp=ts
        ))
    
    if not processed_reviews:
        raise HTTPException(status_code=400, detail="No valid review data found in CSV.")

    # Store with normalized key
    CUSTOM_COMPANIES[name.lower()] = processed_reviews
    save_custom_data()
    return {"message": f"Dataset for {name} uploaded successfully", "count": len(processed_reviews)}

@app.get("/analytics/{company}")
def get_analytics(company: str):
    company_key = company.lower()
    
    if company_key in CUSTOM_COMPANIES:
        company_data = CUSTOM_COMPANIES[company_key]
    else:
        # Check mock data (case-insensitive)
        company_data = [r for r in MOCK_DATA if r.company.lower() == company_key]
    
    if not company_data:
        # Fallback: if MOCK_DATA matches case-sensitively (shouldn't be needed but for safety)
        company_data = [r for r in MOCK_DATA if r.company == company]
        
    if not company_data:
        print(f"DEBUG: Company {company} not found. Available custom: {list(CUSTOM_COMPANIES.keys())}")
        return {"error": f"Company '{company}' not found. Please upload a dataset first."}
    
    avg_rating = sum(r.rating for r in company_data) / len(company_data)
    avg_sentiment = sum(r.sentiment for r in company_data) / len(company_data)
    complaint_count = sum(1 for r in company_data if r.rating <= 2)
    complaint_percentage = (complaint_count / len(company_data)) * 100
    
    # Sentiment Trends
    trends = {}
    for r in company_data:
        date = r.timestamp.strftime("%Y-%m-%d")
        if date not in trends:
            trends[date] = {"sentiment": 0, "count": 0}
        trends[date]["sentiment"] += r.sentiment
        trends[date]["count"] += 1
    
    sorted_trends = [{"date": d, "sentiment": trends[d]["sentiment"] / trends[d]["count"]} for d in sorted(trends.keys())]
    
    # Parameter-based Analysis
    reviews_list = [{"text": r.text, "sentiment": r.sentiment} for r in company_data]
    parameter_analysis = nlp_engine.analyze_parameters(reviews_list)
    
    # Emotion Analysis
    texts = [r.text for r in company_data]
    emotions = nlp_engine.get_emotions(texts)
    emotion_data = [{"emotion": k, "count": v} for k, v in emotions.items()]
    
    # Keyword Extraction
    keywords = nlp_engine.extract_keywords(texts)
    
    return {
        "kpis": {
            "avg_rating": round(avg_rating, 2),
            "avg_sentiment": round(avg_sentiment, 2),
            "complaint_percentage": round(complaint_percentage, 2),
            "total_reviews": len(company_data)
        },
        "trends": sorted_trends,
        "parameters": parameter_analysis,
        "emotions": emotion_data,
        "keywords": keywords
    }

@app.get("/search/{company}")
def search_reviews(company: str, query: str):
    if company in CUSTOM_COMPANIES:
        company_data = CUSTOM_COMPANIES[company]
    else:
        company_data = [r for r in MOCK_DATA if r.company.lower() == company.lower()]
        
    filtered = [r for r in company_data if query.lower() in r.text.lower()]
    
    if not filtered:
        return {"kpis": {"count": 0}, "results": []}

    avg_sentiment = sum(r.sentiment for r in filtered) / len(filtered)
    
    return {
        "kpis": {
            "count": len(filtered),
            "avg_sentiment": round(avg_sentiment, 2)
        },
        "results": filtered[:20]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
