

var months = ["Jan", "Feb", "Mar", 
    "Apr", "May", "Jun", "Jul", "Aug", "Sep", 
    "Oct", "Nov", "Dec"];
var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

var date_data_filter = function (min,max,attr){
  if(!attr){
    attr = 'timestamp';
  }
  var filter = function(item){
    if (min.getTime() < item[attr] && item[attr] < max.getTime() ){
      //console.log("true", min, max, search);
      return true;
    }else{
      //console.log("false", min, max, search);
      return false;
    }
  };
  return filter;
};


var fetch_clusters = function(searches, onSuccess, onFailure){
  console.log("[report.js]: fetching cluster info for "+searches.length+" searches");
  // handle fetch errors dumbly
  function onFail(msg){ 
    console.log(msg); alert(msg); 
  };
  
  var _onSuccess = function(results){
    if(onSuccess && (typeof onSuccess) == "function"){
      onSuccess(results);
    }
  }
  var _onFailure = function(message){
    if(onFailure && (typeof onFailure) == "function"){
      console.log(message); alert(message);
    }
  }
  console.log('Getting categories');
  searches_to_categorised_results(searches, _onSuccess, _onFailure);
};

var spin_all_the_things = function(selector){
  var opts = {
    lines: 2, // The number of lines to draw
    length: 20, // The length of each line
    width: 10, // The line thickness
    radius: 0, // The radius of the inner circle
    corners: 0, // Corner roundness (0..1)
    rotate: 0, // The rotation offset
    direction: 1, // 1: clockwise, -1: counterclockwise
    color: '#000', // #rgb or #rrggbb or array of colors
    speed: 4, // Rounds per second
    trail: 60, // Afterglow percentage
    shadow: false, // Whether to render a shadow
    hwaccel: false, // Whether to use hardware acceleration
    className: 'spinner', // The CSS class to assign to the spinner
    zIndex: 2e9, // The z-index (defaults to 2000000000)
    top: '50%', // Top position relative to parent
    left: '50%' // Left position relative to parent
  };
  $(selector).each(function(i){
    // this is where we would initialise the spinners on our page. 
    // Because we're selecting by elements the spinner will need 
    // need an element on the page that can retrieve using the selector
    new Spinner(opts).spin(this);
  })

};

/*
 * Page init
 */
$(function(){
  var searches = [];
  var history = [];
  var today = new Date();

  spin_all_the_things('.spinning');

  $("#dateslider").dateRangeSlider({
    //step:{
    //  days: 1
    //},
    valueLabels:"show",
    durationIn: 1000,
    durationOut: 1000,
    defaultValues: {
      max: today,
      min: (new Date()).setDate(today.getDate()-7)
    },
    bounds:{
      min: (new Date()).setMonth(today.getMonth()-3),
      max: new Date()
    },
    scales: [{
      first: function(value){ return value; },
      end: function(value) {return new Date(); },
      next: function(value){
        var next = new Date(value);
        return new Date(next.setMonth(value.getMonth() + 1));
      },
      label: function(){return "";},
      format: function(tickContainer, tickStart, tickEnd){
        tickContainer.addClass("month-ticker");
      }
    },
    {
      first: function(value){ return value; },
      end: function(value) {return new Date(); },
      next: function(value){
        var next = new Date(value);
        next.setDate(value.getDate() + 1);
        return next
      },
      label: function(){return "";},
      format: function(tickContainer, tickStart, tickEnd){
        tickContainer.addClass("date-ticker");
      }
    }],
    formatter:function(val){
        var days = val.getDate(),
          month = val.getMonth(),
          year = val.getFullYear();
        if(today.getDate() == days && today.getMonth() == month &&today.getFullYear() == year){
          return "Today";
        }else{
          return days + " " + months[month];// + " " + year;
        }
      }
  });

  get_searches(function(srchs){
    console.log("Got "+srchs.length+" searches from chrome.")
    searches = srchs;

    var timestamps = searches.map(function(search){return search.timestamp;})
    var maxdate = new Date(Math.max.apply(null, timestamps));
    var mindate = new Date(Math.min.apply(null, timestamps))
    reset_slider_bounds(mindate, maxdate);

    console.log("We initialise our report with "+searches.length+" searches");
    // Initialise the graphs based on the slider's default range.
    var vals = $('#dateslider').dateRangeSlider('values');

    var filtered_searches = searches.filter(date_data_filter(vals.min, vals.max));

    // These graphs only need the searches to be drawn
    
    redraw_daily_graph(filtered_searches);
    redraw_hourly_graph(filtered_searches);

    build_history_dataset(function(hstry){
      console.log("Got "+hstry.length+" history items from chrome.");
      history = hstry;

      var filtered_history = history.filter(date_data_filter(vals.min,vals.max,'lastVisitTime'));
      // these graphs need history too :)
      redraw_toplinks_graph(filtered_history);
      redraw_influence_graph(filtered_searches, filtered_history, searches2results(filtered_searches));
      
      fetch_clusters(filtered_searches, function(results){ //Success!
        //these graphs need the clustered results
        redraw_cluster_graph(results);
      }, function(msg){ //Error!
          console.error(msg); alert(msg);
      });

    });
  });

  $("#dateslider").on('valuesChanging', function(ev, data){
    var max = data.values.max;
    var min = data.values.min;
    if(min.getDate() == max.getDate() && min.getMonth() == max.getMonth() && min.getFullYear() == max.getFullYear()){
        min.setDate(min.getDate()-1);
        //$('#dateslider').dateRangeSlider('values', min,max);
    }

    var filtered_searches = searches.filter(date_data_filter(min, max));
    var filtered_history = history.filter(date_data_filter(min,max,'lastVisitTime'));

    // We don't need to re-fetch the data for these.
    redraw_daily_graph(filtered_searches);
    redraw_hourly_graph(filtered_searches);
    redraw_toplinks_graph(filtered_history);
    redraw_influence_graph(filtered_searches, filtered_history, searches2results(filtered_searches));

    // we need to call carrot for this one
    fetch_clusters(filtered_searches, function(results){ //Success!
      //these graphs need the clustered results
      redraw_cluster_graph(results);
    }, function(msg){ //Error!
        console.error(msg); alert(msg);
    });
    
  });



  
});


/*
 * Top links horizontal bars graph
 */
var redraw_toplinks_graph = function(history){
    console.log("[report.js]: redraw_toplinks_graph got "+ history.length + " history items");

    var selector = '#top-links';

    $(selector).html("");
    $(selector).parent().find('.spinning').show();

    var indexedHistory = history2indexedHistory(history);

    var data = _(indexedHistory).map(function(v,k){
      return {y:k, x:v};
    }).sortBy(function(e){
      return -e.x;
    }).take(10).reverse().value();
    console.log(data);  

    // var data = [
    //   { y: 'google.com', x:10 },
    //   { y: 'Hello.com', x:20 },
    //   { y: 'ffffound.com', x:30 },
    //   { y: 'siteinspire.com', x:40 },
    //   { y: 'nataliejohnson.com', x:50 },
    //   { y: 'foobar.com', x:10 },
    //   { y: 'yahoo.com', x:20 },
    //   { y: '2017', x:30 },
    //   { y: 'fractallambda.com', x:40 },
    //   { y: 'stackoverflow.com', x:50 },
    // ];
  var chart = d4.charts.row();
  
  chart.outerWidth($(selector).width())
    .margin({
      left: 0,
      top: 0,
      right: 0,
      bottom: 160
    })
  chart.mixout('xAxis');
  chart.mixout('yAxis');
  chart.using('bars', function(bar){
    bar.rx(4);
  });
  chart.using('barLabels', function(label){
     label.text(function(d){
        return d.y;
     });
     label.x(5);
     label.classes(label.classes()+' custom-class');
  });

  d3.select(selector)
    .datum(data)
    .call(chart);




  $(selector).parent().find('.spinning').hide();
};


/*
 * Bubble categories chart 
 */
var bubble_chart_aspect = null;
var redraw_cluster_graph = function(results){
  console.log("[report.js]: redraw_cluster_graph got "+results.length+ "results ");
  var bubble_graph_selector = "#bubble-chart";

  var pw = $(bubble_graph_selector).parent().width();
  var ph = $(bubble_graph_selector).parent().height();

  if(!bubble_chart_aspect){
    bubble_chart_aspect = pw / ph;
  }

   /* bubble chart */
   var diameter = 550,
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
      .style("fill", "#3666c9" )
      

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
    //console.log(d3.select(this));
    //$elem.find('foreignObject body div.innerlabel').width();
  });

d3.select(self.frameElement).style("height", diameter + "px");

  /* END bubble chart */
};
  
  
  
 /*
  * Hourly breakdown bar chart
  */
var redraw_hourly_graph = function(searches) {  
  console.log("[report.js]: redraw_hourly_graph got "+ searches.length+" searches");

  $("#bar-chart-1").html("");
  $("#bar-chart-1").parent().find('.spinning').show();

  var labels = {
    "0": "12am",
    "1": "1am",
    "2": "2am",
    "3": "3am",
    "4": "4am",
    "5": "5am",
    "6": "6am",
    "7": "7am",
    "8": "8am",
    "9": "9am",
    "10": "10am",
    "11": "11am",
    "12": "12pm",
    "13": "1pm",
    "14": "2pm",
    "15": "3pm",
    "16": "4pm",
    "17": "5pm",
    "18": "6pm",
    "19": "7pm",
    "20": "8pm",
    "21": "9pm",
    "22": "10pm",
    "23": "11pm"
  };

  var graphData = {};

  // add 0 for hours
  for(var h = 0; h < 24; h++){
    if(!(h in graphData)){
      graphData[h] = 0;
    }
  }

  searches.forEach(function(search){
    var when = new Date(search.timestamp);
    graphData[when.getHours()] += 1;
  });

  // formats it suitably for consumption
  var graphData = _.reduce(graphData, function(res, v,k){
    if(k in labels){
      res.push({x:labels[k], y:v});
    }else{
      res.push({x:"", y:v})
    }
    
    return res;
  }, []);


  var graphData = _.sortBy(graphData, graphData,function(o){
    return k.x;
  });

  var chart = d4.charts.column()
    .mixout('yAxis')
    .outerWidth($('#bar-chart-1').width())
    .margin({
      left: 11,
      top: 0,
      right: 11,
      bottom: 240
    })
  
  chart.using('bars', function(bar){
    bar.rx(2);
    bar.ry(2);
  });
  
  d3.select('#bar-chart-1')
    .datum(graphData)
    .call(chart);

  $("#bar-chart-1").parent().find('.spinning').hide();
}


/* 
 * Daily breakdown 
 */
var redraw_daily_graph = function(searches){
  console.log("[report.js]: redraw_daily_graph got "+ searches.length+" searches");
   
  $("#bar-chart-2").html("");
  $("#bar-chart-2").parent().find('.spinning').show();

  var labels = {
    "0": "Sunday",
    "1": "Monday",
    "2": "Tuesday",
    "3": "Wednesday",
    "4": "Thursday",
    "5": "Friday",
    "6": "Saturday",
  };

  var graphData = {};

  // add 0 for hours
  for(var h = 0; h < 7; h++){
    if(!(h in graphData)){
      graphData[h] = 0;
    }
  }

  searches.forEach(function(search){
    var when = new Date(search.timestamp);
    graphData[when.getDay()] += 1;
  });

  // formats it suitably for consumption
  var graphData = _.reduce(graphData, function(res, v,k){
    if(k in labels){
      res.push({x:labels[k], y:v});
    }else{
      res.push({x:"", y:v})
    }
    return res;
  }, []);


  var graphData = _.sortBy(graphData, graphData,function(o){
    return k.x;
  });

  var chart = d4.charts.column()
  .mixout('yAxis')
  .outerWidth($('#bar-chart-2').width())
    .margin({
      left: 11,
      top: 0,
      right: 11,
      bottom: 240
    })
  
  chart.using('bars', function(bar){
    bar.rx(2);
  bar.ry(2);
  
  });
  d3.select('#bar-chart-2')
    .datum(graphData)
    .call(chart);

  $("#bar-chart-2").parent().find('.spinning').hide();
  /* END daily breakdown */
};


function getParameterByName(searchURL, name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(searchURL);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}
function urlIsSearchUrl (url){
  return (url.substring(0,4) == "/url");
}
/*
 * Pie chart to show ???
 */
var redraw_influence_graph = function(searches, history, results){
  console.log("[report.js]: redraw_influence_graph got "+searches.length+" searches "+ history.length+ " history items "+results.length+" results");
  
  // pie one - links from search vs all history links
  // pie two - links from search promoted vs links from search neutral

  var indexedHistory = history2indexedHistory(history);

  var number_of_history_items = _.size(indexedHistory);

  var history_items_from_searches = 0;
  
  


  var uniq_results = _(results).reduce(function(accum, result){
      var resulthost;
      //console.log(accum,result);
      try{
        if(urlIsSearchUrl(result.url)){
          var parser = document.createElement('a');
          parser.href = result.url;
          resulthost = url2host(getParameterByName(parser.search, 'q'));
        } else {
          resulthost = url2host(result.url);
        }
        if(resulthost in accum){
           accum[resulthost].push(result);
        }else{
          accum[resulthost] = [result];
        }
       
      }catch(e){
        console.log(e);
      }
      return accum;

    }, {});

  
  _(uniq_results).forOwn(function(results,host){
    if (host in indexedHistory){
      // a result google returned to us made it in our history...
      history_items_from_searches += 1;
    }
  });
  
  
  var search_v_history = [
    { category: "History Only", value: number_of_history_items - history_items_from_searches},
    { category: "Search", value: history_items_from_searches}
  ];

 

  var pie = d3.layout.pie()
  .sort(null)
  .value(function(d) {
    return d.value;
  });

  var chart = d4.charts.donut()
  .outerWidth($('#pie').width())
  .margin({
    left: 0,
    top: 0,
    right: 0,
    bottom: 0
  })
  .radius(function() {
    return this.width / 8;
  })
  .arcWidth(0)
  .using('arcLabels', function(labels) {
    labels.text(function(d) {
      return d.data.category;
    })
  })
  .using('arcs', function(slices) {
    slices.key(function(d) {
      return d.data.category;
    });
  });

  d3.select('#pie')
  .datum(pie(search_v_history))
  .call(chart); 




  var promoted_links = 0;
  var demoted_links = 0;
  var neutral_links = 0;
  var unique_links = 0;


  var tmp_res = [];
  searches.forEach(function(search){
    var scores = results_to_scores(search);
    tmp_res.push(scores_to_data_template(scores));
  });
  tmp_res = _(tmp_res).flatten().value();

  tmp_res.forEach(function(result){
    if(result.anonymous_rank && result.anonymous_rank == "+"){
      unique_links += 1;
    }else if(result.indicatorclass == "indicator-promoted"){
      promoted_links += 1;
    }else if(result.indicatorclass == "indicator-demoted"){
      demoted_links += 1;
    }else if(result.indicatorclass == "indicator-stable"){
      neutral_links += 1;
    }
  });

   var search_v_search = [
    { category: "Promoted", value: promoted_links},
    { category: "Demoted", value: demoted_links},
    { category: "Neutral", value: neutral_links},
    { category: "Unique", value: unique_links},
  ];

  d3.select('#pie2')
  .datum(pie(search_v_search))
  .call(chart);

}; // end pie 1


/*
 Select the right menu item when loading the page to refelect the hashtag used for the liquidslider
 */
$(function(){
  
  //var hash = hasher.getHash();
  var handleNewHash = function( newhash, oldhash){
    $('#main-menu .menu-item a').each(function(i, elem){
      if($(elem).attr('href').substring(1) == newhash){
        $(elem).addClass('currentCrossLink');
      }
    });
  };
  hasher.changed.add(handleNewHash);
  hasher.initialized.add(handleNewHash);
  hasher.init();


});



