# Sending app feedback to a Google Sheet

Feedback from the app (header ♥ icon, or Settings → Send feedback) is posted to a Google Apps
Script attached to a Google Sheet. The script's URL lives in `public/config.json`, which the app
downloads from GitHub Pages every time it starts, so you can connect or change the sheet **without
building a new APK**. Until a URL is set, feedback waits on each phone and is sent automatically
the next time the app opens after the URL is configured.

## One-time setup (about 3 minutes)

1. Create a new Google Sheet, e.g. **Kinnect Feedback**.
2. In the sheet: **Extensions → Apps Script**. Delete what's there and paste the script below. Save.
3. Click **Deploy → New deployment** → gear icon → **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click **Deploy**, approve the permissions, and copy the **Web app URL**
   (it looks like `https://script.google.com/macros/s/AKfy.../exec`).
5. Put it in `public/config.json`:
   ```json
   { "feedbackUrl": "https://script.google.com/macros/s/AKfy.../exec" }
   ```
   and push to `main`. GitHub Pages redeploys in about a minute; every installed app picks it up
   on its next start.

## Apps Script

```javascript
const HEADERS = ['Received', 'Submitted', 'Name', 'Phone', 'Rating (1-5)', 'Areas',
                 'Message', 'Language', 'Screen', 'App version', 'Platform', 'Id'];

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);

  const f = JSON.parse(e.postData.contents);
  // Ignore duplicates (a phone may retry after a network error)
  const ids = sheet.getRange(1, HEADERS.length, sheet.getLastRow(), 1).getValues().flat();
  if (ids.includes(f.id)) return ContentService.createTextOutput('duplicate');

  sheet.appendRow([
    new Date(), f.submittedAt, f.name, f.phone ? "'+" + f.phone : '', f.rating, f.areas,
    f.message, f.language, f.screen, f.appVersion, f.platform, f.id,
  ]);
  return ContentService.createTextOutput('ok');
}
```

Each feedback entry becomes one row. Testers can untick "The team may contact me", in which case
the phone column is left empty.
