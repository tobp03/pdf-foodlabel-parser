from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import PyPDF2

app = FastAPI()

# Allow React frontend to access backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dummy allergens & nutrition list
ALLERGENS = ["Gluten", "Egg", "Crustaceans", "Fish", "Peanut", "Soy", "Milk", "Tree nuts", "Celery", "Mustard"]
NUTRITION = ["Energy", "Fat", "Carbohydrate", "Sugar", "Protein", "Sodium"]

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    # Read PDF bytes
    pdf_bytes = await file.read()

    # Extract text using PyPDF2 only
    text = ""
    try:
        reader = PyPDF2.PdfReader(file.file)
        for page in reader.pages:
            text += page.extract_text() or ""
    except Exception as e:
        print("PyPDF2 failed:", e)

    # Prepare dummy response
    response = {
        "allergens": {a: False for a in ALLERGENS},
        "nutrition": {n: "N/A" for n in NUTRITION}
    }

    # Example: mark Gluten and Milk as present
    if "gluten" in text.lower():
        response["allergens"]["Gluten"] = True
    if "milk" in text.lower():
        response["allergens"]["Milk"] = True

    return response
