# TitlePerfect

An AI-powered Chrome extension that optimizes Amazon product titles for better SEO and conversion rates.

## Project Structure

```
titleperfect/
├── extension/           # Chrome extension (Manifest V3)
│   ├── manifest.json
│   ├── popup/          # React UI
│   ├── content/        # Content scripts
│   ├── background/     # Background service worker
│   └── package.json
├── backend/            # FastAPI backend
│   ├── app/
│   │   ├── main.py
│   │   ├── routers/
│   │   └── services/
│   ├── requirements.txt
│   └── Dockerfile
└── README.md
```

## Tech Stack

### Extension
- React 18
- TypeScript
- Tailwind CSS
- Vite (build tool)
- Chrome Extension Manifest V3

### Backend
- FastAPI
- Python 3.11
- Pydantic
- Anthropic Claude API (for AI-powered optimization)

### Deployment
- GCP Cloud Run (backend)
- Chrome Web Store (extension)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- Chrome browser
- Anthropic API key (optional, for AI optimization)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file from the example:
```bash
cp .env.example .env
```

5. Add your Anthropic API key to `.env`:
```
ANTHROPIC_API_KEY=your_key_here
PORT=8000
```

6. Run the development server:
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

### Extension Setup

1. Navigate to the extension directory:
```bash
cd extension
```

2. Install dependencies:
```bash
npm install
```

3. Build the extension:
```bash
npm run build
```

4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `extension/dist` directory

5. For development with hot reload:
```bash
npm run dev
```

## Usage

1. Navigate to any Amazon product page
2. Click the TitlePerfect extension icon
3. Click "Optimize Title" to generate an AI-optimized version
4. Copy the optimized title to your clipboard

## Development

### Extension Development

Run the development server with hot reload:
```bash
cd extension
npm run dev
```

Format code:
```bash
npm run format
```

Lint code:
```bash
npm run lint
```

### Backend Development

Run with auto-reload:
```bash
cd backend
uvicorn app.main:app --reload
```

Access API documentation:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Docker Deployment

### Build and run the backend container:

```bash
cd backend
docker build -t titleperfect-backend .
docker run -p 8000:8000 -e ANTHROPIC_API_KEY=your_key_here titleperfect-backend
```

### Deploy to GCP Cloud Run:

```bash
gcloud run deploy titleperfect-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars ANTHROPIC_API_KEY=your_key_here
```

## API Endpoints

### `POST /api/optimize-title`

Optimizes an Amazon product title.

**Request:**
```json
{
  "title": "Original Amazon product title here",
  "asin": "B08N5WRWNW"
}
```

**Response:**
```json
{
  "original_title": "Original Amazon product title here",
  "optimized_title": "Optimized title here",
  "asin": "B08N5WRWNW",
  "improvements": [
    "Reduced length from 150 to 120 characters",
    "Improved keyword placement",
    "Enhanced readability"
  ]
}
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
