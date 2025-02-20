import httpx
import os
import base64

# Assume genai is a library for interacting with the Gemini API
import genai

model = genai.GenerativeModel(model_name="gemini-1.5-pro")
image_path = "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Palace_of_Westminster_from_the_dome_on_Methodist_Central_Hall.jpg/2560px-Palace_of_Westminster_from_the_dome_on_Methodist_Central_Hall.jpg"

image = httpx.get(image_path)

prompt = "Caption this image."
response = model.generate_content([
    {'mime_type': 'image/jpeg', 'data': base64.b64encode(image.content).decode('utf-8')},
    prompt
])

print(response.text)
