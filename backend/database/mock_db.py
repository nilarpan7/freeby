import uuid
import json
import os

DB_FILE = "bounties_db.json"

def _load_db():
    if not os.path.exists(DB_FILE):
        return []
    try:
        with open(DB_FILE, "r") as f:
            return json.load(f)
    except:
        return []

def _save_db(data):
    with open(DB_FILE, "w") as f:
        json.dump(data, f, indent=4)

def init_mock_data():
    if not os.path.exists(DB_FILE):
        _save_db([{
            "id": "mock-bounty-1",
            "msme_id": "msme-1",
            "spec": {
                "title": "Excel Data Extractor",
                "stack": ["python", "pandas"],
                "deliverable": "Script to read excel and find top 3 items based on column B.",
                "time_estimate_min": 60,
                "price_inr": 250,
                "category": "scripting",
                "difficulty": "easy"
            },
            "status": "open",
            "match_score": 98
        }])

def create_bounty(bounty_spec, msme_id="mock_msme"):
    db = _load_db()
    # Pydantic v2 dict support
    spec_dict = bounty_spec.model_dump() if hasattr(bounty_spec, "model_dump") else bounty_spec.dict()
    
    bounty = {
        "id": str(uuid.uuid4()),
        "msme_id": msme_id,
        "spec": spec_dict,
        "status": "open",
        "match_score": 85
    }
    db.append(bounty)
    _save_db(db)
    return bounty

def get_all_bounties():
    return _load_db()

init_mock_data()
