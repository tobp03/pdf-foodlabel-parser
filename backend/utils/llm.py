import os
from langchain.chat_models import init_chat_model
from langchain_core.messages import HumanMessage, SystemMessage


# Initialize the model once
def get_chat_model():
    model = init_chat_model("gpt-4.1", model_provider="openai") # gpt-4.1
    return model

# Function to extract structured JSON from PDF text
def extract_pdf_structured_json(pdf_text: str, api_key: str) -> dict:
    """
    Takes PDF text and returns structured JSON with product info, allergens, and nutrition.
    """
    # Set API key
    os.environ["OPENAI_API_KEY"] = api_key

    model = get_chat_model()

    # Prompt for the model
    prompt = """
Extract JSON from the PDF text in this exact format:
{
  "product_name": "string",
  "product_name_english" : "string"
  "allergens": {
    "Gluten": 0 or 1,
    "Egg": 0 or 1,
    "Crustaceans": 0 or 1,
    "Fish": 0 or 1,
    "Peanut": 0 or 1,
    "Soy": 0 or 1,
    "Milk": 0 or 1,
    "Tree_nuts": 0 or 1,
    "Celery": 0 or 1,
    "Mustard": 0 or 1
  },
  "nutritional_values_per_100g": {
    "Energy_KJ": float or "NA",
    "Energy_kcal": float or "NA",
    "Fat": float or "NA",
    "Carbohydrate": float or "NA",
    "Sugar": float or "NA",
    "Protein": float or "NA",
    "Sodium": float or "NA"
  }
}
Respond only with valid JSON. Allergens: 1 if present, 0 if not. Nutrition: float or "NA"."product_name_english", should be clear and short. Do not add any other text.
    """

    messages = [
        SystemMessage(content=prompt),
        HumanMessage(content=pdf_text),
    ]

    response = model.invoke(messages)

    # Return parsed JSON (as string)
    return response.content
