from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
import os
import json
import requests
# Load local environment variables from .env manually to avoid library dependencies
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
if os.path.exists(env_path):
    with open(env_path, "r") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                parts = line.split("=", 1)
                if len(parts) == 2:
                    os.environ[parts[0].strip()] = parts[1].strip()


app = FastAPI(title="VeloCook API", description="AI Cooking To-Do List & Budget Feasibility Generator via Gemini")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PlanRequest(BaseModel):
    day_description: str = Field(..., example="A busy day with high intensity workouts")
    max_budget: float = Field(..., example=30.0)
    cuisine_preference: Optional[str] = Field("standard", example="maharashtrian")

class MealDetail(BaseModel):
    name: str
    cost: float
    description: str

class GroceryItem(BaseModel):
    id: str
    item: str
    cost: float
    checked: bool = False

class Substitution(BaseModel):
    original: str
    substitute: str
    reason: str

class PlanResponse(BaseModel):
    is_feasible: bool
    total_cost: float
    remaining_balance: float
    meals: Dict[str, MealDetail]
    grocery_list: List[GroceryItem]
    substitutions: List[Substitution]

# Local Fallback Templates (in case Gemini is offline or API key is invalid)
MEAL_TEMPLATES = {
    "vegan": {
        "meals": {
            "breakfast": {"name": "Chia Seed & Coconut Pudding", "cost": 4.50, "description": "Chia seeds soaked in coconut milk, topped with fresh berries and crushed almonds."},
            "lunch": {"name": "Mediterranean Chickpea Salad", "cost": 8.00, "description": "Tossed chickpeas, cucumber, cherry tomatoes, red onion, and parsley with a zesty lemon-tahini dressing."},
            "dinner": {"name": "Lentil & Sweet Potato Curry", "cost": 9.50, "description": "Rich coconut-based curry loaded with red lentils, sweet potato cubes, and fresh spinach, served with brown rice."}
        },
        "grocery_list": [
            {"id": "v1", "item": "Chia seeds & Coconut milk", "cost": 4.50},
            {"id": "v2", "item": "Fresh berries & Almonds", "cost": 3.00},
            {"id": "v3", "item": "Canned chickpeas & Cucumbers", "cost": 2.50},
            {"id": "v4", "item": "Cherry tomatoes & Red onions", "cost": 2.50},
            {"id": "v5", "item": "Red lentils & Sweet potatoes", "cost": 3.00},
            {"id": "v6", "item": "Spinach & Coconut milk (curry base)", "cost": 4.00},
            {"id": "v7", "item": "Brown rice", "cost": 2.50}
        ],
        "substitutions": [
            {"original": "Fresh berries", "substitute": "Frozen berries", "reason": "Reduces cost by 40% while preserving nutritional value."},
            {"original": "Tahini dressing", "substitute": "Olive oil & Lemon juice", "reason": "Saves money if tahini is not already in your pantry."}
        ]
    },
    "keto": {
        "meals": {
            "breakfast": {"name": "Avocado & Bacon Scramble", "cost": 6.50, "description": "Three eggs scrambled in butter with crispy bacon pieces and half a fresh sliced avocado."},
            "lunch": {"name": "Keto Caesar Salad with Chicken", "cost": 9.50, "description": "Romaine lettuce, grilled chicken breast, shaved parmesan, and creamy Caesar dressing (no croutons)."},
            "dinner": {"name": "Garlic Butter Steak with Zucchini Noodles", "cost": 14.50, "description": "Pan-seared sirloin steak basted in garlic butter, paired with sauteed zucchini spirals."}
        },
        "grocery_list": [
            {"id": "k1", "item": "Eggs & Butter", "cost": 3.00},
            {"id": "k2", "item": "Bacon strips", "cost": 3.50},
            {"id": "k3", "item": "Avocado", "cost": 2.00},
            {"id": "k4", "item": "Chicken breast & Romaine lettuce", "cost": 6.00},
            {"id": "k5", "item": "Caesar dressing & Parmesan", "cost": 4.00},
            {"id": "k6", "item": "Sirloin steak", "cost": 9.00},
            {"id": "k7", "item": "Zucchini spirals", "cost": 3.00}
        ],
        "substitutions": [
            {"original": "Sirloin steak", "substitute": "Chicken thighs", "reason": "Lowers cost significantly while retaining high fat and protein ratios."},
            {"original": "Zucchini spirals", "substitute": "Sautéed cabbage", "reason": "Cabbage is cheaper per ounce and holds butter exceptionally well."}
        ]
    },
    "default": {
        "meals": {
            "breakfast": {"name": "Sourdough Toast & Poached Eggs", "cost": 5.0, "description": "Two organic poached eggs served on toasted artisanal sourdough bread with a drizzle of olive oil."},
            "lunch": {"name": "Quinoa Salad with Grilled Chicken", "cost": 9.0, "description": "Fluffy quinoa mixed with diced cucumber, cherry tomatoes, and sliced grilled chicken breast."},
            "dinner": {"name": "Pan-Seared Salmon with Asparagus", "cost": 13.0, "description": "Crispy skin-on salmon fillet basted with lemon butter, served alongside roasted asparagus."}
        },
        "grocery_list": [
            {"id": "d1", "item": "Sourdough bread", "cost": 2.00},
            {"id": "d2", "item": "Eggs & Olive oil", "cost": 3.00},
            {"id": "d3", "item": "Quinoa & Salad greens", "cost": 3.50},
            {"id": "d4", "item": "Chicken breast", "cost": 5.50},
            {"id": "d5", "item": "Salmon fillet", "cost": 8.00},
            {"id": "d6", "item": "Asparagus & Lemon", "cost": 5.00}
        ],
        "substitutions": [
            {"original": "Salmon fillet", "substitute": "Rainbow Trout", "reason": "Trout is often fresher locally and generally costs 20-30% less than salmon."},
            {"original": "Sourdough bread", "substitute": "Whole wheat bread", "reason": "Budget option that provides similar complex carbohydrates."}
        ]
    },
    "indian": {
        "meals": {
            "breakfast": {"name": "Masala Chai & Aloo Paratha", "cost": 3.50, "description": "Whole wheat flatbread stuffed with spiced mashed potatoes, served with plain curd and a cup of aromatic Masala Chai."},
            "lunch": {"name": "Dal Tadka, Jeera Rice & Mixed Veg Sabzi", "cost": 6.50, "description": "Yellow lentil dal tempered with cumin, garlic, and ghee, served with cumin rice and a seasonal vegetable stir-fry."},
            "dinner": {"name": "Paneer Bhurji & Whole Wheat Roti", "cost": 8.00, "description": "Scrambled cottage cheese cooked with onions, tomatoes, and spices, served with fresh handmade rotis."}
        },
        "grocery_list": [
            {"id": "in1", "item": "Potatoes & Whole wheat flour", "cost": 2.00},
            {"id": "in2", "item": "Masala tea leaves & Milk", "cost": 1.50},
            {"id": "in3", "item": "Yellow lentils (Toor Dal)", "cost": 2.00},
            {"id": "in4", "item": "Basmati rice & Cumin seeds", "cost": 2.00},
            {"id": "in5", "item": "Mixed seasonal vegetables", "cost": 2.50},
            {"id": "in6", "item": "Paneer (Cottage cheese)", "cost": 4.50},
            {"id": "in7", "item": "Ghee & Spices", "cost": 3.50}
        ],
        "substitutions": [
            {"original": "Paneer", "substitute": "Tofu", "reason": "Saves up to 30% on cost while maintaining low-carb protein values."},
            {"original": "Basmati rice", "substitute": "Sona Masoori rice", "reason": "A budget grain substitute that lowers the total expense of your pantry staples."}
        ]
    },
    "maharashtrian": {
        "meals": {
            "breakfast": {"name": "Kanda Poha & Solkadhi", "cost": 3.00, "description": "Flattened rice cooked with onions, peanuts, curry leaves, and mustard seeds, paired with a refreshing Solkadhi (kokum and coconut milk drink)."},
            "lunch": {"name": "Pithla Bhakri with Hirvi Mirchi Thecha", "cost": 5.00, "description": "Thick chickpea flour curry (Pithla) served with traditional flatbread made of sorghum (Jowar Bhakri) and spicy crushed green chili condiment (Thecha)."},
            "dinner": {"name": "Varan Bhaat, Batata Bhaji & Sajuk Tup", "cost": 6.50, "description": "Steamed rice topped with yellow split-pigeon-pea dal (Varan) and pure ghee (Sajuk Tup), served alongside tempered dry potato bhaji."}
        },
        "grocery_list": [
            {"id": "mh1", "item": "Poha (Flattened rice) & Peanuts", "cost": 1.50},
            {"id": "mh2", "item": "Kokum & Coconut milk (Solkadhi)", "cost": 1.50},
            {"id": "mh3", "item": "Besan (Gram flour) & Jowar flour", "cost": 2.00},
            {"id": "mh4", "item": "Green chilies & Garlic", "cost": 1.00},
            {"id": "mh5", "item": "Rice & Toor dal", "cost": 2.00},
            {"id": "mh6", "item": "Potatoes & Onions", "cost": 2.00},
            {"id": "mh7", "item": "Pure Ghee (Sajuk Tup)", "cost": 4.50}
        ],
        "substitutions": [
            {"original": "Kokum fruit extract", "substitute": "Tamarind paste", "reason": "If kokum is hard to find or premium, tamarind provides the necessary sour tang for Solkadhi at a lower cost."},
            {"original": "Jowar Bhakri", "substitute": "Wheat Chapati", "reason": "Chapati flour is cheaper and easier to prepare for quick meal prep sessions."}
        ]
    }
}

def get_fallback_plan(day_description: str, max_budget: float, cuisine_preference: str = "standard") -> PlanResponse:
    if cuisine_preference == "indian":
        plan_type = "indian"
    elif cuisine_preference == "maharashtrian":
        plan_type = "maharashtrian"
    else:
        desc_lower = day_description.lower()
        if "vegan" in desc_lower or "plant" in desc_lower or "vegetarian" in desc_lower:
            plan_type = "vegan"
        elif "keto" in desc_lower or "low carb" in desc_lower or "high fat" in desc_lower:
            plan_type = "keto"
        else:
            plan_type = "default"
        
    template = MEAL_TEMPLATES[plan_type]
    meals = template["meals"]
    total_cost = sum(m["cost"] for m in meals.values())
    is_feasible = total_cost <= max_budget
    remaining_balance = max_budget - total_cost
    
    grocery_list = [
        GroceryItem(id=item["id"], item=item["item"], cost=item["cost"], checked=False)
        for item in template["grocery_list"]
    ]
    substitutions = [
        Substitution(original=s["original"], substitute=s["substitute"], reason=s["reason"])
        for s in template["substitutions"]
    ]
    
    return PlanResponse(
        is_feasible=is_feasible,
        total_cost=round(total_cost, 2),
        remaining_balance=round(remaining_balance, 2),
        meals={
            "breakfast": MealDetail(**meals["breakfast"]),
            "lunch": MealDetail(**meals["lunch"]),
            "dinner": MealDetail(**meals["dinner"])
        },
        grocery_list=grocery_list,
        substitutions=substitutions
    )

@app.post("/api/generate-plan", response_model=PlanResponse)
async def generate_plan(request: PlanRequest):
    api_key = os.getenv("GEMINI_API_KEY")
    
    # Just a ping to verify connection
    if request.day_description == "ping":
        return get_fallback_plan(request.day_description, request.max_budget, request.cuisine_preference)
        
    if not api_key:
        print("GEMINI_API_KEY not set. Falling back to local plan generation.")
        return get_fallback_plan(request.day_description, request.max_budget, request.cuisine_preference)

    cuisine_context = ""
    if request.cuisine_preference == "indian":
        cuisine_context = "Cuisine Preference: General Indian Cuisines (incorporate traditional dishes like Poha, Masala Chai, Dal Tadka, Sabzi, Roti, Paneer, Khichdi, etc.)."
    elif request.cuisine_preference == "maharashtrian":
        cuisine_context = "Cuisine Preference: Traditional Maharashtrian Cuisine (incorporate local favorites like Kanda Poha, Misal Pav, Pithla Bhakri with Thecha, Varan Bhaat, Batata Bhaji, Solkadhi, Upma, Sabudana Khichdi, etc.)."
    else:
        cuisine_context = "Cuisine Preference: Standard/International nutritious meals."

    # Build detailed prompt enforcing JSON output
    prompt = f"""
    You are an expert culinary planner and McKinsey consulting budget analyst.
    Generate a structured daily cooking plan, grocery checklist, and substitutions based on the user's inputs.
    
    User's Day Description: "{request.day_description}"
    User's Max Budget: ${request.max_budget:.2f}
    {cuisine_context}
    
    Provide a realistic menu with:
    1. Breakfast, Lunch, and Dinner. Calculate individual estimated costs for each.
    2. A comprehensive grocery list breakdown with individual item costs.
    3. 1-2 pro-tip ingredient substitutions comparing original ingredients with alternatives to save money.
    4. Calculate if total_cost <= max_budget. Set is_feasible = true if so, else false.
    5. Set remaining_balance = max_budget - total_cost.
    
    Output strictly matches this JSON schema (ensure all numeric fields are float/int):
    {{
      "is_feasible": boolean,
      "total_cost": float,
      "remaining_balance": float,
      "meals": {{
        "breakfast": {{ "name": "string", "cost": float, "description": "string" }},
        "lunch": {{ "name": "string", "cost": float, "description": "string" }},
        "dinner": {{ "name": "string", "cost": float, "description": "string" }}
      }},
      "grocery_list": [
        {{ "id": "string", "item": "string", "cost": float, "checked": false }}
      ],
      "substitutions": [
        {{ "original": "string", "substitute": "string", "reason": "string" }}
      ]
    }}
    
    Return raw JSON only. Do not include markdown formatting or tags like ```json.
    """

    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "responseMimeType": "application/json"
            }
        }
        
        response = requests.post(url, headers=headers, json=payload, timeout=10.0)
        
        if response.status_code != 200:
            print(f"Gemini API returned error code {response.status_code}. Response: {response.text}")
            return get_fallback_plan(request.day_description, request.max_budget)
            
        data = response.json()
        
        # Extract response text
        json_text = data['candidates'][0]['content']['parts'][0]['text']
        
        # Clean potential markdown output just in case
        json_text = json_text.strip()
        if json_text.startswith("```json"):
            json_text = json_text[7:]
        if json_text.endswith("```"):
            json_text = json_text[:-3]
        json_text = json_text.strip()
            
        result = json.loads(json_text)
        
        # Validate that the structure contains necessary keys, else trigger fallback
        required_keys = ["is_feasible", "total_cost", "remaining_balance", "meals", "grocery_list", "substitutions"]
        if not all(k in result for k in required_keys):
            raise ValueError("Missing required keys in Gemini JSON output")
            
        return PlanResponse(**result)

    except Exception as e:
        print(f"Error calling Gemini API: {e}. Falling back to local plan generation.")
        return get_fallback_plan(request.day_description, request.max_budget)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)