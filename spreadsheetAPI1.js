class SpreadsheetApp {
    static change(el, rowI, colI_ORG, val) {
        const thisChangedRow = this.rawRes[this.pairedCol[rowI][0]];
        //console.log(val);
        //console.log(rowI);
        let found = false;
        for (let i = 0; i < this.changedRows.length; i++) {
            const el = this.changedRows[i];
            if (el == rowI) {
                found = true;
                if (thisChangedRow[colI_ORG] == val) {
                    // remove from list
                    this.changedRows.splice(i, 1);
                } else {

                }
                // check if it changed back to original
                // if so remove
                // if not update existing
            }
        }
        if (!found && thisChangedRow[colI_ORG] != val) {//this.getNowCol(colI_ORG)       , thisChangedRow[colI_ORG], el.id]
            this.changedRows.push(rowI);
        }


        // NEW PLAN!!!
        
        // based on the current edited rowI, loop through each of the ss.colsToChange  (or make a new array that saves which cols can be edited) and if none of the current values are different than the original, remove the rowI from the changed cols array.
        // just realized: how do I get the current value of each of these cells...?
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
    constructor(prefs = {}) {
        //check prefs
        const Rprefs = ['url', 'adjust_cols'];
        let p = Object.keys(prefs);
        Rprefs.forEach(e => {
            if (!p.includes(e)) {
                console.error('missing required prefrences. Check the documentation for more details');
                throw new Error('must have these values set: {' + p.join(', ') + '}');
            }
        });

        this.prefs = prefs;
        this.colsToChange = Object.keys(this.prefs.adjust_cols).map(x => parseInt(x));
        SpreadsheetApp.colsToHide = this.colsToChange.filter((el) => {
            try {
                if (this.prefs.adjust_cols[el].hidden) {
                    return true;
                }
            } catch (e) {}
            return false;
        });
    }
    fetch(pgName, range, container_id) {
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
            result += "<tr>";
            for (var j=0; j<arr[i].length; j++) {
                if (this.colsToChange.includes(j)) {
                    const aj = this.prefs.adjust_cols[j];
                    result += this.makeAjustedCell(arr[i][j], aj, [i,j]);
                } else {
                    result += "<td>" + arr[i][j] + "</td>";
                }
            }
            result += "</tr>";
        }
        result += "</table>";
        return result;
    }
    makeAjustedCell(val, aj, loc) {
        try {
            if (aj.hidden) {
                return '';
            }
        } catch(e) {}
        try {
            if (aj.dropdown.options.length > 0) {
                let output = '<td><select id="dropdown_' + loc.join(',') + '" onchange="SpreadsheetApp.change(this, ' + loc[0] + ', ' + loc[1] + ', this.value)">';
                for (let i = 0; i < aj.dropdown.options.length; i++) {
                    const el = aj.dropdown.options[i];
                    const sel = (val == el) ? ' selected' : '';
                    output += '<option value="' + el + '"' + sel + '>' + el + '</option>';
                }
                output += '</select></td>';
                return output;
            }
        } catch (e) {}

        return "<td>" + val + "</td>"
    }
    saveChanges() {
        console.log(SpreadsheetApp.changedRows);
    }
}
