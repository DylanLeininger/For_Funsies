import requests

url = 'https://www.powerball.com/previous-results?gc=powerball&sd=2003-01-01&ed=2003-12-31'
resp = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=30)
text = resp.text
markers = ['window.__INITIAL_STATE__', 'api', 'json', 'dataLayer', 'application/json', 'previous-results', 'draw_date', 'white_ball', 'power_play']
for marker in markers:
    if marker.lower() in text.lower():
        print(marker, 'found', text.lower().count(marker.lower()))

idx = text.lower().find('window.__initial_state__')
if idx >= 0:
    print('--- window snippet ---')
    print(text[idx-200:idx+400])
else:
    idx = text.lower().find('draw_date')
    if idx >= 0:
        print('--- draw_date snippet ---')
        print(text[idx-200:idx+400])
    else:
        print('no draw_date or INITIAL_STATE found')
