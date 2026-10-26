import httpx
import re

r = httpx.get("http://localhost:3000")
m = re.findall(r'href="(/_next/static/css/[^"]+\.css|/_next/static/chunks/[^"]+\.css)"', r.text)
print("CSS URLs found:", m)
if m:
    css_res = httpx.get("http://localhost:3000" + m[0])
    print("Status:", css_res.status_code)
    print("Length:", len(css_res.text))
    print("Contains @import tailwindcss:", "@import" in css_res.text)
    print("Contains bg-blue-600:", "bg-blue-600" in css_res.text)
    print("Sample:\n", css_res.text[:400])
