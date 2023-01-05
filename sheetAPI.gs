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
}
