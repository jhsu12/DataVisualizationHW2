const FWith = 600, FHeight = 400;
const FLeftTopX = 50, FLeftTopY = 80;
const MARGIN = { LEFT: 100, RIGHT: 10, TOP: 10, BOTTOM: 130 }
const WIDTH = FWith - (MARGIN.LEFT + MARGIN.RIGHT)
const HEIGHT = FHeight - (MARGIN.TOP + MARGIN.BOTTOM)



const svg = d3.select("#chart-area").append("svg")
            .attr("width", 2000)
            .attr("height", 2000)

let filterState = {
  ageInterval: [null, null],
  selectedEducation: null,
  selectedCounty: null,
};

var population_data = [{'County': 'ILA', 'Population': 0}, {'County': 'HSQ', 'Population': 0},
                      {'County': 'MIA', 'Population': 0}, {'County': 'CHA', 'Population': 0},
                      {'County': 'NAN', 'Population': 0}, {'County': 'YUN', 'Population': 0},
                      {'County': 'CYQ', 'Population': 0}, {'County': 'PIF', 'Population': 0},
                      {'County': 'TTT', 'Population': 0}, {'County': 'HUA', 'Population': 0},
                      {'County': 'KEE', 'Population': 0}, {'County': 'HSZ', 'Population': 0},
                      {'County': 'CYI', 'Population': 0}, {'County': 'TPE', 'Population': 0},
                      {'County': 'KHH', 'Population': 0}, {'County': 'TPQ', 'Population': 0},
                      {'County': 'TXG', 'Population': 0}, {'County': 'TNN', 'Population': 0},
                      {'County': 'TAO', 'Population': 0}];
            
// histogram
const g1 = svg.append("g")
            .attr("transform", `translate(${FLeftTopX + MARGIN.LEFT}, ${FLeftTopY + MARGIN.TOP})`);

const g2 = svg.append('g')
            .attr("transform", "translate(1000,200)");

const g3 = svg.append('g')
            .attr("transform", "translate(1000,500)");

const g4 = svg.append('g')
            .attr("transform", "translate(180,600)");

var tip = d3.tip()
.attr('class', 'd3-tip')
.html(d=>("Hb-A1C: " + d.av_Hb.toFixed(2) + " #People: " + d.Patient + " #MMSE: " + d.MMSE + " #AGE: "+ d.Age));

g4.call(tip);

let value_age = [];
d3.csv("data_loc.csv").then(data => {
  
  // HISTOGRAM

  // title
  g1.append("text")
  .attr("x", WIDTH / 2)
  .attr("y", 0)
  .attr("font-size", "25px")
  .attr("text-anchor", "middle")
  .attr("fill", "black")
  .text("Age Distribution")
  
  // X label
  g1.append("text")
  .attr("x", WIDTH / 2)
  .attr("y", HEIGHT + 70)
  .attr("font-size", "20px")
  .attr("text-anchor", "middle")
  .attr("fill", "black")
  .text("Age")

  // Y label
  g1.append("text")
  .attr("x", -(HEIGHT / 2))
  .attr("y", -40)
  .attr("font-size", "20px")
  .attr("text-anchor", "middle")
  .attr("transform", "rotate(-90)")
  .attr("fill", "black")
  .text("Count")

  // X axis: scale and draw:
  const x = d3.scaleLinear()
      .domain([0, d3.max(data, function(d) { return +d.Age })])    
      .range([0, WIDTH]);
    
  // set the parameters for the histogram
  var histogram = d3.histogram()
      .value(function(d) { return +d.Age })   // I need to give the vector of value
      .domain(x.domain())  // then the domain of the graphic
      .thresholds(x.ticks(100)); // then the numbers of bins

  // And apply this function to data to get the bins
  var bins = histogram(data);
  //console.log(bins)

  
  // Y ticks
  const y = d3.scaleLinear()
  .domain([0, d3.max(bins, function(d) { return d.length; })])
  .range([HEIGHT, 0])

 

  const xAxisCall = d3.axisBottom(x)
  g1.append("g")
  .attr("transform", `translate(0, ${HEIGHT})`)
  .call(xAxisCall)
  .selectAll("text")
    .attr("y", "10")
    .attr("x", "-5")
    .attr("text-anchor", "end")
    .attr("transform", "translate(10)")

  

  const yAxisCall = d3.axisLeft(y)
                  
  g1.append("g").call(yAxisCall)

  const rects = g1.selectAll("rect").data(bins)

  
  var rect = rects.enter()
  .append("rect")
    .attr("x", d => x(d.x0))
    .attr("y", d => y(d.length))
    .attr("width",  4)
    .attr("height", function(d) { return HEIGHT - y(d.length); })
    .attr("fill", "lightskyblue")
    .style("stroke", "black")

  var brush = d3.brushX()
  .extent([[0, 0], [WIDTH, HEIGHT]])
  .on("start", brushed)
  .on("brush", brushed)
  //.on("end", endbrushed);

  g1.call(brush);
  function brushed() {
    var extent = d3.event.selection;
    // is in rect, but no chnage and remember to add title "Age Distribution"
    // Map the extent back to data values
    var x0 = x.invert(extent[0]);
    var x1 = x.invert(extent[1]);
    filterState.ageInterval = [x0, x1];

    //console.log("Selected Range: ", x0, " to ", x1);
    //console.log(extent);
    
    if (extent && extent[1] - extent[0] !== 0) {
      // Transition for selected bars
      rect.filter(function(d) {
          return x(d.x0) >= extent[0] && x(d.x0) <= extent[1];
        })
        .transition()
        .duration(1000)
        .attr("fill", "lightskyblue");
  
      // Transition for unselected bars
      rect.filter(function(d) {
          return x(d.x0) < extent[0] || x(d.x0) > extent[1];
        })
        .transition()
        .duration(1000)
        .attr("fill", "white");
    } else {
      // Reset to original color when no selection
      rect.transition()
        .duration(1000)
        .attr("fill", "lightskyblue");
        filterState.ageInterval = [null, null];
    }

    crossFilter();
      
  };
  
  // DONUT CHART
  // Create desired data
  var donut_data = {"No": 0, "Elementary": 0, "Junior High": 0, "Senior High": 0, "College+": 0};
  for(let i=0; i<data.length; i++)
  {
    year = +data[i].Education;
   // console.log(year);
    if(year == 0)
    {
      donut_data["No"] += 1;
    }
    else if(year <=6)
    {
      donut_data["Elementary"] += 1;
    }
    else if(year <=9)
    {
      donut_data["Junior High"] += 1;
    }
    else if(year <=12)
    {
      donut_data["Senior High"] += 1;
    }
    else {
      donut_data["College+"] += 1;
    }
  }

  var arcGenerator = d3.arc()
                      .innerRadius(50)
                      .outerRadius(100);

  var pie = d3.pie()
  .value(function(d) {return d.value; })
  var data_ready = pie(d3.entries(donut_data))

  var colors = ["#ff5733", "#66ff66", "#3366ff", "#ffcc00", "#9933cc"];
  var color = d3.scaleOrdinal()
  .domain(donut_data)
  .range(colors);


  function draw_pie(data){
    var data_ready = pie(d3.entries(data))
    var path = g2.selectAll("path")
            .data(data_ready);
   
     path
      .enter()
      .append('path')
      .merge(path)
      .transition() // Add transition
      .duration(1000) // Set transition duration in milliseconds
      .attrTween('d', function (d) {
        var interpolate = d3.interpolate(this._current, d);
        this._current = interpolate(0);
        return function (t) {
        
          return arcGenerator(interpolate(t));
        };
      })
      .attr('fill', function(d){ return(color(d.data.key)) })
      .attr("stroke", "white")
  }
  // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
  draw_pie(donut_data);
 
    var legend_ind = {"No": 0, "Elementary": 1, "Junior High": 2, "Senior High": 3, "College+": 4};
  // Add a title
  g2.append("text")
    .text("Education")
    .attr("x", -30)
    .attr("y", -110);

  

  // Create a legend
  var legend = g2.selectAll("legend")
    .data(data_ready)
    .enter()
    .append("g")
    .attr("class", "legend")
    .attr("transform", function(d, i) {
      return "translate(120," + (i * 20) + ")";
    });


  // Add colored squares to the legend
  legend.append("rect")
    .attr("width", 18)
    .attr("height", 18)
    .attr("class", "legend-color")
    .attr("legendInd", (d) => (legend_ind[d.data.key]))
    .on("click", (d) =>  { selectLegend(d.data.key); })
    .style("fill", function(d) { return color(d.data.key); });

  // Add text to the legend
  legend.append("text")
    .attr("x", 24)
    .attr("y", 9)
    .attr("dy", ".35em")
    .text(function(d) { return d.data.key; });

  function selectLegend(key){
    
    // grab element
    var element = d3.select(document.querySelector(`rect[legendInd='${legend_ind[key]}']`));
    
    // unselect
    if (element.classed("selected_pie"))
    {
      filterState.selectedEducation = null;
      element.classed("selected_pie", false);
      draw_pie(donut_data);
    }
    // select
    else {
      filterState.selectedEducation = key;
      element.classed("selected_pie", true);
      var selected_data = {"No": 0, "Elementary": 0, "Junior High": 0, "Senior High": 0, "College+": 0};
      selected_data[key] = 1;
      draw_pie(selected_data);
    }
    
    crossFilter();

  }     

  // MAP
  // Get desired data
  
  for(let i=0; i<data.length; i++)
  {
    let ind = data[i].location - 1;
    population_data[ind]['Population'] += 1;
  }
  d3.json("taiwan.json").then(drawTaiwan);

  // SCATTER PLOT
  createScatterPlot(data);
})



// Map
function drawTaiwan(taiwan) {
  var width = 800;
  var height = 600;
  d3.csv("data_loc.csv").then(data => {

    

    // Normalize data
    var minValue = d3.min(population_data, function(d) { return d.Population });
    var maxValue = d3.max(population_data, function(d) { return d.Population });
    var scale = d3.scaleLinear()
            .domain([minValue, maxValue])
            .range([0, 1]);
    //console.log(population_data);
    
    // Create a custom color interpolator function
    //console.log(taiwan.features);
    const colorScale = d3.scaleSequential(d3.interpolateViridis)
                      .domain([0, 1]);
                      

    var projection = d3.geoMercator()
          .fitExtent([[0,0], [width, height]], taiwan);
    
    var geoGenerator = d3.geoPath()
          .projection(projection);
  
    var paths = g3.selectAll('path')
          .data(taiwan.features)
          .enter()
          .append('path')
          .attr('stroke', "white")
          .attr('County', (d) => {return d.properties.ISO3166})
          .attr('fill', function(d){
            var county = d.properties.ISO3166;
            for(let i=0; i<population_data.length; i++)
            {
              if (population_data[i].County == county)
              {
                return(colorScale(scale(population_data[i].Population)))
              }
            }
            //console.log(d.properties.ISO3166)
          })
          .attr('d', geoGenerator)
          .on("click", toggleSelection);

    function toggleSelection(d) {
      var isSelected = d3.select(this).classed("selected_county");
      if(!isSelected){
        var selected_County = this.getAttribute("County");
        var select_County_id;
        for (const [index, element] of population_data.entries()) {
          if (element['County'] == selected_County)
          {
            select_County_id = index+1;
            break;
          }
          
        }
        filterState.selectedCounty = select_County_id;
        //console.log(selected_County, select_County_id);
      }
      
      // Toggle the selected class
      d3.select(this)
      .classed("selected_county", !isSelected)
      .transition()
      .duration(1000)
      .attr('fill', "yellow"); // Change to the desired color when selected

      // Toggle other unselected class
      if(!isSelected){
      
        var unselected_Counties = document.querySelectorAll("path[County]");
        //console.log(unselected_Counties);
        unselected_Counties.forEach((county) => {
          if (county.getAttribute("County") != selected_County) {
           
  
            // Toggle the unselected class
            d3.select(county)
              .transition()
              .duration(1000)
              .attr('fill',  "purple"); // Change to the desired color when unselected
            }
          })
      }
      else {
          // Reset to the original color when unselected
          var Counties = document.querySelectorAll("path[County]");
          Counties.forEach((county) => 
          d3.select(county)
            .transition()
            .duration(1000)
            .attr('fill', function(d) {
              var county = d.properties.ISO3166;
              for (let i = 0; i < population_data.length; i++) {
                if (population_data[i].County == county)
                {
                  return(colorScale(scale(population_data[i].Population)))
                }
                
              }
            })
          );
          filterState.selectedCounty = null;
    }
    crossFilter();
};
      

    // add title
    g3.append("text")
      .text("Sample Count Map")
      .attr("x", 450) // X-coordinate of the text
      .attr("y", -10) // Y-coordinate of the text
      .style("font-size", "20px") // Font size
      .style("fill", "black"); // Text color

    // Add a legend
    const legend = g3.attr("class", "legend")
    // .attr("x", 10)
    // .attr("y", 100)
    //.attr("transform", "translate(20, 20)"); // Adjust the position

    // Add a title to the legend
    legend.append("text")
    .text("Population")
    .style("font-weight", "bold")
    .attr("x", 580)
    .attr("y", 280);

    const legendRectSize = 18; // Size of the color boxes in the legend
    const legendSpacing = 0; // Spacing between color boxes

    // Create an array of labels for your legend (e.g., population ranges)
    var legendLabel = ["157", "168", "180", "191", "203", "214", "226"];

    legend.selectAll("map-rect")
    .data(legendLabel)
    .enter()
    .append("rect")
    .attr("width", legendRectSize)
    .attr("height", legendRectSize)
    .style("fill", d => colorScale(scale(+d)))
    .attr("x", (d, i) => i * (legendRectSize + legendSpacing))
    .attr("y", 0)
    .attr("transform", "rotate(90), translate(300, -600)");
    
    
    legend.selectAll("map-text")
    .data(legendLabel)
    .enter()
    .append("text")
    .text(d => scale(+d).toFixed(2))
    .style("font-size", "17px") // Font size
    .attr("x", 3)
    .attr("y", (d, i) => (i+3) * (legendRectSize))
    .attr("transform", "translate(600, 260)");
    
    })

  
  

  
}



function createScatterPlot(data)
{
   // Group the data by 'age' and 'MMSE'.
  // filter selected data
  value_age = [];
  data.forEach(function(d){
    value_age = d3.nest().key(d => d.Age).key(d => d.MMSE)
                .rollup((function(d) {
                  return {
                      patient: d.length,  
                      av_Hb: d3.mean(d, function(e) { return e["Hb-A1C"]; }),       
                  }
                }))
                .entries(data);

  })
  
  // Transform the nested data into a list of dictionaries
  
  // Scatter plot
  const listData = [];
  value_age.forEach(ageGroup => {
    ageGroup.values.forEach(MMSEGroup => {
      av_Hb = MMSEGroup.value.av_Hb
      if(av_Hb < 5)
      {
        av_Hb = 5
      }
      else if(av_Hb > 12)
      {
        av_Hb = 12
      }

      const dataPoint = {
        Age: +ageGroup.key,
        MMSE: +MMSEGroup.key,
        Patient: MMSEGroup.value.patient,
        av_Hb: av_Hb,
        // Add any additional properties or calculations here
      };
      
      listData.push(dataPoint);
    });
  });
  
  // Add X axis
  var x = d3.scaleLinear()
    .domain([0, d3.max(listData, function(d) { return d.Age })])
    .range([ 0, WIDTH]);

  g4.append("g")
    .attr("transform", "translate(0," + HEIGHT + ")")
    .classed("x-axis", true)
    .call(d3.axisBottom(x));

  // Add Y axis
  var y = d3.scaleLinear()
    .domain([0, d3.max(listData, function(d) { return d.MMSE })])
    .range([ HEIGHT, 0]);

  g4.append("g")
    .classed("y-axis", true)
    .call(d3.axisLeft(y));

  // Add title
  g4.append("text")
  .attr("text-anchor", "end")
  .attr("x",  WIDTH/2 + MARGIN.LEFT )
  .attr("y", -60)
  .text("Age-MMSE-HbA1C (Size: patient count)");

  // Add X axis label:
  g4.append("text")
      .attr("text-anchor", "end")
      .attr("x", WIDTH/2 + MARGIN.LEFT - 90)
      .attr("y", HEIGHT + MARGIN.TOP + 60)
      .text("AGE");

  // Y axis label:
  g4.append("text")
      .attr("text-anchor", "end")
      .attr("transform", "rotate(-90)")
      .attr("y", -MARGIN.LEFT + 20)
      .attr("x", -MARGIN.TOP - HEIGHT/2 + 50)
      .text("MMSE")

  // Colors
  var colors = ["#23171b","#900c00","#4076f5","#26d0cd","#5ffc73","#cbe839","#ff9b21","#d6390f"];
  var color = d3.scaleOrdinal()
  .domain([d3.min(listData, function(d) { return d.av_Hb }), d3.max(listData, function(d) { return d.av_Hb })])
  .range(colors);
 
  // Size
  var size = d3.scaleLinear()
    .domain([d3.min(listData, function(d) { return d.Patient }), d3.max(listData, function(d) { return d.Patient })])
    .range([ 3, 10]);
  
  // Legend
  // Add a legend
  const legend = g4.attr("class", "legend")
 

  // Add a title to the legend
  legend.append("text")
  .text("Hb-A1C")
  .style("font-weight", "bold")
  .attr("x", 580)
  .attr("y", -10);

  const legendRectSize = 18; // Size of the color boxes in the legend
  const legendSpacing = 0; // Spacing between color boxes

  // Create an array of labels for your legend (e.g., population ranges)
  var legendLabel = ["5", "6", "7", "8", "9", "10", "11", "12"];

  legend.selectAll("scatter-text")
  .data(legendLabel)
  .enter()
  .append("text")
  .text(d => d)
  .style("font-size", "17px") // Font size
  .attr("x", 7)
  .attr("y", (d, i) => (i-13) * (legendRectSize))
  .attr("transform", "translate(600, 260)");

  legend.selectAll("scatter-rect")
  .data(legendLabel)
  .enter()
  .append("rect")
  .attr("width", legendRectSize)
  .attr("height", legendRectSize)
  .style("fill", d => color(+d))
  .attr("x", (d, i) => i * (legendRectSize + legendSpacing))
  .attr("y", 0)
  .attr("transform", "rotate(90), translate(10, -600)");
  
  

  var dots = g4.append('g')
   .selectAll("dot")
   .data(listData)
   

  dots.enter()
  .append("circle")
  .attr("cx", function (d) { return x(d.Age); } )
  .attr("cy", function (d) { return y(d.MMSE); } )
  .attr("r", function (d) { return size(d.Patient); })
  .attr("opacity", 0.7)
  .style("fill", function (d) { return color(d.av_Hb); })
  .on('mouseover', tip.show)
  .on('mouseout', tip.hide);
}
function updateScatterPlot(selectedData) {
   // Group the data by 'age' and 'MMSE'.
  // filter selected data
  console.log(selectedData);
  value_age = [];
  selectedData.forEach(function(d){
    value_age = d3.nest().key(d => d.Age).key(d => d.MMSE)
      .rollup((function(d) {
        return {
          patient: d.length,  
          av_Hb: d3.mean(d, function(e) { return e["Hb-A1C"]; }),       
        }
      }))
      .entries(selectedData);
  })
  
  // Transform the nested data into a list of dictionaries
  const listData = [];
  
  value_age.forEach(ageGroup => {
    ageGroup.values.forEach(MMSEGroup => {
      av_Hb = MMSEGroup.value.av_Hb
      if(av_Hb < 5) {
        av_Hb = 5;
      } else if(av_Hb > 12) {
        av_Hb = 12;
      }

      const dataPoint = {
        Age: +ageGroup.key,
        MMSE: +MMSEGroup.key,
        Patient: MMSEGroup.value.patient,
        av_Hb: av_Hb,
        // Add any additional properties or calculations here
      };
      
      listData.push(dataPoint);
    });
  });
  
  console.log(listData);
  // Add X axis
  var x = d3.scaleLinear()
    .domain([0, d3.max(listData, function(d) { return d.Age })])
    .range([0, WIDTH]);

  g4.select(".x-axis")
    .transition()
    .duration(1000)
    .call(d3.axisBottom(x));

  // Add Y axis
  var y = d3.scaleLinear()
    .domain([0, d3.max(listData, function(d) { return d.MMSE })])
    .range([HEIGHT, 0]);

  g4.select(".y-axis")
    .transition()
    .duration(1000)
    .call(d3.axisLeft(y));

  // Colors
  var colors = ["#23171b","#900c00","#4076f5","#26d0cd","#5ffc73","#cbe839","#ff9b21","#d6390f"];
  var color = d3.scaleOrdinal()
    .domain([d3.min(listData, function(d) { return d.av_Hb }), d3.max(listData, function(d) { return d.av_Hb })])
    .range(colors);

  // Size
  var size = d3.scaleLinear()
    .domain([d3.min(listData, function(d) { return d.Patient }), d3.max(listData, function(d) { return d.Patient })])
    .range([3, 10]);

  var dots = g4.selectAll("circle").data(listData);
    

  // Remove dots that are not needed
  dots.exit()
    .transition()
    .duration(1000)
    .attr('r', 0)
    .remove();
 
     // Add new dots
    dots.enter()
      .append("circle")
      .merge(dots)
      .attr("cx", function (d) { return x(d.Age); } )
      .attr("cy", function (d) { return y(d.MMSE); } )
      .attr("r", function (d) { return size(d.Patient); })
      .attr("opacity", 0)
      .style("fill", function (d) { return color(d.av_Hb); })
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide)
      .call(enterTransition);

  function enterTransition(selection) {
    selection.transition()
      .duration(1000)
      .attr("opacity", 0.7);
  }
   


}



function crossFilter() {
  // prepare the filtered data
  console.log(filterState);
  education_range = {"No": [0, 0], "Elementary": [1, 6], "Junior High": [7, 9], "Senior High": [9, 12], "College+": [13, 13] };
  d3.csv("data_loc.csv").then(rawData => {
    // Apply filters based on conditions
    filteredData = rawData.filter(d => {
      
      if (filterState.selectedEducation != null) {
        const yearStudied = education_range[filterState.selectedEducation];
        if (!(+d.Education >= yearStudied[0] && +d.Education <= yearStudied[1])) {
          return false;
        }
      }
    
      if (filterState.ageInterval[0] != null) {
        const ageInterval = filterState.ageInterval;
        if (!(+d.Age >= ageInterval[0] && +d.Age <= ageInterval[1])) {
          return false;
        }
      }
    
      if (filterState.selectedCounty != null) {
        const countyID = filterState.selectedCounty;
        if (!(+d.location == countyID)) {
          return false;
        }
      }
    
      // If no conditions are met, include the record
      return true;
    
    });
    //console.log("filtered:" + filteredData);
    updateScatterPlot(filteredData);
    
  })
  
  
  
}


        