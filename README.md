# Bubble — CS 147 team website

Live site: https://web.stanford.edu/class/cs147/projects/DesignforMeaningfulWork/Bubble/

## What's where

```
site/
  index.html        the whole page
  css/              tokens.css (colors, fonts), styles.css, intro.css
  js/               carousel.js (paper-trail assignment cards), intro.js (opening logo animation)
  assets/           logo, ducks, team photos
  deliverables/     assignment PDFs linked from the carousel
  videos/           A4 concept video
deploy.sh           uploads site/ to the Stanford server
```

## Editing

- To add an assignment or change its links, edit the list at the top of `site/js/carousel.js`.
- Team names and roles live in `site/index.html`.
- **When you change any CSS or JS file**, update the `?v=YYYYMMDD` date on the matching
  `<link>` / `<script>` tag in `index.html`. The Stanford server doesn't send cache headers,
  so without this people keep seeing the old version.

To preview, open `site/index.html` in a browser, or run `python3 -m http.server -d site 8000`
and go to http://localhost:8000.

## Publishing to the live site

```
./deploy.sh YOUR_SUNETID
```

It asks for your Stanford password and a Duo approval. GitHub isn't connected to the live site.
Pull the latest changes before you deploy, or you might overwrite someone else's update.
