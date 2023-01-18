function cellA1ToIndex(e,r){r=0==(r=r||0)?0:1;var n=e.match(/(^[A-Z]+)|([0-9]+$)/gm);if(2!=n.length)throw new Error("Invalid cell reference");e=n[0];return{row:rowA1ToIndex(n[1],r),col:colA1ToIndex(e,r)}}function colA1ToIndex(e,r){if("string"!=typeof e||2<e.length)throw new Error("Expected column label.");r=0==(r=r||0)?0:1;var n="A".charCodeAt(0),o=e.charCodeAt(e.length-1)-n;return 2==e.length&&(o+=26*(e.charCodeAt(0)-n+1)),o+r}function rowA1ToIndex(e,r){return e-1+(r=0==(r=r||0)?0:1)}
function columnToLetter(column) {
  var temp, letter = '';
  while (column > 0)
  {
    temp = (column - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    column = (column - temp - 1) / 26;
  }
  return letter;
}
function letterToColumn(letter) {
  var column = 0, length = letter.length;
  for (var i = 0; i < length; i++)
  {
    column += (letter.charCodeAt(i) - 64) * Math.pow(26, length - i - 1);
  }
  return column;
}
Array.prototype.indexOf2d = function(item) {
  for(var k = 0; k < this.length; k++){
    if(JSON.stringify(this[k]) == JSON.stringify(item)){
      return k;
    }
  }
}
function A1Print(ss, x, loc='I1242') {
  ss.getRange(loc).setValue(JSON.stringify(x));
}


function doGet(e) {
  const type = e.parameter.type || null;
  const range = e.parameter.range || null;
  const pgNam = e.parameter.pgNam || null;
  if (type == null || range == null || pgNam == null) {
    return ContentService.createTextOutput('[["error"]]');
  }
  
  if (type == 'r') {
    let thisData = JSON.stringify(SpreadsheetApp.getActive().getSheetByName(pgNam).getRange(range).getValues());
    return ContentService.createTextOutput(thisData);
  }

  if (type == 'w') {
    const rows = JSON.parse(e.parameter.rows) || null;
    const options = JSON.parse(e.parameter.options) || null;
    if (rows == null || options == null) {
      return ContentService.createTextOutput('{"wrote" : false}');
    } else {
      const topLeftCell = range.split(':')[0];
      const topLeft = cellA1ToIndex(topLeftCell);

      const ss = SpreadsheetApp.getActive().getSheetByName(pgNam);
      //A1Print(ss, cellA1ToIndex(topLeftCell));
      //A1Print(ss, options);

      // get which col letter is the ref col
      const colRefNum = (topLeft.col + 1 + options.ref);
      const colRefLet = columnToLetter(colRefNum);
      const refColValues = ss.getRange(colRefLet + ':' + colRefLet).getValues();

      for (let i = 0; i < rows.length; i++) {
        // find corresponding val in our 'rows' in that col
        const refValue = rows[i].row[options.ref];
        const foundRow = refColValues.indexOf2d([refValue]) + 1;
        //A1Print(ss, [foundRow, colRefNum]);

        //go through each editable col
        for (let ii=0; ii < options.edited.length; ii++) {
          const e = options.edited[ii];
          // write editable cols
          ss.getRange(foundRow, colRefNum + e).setValue(rows[i].row[e]);
        }
        // dance!
      }
      return ContentService.createTextOutput('{"wrote" : true}');
    }
  }
}
