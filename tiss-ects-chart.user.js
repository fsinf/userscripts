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

async function main() {
    // ============================================
    // Custom way to filter out a specific semester
    var filterOutSemester = false;
    var semesterToFilterOut = "2020SS";
    // ============================================

    console.log("starting TISS ECTS Charts script");
    const table = await waitForTable();
    const data = fillData(table, filterOutSemester, semesterToFilterOut); //
    const ects_data = extractEctsData(data);
    style();
    document.querySelector("#certificateList\\:studentInfoPanel").appendChild(canvas_container);

    const ects_line_chart = makeEctsLineChart(ects_data);
    const grade_line_chart = makeGradeLineChart(ects_data);
    const ects_cumsum_chart = makeEctsCumsumChart(ects_data);

    console.log("finished TISS ECTS Charts script");
}

function waitForTable() {
    return new Promise(resolve => {
        const interval = setInterval(() => {
            const table = document.querySelector("form #certificateList\\:certificatesPanel table");
            if (table) {
                console.log("found table");
                clearInterval(interval);
                resolve(table);
            }
        }, 100);
    });
}

function mapGrade(grade) {
    var ans;
    switch(grade) {
        case "nicht genügend":
        case "unsatisfactory":
        case "insufficient":
        case "ohne Erfolg teilgenommen":
        case "unsuccessfully completed":
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

function fillData(table, customFilter, semesterToFilter) {
    if (!table) {
        throw new Error("Table is undefined - cannot fill data");
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
    if (customFilter) {
        console.log("filtering out: " + semesterToFilter);
        data = customDataFilter(data, semesterToFilter);
    }
    console.log("filled data table")
    return data;
}

function findTerm(date) {
    let splitted = date.split('.');
    let year = parseInt(splitted[2], 10);
    let month = parseInt(splitted[1], 10);
    let term = (month >= 5 && month <= 11) ? "SS" : "WS";
    year = (month <= 4) ? year-1 : year;
    //return term.concat(year);
    return (year.toString()).concat(term);
}

function extractEctsData(data) { //returns ects_data
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
        let term = ects_tried[i][0];
        let tried = ects_tried[i][1];
        let pass = ects_passed.get(term) || 0;
        let weighted = ects_weighted.get(term) || 0;
        let graded = ects_graded.get(term) || 0;

        pass_sum += pass;
        tried_sum += tried;
        weighted_sum += weighted;
        graded_sum += graded;

        let grade_avg = (graded !== 0) ? (weighted / graded).toFixed(2) : null;
        let grade_mavg = (graded_sum !== 0) ? (weighted_sum / graded_sum).toFixed(2) : null;


        ects_data.push({
            term,
            tried,
            passed: pass,
            avg: (pass_sum / (i+1)).toFixed(2),
            passed_sum: pass_sum,
            tried_sum: tried_sum,
            grade_avg,
            grade_mavg
        });
    }
    console.log("extracted ects data");
    return ects_data;
}

function style() {
    const style = document.createElement("style");
    style.textContent = '@media (max-width: 800px) {.cool-chart {width: 100% !important;}}';
    document.body.appendChild(style);
    console.log("styled");
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
    console.log("created new chart context");
    return canvas.getContext("2d");
}

function makeEctsLineChart(ects_data) { //returns ects_line_chart
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
    console.log("made ects line chart");
    return ects_line_chart;
}

function makeGradeLineChart(ects_data) { //returns grade_line_chart
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
                        suggestedMax: 5,
                        reverse: true
                    }
                }]
            }
        }
    });
    console.log("made grade line chart");
    return grade_line_chart;
}

function makeEctsCumsumChart(ects_data) { //returns ects_cumsum_chart
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
    console.log("made ects cumsum chart");
    return ects_cumsum_chart;
}

function waitForElement(selector) {
    return new Promise(resolve => {
        const interval = setInterval(() => {
            const el = document.querySelector(selector);
            if (el) {
                clearInterval(interval);
                resolve(el);
            }
        }, 100);
    });
}

function customDataFilter(data, semester) {
    //Custom filter for not including a semester
    data = data.filter(d => d.term !== semester);
    return data;
}

main();
