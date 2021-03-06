const datasetURL = "https://data.cdc.gov/resource/xkkf-xrst"
const format = "json"
const defaultLimit = 1000
const excess = {}
excess.data = {}

const keyMaps = {
  // observed_number: "observed_number",
  // average_expected_count: "average_expected_count",
  // upper_bound_threshold: "upper_bound_threshold",
  week_ending_date: "weekendingdate",
  week: "mmwrweek",
  state: "state",
  year: "mmwryear"
}

const relevantCauses = ["allcause","covid_19_u071_underlying_cause_of_death"]
// const relevantCauses = ["allcause"]

const fetchDataset = async (url) => {
  url = url ||  `${datasetURL}.${format}`
  let data = []
  let currentOffset = 0
  while (true) {
    const resp = await fetch(`${datasetURL}?$limit=${defaultLimit}&$offset=${currentOffset}`)
    const respJSON = await resp.json()
    if (respJSON && respJSON.length > 0) {
      data = data.concat(respJSON)
    }
    if (respJSON.length < defaultLimit) {
      break
    }
    currentOffset += defaultLimit
  }
  return data
}

const loadHashParams = (selectElementId = "selectState") => {
  excess.extParams = excess.extParams || {}
  if (window.location.hash.length > 2) {
    window.location.hash.slice(1).split('&').forEach(hashParam => {
      const [param, value] = hashParam.split("=")
      excess.extParams[param] = decodeURIComponent(value)
    })
    
    if (excess.extParams.state && excess.params.states.indexOf(excess.extParams.state) !== -1) {
      document.getElementById(selectElementId).value = excess.extParams.state
    } else {
      excess.extParams.state=encodeURIComponent("United States")
    }
  }
}

excess.cleanData = (data = {...dtrack.data.all}) => {

  
  const causes = Object.assign({}, dtrack.data.causes)
  const states = [...dtrack.data.states]
  const shortNames = Object.assign({}, dtrack.data.shortName)
  shortNames[relevantCauses[0]] = "All Causes"
  shortNames[relevantCauses[1]] = "COVID-19"
  const years = [...dtrack.data.years].sort((a,b) => a - b)
  const mmwrWeeks = [...dtrack.data.weeks].sort((a,b) => a - b)
  const maxMMWRWeek = Math.max(...mmwrWeeks)
  const weeks2020 = [ ...new Set(dtrack.data.all.filter(row => row[keyMaps.year] === 2020 && row.jurisdiction_of_occurrence === states.find(state => state !== "All States") && row[keyMaps.week_ending_date]).map(row => row[keyMaps.week_ending_date]).sort((a,b) => a-b)) ]

  // Move United States to top of states so that it is the default option in the select list.
  // const unitedStatesIndex = states.indexOf("United States")
  // states.splice(unitedStatesIndex, 1)
  // states.unshift("United States")

  // Use the array indices as the concept IDs for now.
  // outcomes.forEach((outcome, ind) => excess.concepts.outcomes[outcome] = ind )
  // states.forEach((state, ind) => excess.concepts.states[state] = ind )
  // types.forEach((type, ind) => excess.concepts.types[type] = ind )

  // let dataWithMMWRWeek = []
  // years.forEach(year => {
  //   const yearlyData = data.filter(row => parseInt(new Date(row[keyMaps.week_ending_date]).getUTCFullYear()) === year)
  //   const weeksInYear = [ ...new Set(yearlyData.map(row => row[keyMaps.week_ending_date])) ]
  //   const yearlyDataTillCurrentWeek = yearlyData.filter(row => {
  //     const rowWeekendDate = new Date(row[keyMaps.week_ending_date])
  //     const currentDate = new Date()
  //     // Only use weeks for all years till ongoing week in current year.
  //     if (rowWeekendDate.getMonth() < currentDate.getMonth() || (rowWeekendDate.getMonth() === currentDate.getMonth() && rowWeekendDate.getDate() <= currentDate.getDate())) {
  //       row.mmwrWeek = year === 2017 ? weeksInYear.indexOf(row[keyMaps.week_ending_date]) + 2 : weeksInYear.indexOf(row[keyMaps.week_ending_date]) + 1 // Data for 2017 starts from Jan 14, so starting MMWR week from 2 for that year to make it consistent.
  //       row.mmwrYear = rowWeekendDate.getUTCFullYear() // First few weeks in 2018 data have the year field set to other years for some reason :/ Rectifying that
  //       return row
  //     }
  //   })
  //   dataWithMMWRWeek = dataWithMMWRWeek.concat(yearlyDataTillCurrentWeek)
  // })
  const sortedStateWiseData = states.reduce((statewiseObj, state) => {
    // const currentDate = new Date()
    // const currentYear = currentDate.getUTCFullYear()
    // const currentMMWRWeek = Math.round((currentDate - new Date(`${currentYear}-01-01T00:00:00.000Z`))/(1000*86400*7)) + 1
    statewiseObj[state] = data.filter(row => row.jurisdiction_of_occurrence === state && row[keyMaps.week] <= maxMMWRWeek).sort((a,b) => (a.mmwryear * 365 + a.mmwrweek * 7) - (b.mmwryear * 365 + b.mmwrweek * 7))
    if (state === "All States") {
      statewiseObj[state].forEach(row => row[keyMaps.week_ending_date] = weeks2020[row[keyMaps.week] - 1])
    }

    return statewiseObj
  }, {})
  return { sortedStateWiseData, causes, states, shortNames, years, mmwrWeeks, maxMMWRWeek }
}

excess.ui = async (divId) => {
  if (!dtrack.data.all) {
    try {
      await dtrack.ui()
    } catch (e) {}
  }
  const { sortedStateWiseData: cleanedData, ...params } = excess.cleanData(dtrack.data.all) // Cloning the original object
  excess.data.cleanedData = cleanedData
  excess.params = params


  // const selectTypeRadioBtn = (value) => {
  //   typeSelectDiv.querySelectorAll("input.excessDeathsBarChartType").forEach(el => {
  //     if (el.value !== value) {
  //       el.removeAttribute("checked")
  //     } else if (!el.getAttribute("checked")) {
  //       el.setAttribute("checked", "true")
  //       excess.renderPlots(plotsParentDivId)
  //     }
  //   })
  // }

  // const typeSelectWeightedDiv = document.createElement("div")
  // const typeSelectWeightedBtn = document.createElement("input")
  // typeSelectWeightedBtn.setAttribute("type", "radio")
  // typeSelectWeightedBtn.setAttribute("name", "type")
  // typeSelectWeightedBtn.setAttribute("class", "excessDeathsBarChartType")
  // typeSelectWeightedBtn.setAttribute("id", "barChartOptionWeighted")
  // typeSelectWeightedBtn.setAttribute("value", "Predicted (weighted)")
  // typeSelectWeightedBtn.setAttribute("checked", "true")
  // typeSelectWeightedBtn.onclick = () => selectTypeRadioBtn(typeSelectWeightedBtn.value)
  // const typeSelectWeightedLabel = document.createElement("label")
  // typeSelectWeightedLabel.setAttribute("for", "barChartOptionWeighted")
  // typeSelectWeightedLabel.innerText = "Predicted (weighted)"
  // typeSelectWeightedLabel.style.marginLeft = "5px"
  // typeSelectWeightedDiv.appendChild(typeSelectWeightedBtn)
  // typeSelectWeightedDiv.appendChild(typeSelectWeightedLabel)
  
  // const typeSelectUnweightedDiv = document.createElement("div")
  // const typeSelectUnweightedBtn = document.createElement("input")
  // typeSelectUnweightedBtn.setAttribute("type", "radio")
  // typeSelectUnweightedBtn.setAttribute("name", "type")
  // typeSelectUnweightedBtn.setAttribute("class", "excessDeathsBarChartType")
  // typeSelectUnweightedBtn.setAttribute("id", "barChartOptionUnweighted")
  // typeSelectUnweightedBtn.setAttribute("value", "Unweighted")
  // typeSelectUnweightedBtn.onclick = () => selectTypeRadioBtn(typeSelectUnweightedBtn.value)
  // const typeSelectUnweightedLabel = document.createElement("label")
  // typeSelectUnweightedLabel.setAttribute("for", "barChartOptionUnweighted")
  // typeSelectUnweightedLabel.innerText = "Unweighted"
  // typeSelectUnweightedLabel.style.marginLeft = "5px"
  // typeSelectUnweightedDiv.appendChild(typeSelectUnweightedBtn)
  // typeSelectUnweightedDiv.appendChild(typeSelectUnweightedLabel)
  
  // typeSelectDiv.appendChild(typeSelectWeightedDiv)
  // typeSelectDiv.appendChild(typeSelectUnweightedDiv)

  const parentDiv = document.getElementById(divId)
  const plotDivId = "plotlyCompareDiv"
  let h = `<hr> Excess deaths Associated With COVID-19 in 2017-19 and 2020 for \
  <select id="selectState" onchange="excess.renderPlots('${plotDivId}');"></select>\
  [CDC sources: <a href="https://data.cdc.gov/resource/muzy-jte6" target="_blank">2019-20</a>, <a href="https://data.cdc.gov/resource/3yf8-kanr" target="_blank">2015-18</a>; <a href="https://episphere.github.io/corona/UStable" target="_blank">COVID</a>]`
  h += `<div id="${plotDivId}"></div><br>`
  parentDiv.innerHTML = h
  // by type <select id="selectType" onchange="excess.renderPlots('${plotDivId}')"></select><br/>\
  
  const selectState = document.getElementById("selectState")
  excess.params.states.forEach(state => {
    const stateOption = document.createElement("option")
    stateOption.setAttribute("value",state)
    stateOption.innerText = state
    selectState.appendChild(stateOption)
  })

  // const selectType = document.getElementById("selectType")
  // excess.params.types.forEach(type => {
  //   const typeOption = document.createElement("option")
  //   typeOption.setAttribute("value", type)
  //   typeOption.innerText = type
  //   selectType.appendChild(typeOption)
  // })


  loadHashParams()
  if (!excess.extParams.state) {
    selectState.value = "Maryland"
  }
  excess.renderPlots(plotDivId)
}

// const selectTypeRadioBtn = (value, plotsParentDivId="plotlyCompareDiv") => {
//   document.querySelectorAll(".dataTypeRadioBtn").forEach(el => {
//     if (el.value != value) {
//       el.removeAttribute("checked")
//     }
//     else {
//       el.setAttribute("checked", "true")
//     }
//   })
//   excess.renderPlots(plotsParentDivId)
// }

excess.renderPlots = (plotsParentDivId="plotlyCompareDiv") => {
  excess.areaPlot(plotsParentDivId)
  excess.areaPlotCumulative(plotsParentDivId)
  // excess.scatterPlot(plotsParentDivId)
  // excess.barChart(plotsParentDivId)
}

excess.areaPlot = (plotsParentDivId="plotlyCompareDiv") => {
  const plotsParentDiv = document.getElementById(plotsParentDivId)
  const areaPlotDivId = "excessDeathsareaPlot"
  let areaPlotDiv = document.getElementById(areaPlotDivId)
  if (!areaPlotDiv) {
    areaPlotDiv = document.createElement("div")
    areaPlotDiv.setAttribute("id", areaPlotDivId)
    areaPlotDiv.style.width = "100%"
    plotsParentDiv.appendChild(areaPlotDiv)
    plotsParentDiv.appendChild(document.createElement("hr"))
    plotsParentDiv.appendChild(document.createElement("br"))
  }

  
  const { cleanedData: dataToPlot } = excess.data
  
  excess.stateSelected = document.getElementById('selectState').value
  window.location.hash=`state=${encodeURIComponent(excess.stateSelected)}`
  
  excess.data.stateSelected = dataToPlot[excess.stateSelected]
  // excess.params.mmwrWeeks = [ ...new Set(excess.data.stateSelected.map(row => row.mmwrWeek)) ].sort((a, b) => a-b)
  // excess.params.maxMMWRWeek = excess.params.mmwrWeeks[excess.params.mmwrWeeks.length - 1]
  const dataFor2020 = excess.data.stateSelected.filter(row => (row[keyMaps.year] === 2020))
  const weeks2020 = dataFor2020.map(row => new Date(row[keyMaps.week_ending_date]))
  const dataForOtherYears = excess.data.stateSelected.filter(row => row[keyMaps.year] !== 2020)
  const averageForOtherYearsPerWeek = excess.params.mmwrWeeks.reduce((weeksObj, week) => {
    const dataForOtherYearsForWeek = dataForOtherYears.filter(row => row[keyMaps.week] === week)
    const averagePerWeek = Math.round(dataForOtherYearsForWeek.reduce((sum, current) => sum + current[relevantCauses[0]], 0) / dataForOtherYearsForWeek.length)
    weeksObj[week] = averagePerWeek
    return weeksObj
  }, {})
  // const avgOutcomeSpecificDataPerWeek = excess.params.mmwrWeeks.map(week => {
  //   const outcomeDataPerYear = dataForOtherYears.filter(row => row.mmwrWeek === week)
  //   return Math.round(outcomeDataPerYear.reduce((prev, current) =>  prev + (current[keyMaps.observed_number] - current[compareWith]), 0)/outcomeDataPerYear.length)
  // })
  excessDeathsFor2020 = {}
  relevantCauses.forEach(cause => {
    const key = excess.params.shortNames[cause]
    const dataFor2020ForCause = excess.params.mmwrWeeks.reduce((weeksObj, week) => {
      const dataFor2020ForWeek = dataFor2020.find(row => row[keyMaps.week] === week)
      weeksObj[week] = dataFor2020ForWeek ? dataFor2020ForWeek[cause] : NaN
      // if (isNaN(weeksObj[week])) {
      //   console.log(dataFor2020ForWeek, week, cause)
      // }
      return weeksObj
    }, {})
    
    excessDeathsFor2020[key] = []
    if (cause === relevantCauses[0]) {
      excessDeathsFor2020[key] = excess.params.mmwrWeeks.map(week => dataFor2020ForCause[week] - averageForOtherYearsPerWeek[week])
      // excessDeathsFor2020[key] = excess.params.mmwrWeeks.map(week => dataFor2020ForCause[week])
    } else {
      excessDeathsFor2020[key] = Object.values(dataFor2020ForCause)
    }
    // const acceptableDeviation = averageExcessForOutcome < 0 ? averageExcessForOutcome * 2.5 : averageExcessForOutcome * -2.5
  })
  // console.log(excessDeathsFor2020)
  // excessDeathsFor2020["COVID-19"] = Object.keys(excessDeathsFor2020).reduce((sum, key) => {
  //   if (key !== excess.params.shortNames[excess.params.causes.allcause]) {
  //     if (sum.length > 0) {
  //       sum = sum.map((val, idx) => val + excessDeathsFor2020[key][idx])
  //     } else {
  //       sum = excessDeathsFor2020[key]
  //     }
  //   }
  //   return sum
  // }, [])
  // delete excessDeathsFor2020[dtrack.data.shortName[relevantCauses[relevantCauses.length - 2]]]
  // delete excessDeathsFor2020[dtrack.data.shortName[relevantCauses[relevantCauses.length - 1]]]
  // const upperBoundThresholdsFor2020 = dataFor2020.filter(row => row[keyMaps.outcome] === excess.params.outcomes[0]).map(row => row[keyMaps.upper_bound_threshold])
  // const outcomeNamesMap = {
  //   "All causes": "Including COVID-19",
  //   "All causes, excluding COVID-19": "Excluding COVID-19"
  // }
  

  // const areaPlotTraces = Object.keys(excessDeathsFor2020).reduce((causesObj, cause, idx) => {
  const areaPlotTraces = Object.keys(excessDeathsFor2020).map((cause, idx) => {
    const x = weeks2020.slice(8, -1)
    const y = excessDeathsFor2020[cause].slice(8, -1)
    const fill = "tonexty"
    const fillcolor = cause === excess.params.shortNames[relevantCauses[0]] ? "rgba(128,198,232,0.8)" : "rgba(255,66,66,0.5)"
    const line = {
      color: cause === excess.params.shortNames[relevantCauses[0]] ? "#80c6e8": "#f54242"
    }
    
    // causesObj[cause] = {
    //   x,
    //   y,
    //   fill,
    //   fillcolor,
    //   type: "scatter",
    //   stackgroup: `excess_${idx}`,
    //   hovertemplate: "%{y}",
    //   name: cause.includes("covid") ? `Deaths from ${cause} for 2020` : "Excess Deaths from "+ cause +" for 2020",
    //   line,
    //   mode: "markers",
    //   marker: {
    //     size: 2
    //   }
    // }
    // return causesObj
    return {
      x,
      y,
      fill,
      fillcolor,
      type: "scatter",
      stackgroup: `excess_${idx}`,
      hovertemplate: "%{y}",
      name: cause === excess.params.shortNames[relevantCauses[1]] ? `Deaths from ${cause} for 2020` : "Additional Deaths from "+ cause +" for 2020",
      line,
      mode: "markers",
      marker: {
        size: 2
      }
    }
  })
  // }, {})

  // const thresholdTrace = {
  //   x: weeks2020,
  //   y: avgOutcomeSpecificDataPerWeek,
  //   type: "scatter",
  //   mode: "lines+markers",
  //   name: "Average Excess from 2017-2019",
  //   line: {
  //     dash: "solid",
  //     width: 2
  //   },
  //   marker: {
  //     color: "royalblue"
  //   }
  // }
  
  const averageOverOtherYearsTrace = {
    x: weeks2020.slice(8, -1),
    y: Object.values(averageForOtherYearsPerWeek).slice(8, -1),
    fill: "tozeroy",
    // fiilcolor: "blueviolet",
    type: "scatter",
    stackgroup: "excess_0",
    hovertemplate: "%{y}",
    name: "Average Deaths from All Causes for 2014-2019",
    line: {
      color: "blueviolet"
    },
    mode: "markers",
    marker: {
      size: 2
    }
  }

  const averageOverOtherYearsTrace2 = {
    x: weeks2020.slice(8, -1),
    y: Object.values(averageForOtherYearsPerWeek).slice(8, -1),
    fill: "tozeroy",
    fillcolor: "rgba(255,255,255,0)",
    mode: "none",
    type: "scatter",
    stackgroup: "excess_1",
    hoverinfo: 'skip',
    showlegend: false,
    line: {
      color: "rgba(255,255,255,0)",
      width: 0
    }
  }
  // areaPlotTraces.push(thresholdTrace)
  // areaPlotTraces.push(averageOverOtherYearsTrace)
  // areaPlotTraces.push(averageOverOtherYearsTrace2)
  // areaPlotTraces.reverse()
  
  const tracesToPlot = [averageOverOtherYearsTrace, averageOverOtherYearsTrace2, ...areaPlotTraces]
  // console.log(tracesToPlot)
  const layout = {
    title: `Additional Deaths in <b style="color:green">${excess.stateSelected}</b> in 2020 compared to the Average Deaths from 2014-2019`,
    legend: { 'orientation': "h" },
    yaxis: {
      title: "Number of Deaths"
    }
  }
  Plotly.newPlot(areaPlotDivId, tracesToPlot, layout, {responsive: true});

}

excess.areaPlotCumulative = (plotsParentDivId="plotlyCompareDiv") => {
  const plotsParentDiv = document.getElementById(plotsParentDivId)
  const areaPlotCumulativeDivId = "excessDeathsareaPlotCumulative"
  let areaPlotCumulativeDiv = document.getElementById(areaPlotCumulativeDivId)
  if (!areaPlotCumulativeDiv) {
    areaPlotCumulativeDiv = document.createElement("div")
    areaPlotCumulativeDiv.setAttribute("id", areaPlotCumulativeDivId)
    areaPlotCumulativeDiv.style.width = "100%"
    plotsParentDiv.appendChild(areaPlotCumulativeDiv)
    plotsParentDiv.appendChild(document.createElement("hr"))
    plotsParentDiv.appendChild(document.createElement("br"))
  }

  const { cleanedData: dataToPlot } = excess.data
  
  excess.stateSelected = document.getElementById('selectState').value || excess.extParams.state

  excess.data.stateSelected = dataToPlot[excess.stateSelected]
  
  const dataFor2020 = excess.data.stateSelected.filter(row => (row[keyMaps.year] === 2020))
  const weeks2020 = dataFor2020.map(row => new Date(row[keyMaps.week_ending_date]))
  const dataForOtherYears = excess.data.stateSelected.filter(row => row[keyMaps.year] !== 2020)

  const cumulativeAvgDeathsForOtherYears = excess.params.mmwrWeeks.reduce((cumulativeAvgSum, week) => {
    const deathsThisWeek = dataForOtherYears.filter(row => row[keyMaps.week] === week)
    const avgThisWeek = deathsThisWeek.reduce((prev, current) =>  prev + (current[relevantCauses[0]] || 0), 0) / deathsThisWeek.length
    const cumulativeAvgdSumTillThisWeek = cumulativeAvgSum.length === 0 ? avgThisWeek : cumulativeAvgSum[cumulativeAvgSum.length - 1] + avgThisWeek
    cumulativeAvgSum.push(Math.round(cumulativeAvgdSumTillThisWeek))
    return cumulativeAvgSum
  }, [])
  
  cumulativeDeathsFor2020 = {}
  relevantCauses.forEach(cause => {
    // if (cause === relevantCauses[0]) {
      const key = excess.params.shortNames[cause]
      const cumulativeSum = (sum => value => sum += value)(0)
      const cumulativeSumPerWeek = dataFor2020.map(row => isNaN(row[cause]) ? 0 : row[cause]).map(cumulativeSum)
      cumulativeDeathsFor2020[key] = cumulativeSumPerWeek
    // }
    //   key = "COVID-19"
    //   excess.params.mmwrWeeks.forEach(week => {
    //     const allDataForWeek = dataFor2020.filter(row => row.mmwrWeek === week )
    //     if (allDataForWeek.length > 0) {
    //       const diffBetweenOutcomes = allDataForWeek.find(row => row.outcome === outcome)[keyMaps.observed_number] - allDataForWeek.find(row => row.outcome !== outcome)[keyMaps.observed_number]
    //       if (!isNaN(diffBetweenOutcomes)) {
    //         dataToProcess.push(diffBetweenOutcomes)
    //       }
    //     }
    //   })
    // } else {
    // }
    // const averageExcessForOutcome = outcomeSpecificData.reduce((prev, current) => prev + (current[keyMaps.observed_number] - current[compareWith]), 0) / outcomeSpecificData.length
    // const acceptableDeviation = averageExcessForOutcome < 0 ? averageExcessForOutcome * 2.5 : averageExcessForOutcome * -2.5
  })
  
  // const upperBoundThresholdsFor2020 = dataFor2020.filter(row => row[keyMaps.outcome] === excess.params.outcomes[0]).map(row => row[keyMaps.upper_bound_threshold])
  // const outcomeNamesMap = {
  //   "All causes": "Including COVID-19",
  //   "All causes, excluding COVID-19": "Excluding COVID-19"
  // }

  const areaPlotTraces = Object.entries(cumulativeDeathsFor2020).map(([key, value]) => {
    const x = weeks2020.slice(8, -1)
    const y = value.slice(8, -1)
    const fill =  "tonexty"
    const fillcolor = key === excess.params.shortNames[relevantCauses[0]] ? "rgba(128,198,232,0.6)" : "rgba(255,66,66,0.6)"
    const line = {
      color: key === excess.params.shortNames[relevantCauses[0]] ? "rgb(108,168,255)" : "#f54242",
      width: 2
    }

    
    return {
      x,
      y,
      fill,
      fillcolor,
      type: "scatter",
      stackgroup: key ===  excess.params.shortNames[relevantCauses[1]] ? "cumulative" : undefined,
      hovertemplate: "%{y}",
      name: "Cumulative Deaths from "+ key +" for 2020",
      line,
      mode: key ===  excess.params.shortNames[relevantCauses[1]] ? "markers" : "lines+markers",
      marker: {
        size: 2
      }
    }
  })
  // const thresholdTrace = {
  //   x: weeks2020,
  //   y: avgOutcomeSpecificDataPerWeek,
  //   type: "scatter",
  //   mode: "lines+markers",
  //   name: "Average Excess from 2017-2019",
  //   line: {
  //     dash: "solid",
  //     width: 2
  //   },
  //   marker: {
  //     color: "royalblue"
  //   }
  // }
  
  const averageOverOtherYearsTrace = {
    x: weeks2020.slice(8, -1),
    y: cumulativeAvgDeathsForOtherYears.slice(8, -1),
    fill: "tozeroy",
    fiilcolor: "blueviolet",
    type: "scatter",
    stackgroup: "cumulative",
    hovertemplate: "%{y}",
    name: "Average Cumulative Deaths from All Causes for 2014-2019",
    line: {
      color: "blueviolet",
      width: 2
    },
    mode: "lines+markers",
    marker: {
      size: 2
    }
  }


  
  // areaPlotTraces.push(thresholdTrace)
  
  areaPlotTraces.push(averageOverOtherYearsTrace)
  // areaPlotTraces.sort((trace1, trace2) => Math.max(...trace2.y) - Math.max(...trace1.y))
  console.log(areaPlotTraces)
  const tracesToPlot = [areaPlotTraces[0], areaPlotTraces[2], areaPlotTraces[1]]
  const layout = {
    title: `Cumulative Deaths in <b style="color:green">${excess.stateSelected}</b> for 2020 vs. 2014-2019 averaged`,
    legend: { 'orientation': "h" },
    yaxis: {
      title: 'Cumulative Count of Deaths'
    }
  }
  Plotly.newPlot(areaPlotCumulativeDivId, tracesToPlot, layout, {responsive: true});

}


excess.scatterPlot = (plotsParentDivId="plotlyCompareDiv") => {
  const plotsParentDiv = document.getElementById(plotsParentDivId)
  const { cleanedData: dataToPlot } = excess.data

  // excess.outcomeSelected = document.getElementById('selectOutcome').value
  excess.stateSelected = document.getElementById('selectState').value
  window.location.hash=`outcome=${encodeURIComponent(excess.outcomeSelected)}&state=${encodeURIComponent(excess.stateSelected)}`

  excess.data.stateSelected = dataToPlot.filter(row => row.state === excess.stateSelected && row.outcome === excess.outcomeSelected)
  excess.params.maxMMWRWeek = excess.data.stateSelected.reduce((prev, current) => prev < current.mmwrWeek ? current.mmwrWeek : prev, 0)
  const weeks2020 = [...new Set(excess.data.stateSelected.filter(row => row.mmwrYear === 2020 && row.type==="Predicted (weighted)").map(row => new Date(row.week_ending_date)))]

  const getScatterTrace = (year, type="Predicted (weighted)") => {
    const dataForYear = excess.data.stateSelected.filter(row => (row.mmwrYear === year && row.mmwrWeek <= excess.params.maxMMWRWeek && row.observed_number && row.upper_bound_threshold && row.type === type))

    const marker = {}
    marker.size = year === 2020 ? 8 : 4
    if (type === "Unweighted") {
      marker.color = "royalblue"
    } else {
      marker.color = year === 2020 ?  'maroon' : undefined
    }
    const lineWidth = year === 2020 ? 3 : 1
    
    const x = year === 2017 ? weeks2020.slice(1) : weeks2020
    const meanDifference =  dataForYear.reduce((prev, current) => prev + (current.observed_number - current.upper_bound_threshold), 0)/dataForYear.length || 0
    const y = dataForYear.map(row => {
      const acceptableDeviation = meanDifference < 0 ? meanDifference * 2.5 : meanDifference * -2.5

      if (row.mmwrWeek >= excess.params.maxMMWRWeek - 2 && row.observed_number - row.upper_bound_threshold < acceptableDeviation) {
        
        return undefined
      } else if (!isNaN(row.observed_number - row.upper_bound_threshold)) {
        return row.observed_number - row.upper_bound_threshold
      } else {
        return undefined
      }
    })
    const trace = {
      x,
      y,
      type: 'scatter',
      mode: 'lines+markers',
      name: year === 2020 ? `${year} ${type}` : year,
      line: {
        width: lineWidth
      },
      marker
    }
  }
  
  const scatterTrace = excess.params.years.map(year => getScatterTrace(year, "Predicted (weighted)"))
  scatterTrace.push(getScatterTrace(2020, "Unweighted"))
  
  const scatterPlotDivId = "excessDeathsScatterPlot"
  let scatterPlotDiv = document.getElementById(scatterPlotDivId)
  if (!scatterPlotDiv) {
    scatterPlotDiv = document.createElement("div")
    scatterPlotDiv.setAttribute("id", scatterPlotDivId)
    plotsParentDiv.appendChild(scatterPlotDiv)
    plotsParentDiv.appendChild(document.createElement("hr"))
    plotsParentDiv.appendChild(document.createElement("br"))
  }

  Plotly.newPlot(scatterPlotDivId, scatterTrace,{
    title:`Comparing 2020 with 2017-2019 excessive deaths in <b style="color:green">${excess.stateSelected}</b> for <br><b style="color:maroon">${excess.outcomeSelected}</b></b>`,
    xaxis: {
      title: 'Date of calendar day in 2020'
    },
    yaxis: {
      title: 'Excess Deaths per week'
    },
    legend:{
      bordercolor: 'gray',
      borderwidth: 2
    }
  }, {responsive: true})
}

excess.barChart = (plotsParentDivId = "plotlyCompareDiv") => {
  const plotsParentDiv = document.getElementById(plotsParentDivId)
  let optionsDiv = document.getElementById("barChartOptions")

  if (!optionsDiv) {
    optionsDiv = document.createElement("div")
    optionsDiv.setAttribute("id", "barChartOptions")
    optionsDiv.style.width = "100%"
    optionsDiv.style.textAlign = "center"

    const outcomeSelectDiv = document.createElement("div")
    const outcomeSelect = document.createElement("select")
    outcomeSelect.setAttribute("id", "excessDeathsBarChartOutcome") 
    excess.params.outcomes.forEach(outcome => {
      const outcomeOption = document.createElement("option")
      outcomeOption.setAttribute("value", outcome)
      outcomeOption.innerText = outcome
      outcomeSelect.appendChild(outcomeOption)
    })
    outcomeSelectDiv.appendChild(outcomeSelect)

    const typeSelectDiv = document.createElement("div")
    typeSelectDiv.setAttribute("id", "excessDeathsBarChartTypes")
    typeSelectDiv.style.width = "55%"
    typeSelectDiv.style.margin = "0 auto"
    typeSelectDiv.style.display = "flex"
    typeSelectDiv.style.justifyContent = "space-around"
    
    const yearSelect = document.createElement("select")
    yearSelect.setAttribute("id", "excessDeathsBarChartYear")
    yearSelect.innerHTML = excess.params.years.map(year => {
      if (year === 2020) {
        return `<option value=${year} selected>${year}</option>`
      }
      return `<option value=${year}>${year}</option>`
    }).join("")
    yearSelect.onchange = () => {
      if (parseInt(yearSelect.value) !== 2020) {
        typeSelectDiv.style.visibility = "hidden"
      } else {
        typeSelectDiv.style.visibility = "visible"
      }
      // excess.barChart(plotsParentDivId)
    }
    yearSelect.style.width = "30%"
    
    optionsDiv.appendChild(yearSelect)
    optionsDiv.appendChild(document.createElement("br"))
    optionsDiv.appendChild(typeSelectDiv)
    optionsDiv.appendChild(document.createElement("br"))
    plotsParentDiv.appendChild(optionsDiv)
  } 
  
  const yearSelected = parseInt(document.getElementById("excessDeathsBarChartYear").value) || excess.params.years[0]

  const barChartDivId = "excessDeathsBarChart"
  let barChartDiv = document.getElementById(barChartDivId)
  if (!barChartDiv){
    barChartDiv = document.createElement("div")
    barChartDiv.setAttribute("id", barChartDivId)
    plotsParentDiv.appendChild(barChartDiv)
  }

  const namesMap = {
    "upper_bound_threshold": "Deaths Threshold",
    "observed_number": "Observed Number of Deaths"
  }
  const getBarChartTrace = (field) => {
    const dataForYear = excess.data.stateSelected.filter(row => (row.mmwrYear === yearSelected && row.mmwrWeek <= excess.params.maxMMWRWeek && row.type === excess.typeSelected))
    const x = dataForYear.map(row => new Date(row.week_ending_date))
    const y = dataForYear.map(row => {
      if (row[field]) {
        return row[field]
      } else {
        return undefined
      }
    })
    const trace = {
      x,
      y,
      text: y.map(Number),
      textposition: 'auto',
      hovertemplate: '%{y}',
      name: namesMap[field],
      type: 'bar'
    };
    return trace
  }

  const thresholdBarTraces = getBarChartTrace("upper_bound_threshold")
  const observedNumberBarTraces = getBarChartTrace("observed_number")

  const dataForBarChart = [thresholdBarTraces, observedNumberBarTraces]
  const maxYAxisValue = Math.max(...excess.data.stateSelected.map(row => row.upper_bound_threshold), ...excess.data.stateSelected.map(row => row.observed_number))
  const orderOfMagnitudeOfMaxValue = 10 ** (Math.floor(Math.log10(maxYAxisValue)))
  const maxYAxisRangeValue = orderOfMagnitudeOfMaxValue * Math.floor(maxYAxisValue/orderOfMagnitudeOfMaxValue + 1)

  const layout = { 
    title:`Comparing Thresholds To Observed Deaths during the year <b>${yearSelected}</b> in <b style="color:green">${excess.stateSelected}</b> for <br><b style="color:maroon">${excess.outcomeSelected}</b></b>`,
    barmode: 'group', 
    legend: {"orientation": "h"},
    yaxis: {
      "range": [0, maxYAxisRangeValue]
    }
  }

  Plotly.newPlot(barChartDivId, dataForBarChart, layout, {responsive: true})
}