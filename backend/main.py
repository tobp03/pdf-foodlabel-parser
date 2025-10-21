from utils.cleaning import extract_pdf_text, clean_text3, extract_images_with_ocr
from utils.llm import extract_pdf_structured_json
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import json
import os
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("OPENAI_API_KEY")

if not API_KEY:
    # Fail early — prevents using a fallback secret accidentally
    raise RuntimeError(
        "Missing OPENAI_API_KEY environment variable. "
        "Create a .env file or set the env var. See README."
    )

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://tobyp.fun",
        "https://tobyp.fun",         # React dev server
        "http://164.90.208.125:3000",   # Your server's frontend in dev
        "http://164.90.208.125"      
    ], 
    allow_credentials=True,
    allow_methods=["*"],  # allow GET, POST, etc.
    allow_headers=["*"],  # allow any headers
)


@app.post("/process_pdf")
async def process_pdf(file: UploadFile = File(...)):
    content = await file.read()
    
    # Save temporarily
    temp_path = f"temp_{file.filename}"
    with open(temp_path, "wb") as f:
        f.write(content)
    

    # Use utils functions
    text = extract_pdf_text(temp_path)
    text_clean = clean_text3(text)

    ocr_text = extract_images_with_ocr(temp_path)
    
    pdf_data = {"text": text_clean, "ocr": ocr_text}

    json_output = extract_pdf_structured_json(str(pdf_data), API_KEY)

    return json.loads(json_output)
