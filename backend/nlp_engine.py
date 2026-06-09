from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from sklearn.feature_extraction.text import TfidfVectorizer
import pandas as pd
import re
from typing import List, Dict

class NLPEngine:
    def __init__(self):
        self.analyzer = SentimentIntensityAnalyzer()
        self.vectorizer = TfidfVectorizer(stop_words='english', max_features=20)

    def analyze_sentiment(self, text: str) -> float:
        """Returns the compound sentiment score from -1 to 1."""
        score = self.analyzer.polarity_scores(text)
        return score['compound']

    def extract_keywords(self, texts: List[str]) -> List[Dict[str, float]]:
        """Extracts top keywords using TF-IDF."""
        if not texts:
            return []
        
        # Simple cleaning
        cleaned_texts = [re.sub(r'[^a-zA-Z\s]', '', t.lower()) for t in texts]
        
        try:
            tfidf_matrix = self.vectorizer.fit_transform(cleaned_texts)
            feature_names = self.vectorizer.get_feature_names_out()
            scores = tfidf_matrix.sum(axis=0).tolist()[0]
            
            keywords = []
            for name, score in zip(feature_names, scores):
                keywords.append({"text": name, "value": round(score, 2)})
            
            # Sort by score and take top 20
            keywords = sorted(keywords, key=lambda x: x['value'], reverse=True)[:20]
            return keywords
        except Exception as e:
            print(f"Error in keyword extraction: {e}")
            return []

    def analyze_parameters(self, reviews: List[Dict]) -> List[Dict]:
        """Analyzes 10 constant parameters for positive and negative sentiment counts."""
        parameters = {
            "Delivery": {"pos": 0, "neg": 0},
            "Pricing": {"pos": 0, "neg": 0},
            "Support": {"pos": 0, "neg": 0},
            "Quality": {"pos": 0, "neg": 0},
            "Refund": {"pos": 0, "neg": 0},
            "App Exp": {"pos": 0, "neg": 0},
            "UI/UX": {"pos": 0, "neg": 0},
            "Communication": {"pos": 0, "neg": 0},
            "Reliability": {"pos": 0, "neg": 0},
            "Value": {"pos": 0, "neg": 0}
        }
        
        keywords = {
            "Delivery": ["delivery", "late", "arrived", "shipping", "courier", "package", "packaging", "fast", "slow"],
            "Pricing": ["price", "cost", "expensive", "cheap", "charge", "billing", "fees"],
            "Support": ["support", "service", "customer", "agent", "help", "chat", "care"],
            "Quality": ["quality", "good", "bad", "product", "excellent", "material", "taste", "fresh", "food", "messy", "damaged"],
            "Refund": ["refund", "money", "back", "repayment", "cancel", "return"],
            "App Exp": ["app", "crash", "bug", "error", "login", "slow", "performance", "interface"],
            "UI/UX": ["ui", "ux", "interface", "design", "layout", "navigation", "visual"],
            "Communication": ["email", "call", "response", "reply", "talked", "message", "notification"],
            "Reliability": ["reliable", "trust", "always", "consistently", "failed", "broken", "incomplete", "missing", "wrong"],
            "Value": ["value", "worth", "money", "deal", "affordable", "premium", "portion", "size"]
        }
        
        for review in reviews:
            text_lower = review['text'].lower()
            sentiment = review['sentiment']
            
            for param, words in keywords.items():
                if any(word in text_lower for word in words):
                    if sentiment >= 0:
                        parameters[param]["pos"] += 1
                    else:
                        parameters[param]["neg"] += 1
        
        result = []
        for param, counts in parameters.items():
            total = counts["pos"] + counts["neg"]
            rating = (counts["pos"] / total * 5) if total > 0 else 0
            result.append({
                "parameter": param,
                "positive": counts["pos"],
                "negative": counts["neg"],
                "rating": round(rating, 1)
            })
        return result

    def get_emotions(self, texts: List[str]) -> Dict[str, int]:
        """Simple emotion categorization based on keyword matching."""
        emotions = {
            "Frustrated": 0,
            "Satisfied": 0,
            "Angry": 0,
            "Excited": 0,
            "Disappointed": 0,
            "Neutral": 0
        }
        
        emotion_keywords = {
            "Frustrated": ["slow", "waiting", "again", "stuck", "bug", "annoying"],
            "Satisfied": ["happy", "good", "great", "thanks", "excellent", "fast"],
            "Angry": ["terrible", "worst", "fraud", "scam", "useless", "hate"],
            "Excited": ["love", "best", "awesome", "amazing", "wow", "brilliant"],
            "Disappointed": ["bad", "poor", "unhappy", "expected", "below", "waste"]
        }
        
        for text in texts:
            found = False
            text_lower = text.lower()
            for emotion, words in emotion_keywords.items():
                if any(word in text_lower for word in words):
                    emotions[emotion] += 1
                    found = True
                    break
            if not found:
                emotions["Neutral"] += 1
        return emotions

    def detect_urgency(self, text: str) -> str:
        """Flags high-priority reviews based on critical keywords."""
        critical_words = ["money", "refund", "stolen", "scam", "payment", "health", "safety", "illegal", "broken", "worst"]
        if any(word in text.lower() for word in critical_words):
            return "High"
        return "Normal"

# Initialize the engine
nlp_engine = NLPEngine()
