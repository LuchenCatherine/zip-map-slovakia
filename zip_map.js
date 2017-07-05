/**
 * Visualization of Slovakian zip codes.
 *
 * Data downloaded from Wikipedia (https://sk.wikipedia.org/wiki/Zoznam_slovensk%C3%BDch_obc%C3%AD_a_vojensk%C3%BDch_obvodov)
 * Visualization uses Mercator projection; zoom adapted from bl.ocks.org/mbostock/eec4a6cda2f573574a11
 *
 * @author lucyia (ping@lucyia.com)
 */

'use strict';

(function ( window, document, undefined ) {

  data2Vis('/data/slovakia_cities.tsv');

  /**
   * Function firstly parses the given file and then visualizes it.
   *
   * @param {string} file tab separated file
   */
  function data2Vis( file ) {

    d3.tsv( file, function ( error, data ) {

      if ( error ) { return error; }

      visualize( parseData( data ) );
    });
  };

  /**
   * Parses all elements of given data and creates an array of city objects from it.
   *
   * @param {array} data array of objects representing each line from file
   * @return {array} cities array of objects representing each city
   */
  function parseData( data ) {

    return data.map( createCity );

    /**
     * Creates an object representing a city with given properties.
     *
     * @param {object} cityInfo object with parameters of a city
     * @return {object} city object representing a city
     */
    function createCity( cityInfo ) {

      var zip = cityInfo.zip.replace(/\s/g, '');
      var population = parseInt( cityInfo.population.replace(/\s/g, '') );
      var coordinates = /(.+)°N (.+)°E/g.exec( cityInfo.gps );
      var lat = parseFloat( coordinates[1].replace(/ /g, '') );
      var lon = parseFloat( coordinates[2].replace(/ /g, '') );

      return {
        name: cityInfo.name,
        zip: zip,
        population: population,
        lat: lat,
        lon: lon
      };
    }
  }

  /**
   * Creates a map visualization from given data.
   * Each city is rendered as a circle either coloured or gray and has mouse listeners for tooltip.
   *
   * @param {array} data array of objects representing cities
   */
  function visualize( data ) {
    // vis variables
    var margin = 12;
    var width = window.innerWidth - (margin * 2);
    var height = window.innerHeight - (margin * 2);

    // initial scale for projection
    var scaleInitial = 6000;
    // scale value for mouse event
    var zoomScale = 1;

    var hoverColor = '#00bcd4';
    var matchColor = '#ffffff';
    var nonMatchColor = '#3a3a3a';
    var numberColors = [
      '#2ca02c', '#bcbd22', '#ff7f0e', '#d62728', '#8c564b', '#b1b1b1', '#17becf', '#1f77b4', '#9467bd', '#e377c2'
    ];

    // scales for circle size and color
    var radius = d3.scaleSqrt()
      .domain( d3.extent( data, function(d) { return d.population; } ) )
      .range( [1, 20] );

    var cityColor = d3.scaleOrdinal()
      .domain( d3.range( 10 ) )
      .range( numberColors );

    // projection - mercator - translated to center the map
    var projection = d3.geoMercator()
      .translate( [width/2 - scaleInitial/3 - 50, height/2 + scaleInitial - 150] )
      .scale( scaleInitial );

    // zoom for handling the mouse events
    var zoom = d3.zoom()
      .scaleExtent( [1, 15] )
      .on('zoom', zoomed);

    // draw SVG panel
    var svg = d3.select('.vis')
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    // create main group holding all elements
    var vis = svg.append('g');

    // invoke zoom behaviour
    svg.call( zoom );

    // initialize tooltip
    var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset( [-10, 0] )
    .html(function(d) {
      // create user friendly format for population numbers
      var number = d.population.toString().split('').reverse().join('');
      number = number.replace(/(\d{3})/g, '$1 ');
      number = number.split('').reverse().join('');

      // create elements for each row showing info
      var name = '<div class="cityname">'+ d.name +'</div>';
      var zip = '<div>'+ d.zip +'</div>';
      var citizens = '<div>'+ number +' citizens</div>';

      return name + zip + citizens;
    });

    // invoke the tip in the vis context
    svg.call( tip );

    // draw cities
    update();

    // add listener on window size change
    window.onresize = function(event) {
      // update the variables
      width = window.innerWidth - (margin * 2);
      height = window.innerHeight - (margin * 2);

      // update the svg size
      svg.attr('width', width)
        .attr('height', height);
    }

    // add listeners to input fields
    d3.select('#populationCheck').on('change', function() {
      update();
    });

    d3.select('#colorCheck').on('change', function() {
      update();

      // color legend only when checked
      d3.selectAll('.color-box')
        .style('background-color', function(d, i) {
          return document.getElementById('colorCheck').checked ? cityColor( i ) : nonMatchColor;
        });
    });

    d3.select('#zipInput').on('input', function() {
      // ignore invalid input for ZIP - valid only numbers between 0 and 99999
      if ( !isNaN( document.getElementById('zipInput').value ) ) {
        // valid input
        update();
      }
    });

    /**
     * Update function for the whole visualization creating cities as circles with given attributes.
     * (Data don't change, only their attributes)
     */
    function update() {
      var populationCheck = document.getElementById('populationCheck').checked;
      var colorCheck = document.getElementById('colorCheck').checked;
      var input = document.getElementById('zipInput').value;

      var cities = vis.selectAll('circle')
        .data( data );

      cities.exit()
        .transition()
        .duration( 700 )
        .attr('r', 0)
        .remove();

      cities.transition()
        .attr('r', circleSize)
        .attr('fill', function(d) {
          if (input.length === 5 && d.zip.startsWith( input )) {
            tip.show(d, d3.select(this).node());

            d3.select('.d3-tip')
              .transition()
              .delay( 2000 )
              .duration( 1000 )
              .style('opacity', 0);
          }

          return color( input, d.zip, colorCheck );
        });

      cities.enter()
        .append('circle')
        .attr('class', 'city')
        .attr('cx', function(d) { return projection( [d.lon, d.lat] )[0]; })
        .attr('cy', function(d) { return projection( [d.lon, d.lat] )[1]; })
        .on('mouseover', mouseover)
        .on('mouseout', mouseout)
        .transition()
        // .delay(function (d, i) { return Math.max(i, 50) + i; })
        .attr('r', circleSize)
        .attr('fill', function(d) { return color( input, d.zip, colorCheck ); });

        function circleSize(d) {
          return populationCheck ? radius( d.population ) : 2;
        }
    }

    /**
     * Determines what colour should the city circle have and returns it.
     *
     * @param {string} input numbers from input form
     * @param {string} zip full five letter zip code
     * @param {boolean} show indicator whether the city should be rendered with colour
     * @return {string} color
     */
    function color( input, zip, show ) {

      if ( zip.startsWith( input ) ) {
        return show ? nextNumberColor() : matchColor;
      } else {
        return nonMatchColor;
      }

      /**
       * Determines what's the colour of the next number in zip code and returns it.
       *
       * @return {string} color
       */
      function nextNumberColor() {
        if ( input.length < 5 ) {
          return cityColor( zip.charAt( input.length ) );
        } else {
          // no next number, the whole input is the same as zip
          return matchColor;
        }
      }
    }

    /**
     * Creates a tooltip over the circle representing a city
     * and creates a stroke around the circle to highlight it.
     *
     * @param {object} city
     */
    function mouseover( city ){
      var colorCheck = document.getElementById('colorCheck').checked;

      var circle = d3.select( this )
        .attr('stroke', colorCheck ? matchColor : hoverColor)
        .attr('stroke-width', 5 / zoomScale);

      tip.show( city, d3.select(this).node() );
    }

    /**
     * Hides the tooltip and resets the stroke of a circle.
     */
    function mouseout() {
      d3.select( this )
        .attr('stroke', 'none');

      tip.hide();
    }

    /**
     * Updates the projection acoording to updated zoom scale
     * and renderes only those cities in the extent of the zoom scale.
     */
    function zoomed(event) {
      // update the zoom scale value
      zoomScale = d3.event.transform.k;

      // translate the whole group holding all circles
      vis.attr('transform', d3.event.transform);

      // when having more than hundreds/thousands of elements:
      // do not translate each element individually
      // vis.selectAll('circle')
      //   .attr('transform', d3.event.transform);
    }
  }

})( this, document );
