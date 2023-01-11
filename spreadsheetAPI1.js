class SpreadsheetApp {
    static change(rowI) {
        const thisChangedRow = this.rawRes[this.pairedCol[rowI][0]];
        //console.log(el, rowI, colI_ORG, val, thisChangedRow);
        let same = true;
        for (let i = 0; i < Object.keys(this.editable_cols).length; i++) {
            const ii = Object.keys(this.editable_cols)[i];
            //console.log(ii);
            const el = this.editable_cols[ii];
            //console.log("old:"+thisChangedRow[ii], "new:"+this.getSingleCell(rowI, ii, true));
            if (thisChangedRow[ii] != this.getSingleCell(rowI, ii, true)) {
                same = false;
            }
        }
        if (same && this.changedRows.includes(rowI)) {
            this.changedRows.splice(this.changedRows.indexOf(rowI), 1);
        }else if (!same && !this.changedRows.includes(rowI)) {
            this.changedRows.push(rowI);
        }
        //console.log(this.changedRows);

        const table = document.getElementsByClassName('sheetTbl')[0].firstChild;
        for (let i = 0; i < table.children.length; i++) {
            const row = table.children[i];
            if (this.changedRows.includes(i - 1)) {
                row.classList.add('changedHighlight');
            } else {
                row.classList.remove('changedHighlight');
            }
        }
        if (this.save_button_id != "") {
            document.getElementById(this.save_button_id).style.display = (this.changedRows.length == 0) ? "none" : "";
        }
    }
    static getSingleCell(row, ORGcol, childEl = false) {
        if (childEl) {
            return document.getElementById('cellRangeId_' + row + ',' + ORGcol).firstChild.value;
        } else {
            return document.getElementById('cellRangeId_' + row + ',' + ORGcol).value;
        }
    }
    static getNowCol(org) {
        let newNum = org;
        for (let i = 0; i < this.colsToHide.length; i++) {
            const el = this.colsToHide[i];
            if (el < org) {
                newNum -= 1;
            }
        }
        return newNum;
    }
    static rawRes = Array();
    static pairedCol = Array();
    static changedRows = Array();
    static colsToHide = undefined;
    static editable_cols = [];
    constructor(prefs = {}) {
        //check prefs
        const Rprefs = ['url'];
        let p = Object.keys(prefs);
        Rprefs.forEach(e => {
            if (!p.includes(e)) {
                console.error('missing required prefrences. Check the documentation for more details');
                throw new Error('must have these values set: {' + p.join(', ') + '}');
            }
        });

        this.prefs = prefs;
        this.prefs.editable_cols = prefs.editable_cols || {};
        this.prefs.hidden_cols = prefs.hidden_cols.sort() || [];
        this.prefs.save_button_id = prefs.save_button_id || "";
        this.colsToChange = Object.keys(this.prefs.editable_cols).concat(this.prefs.hidden_cols).map(x => parseInt(x));
        SpreadsheetApp.colsToHide = this.prefs.hidden_cols;
        SpreadsheetApp.editable_cols = this.prefs.editable_cols;
        SpreadsheetApp.save_button_id = this.prefs.save_button_id;
    }
    saveChanges() {
        let rowsToSave = Array();
        let rowPoses = Array();
        for (let i = 0; i < SpreadsheetApp.changedRows.length; i++) {
            const n = SpreadsheetApp.changedRows[i];
            const tr = document.getElementById('rowRangeId_' + String(n));
            console.log(tr);

            // convert tr to array of data. DONT FORGET HIDDEN COLS!
            const td = tr.getElementsByTagName('td');
            const tdRawArr = Array.from(td);
            let tdArr = tdRawArr.map((tag) => {
                if (tag.children.length > 0) {
                    if (tag.firstChild.nodeName == 'SELECT') {
                        return tag.firstChild.value;
                    } else {
                        tag.innerText;
                    }
                } else {
                    return tag.innerText;
                }
            });
            
            for (let ii = 0; ii < this.prefs.hidden_cols.length; ii++) {
                const c = this.prefs.hidden_cols[ii];
                const thisChangedRow = SpreadsheetApp.rawRes[SpreadsheetApp.pairedCol[n][0]];
                console.log(thisChangedRow);
                tdArr.splice(c, 0, thisChangedRow[c]);
            }
            //console.log(tdArr);
            rowsToSave.push(tdArr);
            rowPoses.push(SpreadsheetApp.pairedCol[n][0]);
            
        }
        // save it :)
        this.saveRowDataToSpreadsheet(rowsToSave, rowPoses);
    }
    saveRowDataToSpreadsheet(rows, rowPositions) {
        // make loading screen
        // - - -
        console.log(rows, rowPositions);

        fetch(this.prefs.url + '?type=w&range=' + this.fetchedRange + '&pgNam=' + this.fetchedPgName + '&rowData=' + rows + '&rowPoses=' + rowPositions)
        .then((response) => response.json())
        .then((data) => {
            /*
            if (received confirmation) {
                // say it saved
                // update the original data and stuff
                    // maybe just refresh...
            } else {
                // say it didnt work
                // have a try again button or back to editing
            }
            */
        });
    }
    fetch(pgName, range, container_id) {
        this.fetchedRange = range;
        this.fetchedPgName = pgName;
        fetch(this.prefs.url + '?type=r&range=' + range + '&pgNam=' + pgName)
        .then((response) => response.json())
        .then((data) => {
            SpreadsheetApp.rawRes = data;
            if (this.prefs.hasOwnProperty('filter')) {
                //console.log(data);
                SpreadsheetApp.pairedCol = Array();
                let i = -1;
                let ii = 0;
                data = data.filter((row) => {
                    i += 1;
                    if (this.prefs.filter.function(row)) {
                        SpreadsheetApp.pairedCol.push([i, ii]);
                        ii += 1;
                        return true;
                    } else {
                        return false;
                    }
                });
            }
            let tb = this.makeTableHTML(data);
            document.getElementById(container_id).innerHTML = tb;
        });
        if (SpreadsheetApp.save_button_id != "") {
            document.getElementById(this.prefs.save_button_id).style.display = "none";
        }
    }
    makeTableHTML(arr) {
        var result = '<table class="sheetTbl" border=1>';
        if (this.prefs.hasOwnProperty('header')) {
            SpreadsheetApp.colsToHide.forEach(n => {
                this.prefs.header.splice(n, 1);
            });
            result += '<tr><th>' + this.prefs.header.join('</th><th>') + '</th></tr>';
        }
        for (var i=0; i<arr.length; i++) {
            result += '<tr id="rowRangeId_' + i + '">';
            for (var j=0; j<arr[i].length; j++) {
                const idStr = 'cellRangeId_' + i + ',' + j;
                if (this.colsToChange.includes(j)) {
                    if (this.prefs.hidden_cols.includes(j)) {
                        continue;
                    }
                    const aj = this.prefs.editable_cols[j];
                    result += '<td id="' + idStr + '">' + this.makeAjustedCell(arr[i][j], aj, [i,j]) + '</td>';

                } else {
                    result += '<td id="' + idStr + '">' + arr[i][j] + '</td>';
                }
            }
            result += '</tr>';
        }
        result += '</table>';
        return result;
    }
    makeAjustedCell(val, aj, loc) {
        try {
            if (aj.dropdown.options.length > 0) {
                let output = '<select id="dropdown_' + loc.join(',') + '" onchange="SpreadsheetApp.change(' + loc[0] + ')">';
                for (let i = 0; i < aj.dropdown.options.length; i++) {
                    const el = aj.dropdown.options[i];
                    const sel = (val == el) ? ' selected' : '';
                    output += '<option value="' + el + '"' + sel + '>' + el + '</option>';
                }
                output += '</select>';
                return output;
            }
        } catch (e) {}

        return val;
    }
}
