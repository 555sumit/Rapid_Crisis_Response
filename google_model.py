from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from dotenv import load_dotenv

load_dotenv()

llm = ChatGoogleGenerativeAI(model="models/gemini-2.5-flash",
  temperature=0.2,
  max_tokens=2048)

system_message = SystemMessage(content="""You are a helpful assistant. Keep responses concise. 
do not include any formatting like adding stars keep answers in plain text. """)

while True:
    user_input = input("User: ")
    if user_input.lower() in ['exit', 'quit']:
        print("Exiting the chat. Goodbye!")
        break
    else:
        human_message = HumanMessage(content=user_input)
        output = llm.invoke([system_message, human_message])
        print("Assistant:", output.content)

    