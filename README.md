# PDF Food Label Parser

## Overview

This project extracts **allergens** and **nutritional values** from PDFs of food labels and presents them in a structured format.
It consists of a **React frontend** for file upload and visualization, and a **FastAPI backend** for PDF parsing and data extraction.

[![Watch the video](https://img.youtube.com/vi/sY7aYVVWKRE/maxresdefault.jpg)](https://youtu.be/sY7aYVVWKRE)



---

## User Documentation

### Access

* **Live site:** (Down at the moment)

### How to Use

1. Open the website in your browser.
2. Click **“Select PDF”** and choose one or more product PDFs.
3. Click **“Extract”**.
4. The app will display allergens and nutritional information in a structured table and chart.
5. Hover over charts to see absolute values in grams, milligrams, or kcal.

### Supported File Types

* `.pdf` only
* Maximum file size: 5 MB



---

## Developer Documentation


### Prerequisite
- Python 3.13.3
- Node.js and npm
- Tesseract OCR: sudo apt install tesseract-ocr
- OpenAI API Key

### Project Structure

```
pdf-foodlabel-parser/
├── backend/
│   ├── main.py          # FastAPI backend server
│   ├── requirements.txt
│   ├── utils/           # Helper functions for PDF parsing
│   └── venv/            # Python virtual environment
└── frontend/
    ├── src/             # React components
    ├── public/          # Static assets
    ├── build/           # Production build (generated)
    ├── package.json
    └── package-lock.json
```

### Setup Instructions
First, copy the source code from the GitHub repository:
```bash
git clone https://github.com/tobp03/pdf-foodlabel-parser.git
cd pdf-foodlabel-parser
```

#### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 &
```

#### Frontend

```bash
cd frontend
npm install
npm start          # development mode
npm run build      # production build
```

### Deployment Instructions (VPS with Nginx)

#### 1. Backend

```bash
cd ~/pdf-foodlabel-parser/backend
source venv/bin/activate
# Create a .env file with your OpenAI API key:
# OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
uvicorn main:app --host 0.0.0.0 --port 8000 &
```

#### 2. Frontend

```bash
cd ~/pdf-foodlabel-parser/frontend
npm run build
sudo rm -rf /var/www/html/*
sudo cp -r build/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html
```

#### 3. Nginx Configuration

Edit `/etc/nginx/sites-available/default`:

```nginx
server {
    server_name tobyp.fun www.tobyp.fun;

    client_max_body_size 5M;

    root /var/www/html;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/tobyp.fun/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tobyp.fun/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    if ($host = www.tobyp.fun) { return 301 https://$host$request_uri; }
    if ($host = tobyp.fun) { return 301 https://$host$request_uri; }

    listen 80;
    server_name tobyp.fun www.tobyp.fun;
}
```

#### 4. Reload Nginx

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Notes

* `client_max_body_size 5M` allows limited PDF uploads.
* Make sure Uvicorn backend is running before making API calls.
* Use `jobs` and `kill` to manage the background Uvicorn process.

### Troubleshooting

* **Error: Tesseract not installed**
  Install Tesseract OCR:

  ```bash
  sudo apt install tesseract-ocr
  ```
* **Backend not responding**
  Ensure the FastAPI backend is running:

  ```bash
  uvicorn main:app --host 0.0.0.0 --port 8000 &
  ```

###  Security Note 
The application currently uses a simple client-side password check. The correct password is hardcoded in the App.js file:
```javascript
const correctPassword = "admin123";
```
> For any production deployment, replace this with a secure login system.
