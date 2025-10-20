import os
from langchain.chat_models import init_chat_model
from langchain_core.messages import HumanMessage, SystemMessage


# Initialize the model once
def get_chat_model():
    model = init_chat_model("gpt-4.1", model_provider="openai")
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
    Extract structured JSON from the pdf text. Output must follow this format exactly:
    {
      "product_name": "string",
      "detected_language":,
      "allergens": {
        "Gluten":,
        "Egg":,
        "Crustaceans":,
        "Fish":,
        "Peanut":,
        "Soy":,
        "Milk":,
        "Tree_nuts":,
        "Celery": ,
        "Mustard": 
      },
      "nutritional_values_per_100g": {
        "Energy_KJ":,
        "Energy_kcal":,
        "Fat":,
        "Carbohydrate":,
        "Sugar":,
        "Protein":,
        "Sodium":
      }
    }
    Respond ONLY with the JSON. Allergens should be 0 or 1. nutritional value, put in NA if missing. Notes: só = salt/sodium.
    """

    messages = [
        SystemMessage(content=prompt),
        HumanMessage(content=pdf_text),
    ]

    response = model.invoke(messages)

    # Return parsed JSON (as string)
    return response.content
