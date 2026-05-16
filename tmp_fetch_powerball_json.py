import urllib.request, gzip, json
url = 'https://www.powerball.com/api/v1/numbers/powerball/recent10'
req = urllib.request.Request(url, headers={
    'User-Agent': 'Mozilla/5.0',
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'Accept-Encoding': 'gzip, deflate, br',
    'X-Requested-With': 'XMLHttpRequest'
})
with urllib.request.urlopen(req, timeout=20) as r:
    body = r.read()
    if r.info().get('Content-Encoding') == 'gzip' or body[:2] == b'\x1f\x8b':
        body = gzip.decompress(body)
    text = body.decode('utf-8', 'ignore')
    print('CODE', r.getcode())
    print('HEADERS', r.info().items())
    print(text[:1200])
    try:
        data = json.loads(text)
        print('PARSED', type(data), len(data) if hasattr(data, '__len__') else '')
    except Exception as e:
        print('JSON ERR', e)
