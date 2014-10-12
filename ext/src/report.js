

var display_data = {
  startDate: (new Date(2014,01,01)).getTime(),
  endDate: (new Date()).getTime(),

  personalised_links_number: 456,
  mostPersonalised: {
    term: "Kittens",
    size: 4,
    date: (new Date()).getTime()
  },

  clusters: [
    {name: "Cute creature", size:23},
    {name: "Engines", size:33},
    {name: "Fonts", size:45}
  ],

  view_history: [],
};


/*
 * Data request and template building
 */
$(function(){ 
  function onFail(msg){ console.log(msg); alert(msg); }

  build_results_dataset(function(results){
    console.log("Results dataset built...", results);
    build_history_dataset(function(historyItems){
      console.log(
        "Fetched all dataset. ready for reporting and rendering: ", 
        {results: results, history: historyItems}
      );
    }, onFail);
  }, onFail);

  //var template_text = $("#report-template").html();
  //var report_template = Handlebars.compile(template_text);
  //var html = report_template(display_data);
  //$('body').append(html);
});


/*
 * Top links horizontal bars graph
 */
$(function(){
var m = [30, 10, 10, 30],
    w = 360 - m[1] - m[3],
    h = 280 - m[0] - m[2];

var format = d3.format(",.0f");

var x = d3.scale.linear().range([0, w]),
    y = d3.scale.ordinal().rangeRoundBands([0, h], .1);

var xAxis = d3.svg.axis().scale(x).orient("top").tickSize(-h),
    yAxis = d3.svg.axis().scale(y).orient("left").tickSize(0);

var svg = d3.select("#top-links").append("svg")
    .attr("width", '100%')
    .attr("height", '440')
  .append("g")
    .attr("transform", "translate(" + m[0] + "," + m[0] + ")");
var data = [
  {
    "name":"AL",
    "value":4708708
  },
  {
    "name":"AK",
    "value":698473
  },
  {
    "name":"AZ",
    "value":6595778
  },
  {
    "name":"AR",
    "value":2889450
  },
  {
    "name":"CA",
    "value":36961664
  },
  {
    "name":"CO",
    "value":5024748
  },
  {
    "name":"CT",
    "value":3518288
  },
  {
    "name":"DE",
    "value":885122
  },
  {
    "name":"DC",
    "value":599657
  },
  {
    "name":"FL",
    "value":18537969
  }
]

  // Parse numbers, and sort by value.
  data.forEach(function(d) { d.value = +d.value; });
  data.sort(function(a, b) { return b.value - a.value; });

  // Set the scale domain.
  x.domain([0, d3.max(data, function(d) { return d.value; })]);
  y.domain(data.map(function(d) { return d.name; }));

  var bar = svg.selectAll("g.bar")
      .data(data)
    .enter().append("g")
      .attr("class", "bar")
      .attr("transform", function(d) { return "translate(0," + y(d.name) + ")"; });

  bar.append("rect")
      .attr("width", function(d) { return x(d.value); })
      .attr("height", '17px');

  bar.append("text")
      .attr("class", "value")
      .attr("x", function(d) { return x(d.value); })
      .attr("y", y.rangeBand() / 2)
      .attr("dx", -3)
      .attr("dy", ".35em")
      .attr("text-anchor", "end")
      .text(function(d) { return format(d.value); });

  svg.append("g")
      .attr("class", "x axis")
      .call(xAxis);

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis);

});


/*
 * Bubble categories chart 
 */
var bubble_chart_aspect = null;
var draw_bubble_graph = function() {  
  var bubble_graph_selector = "#bubble-chart";

  var pw = $(bubble_graph_selector).parent().width();
  var ph = $(bubble_graph_selector).parent().height();

  if(!bubble_chart_aspect){
    bubble_chart_aspect = pw / ph;
  }

   /* bubble chart */
   var diameter = 450,
    format = d3.format(",d"),
    color = d3.scale.category20c();

  var bubble = d3.layout.pack()
      .sort(null)
      .size([pw, ph])
      .padding(40);

var svg = d3.select(bubble_graph_selector).append("svg")
    .attr("width", '100%')
    .attr("height",'100%')
    .attr("class", "bubble");
  
var root =  { "children": [
      {"className": "perfectmasonry ", "value": 2000},
      {"className": "Agglomerative Cluster", "value": 3938},
      {"className": "Community Structure", "value": 3812},
      {"className": "Hierarchical Cluster", "value": 6714},
      {"className": "Merge Edge", "value": 743},
      {"className": "Agglomerative Cluster", "value": 4343},
      {"className": "Community Structure", "value": 4812},
      {"className": "Hierarchical Cluster", "value": 5714},
      {"className": "Merge Edge", "value": 143},
      {"className": "Community Structure", "value": 6812},
      {"className": "Hierarchical Cluster", "value": 714}
     ]
    };
  var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d) {
      return  "<br/> Searches: <span style='color:red'>" + d.className+ + "</span>";
    })

  svg.call(tip);

  var node = svg.selectAll(".node")
      .data(bubble.nodes(root).filter(function(d) { return !d.children; }))
      .enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

  node.append("title")
      .text(function(d) { return d.className + ": " + format(d.value); });

  node.append("circle")
      .attr("r", function(d) { return d.r; })
      .style("fill", function(d) { return color(d.packageName); })
      

  node.append('foreignObject')
    .attr('x', function(d){return -d.r;})
    .attr('y', function(d){return -d.r;})
    .attr('width', function(d){return d.r*2;})
    .attr('height', function(d){return d.r*2;})
    .on('mouseover', tip.show)
    .on('mouseout', tip.hide)
    .append("xhtml:body")
      .attr('class', 'label')
      .html(function(d){return '<div class="innerlabel">'+d.className+'</div>';})//function(d) { return "<p>"+d.className+"</p>"; })
  
  svg.selectAll(".node").filter(function(d,i){
    console.log(d3.select(this));
    //$elem.find('foreignObject body div.innerlabel').width();
  });

d3.select(self.frameElement).style("height", diameter + "px");

  /* END bubble chart */
}

$(function(){
  draw_bubble_graph();
});
  
  
  
 /*
  * Hourly breakdown bar chart
  */
var aspect_hourly_graph = null;
var draw_hourly_graph = function() {  

  var pw = $("#bar-chart-1").parent().width();
  var ph = $("#bar-chart-1").parent().height();
  if(!aspect_hourly_graph){
    aspect_hourly_graph = pw / ph;
  }
  
  var margin = {top: 0, right: 0, bottom: 30, left:0};
  var width = pw;
  var height = pw/aspect_hourly_graph;

  var formatPercent = d3.format(".0%");

  var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d) {
      return d.letter+ "<br/> Searches: <span style='color:red'>" + d.frequency + "</span>";
    })


  $("#bar-chart-1 svg").remove();
  var svg = d3.select("#bar-chart-1").append("svg")
      .attr("width", width)
      .attr("height", height)
      

  svg.call(tip);

  var data = ([{  
     "letter":"1am",
     "frequency":0.12702
  },
  {  
     "letter":"2am",
     "frequency":0.06749
  },
  {  
     "letter":"3am",
     "frequency":0.06749
  },
  {  
     "letter":"4am",
     "frequency":0.12702
  },
  {  
     "letter":"5am",
     "frequency":0.12702
  },
  {  
     "letter":"6am",
     "frequency":0.12702
  },
  {  
     "letter":"7am",
     "frequency":0.06094
  },
  {  
     "letter":"8am",
     "frequency":0.06973
  },
  {  
     "letter":"9am",
     "frequency":0.12702
  },
  {  
     "letter":"10am",
     "frequency":0.12702
  },
  {  
     "letter":"11am",
     "frequency":0.12702
  },
  {  
     "letter":"12pm",
     "frequency":0.12702
  },
  {  
     "letter":"1pm",
     "frequency":0.12702
  },
  {  
     "letter":"2pm",
     "frequency":0.12702
  },
  {  
     "letter":"3pm",
     "frequency":0.12702
  },
  {  
     "letter":"4pm",
     "frequency":0.12702
  },
  {  
     "letter":"5pm",
     "frequency":0.12702
  },
  {  
     "letter":"6pm",
     "frequency":0.12702
  },
  {  
     "letter":"7pm",
     "frequency":0.12702
  },
  {  
     "letter":"8pm",
     "frequency":0.12702
  },
  {  
     "letter":"9pm",
     "frequency":0.12702
  },
  {  
     "letter":"10pm",
     "frequency":0.12702
  },
  {  
     "letter":"11pm",
     "frequency":0.12702
  },
  {  
     "letter":"12pm",
     "frequency":0.12702
  }])

var x = d3.scale.ordinal()
      .rangeRoundBands([0, width], .1);

  var y = d3.scale.linear()
      .range([height-margin.bottom, 0]);

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

  var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")
      .tickFormat(formatPercent);
  
  x.domain(data.map(function(d) { return d.letter; }));
  y.domain([0, d3.max(data, function(d) { return d.frequency; })]);

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + (height-margin.bottom) + ")")
      .call(xAxis);

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("span")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Frequency");

  var bars = svg.append("g");
    
  bars.selectAll(".bar")
      .data(data)
    .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d) { return x(d.letter); })
      .attr("width", x.rangeBand())
      .attr("y", function(d) { return y(d.frequency); })
      .attr("height", function(d) { return height - margin.bottom - y(d.frequency); })
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide)



  function type(d) {
    d.frequency = +d.frequency;
    return d;
  }

}
$(function(){
  draw_hourly_graph();

  $(window).resize(function(){
    draw_hourly_graph();
  });
});


/* 
 * Daily breakdown 
 */
$(function() {  
   
  var margin = {top: 0, right: 0, bottom: 0, left: 0},
    width = 260 - margin.left - margin.right,
    height = 270 - margin.top - margin.bottom;

  var formatPercent = d3.format(".0%");

  var x = d3.scale.ordinal()
      .rangeRoundBands([0, width], .1);

  var y = d3.scale.linear()
      .range([height, 0]);

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

  var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")
      .tickFormat(formatPercent);

  var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d) {
      return "Searches: <span style='color:red'>" + d.frequency + "</span>";
    })
    

  var svg = d3.select("#bar-chart-2").append("svg")
      .attr("width", '100%')
      .attr("height", '100%')
    .attr('viewBox','0 0 '+Math.min(width,height)+' '+Math.min(width,height))
      .attr('preserveAspectRatio','xMinYMin')
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  svg.call(tip);

  var data = ([{  
     "letter":"S",
     "frequency":0.08167
  },
  {  
     "letter":"M",
     "frequency":0.01492
  },
  {  
     "letter":"TU",
     "frequency":0.0278
  },
  {  
     "letter":"W",
     "frequency":0.04253
  },
  {  
     "letter":"TH",
     "frequency":0.12702
  },
  {  
     "letter":"F",
     "frequency":0.02288
  },
  {  
     "letter":"SA",
     "frequency":0.02022

  }])
  
  x.domain(data.map(function(d) { return d.letter; }));
  y.domain([0, d3.max(data, function(d) { return d.frequency; })]);

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("span")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Frequency");

  svg.selectAll(".bar")
      .data(data)
    .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d) { return x(d.letter); })
      .attr("width", x.rangeBand())
      .attr("y", function(d) { return y(d.frequency); })
      .attr("height", function(d) { return height - y(d.frequency); })
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide)



  function type(d) {
    d.frequency = +d.frequency;
    return d;
  }

  /* END daily breakdown */
});
  
  



/*
 * Pie chart to show ???
 */
$(function() {
  /*  pie 1 */
  var width = 100,
    height = 100,
    radius = Math.min(width, height) / 2;

  var color = d3.scale.ordinal()
      .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

  var arc = d3.svg.arc()
      .outerRadius(radius - 10)
      .innerRadius(0);

  var pie = d3.layout.pie()
      .sort(null)
      .value(function(d) { return d.population; });

  var svg = d3.select("#pie-1").append("svg")
      .attr("width", width)
      .attr("height", height)
    .append("g")
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");


  var data = [
    {
      "age":"<5",
      "population":2704659
    },
    {
      "age":"5-13",
      "population":4499890
    }
  ];

  data.forEach(function(d) {
    d.population = +d.population;


    var g = svg.selectAll(".arc")
        .data(pie(data))
      .enter().append("g")
        .attr("class", "arc");

    g.append("path")
        .attr("d", arc)
        .style("fill", function(d) { return color(d.data.age); });

    g.append("text")
        .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
        .attr("dy", ".35em")
        .style("text-anchor", "middle")
        .text(function(d) { return d.data.age; });
  });

}); // end pie 1

/*
 * Pie chart to show ???
 */
$(function() {
  /*  pie 2 */
  var width = 100,
    height = 100,
    radius = Math.min(width, height) / 2;

  var color = d3.scale.ordinal()
      .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

  var arc = d3.svg.arc()
      .outerRadius(radius - 10)
      .innerRadius(0);

  var pie = d3.layout.pie()
      .sort(null)
      .value(function(d) { return d.population; });

  var svg = d3.select("#pie-2").append("svg")
      .attr("width", width)
      .attr("height", height)
    .append("g")
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");


  var data = [
    {
      "age":"<5",
      "population":2704659
    },
    {
      "age":"5-13",
      "population":4499890
    }
  ];

  data.forEach(function(d) {
    d.population = +d.population;

    var g = svg.selectAll(".arc")
        .data(pie(data))
      .enter().append("g")
        .attr("class", "arc");

    g.append("path")
        .attr("d", arc)
        .style("fill", function(d) { return color(d.data.age); });

    g.append("text")
        .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
        .attr("dy", ".35em")
        .style("text-anchor", "middle")
        .text(function(d) { return d.data.age; });
  });

});//end pie 2

