import requests

url = "https://newsnow.p.rapidapi.com/newsv2_top_news"

payload = {
	"location": "us",
	"language": "en",
	"page": 1,
	"time_bounded": False,
	"from_date": "01/02/2021",
	"to_date": "05/06/2021"
}
headers = {
	"x-rapidapi-key": "98e9cc28dbmsh1d7d910a6c3c37cp17c08ajsnad1e0402f572",
	"x-rapidapi-host": "newsnow.p.rapidapi.com",
	"Content-Type": "application/json"
}

response = requests.post(url, json=payload, headers=headers)

print(response.json())