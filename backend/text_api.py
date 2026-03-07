import requests

url = "http://localhost:5000/encrypt"

data = {
    "text": "I finally got the job but I'm nervous"
}

response = requests.post(url, json=data)

print(response.json())