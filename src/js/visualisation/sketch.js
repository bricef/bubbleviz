/*
NATALIE IS AWESOME!!!!
<div id="infobox" class="{{category}}" style="display:none;">
  <p class="category">Category: <span id="category-placeholder">{{category}}</span></p>
  <p>Search Terms: <a class="search" href="{{search_url}}">{{terms}}</a></p>
  <p>Result: <a class="result" href="{{url}}">{{result}}</a></p>
  <p class="rank">User Rank: <span id="rank-placeholder">{{personal_rank}}</span></p>
</div>
*/


$(function(){
  var lastMoved = 0;
  var anchor = null;
  var tether = null;




  /**
   * We have to wrap evrything that will use the processing API around the sketch function so
   * we can access the processing.* namespace.
   */
   var createSketch  = function(data){
    return function (processing) {
      var showInformation = function(particle){
        var result = particle.result;
        var infobox = $("#infobox");
        infobox.attr('class', result.category);
        infobox.find('.category #category-placeholder').html(result.category);
        infobox.find('.search').attr('href', result.search_url).html(result.terms);
        infobox.find('.result').attr('href', result.url).html(result.result);
        if(result.personal_rank){
          infobox.find('.rank #rank-placeholder').html(result.personal_rank);
          infobox.find('.rank').show();
        }else{
          infobox.find('.rank').hide();
        }

        anchor = $('<a>').css({
          position: 'absolute',
          top: particle.pos.y + 'px',
          left: particle.pos.x + 'px',
          width: particle.radius*2 + 'px',
          height: particle.radius*2 + 'px'
        });
        $('body').append(anchor);

        infobox.show();

        tether = new Tether({
          element: infobox[0],
          target: anchor[0],
          attachment: 'top left',
          targetAttachment: 'bottom left',
          constraints: [
            {
              to: [20,20,processing.width-20, processing.height-20],
              attachement:'together',
              pin: true
            }
          ]
        });

      };

  var hideInformation = function(){
    var infobox = $("#infobox");
    infobox.hide();
    tether.destroy();
    anchor.remove();
  };




      var getNoise = function(amplitude){
        var noise = new processing.PVector(Math.random()*((Math.random()>0.5)?-1:1), Math.random()*((Math.random()>0.5)?-1:1));
        noise.normalize();
        noise.mult(amplitude);
        return noise;
      };
      /**
       * The Particle Object is responsible for movement and display of a particle.
       */
      var Particle = function(options){
        this.velMax = options.maxVel;
        this.pos = options.pos;
        this.colour = options.colour;
        this.accFunction = options.accFunction;

        this.result = options.result;
        this.oldPos = null;
        this.drawDot = false;
        this.doUpdate = true;
        this.radius = 3.5;
        this.speedState = 'SLOW';
        this.mass = 1;
        this.vel = new processing.PVector(0,0);
        this.acc = new processing.PVector(0,0);
      };

      Particle.prototype.updateVelocity = function(VMousePosition){
        var accel = this.accFunction(VMousePosition, this.pos);

        if(this.pos.dist(VMousePosition) > 300){
          this.speedState = "FAST";
        }


        var since_moved = (new Date().getTime()) - lastMoved;

        var time_threshold = 2000;

        if(since_moved  > time_threshold){
          this.speedState = "SLOW";
        }

        var ko = 5;
        var k = (- ko*since_moved)/time_threshold + ko + 1; // how much faster than normal we can go


        if(this.speedState == "FAST"){
            //accel.add(getNoise(1));
            this.vel.add(accel);
            this.vel.limit(k*this.velMax);
        }else{
            this.vel.add(accel);
            this.vel.limit(this.velMax);
        }

      };

      Particle.prototype.updatePosition = function(VMousePosition){
        this.pos.add(this.vel);
        if(this.pos.x > processing.width || this.pos.x <0 ){
          this.vel.x *= -1;
        }
        if(this.pos.y > processing.height || this.pos.y <0 ){
          this.vel.y *= -1;
        }
      };

      Particle.prototype.update = function(VMousePosition){
        if(this.doUpdate){
          this.updateVelocity(VMousePosition);
          this.oldPos = new processing.PVector(this.pos.x, this.pos.y);
          this.updatePosition(VMousePosition);
        }
      };

      Particle.prototype.draw = function(){

        if(this.drawDot){
          processing.noStroke();
          processing.fill(this.colour[0],this.colour[1],this.colour[2]);
          processing.ellipse(this.pos.x, this.pos.y, this.radius*4, this.radius*4);
        }else{
          processing.noStroke();
          //processing.stroke(this.colour[0],this.colour[1],this.colour[2]);
          processing.fill(this.colour[0],this.colour[1],this.colour[2]);
          //processing.point(this.pos.x, this.pos.y);
          //processing.line(this.oldPos.x, this.oldPos.y, this.pos.x, this.pos.y);
          processing.ellipse(this.pos.x, this.pos.y, this.radius*2.1,this.radius*1.9);
        }
      };

      Particle.prototype.select = function(){
        this.drawDot = true;
        this.doUpdate = false;
      };
      Particle.prototype.unselect = function(){
        this.drawDot = false;
        this.doUpdate = true;
      };


      /*
       * We define several potential field for our particles.
       * See the functions plotted at http://fooplot.com/plot/lqvbmcfj5g
       */
      var personalAccelerationFunction = function(VMousePosition, VParticlePosition){
        var accel = processing.PVector.sub(VMousePosition, VParticlePosition);
        var dist = accel.mag();

        var a = 0.001;
        var b = 0.000000001;
        accel.normalize();
        accel.mult(a*dist+b*Math.pow(dist, 4)); // f = ax

        accel.add(getNoise(0.5));
        return accel;
      };

      var bothAccelerationFunction = function(VMousePosition, VParticlePosition){
        var mass = 1;
        var accel = processing.PVector.sub(VMousePosition, VParticlePosition);
        var dist = accel.mag();
        accel.normalize();

        var n = 100;

        var force;
        if( dist < n){
          // Sinusoid force = -sin(PI*dist/n) negative cause it's repulsive
          var theta = Math.PI * dist/n;
          var k = 10;
          force = -(Math.cos(theta)+1) * k;
        }else{
          // Quadratic force = a(dist - n)^2
          var a = 0.000005;
          force = Math.pow( (dist-n), 2) * a;
        }
        // f=ma
        accel.mult(force/mass);

        accel.add(getNoise(0.5));

        return accel;
      };

      var anonymousAccelerationFunction = function(VMousePosition, VParticlePosition){
        var mass = 1;
        var accel = processing.PVector.sub(VMousePosition, VParticlePosition);
        var dist = accel.mag();
        accel.normalize();

        var n = 100;

        // reciprocal repulsive force = -a/(dist-n)
        var a = 100;
        var force = -a/(dist)

        //weak quadratic attractive force = b(dist)^2
        var b = 0.000005;
        force += b*dist*dist;

        // f = ma
        accel.mult(force/mass);

        accel.add(getNoise(0.5));

        return accel;
      };








      var options = {
        "personal": {
          pos: new processing.PVector(0,0),
          maxVel: 2.5,
          accFunction: personalAccelerationFunction,
          colour: [255,0,0]
        },
        "both": {
          pos: new processing.PVector(0,0),
          maxVel: 2.5,
          accFunction: bothAccelerationFunction,
          colour: [0,255,0]
        },
        "anonymous": {
          pos: new processing.PVector(0,0),
          maxVel: 2.5,
          accFunction: anonymousAccelerationFunction,
          colour: [100,100,255]
        },
      };

      var colour_options = {
        "personal": [ //shades of red
          [255,0,0],
          [255,100,100],
          [255,200,200]
        ],
        "both": [ // shades of green
          [0,255,0],
          [100,255,100],
          [200,255,200]
        ],
        "anonymous": [ //shades of blue
          [0,0,255],
          [100,100,255],
          [200,200,255]
        ]
      };


      var particles = [];
      var selected = null;
      var centerOfMass = null;

      var update = function(){
        if(selected){
          particles.forEach(function(particle){
            particle.update(centerOfMass);
          });
        }else{
          var mousePos = new processing.PVector(processing.mouseX, processing.mouseY);
          particles.forEach(function(particle){
            particle.update(mousePos);
          });
        }
      };

      var decayRate = 255;
      var decayAll = function(){
        processing.noStroke();
        processing.fill(254,254,255,decayRate);
        processing.rect(0,0,processing.width,processing.height);
      };

      processing.draw = function() {
        decayAll();
        update();

        particles.forEach(function(particle){
          particle.draw();
        });
      };

      processing.addResult = function(result, isInjected){
        var pos = new processing.PVector(Math.random()*processing.width,Math.random()*processing.height);

        if(isInjected){
          console.log("Adding new result to visualisation...");
          var ndist = 450; // distance away from center of mass at which new particles are added
          var com;
          if (centerOfMass){
            com = centerOfMass;
          }else{
            com = new processing.PVector(processing.mouseX,processing.mouseY);
          }
          var n = new processing.PVector( ((Math.random() > 0.5)?-1:1)*Math.random(), ((Math.random() > 0.5)?-1:1)*Math.random());
          n.normalize();
          n.mult(ndist);
          pos = processing.PVector.add(com, n);
        }

        var particle = new Particle(
          $.extend({},
            options[result.category],
            { // This object overrides the defaults defined in the 'options' variable
              pos: pos,
              result: result,
              // We select a random colour from our colour_options.
              colour: colour_options[result.category][Math.floor(Math.random()*colour_options[result.category].length)]
            }
          )
        );

        particles.push(particle);
      };

      processing.clearResults = function(){
        particles = [];
      };

      processing.setup = function(){
        for(var si = 0; si < data.length; si++){
          for(var ri = 0; ri<data[si].length; ri++){
            processing.addResult( data[si][ri]);
          }
        }

        processing.fill(255);
        processing.background(254,254,255);
        processing.noStroke();
      }

      processing.mouseClicked = function() {

        if(selected){
         selected.unselect();
         hideInformation();
         selected = null;
         centerOfMass = null;
        }else{
          var nearest = null;
          var mouse = new processing.PVector(processing.mouseX, processing.mouseY);
          particles.forEach(function(particle){
            if(!nearest){ nearest = particle; }
            if(particle.pos.dist(mouse) < nearest.pos.dist(mouse) ){
              nearest = particle;
            }
          });
          nearest.select();
          showInformation(nearest);
          selected = nearest;

          var category = selected.result.category;
          var d;
          if(category == "personal"){
            d = 0;
          }else if (category == "both"){
            d = 125;
          }else{
            d = 250;
          }
          var center_of_page = new processing.PVector(processing.width/2, processing.height/2);
          var from_selected_to_center =  processing.PVector.sub(center_of_page, selected.pos);
          from_selected_to_center.normalize();
          from_selected_to_center.mult(d);
          centerOfMass = processing.PVector.add(selected.pos, from_selected_to_center);

        }

      };

      processing.mouseMoved = function(){
        lastMoved = new Date().getTime();
      };

    }
  };

  var canvas = document.getElementById("canvas");

  var processing = null;

  chrome.storage.local.get("searches", function(store){

    var data = store.searches.map(results_to_scores);
    processing = new Processing(canvas, createSketch(data));

    $(window).on('resize', function(){
      $('body').css({width: $(window).width() ,height:$(window).height()});
      processing.size($(window).width(),$(window).height());
    });
    $('body').css({width: $(window).width() ,height:$(window).height()});
    processing.size($(window).width(),$(window).height());

  });


  chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (processing && ("searches" in changes) && (namespace == "local") ){

      var storageChange = changes["searches"];
      var oldSearches = storageChange.oldValue;
      var newSearches = storageChange.newValue;

      if ( oldSearches.length < newSearches.length ){
        // We added a new search, add new items
                    var data = newSearches.map(results_to_scores);

        for(var si = oldSearches.length; si < data.length; si++){
          for(var ri = 0; ri < data[si].length; ri++){
            var result = data[si][ri];
            processing.addResult(result, true);

          }
        }

      }else{
        // Something else happened, redraw viz completely
        console.log("Don't know how to deal. Clearing changes.")
        processing.clearResults();

      }

    }
  });

  $('#clear').click(function(){
    chrome.storage.local.set({searches: []}, function(){
      console.log("Cleared local storage");
    });
  });

});
