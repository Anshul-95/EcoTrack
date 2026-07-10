#  EcoTrack – Personal Carbon AI Footprint Tracker

EcoTrack is a full-stack AI-powered web application that helps users monitor, analyze, and reduce their daily carbon footprint. The platform allows users to log transportation, food, and household energy activities, calculate carbon emissions, visualize environmental impact through interactive dashboards, and receive AI-powered sustainability recommendations.

---

##  Live Demo

🌐 **Frontend:** https://eco-track-theta-ten.vercel.app

🔗 **Backend API:** https://ecotrack-backend-hjpe.onrender.com/api/test

---

##  Features

-  Secure User Authentication using Firebase Authentication
-  Track transportation carbon emissions
-  Log food consumption habits
-  Record household energy usage
-  Interactive Dashboard with charts and statistics
-  Carbon emission history tracking
-  AI-powered sustainability recommendations using Groq LLaMA 3.3-70B
-  Cloud storage using Firebase Firestore
-  Responsive modern UI with glassmorphism design
-  Cloud deployment using Vercel and Render

---

#  Tech Stack

## Frontend

- React.js
- Vite
- CSS3
- Chart.js
- Framer Motion
- Axios

## Backend

- Flask
- Python
- Flask-CORS

## Database

- Firebase Cloud Firestore

## Authentication

- Firebase Authentication

## Artificial Intelligence

- Groq API
- LLaMA 3.3-70B Versatile

## Deployment

- Vercel
- Render
- GitHub

---

## 📂 Project Structure

```text
EcoTrack/
│
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   ├── .env
│   └── venv/
│
├── frontend/
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   │
│   ├── src/
│   │   ├── assets/
│   │   │   ├── hero.png
│   │   │   ├── react.svg
│   │   │   └── vite.svg
│   │   │
│   │   ├── components/
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── PublicRoute.jsx
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── HabitLogger.jsx
│   │   │   ├── History.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Register.jsx
│   │   │   └── Suggestions.jsx
│   │   │
│   │   ├── api.js
│   │   ├── firebase.js
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── .env
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js
│   └── index.html
│
├── .gitignore
└── README.md
```

#  Installation

## Clone Repository

```bash
git clone https://github.com/Anshul-95/EcoTrack.git
cd EcoTrack
Backend Setup
cd backend

Create a virtual environment

python -m venv venv

Activate environment

Windows
venv\Scripts\activate
macOS/Linux
source venv/bin/activate

Install dependencies

pip install -r requirements.txt

Run backend

python app.py

Backend runs on

http://localhost:5000
Frontend Setup
cd frontend

Install packages

npm install

Run development server

npm run dev

Frontend runs on

http://localhost:5173
Environment Variables
Backend (.env)
GROQ_API_KEY=your_groq_api_key
Frontend (.env)
VITE_FIREBASE_API_KEY=YOUR_KEY
VITE_FIREBASE_AUTH_DOMAIN=YOUR_DOMAIN
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=YOUR_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_APP_ID
VITE_FIREBASE_MEASUREMENT_ID=YOUR_MEASUREMENT_ID
VITE_API_URL=http://localhost:5000
Carbon Calculation Modules

The application calculates carbon emissions based on:

 Transportation
Petrol Car
Diesel Car
Bike
Bus
Train
Flight
Walking
Cycling
 Food
Vegan
Vegetarian
Pescatarian
Low Meat
High Meat
⚡ Energy
Electricity
Natural Gas
Heating Oil
AI Recommendation System

EcoTrack integrates Groq's LLaMA 3.3-70B Versatile model to generate personalized sustainability recommendations.

The AI analyzes:

Transportation habits
Food consumption
Household energy usage

It provides practical eco-friendly suggestions to help users reduce their carbon footprint.

Application Modules
Login
Register
Dashboard
Habit Logger
History
AI Insights
Profile
Screenshots

Add screenshots here.

Login Page
Dashboard
Habit Logger
History
AI Insights
Profile
Future Enhancements
Edit & Delete Habit Logs
Carbon Reduction Goals
Achievement Badges
Leaderboard
Mobile Application
Push Notifications
Export Reports (PDF/CSV)
Author

Anshul Rajesh Upganlawar

B.Tech Computer Science Engineering
SRM University AP

Microsoft Learn Student Ambassador

License

This project is developed for educational purposes as part of a university project.


---

