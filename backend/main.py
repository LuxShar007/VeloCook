from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
import random

app = FastAPI(title="MacroByte API", description="AI Cooking To-Do List & Budget Feasibility Generator")

# Configure CORS so our React frontend can access the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request schema
class PlanRequest(BaseModel):
    day_description: str = Field(..., example="A busy day with high intensity workouts")
    max_budget: float = Field(..., example=30.0)

# Nested response schemas
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

# Meal plan templates based on categories
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
            "breakfast": {"name": "Sourdough Toast & Poached Eggs", "cost": 5.00, "description": "Two organic poached eggs served on toasted artisanal sourdough bread with a drizzle of olive oil."},
            "lunch": {"name": "Quinoa Salad with Grilled Chicken", "cost": 9.00, "description": "Fluffy quinoa mixed with diced cucumber, cherry tomatoes, and sliced grilled chicken breast."},
            "dinner": {"name": "Pan-Seared Salmon with Asparagus", "cost": 13.00, "description": "Crispy skin-on salmon fillet basted with lemon butter, served alongside roasted asparagus."}
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
    }
}

@app.post("/api/generate-plan", response_model=PlanResponse)
async def generate_plan(request: PlanRequest):
    desc_lower = request.day_description.lower()
    
    # Simple rule-based keyword matcher
    if "vegan" in desc_lower or "plant" in desc_lower or "vegetarian" in desc_lower:
        plan_type = "vegan"
    elif "keto" in desc_lower or "low carb" in desc_lower or "high fat" in desc_lower:
        plan_type = "keto"
    else:
        plan_type = "default"
        
    template = MEAL_TEMPLATES[plan_type]
    
    # Calculate costs
    meals = template["meals"]
    total_cost = sum(m["cost"] for m in meals.values())
    
    # Calculate feasibility based on max budget
    is_feasible = total_cost <= request.max_budget
    remaining_balance = request.max_budget - total_cost
    
    # Adapt the grocery list checklist schema
    grocery_list = [
        GroceryItem(id=item["id"], item=item["item"], cost=item["cost"], checked=False)
        for item in template["grocery_list"]
    ]
    
    # Create the substitutions list
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
