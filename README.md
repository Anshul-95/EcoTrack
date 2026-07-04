# EcoTrack – Personal Carbon AI Footprint Tracker

An internship project to track, analyze, and optimize personal carbon footprint using AI insights.

## Project Structure

- `frontend/`: React.js + Vite application (port `5173`)
- `backend/`: Flask API (port `5000`)

## Getting Started

### Backend Setup

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Set up a virtual environment and activate it:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the Flask application:
   ```bash
   python app.py
   ```
   The backend will be available at `http://localhost:5000`.

### Frontend Setup

1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`.
