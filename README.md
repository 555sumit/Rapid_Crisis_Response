# Rapid Crisis Response

Rapid Crisis Response is an emergency coordination platform designed to automate data extraction and streamline triage during critical events. By utilizing the **Gemma 4:31-b** cloud model, the system processes complex crisis data in real-time, providing actionable insights through a high-performance **FastAPI** backend and a responsive **React** frontend.

## 📂 Project Structure

```text
Rapid_Crisis_Response/
├── README.md               # Project documentation
├── main1.py                # Core Gemma 4:31-b model integration logic
├── backend/
│   ├── main.py             # FastAPI server and API endpoints
│   └── requirements.txt    # Python backend dependencies
└── frontend/
    ├── src/
    │   └── App.jsx         # Primary React interface
    ├── package.json        # Frontend dependencies and scripts
    └── ...                 # Supporting React components and assets

🛠️ Tech Stack
Intelligence: Gemma 4:31-b Cloud Model (Generative AI for data extraction)

Backend: FastAPI (Python)

Frontend: React.js (Modern UI/UX)

Communication: RESTful API / JSON Parameter Extraction

🚀 Getting Started
Backend Setup
Navigate to the backend directory:
cd backend

Install dependencies:
pip install -r requirements.txt

Start the FastAPI server:
uvicorn main:app --reload

Frontend Setup
Navigate to the frontend directory:
cd frontend

Install dependencies:
npm install

Start the development server:
npm start

Model Integration
The main1.py file in the root directory contains the logic for interacting with the Gemma 4:31-b cloud model. Ensure your environment variables and cloud credentials are configured to allow the FastAPI backend to communicate with the model service.

📋 Features
Automated Triage: Uses LLM capabilities to categorize emergency requests.

Rapid Data Extraction: Converts unstructured crisis reports into structured JSON data.

Real-time Coordination: A centralized dashboard for hospitality and emergency responders.

Scalable Architecture: Clean separation between the AI model logic, the API layer, and the client-side UI.

📄 License
This project is developed for the Google Solution Challenge.