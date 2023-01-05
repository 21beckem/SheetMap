class SpreadsheetApp {
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
        this.colsToHide = this.colsToChange.filter((el) => {
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
            if (this.prefs.hasOwnProperty('filter')) {
                //console.log(data);
                data = data.filter((row) => {
                    return this.prefs.filter.function(row[this.prefs.filter.column]);
                });
            }
            let tb = this.makeTableHTML(data);
            document.getElementById(container_id).innerHTML = tb;
        });
    }
    makeTableHTML(arr) {
        var result = '<table class="sheetTbl" border=1>';
        if (this.prefs.hasOwnProperty('header')) {
            this.colsToHide.forEach(n => {
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
                let output = '<td><select id="dropdown_' + loc.join(',') + '">';
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
}
