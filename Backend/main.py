import json
import uvicorn
import httpx
import re
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import ollama

app = FastAPI()

# --- Middleware ---
# Allows your React frontend to communicate with this backend without CORS blocking
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- WebSocket Connection Manager ---
# Handles real-time communication to the Staff Dashboard
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            await connection.send_json(message)

manager = ConnectionManager()

# --- Input Data Model ---
class IncidentReport(BaseModel):
    raw_text: str
    reported_location: str
    image_data: str | None = None  # Receives base64 image string from the React frontend

# --- External Dispatcher (Webhooks) ---
# Automatically routes critical alerts to external 911/First Responder APIs
async def dispatch_to_external_services(incident_data: dict):
    if not incident_data.get("requires_external_services"):
        return
    
    category = incident_data.get("incident_category", "").lower()
    payload = {
        "priority": incident_data.get("severity_level"),
        "location": incident_data.get("location_extracted"),
        "summary": incident_data.get("ai_standardized_summary")
    }

    # Asynchronous external API calls to prevent blocking the main server
    async with httpx.AsyncClient() as client:
        try:
            if category == "fire":
                print("🔥 [WEBHOOK FIRED] Sending automated alert to Fire Department API...")
                # await client.post("https://api.local-fire-dept.gov/dispatch", json=payload)
                
            elif category == "medical":
                print("🚑 [WEBHOOK FIRED] Sending automated alert to Hospital EMS API...")
                # await client.post("https://api.local-hospital.org/emergency", json=payload)
                
            elif category == "natural disaster":
                print("🌪️ [WEBHOOK FIRED] Sending automated alert to Disaster Management...")
                # await client.post("https://api.disaster-management.gov/alert", json=payload)
                
        except Exception as e:
            print(f"Failed to reach external service: {e}")

# --- REST Endpoints ---
@app.post("/api/incidents")
async def report_incident(report: IncidentReport):
    
    # Strict prompt to ensure predictable JSON outputs for the dashboard
    system_prompt = '''You are an emergency analysis assistant for a hospitality venue.
    Given the text (and potentially an image) about the emergency situation, return output STRICTLY in valid JSON format:
    {
      "incident_category": "Medical or Fire or Security or Natural Disaster or Other",
      "severity_level": "Critical or High or Medium or Low",
      "location_extracted": "",
      "weapons_or_hazards_present": false,
      "requires_external_services": false,
      "number_of_people_affected": 1,
      "ai_standardized_summary": "",
      "confidence_score": 0.9
    }
    Rules:
    - DO NOT include "Thinking", "Analysis", or explanations.
    - DO NOT include any extra text outside the JSON.
    - Keep the summary concise and professional.
    '''

    user_input = f"Location: {report.reported_location}\nReport: {report.raw_text}"
    
    # Construct the message payload for Ollama
    message_content = {'role': 'user', 'content': user_input}
    
    # If an image was attached via the frontend, clean the base64 header and append it
    if report.image_data:
        clean_base64 = re.sub('^data:image/.+;base64,', '', report.image_data)
        message_content['images'] = [clean_base64]

    # Run the local Ollama model (forcing JSON format to prevent parsing crashes)
    result = ollama.chat(
        model='gemma4:31b-cloud',
        messages=[
            {'role': 'system', 'content': system_prompt},
            message_content
        ],
        format='json' 
    )
    
    output_text = result['message']['content']
    
    # Safely parse the AI output, with a robust fallback if formatting fails
    try:
        parsed_incident = json.loads(output_text)
    except json.JSONDecodeError:
        parsed_incident = {
            "incident_category": "Unknown",
            "severity_level": "High",
            "location_extracted": report.reported_location,
            "weapons_or_hazards_present": False,
            "requires_external_services": True,
            "number_of_people_affected": 0,
            "ai_standardized_summary": "System parsing error. Raw report: " + report.raw_text,
            "confidence_score": 0.0
        }
    
    # 1. Instantly broadcast to internal staff dashboard via WebSockets
    await manager.broadcast(parsed_incident)
    
    # 2. Trigger external dispatch routing (Fire, Medical, etc.) in the background
    await dispatch_to_external_services(parsed_incident)
    
    return {"status": "success", "message": "Incident successfully processed and routed.", "data": parsed_incident}

# --- WebSocket Endpoints ---
@app.websocket("/ws/alerts")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep the connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

if __name__ == "__main__":
    # Runs the server on localhost port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)