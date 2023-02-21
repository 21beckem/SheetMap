# SheetMap

A simple JavaScript API to edit ranges of data on Google Sheets without any hastle!

<br>

## Simple Usage
1. Copy and paste `sheetmap_api.gs` into the sheet that you want to edit Script's page
2. Deploy that as a webapp and copy the url
3. In your app:
```html
<head>
    <link rel="stylesheet" href="path/to/sheetmap.css">
</head>
<body>
    <script src="path/to/sheetmap.js"></script>
    <div id="myDIV"><div>
    <script>
    const TablePreferences = {
        url : 'your Google-Apps-Script url here',
        reference_col : 0
    };

    const ss = new SheetMap(TablePreferences);
    ss.fetch('Sheet1', 'A1:C', 'myDIV');
    </script>
</body>
```
<br>

## All TablePreferences Options

### url (*required*)
* this is the URL you got from deploying the `sheetmap_api.gs` script as a web-app in Google Apps Scripts.
* example: [Simple Usage](#simple-usage)
---
### reference_col (*required*)
* this is a column of unique data (like a date and time) that the system uses as a refrence when you save your data back to google sheets.
* example: [Simple Usage](#simple-usage)
---
### header
* adds a header row. Takes an array of strings. Doesn't *have* to be the same length as the width of the table but probably should be.
* example:
```javascript
const TablePreferences = {
    /* required prefs */
    header : ['Col 1 Header', 'Hello', 'World']
};
```
---
### filter
* supply a function to filter through the rows to not show some of them.
* Function must take 1 arg which is an array with the values of the rows
* Function must return a true or false for *every row*!
* example:
```javascript
const TablePreferences = {
    /* required prefs */
    filter : {
        function : myFilterFunction
    }
};
---
// this will show all rows where their age (col 2) is more than 10
function myFilterFunction(row) {
    const AgeColValue = parseInt( row[1] );
    return ( AgeColValue > 10 );
}
```
---
### hidden_cols
* if you do not want to show certain columns, use this
* supply an array with the *indicies* of the rows to hide
    * AKA, start counting at 0, not 1
* *__IMPORTANT:__* the hiding of columns happens LAST! After everything else is already done by the system!
    * So what that means is every other prefrence that you set where you give a column index will be the index BEFORE these columns are hidden!
* example:
```javascript
const TablePreferences = {
    /* required prefs */
    hidden_cols : [0,4]
};
```
---
### editable_cols
* This is the whole point of being able to save what you edit on the table.
* __No cell is editable unless listed in this prefrence__
* list objects with the names of those objects being the indicies of the rows to edit
* inside each object is another object with the name of which being the type of editable column you want
    * currently the only option is `dropdown` but more are coming
Dropdown:
* provide an array of options that the user can choose from
* __Note:__ if there's no value in the cell in speadsheets or the cell is empty, the code we default to the first option.
    * So if you want blank to be an option, supply that as the first string in the array
* example:
```javascript
const TablePreferences = {
    /* required prefs */
    5 : {
        dropdown : {
            options : ['', 'Married', 'Engaged', 'In a Relationship', 'Single']
        }
    },
    6 : {
        dropdown : {
            options : ['', 'Toyota', 'Mazda', 'BMW', 'Scooter']
        }
    }
};
```
---
### conditional_formatting
* Just like google spreadsheets has conditional formatting, so do we :)
* List objects with the name of which breing the index of the row to have the formatting.
* Inside the object list scenarios.
    * The key of each item is the value the cell need to be eaqal to to apply the formatting.
    * The Value of which is a CSS string that will be applied to that cell. You have complete control, this will literally be pasted in on the element.
* __Note:__ if none of the scenarios match, then the cell will default back to the same as any other normal cell on the sheet.
* example:
```javascript
const TablePreferences = {
    /* required prefs */
    conditional_formatting : {
        5 : {
            'Toyota' : "background-color: #00FFFF",
            'Mazda': "background-color: #6D9EEB",
            'BMW': "background-color: #6AA84F",
            'Scooter': "background-color: #1C4587;  color: #C1C1CC"
        }
    }
};
```
