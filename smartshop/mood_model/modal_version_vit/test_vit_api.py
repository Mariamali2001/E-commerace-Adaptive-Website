import requests

URL = "https://mariamali2001--vit-egypt-mood-dev-predict.modal.run"

IMAGE_PATH = "trial2.jpeg"

with open(IMAGE_PATH, "rb") as f:
    image_bytes = f.read()

response = requests.post(
    URL,
    data=image_bytes,
    headers={
        "Content-Type": "image/jpeg",
    },
    timeout=180,
)

print("Status:", response.status_code)
print("Response:")
print(response.text)
