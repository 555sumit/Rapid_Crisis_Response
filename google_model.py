from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from dotenv import load_dotenv
import speech_recognition as sr
import json
import base64

recognizer = sr.Recognizer()

with sr.Microphone() as source:
    recognizer.adjust_for_ambient_noise(source, duration=1)
    print('speak now: ')
    audio = recognizer.listen(source)


text = recognizer.recognize_google(audio)
print(text)

load_dotenv()

llm = ChatGoogleGenerativeAI(model="models/gemini-2.5-flash",
  temperature=0.2,
  max_tokens=2048)




system_message = SystemMessage(content="""you are an emergency response assistant. Your task is to
 analyze the given emergency situation(text, image, or both) and provide structured information 
 that can help emergency responders assess the situation and determine the necessary actions. The
  information you provide should be concise, accurate, and relevant to the emergency at hand.
  return the information with the following fields:
  "category":"",
  "severity":"",
  "location":"",
  "people_involved": number of people involved
  "services_required":[],
  "summary":"",
  "confidence_score": number between 0 and 1 representing the confidence level of the information provided
  
  for external services required include only required or emergency services.
 

  if the user query is not about the emergency analysis, respond normally in plain text form

  
  
  """)

# user_input = '''A high-rise residential building is engulfed in intense flames , with fire
#  spreading rapidly across multiple floors and thick smoke rising into the air. 8 to 10
#   occupants may still be trapped inside, and immediate evacuation along with
#    urgent fire brigade and emergency rescue assistance is required.'''

with open("burning-shopping-center-mall-with-smoke.jpg", "rb") as f:
    image_data = base64.b64encode(f.read()).decode("utf-8")

message = HumanMessage(
    content=[
        {
            "type": "text",
            "text": text
        },
        {
            "type": "image_url",
            "image_url": f"data:image/jpeg;base64,{image_data}"
        }
    ]
)

response = llm.invoke([system_message, message])

print(response.content)