# speadsheetAPI1

A simple JavaScript API to edit ranges of data on Google Sheets without hastle!

<br>

## Simple Usage
1. Copy and paste `sheetAPI.gs` into the sheet that you want to edit Script's page
2. Deploy that as a webapp and copy the url
3. In your app:
```html
<body>
    <script src="path/to/spreadsheetAPI1.js"></script>
    <div id="myDIV"><div>
    <script>
    const TablePreferences = {
        url : 'your Google-Apps-Script url',
    };

    const ss = new SpreadsheetApp(TablePreferences);
    ss.fetch('Sheet1', 'A1:C', 'myDIV');
    </script>
</body>
```
