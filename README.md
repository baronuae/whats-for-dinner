# ماذا نطبخ؟ · What's for Dinner?

Rashed Ahmed Alzaabi's cooking app: breakfast, lunch and dinner recipes with ingredients, a WhatsApp shopping list, YouTube and step-by-step cooking, in six languages.

- `docs/` – the web app, published with GitHub Pages. It installs on a phone's home screen and works offline.
- `mobile/` – the App Store / Google Play app (Expo). It carries the same page inside the app, so it works without internet.

When the recipes change: copy the new `index.html` into `docs/` and `mobile/assets/web/`, bump `VERSION` in `docs/sw.js` and `CONTENT_VERSION` in `mobile/App.js`, and raise the version numbers in `mobile/app.json` before a new store build.

Recipe photos come from Wikimedia Commons; each photo links to its source page and licence inside the app.

© 2026 Rashed Ahmed Alzaabi. All rights reserved.
