class SheetMap_ReferenceSaving {
    static change(rowI, colI, el) {
        //console.log(rowI, colI);
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
        this.editsMade = this.changedRows.length != 0;
        if (this.save_button_id != "") {
            this.hideSaveButton(!this.editsMade);
        }
        
        // conditional formating:
        let found = false;
        if (this.conditionalCols.includes(colI)) {
            const opsList = this.conditional_formatting[colI];
            for (let i = 0; i < Object.keys(opsList).length; i++) {
                const ops = opsList[Object.keys(opsList)[i]];
                if (el.value == Object.keys(opsList)[i]) {
                    //this is where we actually apply the formatting:
                    el.parentElement.style.cssText = ops;
                    found = true;
                    break;
                    //console.log(val);
                }
            }
            //console.log(val, aj, loc, ops);
        }
        if (!found) {
            el.parentElement.style.cssText = '';
        }
    }
    static hideSaveButton(onOff) {
        document.getElementById('SheetMap_saveBtn').style.display = (onOff) ? "none" : "";
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
    static editsMade = false;
    static rawRes = Array();
    static pairedCol = Array();
    static changedRows = Array();
    static colsToHide = undefined;
    static editable_cols = [];
    
    constructor(prefs = {}) {
        //check prefs
        const Rprefs = ['url', 'reference_col'];
        let p = Object.keys(prefs);
        Rprefs.forEach(e => {
            if (!p.includes(e)) {
                console.error('missing required prefrences. Check the documentation for more details');
                throw new Error('must have these values set: {' + Rprefs.join(', ') + '}');
            }
        });

        this.prefs = prefs;
        this.prefs.editable_cols = prefs.editable_cols || {};
        this.prefs.fetchStyles = prefs.fetchStyles || false;
        this.prefs.hidden_cols = prefs.hidden_cols || [];
        this.prefs.hidden_cols = this.prefs.hidden_cols.sort();
        this.prefs.conditional_formatting = prefs.conditional_formatting || {};
        this.colsToChange = Object.keys(this.prefs.editable_cols).concat(this.prefs.hidden_cols).map(x => parseInt(x));
        SheetMap_ReferenceSaving.colsToHide = this.prefs.hidden_cols;
        SheetMap_ReferenceSaving.editable_cols = this.prefs.editable_cols;
        SheetMap_ReferenceSaving.conditionalCols = Object.keys(this.prefs.conditional_formatting).map(x => parseInt(x));
        SheetMap_ReferenceSaving.conditional_formatting = this.prefs.conditional_formatting;
    }
    saveChanges() {
        let [rowsToSave, rowPoses] = this.getCurrentDataOfEditedRows();
        //console.log(rowsToSave);
        //console.log(rowPoses);
        let toSave = Array();
        let options = {
            "ref" : this.prefs.reference_col,
            "edited" : Object.keys(this.prefs.editable_cols).map(x => parseInt(x))
        };
        for (let i = 0; i < rowsToSave.length; i++) {
            const r = rowsToSave[i];
            const rN = SheetMap_ReferenceSaving.pairedCol[SheetMap_ReferenceSaving.changedRows[i]][0];
            toSave.push({
                "relRow" : rN,
                "row" : r
            });
        }
        //console.log(toSave);
        //console.log(options);

        // save it :)
        this.saveRowDataToSpreadsheet(toSave, options);
    }
    getCurrentDataOfEditedRows() {
        let rowsToSave = Array();
        let rowPoses = Array();
        for (let i = 0; i < SheetMap_ReferenceSaving.changedRows.length; i++) {
            const n = SheetMap_ReferenceSaving.changedRows[i];
            const tr = document.getElementById('rowRangeId_' + String(n));
            //console.log(tr);

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
                const thisChangedRow = SheetMap_ReferenceSaving.rawRes[SheetMap_ReferenceSaving.pairedCol[n][0]];
                //console.log(thisChangedRow);
                tdArr.splice(c, 0, thisChangedRow[c]);
            }
            //console.log(tdArr);
            rowsToSave.push(tdArr);
            rowPoses.push(SheetMap_ReferenceSaving.pairedCol[n][0]);
            
        }
        return [rowsToSave, rowPoses];
    }
    saveRowDataToSpreadsheet(toSave, options) {
        // make loading screen
        // - - -
        //console.log(toSave, options);
        const reqUrl = this.prefs.url + '?type=w&range=' + this.fetchedRange + '&pgNam=' + this.fetchedPgName + '&rows=' + encodeURIComponent(JSON.stringify(toSave)) + '&options=' + encodeURIComponent(JSON.stringify(options));
        console.log(reqUrl);
        fetch(reqUrl)
        .then((response) => response.json())
        .then((data) => {
            console.log(data);
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
            SheetMap_ReferenceSaving.editsMade = false;
            location.reload();
        });
    }
    async fetch(pgName, range, container_id) {
        this.fetchedRange = range;
        this.fetchedPgName = pgName;
        const mainFetch = await fetch(this.prefs.url + '?type=r&range=' + range + '&pgNam=' + pgName);
        const data = await mainFetch.json();
        let stylesJson = null;
        console.log(data);
        if (this.prefs.fetchStyles) {
            const styRes = await fetch(this.prefs.url + '?type=r_basic_style&range=' + range + '&pgNam=' + pgName);
            stylesJson = await styRes.json();
            console.log(stylesJson);
        }

        SheetMap_ReferenceSaving.rawRes = data;
        if (this.prefs.hasOwnProperty('filter')) {
            //console.log(data);
            SheetMap_ReferenceSaving.pairedCol = Array();
            let i = -1;
            let ii = 0;
            data = data.filter((row) => {
                i += 1;
                if (this.prefs.filter.function(row)) {
                    SheetMap_ReferenceSaving.pairedCol.push([i, ii]);
                    ii += 1;
                    return true;
                } else {
                    return false;
                }
            });
        }
        let tb = this.makeTableHTML(data, stylesJson);
        document.getElementById(container_id).innerHTML = tb;
        SheetMap_ReferenceSaving.hideSaveButton(true);
    }
    makeTableHTML(arr, stylesJson) {
        var result = '<div class="SheetMapTable"><button id="SheetMap_saveBtn" onclick="ss.saveChanges();">Save</button>';
        result += '<table class="sheetTbl" border=1>';
        if (this.prefs.hasOwnProperty('header')) {
            SheetMap_ReferenceSaving.colsToHide.forEach(n => {
                this.prefs.header.splice(n, 1);
            });
            result += '<tr><th>' + this.prefs.header.join('</th><th>') + '</th></tr>';
        }
        for (var i=0; i<arr.length; i++) {
            result += '<tr id="rowRangeId_' + i + '">';
            for (var j=0; j<arr[i].length; j++) {
                const idStr = 'cellRangeId_' + i + ',' + j;
                let styStr = '';
                if (stylesJson != null) {
                    styStr = stylesJson[i][j];
                }
                if (this.colsToChange.includes(j)) {
                    if (this.prefs.hidden_cols.includes(j)) {
                        continue;
                    }
                    const aj = this.prefs.editable_cols[j];
                    result += '<td id="' + idStr + '" style="' + this.addConditionalFormatting(arr[i][j], [i,j]) + styStr + '">' + this.makeAjustedCell(arr[i][j], aj, [i,j]) + '</td>';

                } else {
                    result += '<td id="' + idStr + '" style="' + this.addConditionalFormatting(arr[i][j], [i,j]) + styStr + '">' + arr[i][j] + '</td>';
                }
            }
            result += '</tr>';
        }
        result += '</table></div>';
        return result;
    }
    makeAjustedCell(val, aj, loc) {
        try {
            if (aj.dropdown.options.length > 0) {
                let output = '<select id="dropdown_' + loc.join(',') + '" onchange="SheetMap_ReferenceSaving.change(' + loc[0] + ',' + loc[1] + ',this)">';
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
    addConditionalFormatting(val, loc) {
        let output = '';
        if (this.prefs.conditional_formatting.hasOwnProperty('overall')) {
            const opsList = SheetMap_ReferenceSaving.conditional_formatting['overall'];
            for (let i = 0; i < Object.keys(opsList).length; i++) {
                const ops = opsList[Object.keys(opsList)[i]];
                if (val == Object.keys(opsList)[i]) {
                    //this is where we actually apply the formatting:
                    output = ops;
                    //console.log(val);
                }
            }
            //console.log(val, aj, loc, ops);
        }
        if (SheetMap_ReferenceSaving.conditionalCols.includes(loc[1])) {
            const opsList = SheetMap_ReferenceSaving.conditional_formatting[loc[1]];
            for (let i = 0; i < Object.keys(opsList).length; i++) {
                const ops = opsList[Object.keys(opsList)[i]];
                if (val == Object.keys(opsList)[i]) {
                    //this is where we actually apply the formatting:
                    output = ops;
                    //console.log(val);
                }
            }
            //console.log(val, aj, loc, ops);
        }
        return output;
    }
}
window.onbeforeunload = function () {
    if (SheetMap_ReferenceSaving.editsMade) {
        return "If you reload this page, your previous action will be repeated";
    }
}
