# Creating the PNG og:image

## Current Issue

The site uses `og-image.svg` for social media previews. SVG images are **not rendered** by Facebook, Twitter/X, or LinkedIn — they show a blank preview or fallback to the site favicon.

## Required

Create a PNG image with these specs:

- **Dimensions**: 1200 x 630 px (Facebook/LinkedIn/Twitter standard)
- **Format**: PNG (or JPG, but PNG preferred for text clarity)
- **File size**: < 1 MB (ideally 100-300 KB)
- **Content**:
  - MandarinFlash logo or brand name
  - Tagline: "Learn Chinese with HSK Vocabulary & Spaced Repetition"
  - Clean, professional design with good contrast
  - Chinese characters (e.g., 学习中文) for visual interest

## Steps to Create

### Option 1: Use Figma / Design Tool

1. Create a 1200 x 630 px canvas
2. Add background (gradient or solid color)
3. Add logo + text
4. Export as PNG

### Option 2: Use Canva

1. Go to canva.com
2. Create custom size: 1200 x 630 px
3. Design with text + Chinese characters
4. Download as PNG

### Option 3: Generate with Code

```python
from PIL import Image, ImageDraw, ImageFont

# Create image
img = Image.new('RGB', (1200, 630), color=(240, 124, 50))  # Orange/red brand color
draw = ImageDraw.Draw(img)

# Add text (you'll need to install fonts with Chinese support)
title_font = ImageFont.truetype("/path/to/NotoSansSC-Bold.ttf", 80)
subtitle_font = ImageFont.truetype("/path/to/NotoSansSC-Regular.ttf", 40)

draw.text((600, 250), "MandarinFlash", fill=(255, 255, 255), font=title_font, anchor="mm")
draw.text((600, 350), "学习中文 | Learn Chinese", fill=(255, 255, 255), font=subtitle_font, anchor="mm")
draw.text((600, 420), "HSK Vocabulary & Spaced Repetition", fill=(255, 255, 255), font=subtitle_font, anchor="mm")

img.save('/path/to/og-image.png', 'PNG', optimize=True)
```

## Installation

1. Save the PNG as `/workspace/frontend/public/og-image.png`
2. Update `frontend/index.html`:

   Replace:
   ```html
   <meta property="og:image" content="/og-image.svg" />
   <meta name="twitter:image" content="/og-image.svg" />
   ```

   With:
   ```html
   <meta property="og:image" content="https://mandarinflash.com/og-image.png" />
   <meta property="og:image:width" content="1200" />
   <meta property="og:image:height" content="630" />
   <meta name="twitter:image" content="https://mandarinflash.com/og-image.png" />
   <meta name="twitter:card" content="summary_large_image" />
   ```

   Note: Use absolute URLs (not relative paths) for og:image.

3. Deploy and test with:
   - https://www.opengraph.xyz/
   - https://cards-dev.twitter.com/validator
   - Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/

## Quick Test Image

For immediate deployment, use this placeholder:

```bash
cd /workspace/frontend/public
convert -size 1200x630 xc:'#f07c32' \
  -gravity center -pointsize 80 -fill white -font "DejaVu-Sans-Bold" \
  -annotate +0-50 'MandarinFlash' \
  -pointsize 40 -annotate +0+30 '学习中文 | Learn Chinese' \
  -pointsize 35 -annotate +0+90 'HSK Vocabulary & SRS' \
  og-image.png
```

(Requires ImageMagick. If not available, create manually.)

## After Deployment

Clear social media caches:

1. **Facebook**: https://developers.facebook.com/tools/debug/ — enter URL and click "Scrape Again"
2. **Twitter**: Tweet the URL once to force-refresh their cache
3. **LinkedIn**: Post the URL in a test post (can delete immediately)

Allow 1-24 hours for full propagation.
