import requests
from bs4 import BeautifulSoup
from datetime import datetime

URL_TEMPLATE = "https://www.powerball.com/previous-results?gc=powerball&sd={sd}&ed={ed}"
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
}


def fetch_year(year):
    sd = f"{year}-01-01"
    ed = f"{year}-12-31"
    url = URL_TEMPLATE.format(sd=sd, ed=ed)
    print(f"Fetching {year}: {url}")
    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    return resp.text


def parse_drawings(html):
    soup = BeautifulSoup(html, 'html.parser')
    # Inspect the page for the listing container
    results = []
    # Powerball results may be in a table or in sections with result-item classes
    # Try table first
    table = soup.find('table')
    if table:
        headers = [th.get_text(strip=True).lower() for th in table.find_all('th')]
        print('Found table headers:', headers)
        for row in table.find_all('tr')[1:]:
            cols = [td.get_text(strip=True) for td in row.find_all('td')]
            if len(cols) < 8:
                continue
            results.append(cols)
        return results

    # Fallback: find result sections
    for item in soup.select('.result-item, .result-row, .drawings-results-row'):
        text = item.get_text(' ', strip=True)
        print('Found item text sample:', text[:200])
        break
    return results


if __name__ == '__main__':
    html = fetch_year(2003)
    drawings = parse_drawings(html)
    print('Parsed rows:', len(drawings))
    for item in drawings[:5]:
        print(item)
