import json
import uvicorn
import httpx
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from dotenv import load_dotenv

# Load API keys (ensure GOOGLE_API_KEY is in your .env)
load_dotenv()
llm = ChatGoogleGenerativeAI(
    model="models/gemini-2.5-flash",
    temperature=0.2,
    max_tokens=2048
)

app = FastAPI()

# --- Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- WebSocket Connection Manager ---
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
    image_data: str | None = None  

# --- External Dispatcher (Webhooks) ---
async def dispatch_to_external_services(incident_data: dict):
    if not incident_data.get("requires_external_services"):
        return
    
    category = incident_data.get("incident_category", "").lower()
    payload = {
        "priority": incident_data.get("severity_level"),
        "location": incident_data.get("location_extracted"),
        "summary": incident_data.get("ai_standardized_summary")
    }

    async with httpx.AsyncClient() as client:
        try:
            if category == "fire":
                print("🔥 [WEBHOOK FIRED] Sending automated alert to Fire Department API...")
            elif category == "medical":
                print("🚑 [WEBHOOK FIRED] Sending automated alert to Hospital EMS API...")
            elif category == "natural disaster":
                print("🌪️ [WEBHOOK FIRED] Sending automated alert to Disaster Management...")
        except Exception as e:
            print(f"Failed to reach external service: {e}")

# --- REST Endpoints ---
@app.post("/api/incidents")
async def report_incident(report: IncidentReport):
    
    # Updated prompt combining your Gemini rules with the Dashboard's expected JSON
    system_prompt = '''You are an emergency analysis assistant for a hospitality venue.
    Analyze the given emergency situation (text, image, or both) and return output STRICTLY in valid JSON format:
    {
      "incident_category": "Medical or Fire or Security or Natural Disaster or Other",
      "severity_level": "Critical or High or Medium or Low",
      "location_extracted": "",
      "weapons_or_hazards_present": false,
      "requires_external_services": false,
      "number_of_people_affected": 1,
      "ai_standardized_summary": "",
      "confidence_score": 0.95
    }
    Rules:
    - DO NOT include Markdown formatting (like ```json).
    - DO NOT include any extra text or thoughts outside the JSON.
    - Keep the summary concise and highly professional.
    '''

    user_input = f"Location: {report.reported_location}\nReport: {report.raw_text}"
    
    # Construct the multimodal message payload for LangChain
    content_blocks = [
        {"type": "text", "text": user_input}
    ]
    
    # Attach image if provided by the frontend
    if report.image_data:
        image_url = report.image_data
        # Ensure the frontend base64 string is properly formatted for Gemini
        if not image_url.startswith("data:image"):
            image_url = f"data:image/jpeg;base64,{image_url}"
            
        content_blocks.append({
            "type": "image_url",
            "image_url": image_url
        })

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=content_blocks)
    ]

    try:
        # Invoke Gemini 2.5 Flash
        response = llm.invoke(messages)
        output_text = response.content.strip()
        
        # Clean up Markdown block if the LLM ignores instructions
        if output_text.startswith("```json"):
            output_text = output_text[7:]
        if output_text.endswith("```"):
            output_text = output_text[:-3]
            
        parsed_incident = json.loads(output_text.strip())
        
    except Exception as e:
        print(f"Error parsing Gemini response: {e}")
        # Robust fallback
        parsed_incident = {
            "incident_category": "Unknown",
            "severity_level": "High",
            "location_extracted": report.reported_location,
            "weapons_or_hazards_present": False,
            "requires_external_services": True,
            "number_of_people_affected": 0,
            "ai_standardized_summary": f"System parsing error. Raw report: {report.raw_text}",
            "confidence_score": 0.0
        }
    
    # Broadcast to CAD Dashboard & Dispatch
    await manager.broadcast(parsed_incident)
    await dispatch_to_external_services(parsed_incident)
    
    return {"status": "success", "message": "Incident successfully processed.", "data": parsed_incident}

# --- WebSocket Endpoints ---
@app.websocket("/ws/alerts")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)