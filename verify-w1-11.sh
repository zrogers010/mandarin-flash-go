#!/bin/bash
# W1-11 Verification Script
# Run this against the deployed site to verify SEO and sitemap changes

BASE_URL="${1:-https://mandarinflash.com}"

echo "========================================"
echo "W1-11 Verification for $BASE_URL"
echo "========================================"
echo ""

# Test 1: Auth pages have noindex meta tag
echo "1. Checking auth pages for noindex meta tag..."
echo "-------------------------------------------"
for page in login signup verify-email reset-password forgot-password; do
  echo -n "  /$page: "
  if curl -s "$BASE_URL/$page" | grep -q '<meta name="robots" content="noindex, nofollow"'; then
    echo "✓ noindex found"
  else
    echo "✗ noindex NOT found"
  fi
done
echo ""

# Test 2: Auth pages NOT in sitemap
echo "2. Checking sitemap does NOT contain auth pages..."
echo "-------------------------------------------"
echo -n "  Checking for login/signup: "
if curl -s "$BASE_URL/sitemap.xml" | grep -qE '(login|signup)'; then
  echo "✗ Auth pages STILL in sitemap"
else
  echo "✓ Auth pages removed from sitemap"
fi
echo ""

# Test 3: Sitemap contains canonical routes only
echo "3. Checking sitemap contains canonical routes..."
echo "-------------------------------------------"
echo -n "  Checking for /hsk: "
if curl -s "$BASE_URL/sitemap.xml" | grep -q '<loc>https://mandarinflash.com/hsk</loc>'; then
  echo "✓ Found"
else
  echo "✗ NOT found"
fi

echo -n "  Checking for /pinyin: "
if curl -s "$BASE_URL/sitemap.xml" | grep -q '<loc>https://mandarinflash.com/pinyin</loc>'; then
  echo "✓ Found"
else
  echo "✗ NOT found"
fi

echo -n "  Checking for old /hsk-hub: "
if curl -s "$BASE_URL/sitemap.xml" | grep -q 'hsk-hub'; then
  echo "✗ Old URL still in sitemap"
else
  echo "✓ Old URL removed"
fi

echo -n "  Checking for old /pinyin-chart: "
if curl -s "$BASE_URL/sitemap.xml" | grep -q 'pinyin-chart'; then
  echo "✗ Old URL still in sitemap"
else
  echo "✓ Old URL removed"
fi
echo ""

# Test 4: Redirects work (client-side, so check HTTP 200 and final URL)
echo "4. Checking redirects (client-side in SPA)..."
echo "-------------------------------------------"
echo "  Note: Client-side redirects won't show HTTP 301."
echo "  Test manually in browser that /hsk-hub → /hsk and /pinyin-chart → /pinyin"
echo ""

# Test 5: Canonical routes still work
echo "5. Checking canonical routes are accessible..."
echo "-------------------------------------------"
for page in hsk pinyin; do
  echo -n "  /$page: "
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/$page")
  if [ "$STATUS" = "200" ]; then
    echo "✓ HTTP $STATUS"
  else
    echo "✗ HTTP $STATUS"
  fi
done
echo ""

echo "========================================"
echo "Verification complete!"
echo "========================================"
