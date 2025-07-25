export const validThemes = ["black", "white", "league", "beige", "sky", "night", "serif", "simple", "solarized", "blood", "moon"];

export const generateFullRevealHtmlPage = (coreHtmlContent: string, theme: string) => {
  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Presentation</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.3.1/reset.min.css">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.3.1/reveal.min.css">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.3.1/theme/${theme}.min.css">
      </head>
      <body>
        <div class="reveal">
          <div class="slides">
            ${coreHtmlContent}
          </div>
        </div>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.3.1/reveal.js"></script>
        <script>
          Reveal.initialize({ hash: true });
        </script>
      </body>
    </html>
  `;
};
