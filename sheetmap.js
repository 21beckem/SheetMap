Array.prototype.locationOf2d = function(del) {
    for (let i = 0; i < this.length; i++) {
        const row = this[i];
        for (let j = 0; j < row.length; j++) {
            if (row[j] == del) {
                return [i, j];
            }
        }
    }
    return [-1, -1];
}
class SheetMap {
    constructor(prefs = {}) {
        //check prefs
        const Rprefs = ['url'];
        let p = Object.keys(prefs);
        Rprefs.forEach(e => {
            if (!p.includes(e)) {
                console.error('missing required prefrences. Check the documentation for more details');
                throw new Error('must have these values set: {' + Rprefs.join(', ') + '}');
            }
        });
        this.prefs = prefs;
        SheetMap.vars = JSON.parse(localStorage.getItem('SheetMap_vars'));
    }
    static vars;
    static setChangedCells(lst) { return localStorage.setItem('SheetMap_changedCells', JSON.stringify(lst)); }
    static getChangedCells() { return JSON.parse(localStorage.getItem('SheetMap_changedCells') || {}); }
    async fetch(pgName, range) {
        const mainFetch = await fetch(this.prefs.url + '?type=r&range=' + range + '&pgNam=' + pgName);
        const data = await mainFetch.json();
        let stylesJson = [];
        console.log(data);
        if (this.prefs.hasOwnProperty('fetchStyles')) {
            const styRes = await fetch(this.prefs.url + '?type=r_basic_style&range=' + range + '&pgNam=' + pgName);
            stylesJson = await styRes.json();
            console.log(stylesJson);
        }
        let dropdownOptions = [];
        if (this.prefs.hasOwnProperty('data_validation')) {
            const validationRes = await fetch(this.prefs.url + '?type=r_get_data_validation&range=' + this.prefs.data_validation + '&pgNam=' + pgName);
            dropdownOptions = await validationRes.json();
            console.log(dropdownOptions);
        }
        let conditional_formatting = this.makeOurOwnConditionalFormatting(data, stylesJson, dropdownOptions);
        console.log(conditional_formatting);
        
        let conditional_lookup = {};
        for (let i = 0; i < dropdownOptions.length; i++) {
            conditional_lookup[ dropdownOptions[i] ] = conditional_formatting[i];
        }
        let SheetMap_vars = {
            prefs : this.prefs,
            sheet_range : range,
            sheet_pgName : pgName,
            originalFetchedData : data,
            tableDataNOW : data,
            dropdownOptions : dropdownOptions,
            conditional_formatting_styles : conditional_formatting,
            conditional_lookup : conditional_lookup
        }
        SheetMap.vars = SheetMap_vars;
        localStorage.setItem('SheetMap_vars', JSON.stringify(SheetMap_vars));
        SheetMap.setChangedCells({});
    }
    makeTableHTML(container_id = null) {
        let arr = SheetMap.vars.tableDataNOW;
        var result = '<div class="SheetMapTable">';
        result += '<table class="sheetTbl" border=1>';
        if (this.prefs.hasOwnProperty('header')) {
            SheetMap.colsToHide.forEach(n => {
                this.prefs.header.splice(n, 1);
            });
            result += '<tr><th>' + this.prefs.header.join('</th><th>') + '</th></tr>';
        }
        for (var i=0; i<arr.length; i++) {
            result += '<tr id="rowRangeId_' + i + '">';
            for (var j=0; j<arr[i].length; j++) {
                const idStr = 'cellRangeId_' + i + ',' + j;
                let styStr = '';
                if (SheetMap.vars.dropdownOptions.includes(arr[i][j])) {
                    styStr = SheetMap.vars.conditional_formatting_styles[ SheetMap.vars.dropdownOptions.indexOf(arr[i][j]) ];
                }
                result += '<td id="' + idStr + '" style="' + styStr + '">' + this.makeAjustedCell(arr[i][j], [i,j]) + '</td>';
            }
            result += '</tr>';
        }
        result += '</table></div>';
        if (container_id == null) {
            return result;
        }
        document.getElementById(container_id).innerHTML = result;
    }
    makeAjustedCell(val, loc) {
        try {
            if (SheetMap.vars.dropdownOptions.includes(val)) {
                let cellBeenEdited = ( Object.keys(SheetMap.getChangedCells()).includes(loc[0]+','+loc[1]) ) ? 'sheetMap_EditedCell' : '';
                let output = '<select id="dropdown_' + loc.join(',') + '" class="' + cellBeenEdited + '" onchange="SheetMap.dropdownChange(' + loc[0] + ',' + loc[1] + ',this)">';
                for (let i = 0; i < SheetMap.vars.dropdownOptions.length; i++) {
                    const el = SheetMap.vars.dropdownOptions[i];
                    const sel = (val == el) ? ' selected' : '';
                    output += '<option value="' + el + '"' + sel + '>' + el + '</option>';
                }
                output += '</select>';
                return output;
            }
        } catch (e) {}

        return val;
    }
    makeOurOwnConditionalFormatting(allData, styles, options) {
        if (styles.length == 0 || options.length == 0) {
            return [];
        }

        let condish = Array();
        for (let i = 0; i < options.length; i++) {
            const op = options[i];
            let [loc1, loc2] = allData.locationOf2d(op);
            if (loc1 == -1) {
                condish.push('');
                continue;
            }
            let st = styles[loc1][loc2];
            condish.push(st);
        }
        return condish;
    }
    static dropdownChange(loc1, loc2, el) {
        //console.log(loc1, loc2, el.parentElement.style.cssText, SheetMap.vars.originalFetchedData[loc1][loc2]);
        el.parentElement.style.cssText = SheetMap.vars.conditional_lookup[el.value];
        let changedCells = SheetMap.getChangedCells();
        if (SheetMap.vars.originalFetchedData[loc1][loc2] != el.value) {
            el.classList.add('sheetMap_EditedCell');
            changedCells[ loc1+','+loc2 ] = el.value;
        } else {
            el.classList.remove('sheetMap_EditedCell');
            delete changedCells[ loc1+','+loc2 ];
        }
        SheetMap.setChangedCells(changedCells);
        SheetMap.vars.tableDataNOW[loc1][loc2] = el.value;
        localStorage.setItem('SheetMap_vars', JSON.stringify(SheetMap.vars));
        //console.log(changedCells);
    }
    async syncChanges() {
        return await SheetMap.syncChanges();
    }
    static async syncChanges() {
        const syncURI = SheetMap.vars.prefs.url + '?type=w&range=' + encodeURI(SheetMap.vars.sheet_range) + '&pgNam=' + encodeURI(SheetMap.vars.sheet_pgName) + '&changed_cells=' + encodeURI( JSON.stringify(SheetMap.getChangedCells()) );
        const mainFetch = await fetch(syncURI);
        console.log(syncURI);
        const data = await mainFetch.json();
        console.log(data);
    }
}
