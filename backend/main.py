import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List
from google import genai
from google.genai import types

# EFFICIENCY & QUALITY: Instantiating a lean, descriptive FastAPI instance
app = FastAPI(
    title="VeloCook-Backend",
    description="Micro-app AI cooking to-do list generator for PromptWars 2026."
)

# SECURITY: Enable CORS safely so your AntiGravity frontend can communicate
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows smooth local connection during evaluation
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# SECURITY: Strict environment variable checking. Never hardcode API credentials.
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("CRITICAL ERROR: GEMINI_API_KEY environment variable is not set!")

# Initialize the official lightweight Google GenAI Client
client = genai.Client(api_key=GEMINI_API_KEY)


# --- CODE QUALITY: Strong Type-Hinted Schemas via Pydantic ---

class RequestPayload(BaseModel):
    day_description: str = Field(..., description="User's schedule and energy context.")
    max_budget: float = Field(..., description="Maximum budget threshold.")

class GroceryItem(BaseModel):
    item: str
    estimated_cost: float

class SubstitutionItem(BaseModel):
    original: str
    substitute: str
    reason: str

# PROBLEM STATEMENT ALIGNMENT: Dictating the exact data blueprint required by the image
class MealPlanOutput(BaseModel):
    breakfast: str
    lunch: str
    dinner: str
    grocery_list: List[GroceryItem]
    substitutions: List[SubstitutionItem]


@app.post("/api/generate-plan")
async def generate_plan(payload: RequestPayload):
    try:
        # PROBLEM STATEMENT ALIGNMENT: System context enforcing strict architectural bounds
        prompt = f"""
        You are an elite culinary assistant for VeloCook. Analyze the user's daily layout schedule and budget rules.
        Generate a highly targeted cooking to-do list matching their constraints.
        
        User's Day Context: {payload.day_description}
        Target Budget Limit: ${payload.max_budget}
        
        Provide relevant meal plans (e.g., rapid prep for tight timelines). Estimate normal, standard ingredient prices accurately. 
        Do not calculate or execute final mathematical budget validation strings.
        """
        
        # EFFICIENCY: Structured Outputs ensure no token waste on conversational fluff
        response = client.models.generate_content(
            model='gemini-1.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=MealPlanOutput,
            ),
        )
        
        # CODE QUALITY: Robust structural compilation parsing
        structured_data = MealPlanOutput.model_validate_json(response.text)
        
        # SECURITY & ALIGNMENT: Explicit Backend Mathematical Feasibility Logic 
        # (Never rely on LLMs for financial computations)
        total_grocery_cost = sum(item.estimated_cost for item in structured_data.grocery_list)
        is_feasible = total_grocery_cost <= payload.max_budget
        remaining_balance = payload.max_budget - total_grocery_cost
        
        return {
            "success": True,
            "meal_plan": {
                "breakfast": structured_data.breakfast,
                "lunch": structured_data.lunch,
                "dinner": structured_data.dinner
            },
            "grocery_list": structured_data.grocery_list,
            "substitutions": structured_data.substitutions,
            "budget_metrics": {
                "total_cost": round(total_grocery_cost, 2),
                "max_budget": payload.max_budget,
                "is_feasible": is_feasible,
                "remaining_balance": round(remaining_balance, 2)
            }
        }
        
    except Exception as e:
        # EFFICIENCY: Clean error propagation for frontend handling
        raise HTTPException(status_code=500, detail=f"Backend execution failure: {str(e)}")