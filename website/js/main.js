
////// MAIN FUNCTION

$(document).ready(function() {
    main();
});

function getKeysSortInputs(data, input) {
  var sortedKeys = Object.keys(data).sort(function(a, b) {
    return data[a].inputs[input] - data[b].inputs[input];
  });
  return sortedKeys;
}

function getOutputsSortInputs(data, output, input) {
  var sortedKeys = getKeysSortInputs(data, input);
  return sortedKeys.map(function(key, index) { return [key, data[key].outputs[output]] });
}

function getKeyNames(data) {
  return Object.keys(data);
}

function mergeData(xdata, ydata) {
  const date_key = 'UTCTimeStamp';
  const value_key = 'Value';
  var data = {}
  for (idx in xdata) {
    var x = xdata[idx];
    if (!(x[date_key] in data)) {
      data[x[date_key]] = [null, null];
    }
    data[x[date_key]][0] = parseFloat(x[value_key]);
  }
  for (idx in ydata) {
    var y = ydata[idx];
    if (!(y[date_key] in data)) {
      data[y[date_key]] = [null, null];
    }
    data[y[date_key]][1] = parseFloat(y[value_key]);
  }
  for (key in data) {
    datum = data[key];
    if (datum[0] === null || datum[1] === null) {
      delete data[key];
    }
  }
  delete data[''];
  return data;
}

function getXValues(data) {
  return Object.values(data).map(function(value, index) {
    return value[0];
  });
}

function getYValues(data) {
  return Object.values(data).map(function(value, index) {
    return value[1];
  });
}

function renderData(data_store) {

  function renderBars(xdata, ydata, xlabel, ylabel) {

    var data = mergeData(xdata, ydata);
    var xvalues = getXValues(data);
    var yvalues = getYValues(data);

    console.log(data);

    // don't want dots overlapping axis, so add in buffer to data domain
    xScale.domain([d3.min(xvalues)-0.5, d3.max(xvalues)+0.5]);
    yScale.domain([d3.min(yvalues)-0.5, d3.max(yvalues)+0.5]);

    svg.selectAll('.axis').remove();
    svg.selectAll('.dot').remove();

    // x-axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
      .append("text")
        .attr("class", "label")
        .attr("x", width)
        .attr("y", -6)
        .style("text-anchor", "end")
        .text(xlabel);

    // y-axis
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
      .append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text(ylabel);

    // draw dots
    svg.selectAll(".dot")
        .data(Object.entries(data))
      .enter().append("circle")
        .attr("class", "dot")
        .attr("r", 3.5)
        .attr("cx", xMap)
        .attr("cy", yMap)
        .style("fill", function(d) { return 'black'; }) 
        .on("mouseover", function(d) {
            tooltip.transition()
                 .duration(200)
                 .style("opacity", .9);
            tooltip.html( xValue(d) + ", " + yValue(d) + ")")
                 .style("left", (d3.event.pageX + 5) + "px")
                 .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", function(d) {
            tooltip.transition()
                 .duration(500)
                 .style("opacity", 0);
        });
  }

  var svg = d3.select("svg"),
    margin = {top: 20, right: 20, bottom: 200, left: 40},
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom;

  var g = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // setup x 
  var xValue = function(d) {
    //console.log(d);
      return d[1][0];
    }, // data -> value
    xScale = d3.scale.linear().range([0, width]), // value -> display
    xMap = function(d) { return xScale(xValue(d));}, // data -> display
    xAxis = d3.svg.axis().scale(xScale).orient("bottom");

  // setup y
  var yValue = function(d) { return d[1][1];}, // data -> value
    yScale = d3.scale.linear().range([height, 0]), // value -> display
    yMap = function(d) {
      //console.log(yValue(d));
      //console.log(yScale(yValue(d)));
     return yScale(yValue(d));
     }, // data -> display
    yAxis = d3.svg.axis().scale(yScale).orient("left");

  // setup fill color
  var cValue = function(d) { return d.Manufacturer;},
    color = d3.scale.category10();

  // add the tooltip area to the webpage
  var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);


  var xkey = "chlorophyll";
  var ykey = "temperature";

  var controls = d3.select(".controls");
  var outputControls = d3.select(".output-controls");

  console.log(data_store);

  renderBars(data_store[xkey], data_store[ykey], xkey, ykey);

  controls.selectAll(".input")
    .data(getKeyNames(data_store))
    .enter().append("button")
      .attr("class", "input")
      .text(function(d) { return d; })
      .on("click", function(d) {
        xkey = d;
        renderBars(data_store[xkey], data_store[ykey], xkey, ykey);
      }); 

  outputControls.selectAll(".output")
    .data(getKeyNames(data_store))
    .enter().append("button")
      .attr("class", "output")
      .text(function(d) { return d; })
      .on("click", function(d) {
        ykey = d;
        renderBars(data_store[xkey], data_store[ykey], xkey, ykey);
      });
}

var data_store = {};




function main() {
  files = {
    "chlorophyll": "./data/mwra-inner_harbor_mouth_024-chlorophyll_a.csv",
    "nitrogen": "./data/mwra-inner_harbor_mouth_024-nitrogen__total_dissolved.csv",
    "phosphorus": "./data/mwra-inner_harbor_mouth_024-phosphorus__total_dissolved.csv",
    "temperature": "./data/mwra-inner_harbor_mouth_024-temperature.csv",
  }

  var total_fill = Object.keys(files).length;
  var count = 0;
  var data_store = {};

  var parseFile = function () {
    var key = Object.keys(files)[count];
    Papa.parse(files[key], {
      download: true,
      header: true,
      comments: '#',
      complete: function(results, file) {
        data = results.data
        console.log("Parsing complete:", results, file);
        count += 1;
        data_store[key] = data;
        if (count >= total_fill) {
          renderData(data_store);
        } else {
          parseFile();
        }
      }
    });
  }    

  parseFile();
};



