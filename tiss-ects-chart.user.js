// ==UserScript==
// @name        TISS ECTS Charts
// @namespace   https://fsinf.at/
// @require     https://d3js.org/d3.v6.js
// @require     https://cdn.jsdelivr.net/npm/chart.js@2.8.0
// @description add charts to TISS certificates
// @include     https://tiss.tuwien.ac.at/graduation/certificates.xhtml*
// @version     1
// @downloadURL https://fsinf.at/userscripts/tiss-ects-chart.user.js
// @updateURL   https://fsinf.at/userscripts/tiss-ects-chart.user.js
// ==/UserScript==

var table = document.querySelector("#certificateList\\:j_id_3p > div > table")

function findTerm(date) {
    var splitted = date.split('.');
    var year = parseInt(splitted[2], 10);
    var month = parseInt(splitted[1], 10);
    var term = (month > 2 && month < 10) ? "SS" : "WS";
    year = (month < 3) ? year-1 : year;
    //return term.concat(year);
    return (year.toString()).concat(term);
}

var data = [];
for ( var i = 1; i < table.rows.length; i++ ) {
    if (table.rows[i].cells[4].innerText == "") continue;
    data.push({
        'hours': table.rows[i].cells[3].innerText,
        'ects': parseFloat(table.rows[i].cells[4].innerText),
        'date': table.rows[i].cells[5].innerText,
        'study': table.rows[i].cells[6].innerText,
        'grade': table.rows[i].cells[7].innerText,
        'term': findTerm(table.rows[i].cells[5].innerText)
    });
}

function passed(grade) {
    var ans;
    switch(grade) {
        case "nicht genügend":
            ans = false;
            break;
        case "unsatisfactory":
            ans = false;
            break;
        default:
            ans = true;
    }
    return ans;
}

var data_passed = data.filter(function(d) { return passed(d.grade) == true; })

var ects_tried = d3.rollup(data, v => d3.sum(v, d => d.ects), d => d.term)
var ects_passed = d3.rollup(data_passed, v => d3.sum(v, d => d.ects), d => d.term)
ects_tried = [...ects_tried.entries()].sort()

var ects_data = []
var sum = 0;
for ( var i = 0; i < ects_tried.length; i++ ) {
    var pass = ects_passed.get(ects_tried[i][0]);
    pass = (pass == undefined) ? 0 : pass
    sum += pass;

    ects_data.push({
        'term': ects_tried[i][0],
        'tried': ects_tried[i][1],
        'passed': pass,
        'avg': sum / (i+1)
    });
}


var canvas = document.createElement("canvas");
//document.querySelector("#certificateList\\:certificatesPanel").appendChild(canvas);
document.querySelector("#certificateList\\:studentInfoPanel").appendChild(canvas);
var d = canvas.getContext("2d");
var chart = new Chart(d, {
    type: 'line',

    data: {
        labels: ects_data.map(function(d) { return d.term }),
        datasets: [{
            label: 'Tried',
            fill: false,
            borderColor: 'rgb(255, 99, 132)',
            data: ects_data.map(function(d) { return d.tried })
        }, {
            label: 'Passed',
            fill: false,
            borderColor: 'rgb(0, 204, 102)',
            data: ects_data.map(function(d) { return d.passed })
        }, {
            label: 'Avg',
            fill: false,
            borderColor: 'rgb(0, 102, 255)',
            data: ects_data.map(function(d) { return d.avg })
        }]
    },

    options: {
        scales: {
            yAxes: [{
                display: true,
                ticks: {
                    suggestedMin: 0,
                    suggestedMax: 30
                }
            }]
        }
    }
});
