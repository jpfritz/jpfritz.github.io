var mapWidth = 1200,
mapHeight = 500,
mapSensitivity = 0.25,
mapSvg,
mapProjection,
mapWorld,
mapPath,
mapBounds,
mapRoutes,
farAwayZoom = 500, // Zoom level for when crossing the Atlantic
defaultZoom = 1700; // Zoom level for the rest of the time

// ...Maybe instead let's make the map as big as the screen, since resizing it is kind of trouble
// and I do mean the SCREEN, not the current browser window!
// This is somewhat of a hackish solution, yes

mapWidth = $(window).width();
mapHeight = $(window).height();

function initializeMap() {
  mapProjection = d3.geo
  .orthographic() // This is the projection, you can find others at https://github.com/mbostock/d3/wiki/Geo-Projections
                  // some might be better at displaying accurate lengths of route sections
  .scale(defaultZoom) // How zoomed in the map is
  .rotate([70, -50]) // where the center point of the map is
  .translate([mapWidth / 2, mapHeight / 2])
  .clipAngle(90);

  mapPath = d3.geo.path()
  .projection(mapProjection);

  //SVG container

  mapSvg = d3.select("#timeline-map")
  .attr("width", mapWidth)
  .attr("height", mapHeight);

  //Adding water

  mapSvg.append("path")
  .datum({type: "Sphere"})
  .attr("class", "water")
  .attr("d", mapPath);

  queue()
  .defer(d3.json, "world-110m.json") // the json for the countries
  .defer(d3.json, "route.json") // the json for the route, 'identifier' in json must match 'identifier' in spreadsheet
  .await(timelineMapReady);
  
  $("<div id='map-toggle'>Toggle map</div>").appendTo("body")
                                            .click( function() {
                                              if($("#timeline-map-holder").is(":visible")) {
                                                $("#timeline-map-holder").hide();
                                              } else {
                                                $("#timeline-map-holder").show();
                                              }
                                              return false;
                                            })
}

// Main function

function focusOnFeature(element, duration) {
      var totalLength = element.node().getTotalLength();
      var feature = element.datum();

      // ZOOM STUFF:
      //
      // Right now if it's a big long line (ie NYC-London) it zooms to 400
      // otherwise it sits at 1300
      
      if(totalLength > 1000) {
        endScale = farAwayZoom;
      } else {
        endScale = defaultZoom;
      }
      
      d3.transition()
          .ease("easeOutCirc")
          .duration(duration) 
          .tween("zoomTo", function() {
            var p = d3.geo.centroid(feature),
                r = d3.interpolate(mapProjection.rotate(), [-p[0], -p[1]]),
                s = d3.interpolate(mapProjection.scale(), endScale);
            return function(t) {
              console.log('current scale is ' + s(t));
              mapProjection = mapProjection.rotate(r(t)).scale(s(t));
              mapPath = d3.geo.path()
                .projection(mapProjection);
              mapRouteOutlines.attr('d', mapPath);
              mapRoutes.attr('d', mapPath);
              mapWorld.attr('d', mapPath);
            }
          });
  
}

function timelineMapReady(error, world, route) {

  // // Getting bounds
  // mapBounds = d3.geo.bounds(route);
  // mapProjection.center([(mapBounds[1][0]+mapBounds[0][0])/2, (mapBounds[1][1]+mapBounds[0][1])/2]);

  // Drawing countries on the globe
  var countries = topojson.feature(world, world.objects.countries).features;
  
  mapWorld = mapSvg.selectAll("path.land")
  .data(countries)
  .enter().append("path")
  .attr("class", "land")
  .attr("d", mapPath)

  // Drawing route
  var sorted_route = route.features.sort( function(a, b) { return d3.ascending(a.properties.order, b.properties.order); });

  mapRouteOutlines = mapSvg.selectAll("path.route-outline")
    .data(sorted_route)
    .enter().append("path")
    .attr('class','route-outline')
    .attr("d", mapPath);

  mapRoutes = mapSvg.selectAll("path.route")
    .data(sorted_route)
    .enter().append("path")
    .attr('class','route')
    .attr("id", function(d, i) {
      // Give it a index starting at 1 so we can skip the very first one
      return "route-" + (i + 1);
    })
    .attr("d", mapPath);
  
  $(".route").on("activate", function() {
    var element = d3.select(this);
    
    if(element.attr('class') != 'route active') {
      element.attr('class','route active');

      var x, y, k;

      var totalLength = element.node().getTotalLength();
      
      element
        .attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition()
          .duration(1500) // This is the speed that the line is drawn for when going forward (1.5 seconds)
          .ease("linear")
          .attr("stroke-dashoffset", 0);

      focusOnFeature(element, 750)
    }
  });

  $(".route").on("deactivate", function() {
    var element = d3.select(this);
    if(element.attr('class') == 'route active') {

      var totalLength = element.node().getTotalLength();

      element
        .attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", 0)
        .transition()
        .duration(500) // This is the speed that lines disappear when going backward (0.5 seconds)
        .ease("linear")
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .delay(500)
        .attr('class','route')
        .attr("stroke-dashoffset", totalLength);

        focusOnFeature(element, 350)

    }
  });
  
  $(window).resize(function() {
      if(this.resizeTO) clearTimeout(this.resizeTO);
      this.resizeTO = setTimeout(function() {
          $(this).trigger('resizeEnd');
      }, 500);
  });
  
  $(window).bind('resizeEnd', function() {    
    mapWidth = $(window).width();
    mapHeight = $(window).height();
    
    d3.select("#timeline-map").attr("width", mapWidth).attr("height", mapHeight);
    mapProjection = mapProjection.translate([mapWidth / 2, mapHeight / 2]);
    mapPath = d3.geo.path().projection(mapProjection);
    
    mapWorld.attr('d', mapPath);
    mapRouteOutlines.attr('d', mapPath);
    mapRoutes.attr('d', mapPath);
    // var rotate = mapProjection.rotate();
    // mapProjection.center([20,0]);
    // mapSvg.selectAll("path.land").attr("d", mapPath);
    // mapSvg.selectAll("path.route").attr("d", mapPath);
    // console.log('ok');
  });

  focusOnFeature(d3.select("#route-1"), 500)

};

initializeMap();