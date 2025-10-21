# Food label extractor application

## OVERVIEW
This is the front-end application for the Food Label Extractor tool. It processes PDF food labels via a backend API to extract nutritional values and allergen information, displaying the results in a UI with a comparative chart.


## CORE FUNCTIONS
1.  UPLOAD: Drag-and-drop or browse to upload PDF files (max 5MB each).
2.  PROCESS: Click 'Process [X] File(s)' to send pending PDFs sequentially to the backend API (/api/process_pdf).
3.  COMPARE: A Radar Chart visualizes key nutritional data for all 'Done' files.
4.  VIEW: Click on file tabs to see detailed results (Product Info, Allergens, Nutrition Table).
5.  EXPORT: Click 'Download CSV' to get a spreadsheet of all processed data.

## SETUP COMMANDS (Standard Create React App)
-   npm install (Install dependencies)
-   npm start (Run the app in development mode)
-   npm run build (Build the app for production deployment)