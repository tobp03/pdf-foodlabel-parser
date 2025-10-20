import re
import io
from PIL import Image
import pytesseract
import pymupdf


def extract_pdf_text(pdf_path):
    doc = pymupdf.open(pdf_path)
    pdf_text = ""
    for page_index, page in enumerate(doc, start=1):
        text = page.get_text()  # plain text
        pdf_text += text + "\f"  # page delimiter
    return pdf_text

def clean_text3(raw_text):
    HUNGARIAN_STOPWORDS = [
    # Basic conjunctions and fillers
    "és", "vagy", "de", "hogy", "is", "az", "a", "azt", "ez", "egy", "minden", "valamint",
    "illetve", "által", "általa", "általában", "kell", "számára", "általános", "volt", "van",
    "továbbá", "mint", "mely", "melyek", "akkor", "amikor", "előtt", "után", "itt", "ott",
    "ha", "lehet", "lenne", "úgy", "egyes", "néhány", "más", "kivéve", "bár", "pedig", "nos",
    "tehát", "ezért", "azonban", "mindazonáltal", "sőt", "így", "úgy", "egyaránt", "vagyis", 
    "például", "stb", "pl", "ill", "azaz",
    
    # Pronouns
    "én", "te", "ő", "mi", "ti", "ők", "magam", "magad", "maga", "magunk", "magatok", "maguk",
    "ezek", "azok", "valaki", "valami", "semmi", "senki", "valamelyik", "valamennyi",
    "egyik", "másik", "egyiksem", "másiksem", "mindenki", "mindenhol", "mindenféle", "akik", "amelyek",
    
    # Temporal / spatial
    "ma", "most", "holnap", "régen", "tovább", "vissza", "előre", "alatt", "fölött", "között", "mellett", 
    "ellen", "felé", "iránt", "nélkül", "alapján", "kapcsán", "körül", "előtt", "után", "továbbra", "egyre", 
    "szinte", "újra", "ismét",
    
    # Quantifiers / modifiers
    "sokan", "kevesen", "többen", "egyesek", "néhányan", "mindegyik", "együtt", "külön", "elég",
    "nagyon", "kevésbé", "teljesen", "egészen", "alapvetően", "természetesen", "valójában", "egyáltalán",
    
    # Negations / modal
    "nem", "se", "sem", "soha", "senki", "semmi", "egyáltalán", "lehet", "lenne", "kellene", "muszáj"] 
    text = raw_text
    
    # 1. Normalize whitespace
    text = re.sub(r'\n\s*\n+', '\n\n', text)  # collapse multiple newlines
    text = re.sub(r'[ \t]+', ' ', text)       # normalize spaces
    
    # 2. Remove OCR artifacts (page numbers, random punctuation, repeated company info)
    text = re.sub(r'Oldal \d+/\d+', '', text)           # remove page numbers
    text = re.sub(r'Verzi[ói] \(datum\).*', '', text)  # remove version/date lines
    text = re.sub(r'Nadudvari Elelmiszer Kft\.*', '', text)  # remove repeated company name
    text = re.sub(r'EBIR csoport J[ée]ovahagyta.*', '', text)
    text = re.sub(r'Linbert M[ée]rndki Tanacsad[óo] Iroda.*', '', text)
    text = re.sub(r'[0-9]{5,}', '', text)  # remove long numeric strings (barcodes, IDs)
    text = re.sub(r'[©®]', '', text)       # remove special symbols
    
    # 3. Remove extra punctuation
    text = re.sub(r'[-–—]{2,}', '', text)  # remove multiple dashes
    text = re.sub(r'[^\S\r\n]{2,}', ' ', text)  # remove extra spaces
    text = re.sub(r'[\|\[\]\(\)]+', '', text)   # remove stray brackets/pipes
    
    # 4. Remove Hungarian stopwords (optional: only if you want to simplify text further)
    pattern = r'\b(?:' + '|'.join(HUNGARIAN_STOPWORDS) + r')\b'
    text = re.sub(pattern, '', text, flags=re.IGNORECASE)
    
    # 5. Strip leading/trailing whitespace on each line
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    text = '\n'.join(lines)
    
    return text



# -------------------------------
# STEP 2: Extract images and OCR text
# -------------------------------
def extract_images_with_ocr(pdf_path, preview=True):
    doc = pymupdf.open(pdf_path)
    images_info = []

    for page_index, page in enumerate(doc, start=1):
        imgs = page.get_images(full=True)
        for img_index, img in enumerate(imgs, start=1):
            xref = img[0]
            pix = doc.extract_image(xref)
            image_bytes = pix["image"]

            # Load image in memory
            image = Image.open(io.BytesIO(image_bytes))

            ocr_text = pytesseract.image_to_string(image)
            images_info.append(clean_text3(ocr_text))

    images_info = "".join(images_info)
    return images_info