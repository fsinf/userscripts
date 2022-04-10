// ==UserScript==
// @name        TISS ECTS Charts
// @namespace   https://fsinf.at/
// @require     https://d3js.org/d3.v6.js
// @require     https://cdn.jsdelivr.net/npm/chart.js@2.8.0
// @description add charts to TISS certificates
// @include     https://tiss.tuwien.ac.at/graduation/certificates.xhtml*
// @version     1.3
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
        case "insufficient":
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

const canvas_container = document.createElement("div");

function newChartContext(){
  var canvas = document.createElement("canvas");
  var canvas_wrapper = document.createElement('div');
  canvas_wrapper.className = 'cool-chart';
  canvas_wrapper.style.width = '33%';
  canvas_wrapper.style.minHeight = '200px';
  canvas_wrapper.style.display = 'inline-block';
  canvas_wrapper.appendChild(canvas);
  canvas_container.appendChild(canvas_wrapper);
  return canvas.getContext("2d");
}

const style = document.createElement("style");
style.textContent = '@media (max-width: 800px) {.cool-chart {width: 100% !important;}}';
document.body.appendChild(style);

var ects_line_chart = new Chart(newChartContext(), {
    type: 'line',

    data: {
        labels: ects_data.map(function(d) { return d.term }),
        datasets: [{
            label: 'Passed',
            fill: false,
            cubicInterpolationMode: 'monotone',
            borderColor: 'rgb(0, 204, 102)',
            data: ects_data.map(function(d) { return d.passed })
        }, {
            label: 'Tried',
            fill: false,
            cubicInterpolationMode: 'monotone',
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
        maintainAspectRatio: false,
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


var grade_line_chart = new Chart(newChartContext(), {
    type: 'line',

    data: {
        labels: ects_data.map(function(d) { return d.term }),
        datasets: [{
            label: 'Weighted GPA by ECTS / Term',
            fill: false,
            cubicInterpolationMode: 'monotone',
            borderColor: 'rgb(255, 102, 255)',
            data: ects_data.map(function(d) { return d.grade_avg })
        }, {
            label: 'Weighted GPA by ECTS / Total',
            fill: false,
            borderColor: 'rgb(0,0,0)',
            data: ects_data.map(function(d) { return d.grade_mavg })
        }]
    },

    options: {
        title: {
            display: true,
            text: 'GPA over time (passed courses)'
        },
        maintainAspectRatio: false,
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

var ects_cumsum_chart = new Chart(newChartContext(), {
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
        maintainAspectRatio: false,
        title: {
            display: true,
            text: 'Cummulative ECTS'
        }
    }
});

document.querySelector("#certificateList\\:studentInfoPanel").appendChild(canvas_container);
