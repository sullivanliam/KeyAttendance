// Copyright (c) 2016 - 2017 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

import React from 'react';
import {scaleLinear} from 'd3-scale';

import {XYPlot, XAxis, YAxis, HeatmapSeries, LabelSeries} from 'react-vis';

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const data = [{x: 0, y:0, color:0}, {x: 1, y:0, color:2}, {x: 2, y:0, color:5}, {x: 3, y:0, color:0}, {x: 4, y:0, color:2}, {x: 6, y:0, color:5}, {x: 7, y:0, color:3},
			  {x: 0, y:1, color:0}, {x: 1, y:1, color:2}, {x: 2, y:1, color:5}, {x: 3, y:1, color:0}, {x: 4, y:1, color:2}, {x: 6, y:1, color:5}, {x: 7, y:1, color:3},
			  {x: 0, y:2, color:0}, {x: 1, y:2, color:2}, {x: 2, y:2, color:5}, {x: 3, y:2, color:0}, {x: 4, y:2, color:2}, {x: 6, y:2, color:5}, {x: 7, y:2, color:3},
			  {x: 0, y:3, color:0}, {x: 1, y:3, color:2}, {x: 2, y:3, color:5}, {x: 3, y:3, color:0}, {x: 4, y:3, color:2}, {x: 6, y:3, color:5}, {x: 7, y:3, color:3}];
const min = 0;
const max = 10;


function sameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}


function compareTime(time1, time2) {
  return new Date(time1) > new Date(time2); // true if time1 is later
}


async function formatData(){
  try {
    console.log("Hit the endpoint with studentid=906, startdate=2018-01-28, enddate=2018-03-03");
    var studentId = "906";
    var startDateString = "2018-01-28";
    var endDateString = "2018-03-03";
    const heatMapData = await fetch('http://127.0.0.1:8000/api/reports/individualHeatmap/?student_id=' + studentId + '&startdate=' + startDateString + '&enddate=' + endDateString);
    const heatMapJson = await heatMapData.json();
   //replace hyphens in date string with slashes b/c javascript Date object requires this (weird)
   var startDate = new Date(startDateString.replace(/-/g, '\/'));
   var endDate = new Date(endDateString.replace(/-/g, '\/'));
   var dateToCompare = startDate;
   var currEntryDate;
   var currIdx = 0;

   //Add dummy date entries for missing dates (dates with no engagements) to json btwn start and end date
   while (compareTime(dateToCompare, endDate) == false){
    //if reached the end of json but there's still dates to fill in up to the end date, stay on end entry
    if(currIdx > heatMapJson.length-1){
      currIdx = heatMapJson.length-1;
    }

    currEntryDate = new Date(heatMapJson[currIdx]["date"].replace(/-/g, '\/'));

    //add dummy date entry for missing date.
    //if previous entry does not have same date as current, or we're at first/last entry of json
    if((currIdx != 0 && heatMapJson[currIdx-1]["date"] != heatMapJson[currIdx]["date"]) || currIdx == 0 || currIdx == heatMapJson.length-1){
      //and if current entry does not match date to compare
      if (sameDay(dateToCompare, currEntryDate) == false){
        var dateEntryZeroEngagements = {"date": dateToCompare.toISOString().slice(0, 10), "empty": true};
        //add entry in place if not at end of json, add to end if at end of json   
        if(currIdx != heatMapJson.length-1){
          heatMapJson.splice(currIdx, 0, dateEntryZeroEngagements);
        }else{
          heatMapJson.splice(currIdx+1, 0, dateEntryZeroEngagements);
        }
      }
    }

    //increment date to compare if reading first entry of json, last entry of json, or previous entry has same date as current
    if((currIdx != 0 && heatMapJson[currIdx-1]["date"] != heatMapJson[currIdx]["date"]) || currIdx == 0 || currIdx == heatMapJson.length-1){
      dateToCompare.setDate(dateToCompare.getDate() + 1);
    }
    currIdx++;
   }
   console.log("heatmap json with missing dates added: " + heatMapJson);


   //Time to convert updated JSON with missing dates added in into
   //a list called processedData of {"dayOfWeek": 1, "weekNum": Week #, "numEngagements": 3} objs
   var processedData = [];
   var dayOfWeek, weekNum, dayEntry;
   var entriesAdded = 0;
   var numEngagements = 1;
   var nextDateString;
   var currDateObj;
   var mdyArray;
   var m, d ,y;
    for (var i = 0; i < heatMapJson.length; i++) {

      if(heatMapJson[i+1] == undefined){
        nextDateString = "reachedEndOfData";
      }else{
        nextDateString = heatMapJson[i+1]['date'];
      }
      //Compare curr date to next date to count engagements for a single day
      if (heatMapJson[i]['date'] == nextDateString){
        numEngagements++;
      //All engagements counted for this day, add entry representing current day  
      }else{
        if(heatMapJson[i]['empty']){
          numEngagements = 0;
        }
        currDateObj = new Date(heatMapJson[i]['date'].replace(/-/g, '\/'));
        dayOfWeek = currDateObj.getDay();
        weekNum = Math.floor(entriesAdded/7);

        mdyArray = heatMapJson[i]['date'].split(/\s*\-\s*/g);
        y = mdyArray[0];
        m = mdyArray[1];
        d = mdyArray[2];
        dayEntry = {"dayOfWeek": dayOfWeek, "weekNum": weekNum, "numEngagements": numEngagements, "month": m, "day": d,"year": y};
        processedData.push(dayEntry);
        numEngagements = 1;
        entriesAdded++;
      }
    }
    console.log("processedData: " + processedData);
  }
  catch (e) {
    console.log(e);
  }
}


export default function LabeledHeatmap() {
  formatData();
  const exampleColorScale = scaleLinear()
    .domain([min, (min + max) / 2, max])
    .range(['orange', 'white', 'cyan']);
  return (
	<XYPlot
	  width={300}
	  height={300}>
	  <XAxis />
	  <YAxis />
	  <HeatmapSeries
		className="heatmap-series-example"
		colorRange={["white", "orange"]}
		data={data} 
		style={{
          stroke: 'white',
          strokeWidth: '2px',
          rectStyle: {
            rx: 10,
            ry: 10
          }
        }} />

	  <LabelSeries
		animation
		allowOffsetToBeReversed
		data={data} />
	</XYPlot>
  );
}