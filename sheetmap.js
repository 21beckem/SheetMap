//localStorage.setItem(cname, cvalue);
//localStorage.getItem(cname);
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
        this.vars = JSON.parse(localStorage.getItem('SheetMap_vars'));
    }
    async fetch(pgName, range) {
        this.fetchedRange = range;
        this.fetchedPgName = pgName;
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
        

        SheetMap.rawRes = data;
        if (this.prefs.hasOwnProperty('filter')) {
            //console.log(data);
            SheetMap.pairedCol = Array();
            let i = -1;
            let ii = 0;
            data = data.filter((row) => {
                i += 1;
                if (this.prefs.filter.function(row)) {
                    SheetMap.pairedCol.push([i, ii]);
                    ii += 1;
                    return true;
                } else {
                    return false;
                }
            });
        }
        let SheetMap_vars = {
            originalFetchedData : data,
            tableDataNOW : data,
            conditional_formatting : conditional_formatting,
        }
        localStorage.setItem('SheetMap_vars', JSON.stringify(SheetMap_vars));
    }
    makeTableHTML(container_id = null) {
        let arr = this.vars.tableDataNOW;
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
                // if (stylesJson.length != 0) {
                //     styStr = stylesJson[i][j];
                // }
                result += '<td id="' + idStr + '" style="' + styStr + '">' + arr[i][j] + '</td>';
            }
            result += '</tr>';
        }
        result += '</table></div>';
        if (container_id == null) {
            return result;
        }
        document.getElementById(container_id).innerHTML = result;
    }
    makeOurOwnConditionalFormatting(allData, styles, options) {
        if (styles.length == 0 || options.length == 0) {
            return [];
        }

        // now do all the special stuff
        let condish = Array();
        for (let i = 0; i < options.length; i++) {
            const op = options[i];
            
            // find op in 'allData'

            
            // find that same color validation in 'styles'


            // save it
            //condish.push();
        }

        // dance

        // return
    }
}
window.onbeforeunload = function () {
    if (SheetMap.editsMade) {
        return "If you reload this page, your previous action will be repeated";
    }
}
