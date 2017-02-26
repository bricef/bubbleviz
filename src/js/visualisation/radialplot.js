  var width = 1000;
  var height = 1000;



var visualise_as_radialplot = function(searches){

  var symbol_width = 10;
  var center_empty_radius = 235; //( (symbol_width+4) * searches.length) / (2*Math.PI);
  var line_length = (Math.min(width, height)/2) - center_empty_radius;
  var maximum_num_results = Math.max.apply(null, searches.map(function(results){return results.length;}));
  var separation = (line_length - center_empty_radius) / (maximum_num_results-1);
  var text_offset = 10;
  var gap_between_dots = 2;
  var cache = {radius:{},distance:{}};

  var tip = d3.tip().attr('class', 'd3-tip').html(function(d) {
    return d.result;
  });

  var svg = d3.select("#chart").append("svg")
    .attr("viewBox", "0 0 "+width+" "+height)
    .attr("preserveAspectRation", "xMidYMid")
    .call(tip)

  var searchgroup = svg.append("g")
    .attr("transform", "translate(" + width/2 + "," + height/2 + ")");


  var searchesEnter = searchgroup.selectAll('g')
    .data(searches)
    .enter()

  var isReversed = function(d,i){
    var angle = (360/searches.length)*i;
    if(angle > 90 && angle < 270){
      return true;
    }
    return false;
  }

  var radius_of_dot = function(d,i){
    if( cache.radius[i]){ return cache.radius[i]; };

    var r;

    //var number_of_searches = searches.length;
    //var circ = 2* Math.PI * distance_from_origin(d, i);
    //var width = (circ / (number_of_searches)) - gap_between_dots;

    // r=3@distance=70, r=6@distance=200
    // a=3/130, r=ad
    var a = -0.05; // growth rate
    var c = 4.5; // starting value
    r = a*i + c;

    if(r>6){r = 6}
    cache.radius[i] = r;
    return r;
  };

  var distance_from_origin = function(d, i){
    if( cache.distance[i]){ return cache.distance[i]; };
    var d;
    if(i == 0){
      d = center_empty_radius;
    }else{
      d = (2*radius_of_dot(d,i-1))+distance_from_origin(d,i-1)+gap_between_dots;
    }
    cache.distance[i] = d;
    return d;

  };

  var applyDefaultStyle = function(d3selection){
      /*d3selection.select('text')
        .attr('x', line_length+text_offset )
        .attr('y', 4)
        .attr("font-family", "sans-serif")
        .attr('fill', '#aaaaaa')
        .attr('font-size', '10px');
      d3selection.select('line')
        .style('stroke', 'black')
        .attr('stroke-width', '1px');*/

    var circles = d3selection.selectAll('circle');
      circles.attr('r', radius_of_dot)
      circles.attr('cx', distance_from_origin);
  };

  var applyHoverStyle = function(d3selection){
    d3selection.selectAll('circle')
      .attr('r', 5);

  };

  var srchs = searchesEnter.append('g')
    .attr('class', "search")
    .attr('transform', function(d,i){
      //return 'rotate('+(360/searches.length)*i+')';
      var angle_per_search = 360/150;
      var starting_angle = (-90) - (0.5 * searches.length*angle_per_search);
      return 'rotate('+(starting_angle+angle_per_search*i)+')';
    })
    .on('mouseover', function(d,i){
      applyHoverStyle(d3.select(this));
    })
    .on('mouseout', function(d,i){
      applyDefaultStyle(d3.select(this));

    })

  /*
  srchs.append('text')
      .text(function(d){
        return d[0].terms;
      })
      .attr('transform', function(d,i){
        if(isReversed(d,i)){
           return 'rotate(180 '+(line_length+text_offset)+',0)';
        }
        return null;
      })
      .attr('text-anchor', function(d,i){
        return isReversed(d,i)?"end":"start";
      })

  srchs.append('line')
      .attr('x1', center_empty_radius)
      .attr('x2', line_length)
  */
  srchs.selectAll('g')
    .data(function(d){
      d.sort(result_comparator);
      return d;
    })
    .enter()
    .append('circle')
    .attr('cx', function (d,i){
      return (i*separation) + center_empty_radius;
    })
    .attr('fill', function(d,i){
      if(d.category == "personal"){ return "red"; }
      if(d.category == "anonymous"){ return "blue"; }
      if(d.category == "both"){ return "green"; }
      return "grey"
    });

    srchs.each(function(d,i){ applyDefaultStyle(d3.select(this));});

};
