import requests
from bs4 import BeautifulSoup

url = 'https://www.powerball.com/previous-results?gc=powerball&sd=2003-01-01&ed=2003-12-31'
resp = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=30)
print('status', resp.status_code)
print('len', len(resp.text))
print('content-type', resp.headers.get('Content-Type'))
print('has table', 'table' in resp.text.lower())
print('has result-item', 'result-item' in resp.text.lower())
print('has draw_date', 'draw_date' in resp.text.lower())
print('first 400 chars:')
print(resp.text[:400])
print('\n--- search for markers ---')
for marker in ['window.__INITIAL_STATE__', 'window.__DATA__', 'fetch(', 'ajax', 'api', 'json', 'draw_date', 'white_ball', 'powerball', 'previous-results', 'dataLayer']:
    print(marker, resp.text.lower().count(marker.lower()))

soup = BeautifulSoup(resp.text, 'html.parser')
print('script tags count:', len(soup.find_all('script')))
for i, script in enumerate(soup.find_all('script')):
    text = script.string or ''
    if not text:
        continue
    if any(marker.lower() in text.lower() for marker in ['window.__INITIAL_STATE__', 'window.__DATA__', 'fetch(', 'ajax', 'api', 'json', 'draw_date', 'white_ball', 'powerball', 'previous-results']):
        print('--- script', i, '---')
        print(text[:2000])
        break

print('\n--- body text sample ---')
body = soup.body.get_text(separator=' ', strip=True) if soup.body else ''
print(body[:1000])
