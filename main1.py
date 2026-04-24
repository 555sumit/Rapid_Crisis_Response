import ollama
import time

start_time = time.time()

system_prompt = '''You are an emergency analysis assistant.
Return output STRICTLY in this format:

Emergency Category:
Severity Level:
Location:
People Involved:
External Services Required:
Summary:

Rules:
- DO NOT include "Thinking", "Analysis", or explanations
- DO NOT include any extra text
- In the external services required include only upto three services and main 
services keep things specific
- DO NOT describe steps
- If unsure, write "Unknown"
- Output must start directly with "Emergency Category:.'''


user_input = '''Due to continuous heavy rainfall over the past few hours, water levels 
in a residential area are rising rapidly. Several houses are already partially submerged, 
and residents are trying to move their belongings to safer locations.'''


result = ollama.chat(
    model  = 'gemma4:31b-cloud',
    messages=[
        {'role': 'system', 'content': system_prompt},
        {
            'role': 'user',
            'content': user_input
        }
    ]
    
)

print(result.message.content)

end_time = time.time()
print(f"Execution time: {end_time - start_time} seconds")