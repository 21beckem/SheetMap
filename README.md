# speadsheetAPI1

A simple JavaScript API to edit ranges of data on Google Sheets without hastle!

<br>

## Simple Usage

```javascript
const TablePreferences = {
    url : 'your Google-Apps-Script url',
};

const ss = new SpreadsheetApp(TablePreferences);
ss.fetch('Sheet1', 'A1:C', 'myDIV');
```
