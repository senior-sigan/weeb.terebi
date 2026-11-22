# Electron preview

The preview loads the same `app/dist/index.html` that goes into the TV widget.
It uses stock Electron 3.1.13 (Chromium 66.0.3359.181). The QE50LS03TAUXRU
runs Chromium 69.0.3497.128. The preview sends the TV's User-Agent for
application code that detects Tizen. JavaScript and CSS run in Chromium 66.
