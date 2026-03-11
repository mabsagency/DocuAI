import urllib.request
import json

image='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg=='
req = urllib.request.Request('http://localhost:3000/api/ocr', data=json.dumps({'image': image}).encode('utf-8'), headers={'Content-Type':'application/json'})
with urllib.request.urlopen(req) as res:
    print(res.status)
    print(res.read().decode())
