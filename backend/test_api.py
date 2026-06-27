import urllib.request
from urllib.error import HTTPError

try:
    urllib.request.urlopen('http://localhost:5000/meetings/code/TM-7YZXUI')
except HTTPError as e:
    print('STATUS:', e.code)
    print('BODY:', e.read().decode('utf-8'))
except Exception as e:
    print('ERROR:', str(e))
