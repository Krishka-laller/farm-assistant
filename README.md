# Multilingual AI Farm Decision Assistant

A mobile-first web application designed to help Indian farmers make informed farming decisions. The platform provides localized agricultural advice across multiple Indian regional languages through conversational chat, weather advisories, market commodity prices, crop recommendations, leaf disease analysis, and fertilizer guidance.

## What the App Does

- Multilingual Chat: Conversational farming advice in Hindi, Punjabi, Tamil, Telugu, Marathi, Gujarati, Bengali, and English.
- Crop Recommendation: Suggestions based on user coordinates, soil type, crop season, and water availability.
- Disease Identification: Leaf image diagnosis and treatment suggestions.
- Weather Advisory: Farming action advice (sowing, irrigation, spraying) based on forecast data.
- Mandi Prices: Market commodity prices with modal rates and arrival dates across Indian states and districts.
- Fertilizer Guidance: General safety practices, nutrient advice, and Krishi Vigyan Kendra (KVK) consultation prompts.

## Stateless Design

The application follows a strictly stateless architecture:
- No Database: The application does not include or connect to any database.
- No Stored Chat History: Conversation history is maintained entirely within the client session and sent in request payloads. Nothing is persisted on the server.
- No Stored Photos: Uploaded leaf images are validated, sanitized, and evaluated in memory. Files are not saved to server disk or persistent cloud buckets.

## Data Sources

- Weather: Open-Meteo API (open-meteo.com) for real-time weather and forecast data.
- Mandi Prices: Agmarknet dataset via data.gov.in official government API.
- AI Reasoning: Google Gemini API for natural language assistance and vision-based image diagnosis.
- Institutional Guidance: Krishi Vigyan Kendra (KVK) reference recommendations.

## Environment Variables

Only variable names are listed below. Do not commit secret values to version control.

### Backend (.env)

- GEMINI_API_KEY
- DATA_GOV_IN_API_KEY
- ALLOWED_ORIGINS
- MAX_IMAGE_SIZE_MB
- RATE_LIMIT_DEFAULT
- RATE_LIMIT_UPLOAD
- RATE_LIMIT_CHAT

### Frontend (.env.local)

- NEXT_PUBLIC_API_URL
- NEXT_PUBLIC_SITE_URL

## How to Run

### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   - On Windows:
     ```bash
     .\venv\Scripts\activate
     ```
   - On Linux or macOS:
     ```bash
     source venv/bin/activate
     ```

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Configure environment variables in `.env` based on `.env.example`.

6. Run the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload
   ```

The backend server runs on `http://127.0.0.1:8000`.

### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `.env.local` based on `.env.example`.

4. Start the Next.js development server:
   ```bash
   npm run dev
   ```

The frontend application runs on `http://localhost:3000`.

### API Client Generation

To regenerate the frontend TypeScript API client from the backend OpenAPI schema:
```bash
cd frontend
npm run gen:api
```
