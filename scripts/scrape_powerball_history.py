import re
import time
from datetime import datetime

import pg8000
import requests
from bs4 import BeautifulSoup

URL_TEMPLATE = "https://www.powerball.com/previous-results?gc=powerball&sd={sd}&ed={ed}"
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
}
YEAR_START = 2000
YEAR_END = 2019

DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'appdb',
    'user': 'appuser',
    'password': 'secret',
}

ROW_PATTERN = re.compile(
    r"(?P<date>(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4})"
    r"\s+(?P<w1>\d{1,2})\s+(?P<w2>\d{1,2})\s+(?P<w3>\d{1,2})\s+(?P<w4>\d{1,2})\s+(?P<w5>\d{1,2})\s+(?P<power>\d{1,2})"
    r"(?:\s+Power Play\s+(?P<power_play>\S+))?",
    flags=re.IGNORECASE,
)


def fetch_year_html(year: int) -> str:
    sd = f"{year}-01-01"
    ed = f"{year}-12-31"
    url = URL_TEMPLATE.format(sd=sd, ed=ed)
    print(f"Fetching {year}: {url}")
    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    return resp.text


def parse_drawings_from_html(html: str):
    soup = BeautifulSoup(html, 'html.parser')
    body_text = soup.body.get_text(separator=' ', strip=True) if soup.body else soup.get_text(separator=' ', strip=True)
    rows = []
    for match in ROW_PATTERN.finditer(body_text):
        d = datetime.strptime(match.group('date'), '%a, %b %d, %Y').date()
        rows.append({
            'draw_date': d.isoformat(),
            'white_ball_1': int(match.group('w1')),
            'white_ball_2': int(match.group('w2')),
            'white_ball_3': int(match.group('w3')),
            'white_ball_4': int(match.group('w4')),
            'white_ball_5': int(match.group('w5')),
            'powerball': int(match.group('power')),
            'power_play': match.group('power_play') or '',
        })
    return rows


def upsert_drawings(drawings):
    conn = pg8000.connect(**DB_CONFIG)
    try:
        cursor = conn.cursor()
        cursor.execute(
            '''
            CREATE TABLE IF NOT EXISTS powerball_drawings (
                draw_date DATE PRIMARY KEY,
                white_ball_1 SMALLINT NOT NULL,
                white_ball_2 SMALLINT NOT NULL,
                white_ball_3 SMALLINT NOT NULL,
                white_ball_4 SMALLINT NOT NULL,
                white_ball_5 SMALLINT NOT NULL,
                powerball SMALLINT NOT NULL,
                power_play TEXT
            )
            '''
        )
        conn.commit()

        insert_sql = '''
            INSERT INTO powerball_drawings
                (draw_date, white_ball_1, white_ball_2, white_ball_3, white_ball_4, white_ball_5, powerball, power_play)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (draw_date) DO UPDATE
            SET white_ball_1 = EXCLUDED.white_ball_1,
                white_ball_2 = EXCLUDED.white_ball_2,
                white_ball_3 = EXCLUDED.white_ball_3,
                white_ball_4 = EXCLUDED.white_ball_4,
                white_ball_5 = EXCLUDED.white_ball_5,
                powerball = EXCLUDED.powerball,
                power_play = EXCLUDED.power_play
        '''

        for drawing in drawings:
            cursor.execute(insert_sql, (
                drawing['draw_date'],
                drawing['white_ball_1'],
                drawing['white_ball_2'],
                drawing['white_ball_3'],
                drawing['white_ball_4'],
                drawing['white_ball_5'],
                drawing['powerball'],
                drawing['power_play'],
            ))
        conn.commit()
        print(f"Upserted {len(drawings)} drawings into powerball_drawings")
    finally:
        conn.close()


def main():
    all_drawings = []
    seen_dates = set()
    for year in range(YEAR_START, YEAR_END + 1):
        html = fetch_year_html(year)
        year_drawings = parse_drawings_from_html(html)
        if not year_drawings:
            raise RuntimeError(f"No drawings parsed for {year}; page structure may have changed")
        for drawing in year_drawings:
            if drawing['draw_date'] not in seen_dates:
                seen_dates.add(drawing['draw_date'])
                all_drawings.append(drawing)
        time.sleep(1)

    all_drawings.sort(key=lambda x: x['draw_date'])
    print(f"Total parsed drawings: {len(all_drawings)}")
    upsert_drawings(all_drawings)

    sql_file = 'backend/db/powerball_history_2000_2019.sql'
    with open(sql_file, 'w', encoding='utf-8') as f:
        f.write('-- Powerball history insert statements for 2000-2019\n')
        f.write('INSERT INTO powerball_drawings (draw_date, white_ball_1, white_ball_2, white_ball_3, white_ball_4, white_ball_5, powerball, power_play) VALUES\n')
        for idx, drawing in enumerate(all_drawings):
            power_play = drawing['power_play'].replace("'", "''")
            line = (
                f"('{drawing['draw_date']}', {drawing['white_ball_1']}, {drawing['white_ball_2']}, {drawing['white_ball_3']}, {drawing['white_ball_4']}, {drawing['white_ball_5']}, {drawing['powerball']}, '{power_play}')"
            )
            if idx < len(all_drawings) - 1:
                line += ',\n'
            else:
                line += ';\n'
            f.write(line)
    print(f"Wrote SQL file: {sql_file}")


if __name__ == '__main__':
    main()
