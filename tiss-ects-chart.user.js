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
    let splitted = date.split('.');
    let year = parseInt(splitted[2], 10);
    let month = parseInt(splitted[1], 10);
    let term = (month >= 5 && month <= 11) ? "SS" : "WS";
    year = (month <= 4) ? year-1 : year;
    //return term.concat(year);
    return (year.toString()).concat(term);
}

function mapGrade(grade) {
    var ans;
    switch(grade) {
        case "nicht genügend":
        case "unsatisfactory":
            ans = 5;
            break;
        case "genügend":
        case "sufficient":
            ans = 4;
            break;
        case "befriedigend":
        case "satisfactory":
            ans = 3;
            break;
        case "gut":
        case "good":
            ans = 2;
            break;
        case "sehr gut":
        case "excellent":
            ans = 1;
            break;
        default:
            ans = 0;
    }
    return ans;
}

var data = [];
for ( var i = 1; i < table.rows.length; i++ ) {
    if (table.rows[i].cells[4].innerText == "") continue;
    data.push({
        'hours': table.rows[i].cells[3].innerText,
        'ects': parseFloat(table.rows[i].cells[4].innerText),
        'date': table.rows[i].cells[5].innerText,
        'study': table.rows[i].cells[6].innerText,
        'grade': mapGrade(table.rows[i].cells[7].innerText),
        'term': findTerm(table.rows[i].cells[5].innerText)
    });
}

var data_passed = data.filter(function(d) { return d.grade != 5; })
var data_weighted = data.filter(function(d) { return d.grade != 0 && d.grade != 5; })

var ects_tried = d3.rollup(data, v => d3.sum(v, d => d.ects), d => d.term)
var ects_passed = d3.rollup(data_passed, v => d3.sum(v, d => d.ects), d => d.term)
ects_tried = [...ects_tried.entries()].sort()

var ects_weighted = d3.rollup(data_weighted, v => d3.sum(v, d => (d.ects * d.grade)), d => d.term)
var ects_graded = d3.rollup(data_weighted, v => d3.sum(v, d => (d.ects)), d => d.term)

var ects_data = []
var pass_sum = 0;
var tried_sum = 0;
var weighted_sum = 0;
var graded_sum = 0;
for ( var i = 0; i < ects_tried.length; i++ ) {
    let pass = ects_passed.get(ects_tried[i][0]);
    pass = (pass == undefined) ? 0 : pass;
    pass_sum += pass;
    tried_sum += ects_tried[i][1];

    weighted_sum += ects_weighted.get(ects_tried[i][0]);
    graded_sum += ects_graded.get(ects_tried[i][0]);

    let grade_avg = ects_weighted.get(ects_tried[i][0]) / ects_graded.get(ects_tried[i][0]);
    let grade_mavg = weighted_sum / graded_sum;

    ects_data.push({
        'term': ects_tried[i][0],
        'tried': ects_tried[i][1],
        'passed': pass,
        'avg': (pass_sum / (i+1)).toFixed(2),
        'passed_sum': pass_sum,
        'tried_sum': tried_sum,
        'grade_avg': grade_avg.toFixed(2),
        'grade_mavg': grade_mavg.toFixed(2)
    });
}


var canvas_ects_line = document.createElement("canvas");
//document.querySelector("#certificateList\\:certificatesPanel").appendChild(canvas);
document.querySelector("#certificateList\\:studentInfoPanel").appendChild(canvas_ects_line);
var ects_line_chart = new Chart(canvas_ects_line.getContext("2d"), {
    type: 'line',

    data: {
        labels: ects_data.map(function(d) { return d.term }),
        datasets: [{
            label: 'Passed',
            fill: false,
            lineTension: 0,
            borderColor: 'rgb(0, 204, 102)',
            data: ects_data.map(function(d) { return d.passed })
        }, {
            label: 'Tried',
            fill: false,
            lineTension: 0,
            borderColor: 'rgb(255, 99, 132)',
            data: ects_data.map(function(d) { return d.tried })
        }, {
            label: 'AVG',
            fill: false,
            borderColor: 'rgb(0, 102, 255)',
            data: ects_data.map(function(d) { return d.avg })
        }]
    },

    options: {
        title: {
            display: true,
            text: 'ECTS over time'
        },
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

var canvas_grade_line = document.createElement("canvas");
//document.querySelector("#certificateList\\:certificatesPanel").appendChild(canvas);
document.querySelector("#certificateList\\:studentInfoPanel").appendChild(canvas_grade_line);
var grade_line_chart = new Chart(canvas_grade_line.getContext("2d"), {
    type: 'line',

    data: {
        labels: ects_data.map(function(d) { return d.term }),
        datasets: [{
            label: 'Weighted GPA (passed courses) by ECTS / Term',
            fill: false,
            lineTension: 0,
            borderColor: 'rgb(255, 102, 255)',
            data: ects_data.map(function(d) { return d.grade_avg })
        }, {
            label: 'Weighted GPA (passed courses) by ECTS / Total',
            fill: false,
            borderColor: 'rgb(0,0,0)',
            data: ects_data.map(function(d) { return d.grade_mavg })
        }]
    },

    options: {
        title: {
            display: true,
            text: 'GPA over time'
        },
        scales: {
            yAxes: [{
                display: true,
                ticks: {
                    suggestedMin: 1,
                    suggestedMax: 5
                }
            }]
        }
    }
});

var canvas_bar = document.createElement("canvas");
document.querySelector("#certificateList\\:studentInfoPanel").appendChild(canvas_bar);
var ects_cumsum_chart = new Chart(canvas_bar.getContext("2d"), {
    type: 'bar',

    data: {
        labels: ects_data.map(function(d) { return d.term }),
        datasets: [{
            label: 'Passed',
            backgroundColor: 'rgb(0, 204, 102)',
            data: ects_data.map(function(d) { return d.passed_sum })
        }, {
            label: 'Tried',
            backgroundColor: 'rgb(255, 99, 132)',
            data: ects_data.map(function(d) { return d.tried_sum })
        }]
    },

    options: {
        title: {
            display: true,
            text: 'Cummulative ECTS'
        }
    }
});