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

			if ( error ) return error;

			visualize( parseData( data ) );

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
				// variables
				var width = 800;
				var height = 500;

				var scaleInitial = 6000;

				var hoverColor = '#aaaaaa';
				var matchColor = '#000000';
				var nonMatchColor = '#dadada';

				var medianLat = d3.median( data, function(d) { return d.lat; } );
				var medianLon = d3.median( data, function(d) { return d.lon; } );

				// scales and functions
				var radius = d3.scale.sqrt()
					.domain( d3.extent( data, function(d) { return d.population; } ) )
					.range( [2, 20] );

				var cityColor = d3.scale.ordinal()
					.domain( d3.range( 10 ) )
					.range( ['#2ca02c', '#bcbd22', '#ff7f0e', '#d62728', '#8c564b', '#7f7f7f', '#17becf', '#1f77b4', '#9467bd', '#e377c2'] );

				var projection = d3.geo.mercator();

				var zoom = d3.behavior.zoom()
					.translate( [width/2, height/2] )
					.scale( scaleInitial )
					.scaleExtent( [scaleInitial, 15*scaleInitial] )
					.on('zoom', zoomed);

				// add basic tooltip
				d3.select(".vis")
					.append('div')
						.attr('class', 'city-tooltip')
						.style('opacity', 0);

				// draw elements
				var svg = d3.select('.vis')
					.append('svg')
						.attr('width', width)
						.attr('height', height)
						.style('border', '1px solid black')
					.append('g');

				svg.append('rect')
					.attr('class', 'overlay')
					.attr('width', width)
					.attr('height', height);

				var circleGroup = svg.append('g');

				svg.call( zoom )
					.call( zoom.event );

				// draw cities
				update();

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
					if ( isNaN( document.getElementById('zipInput').value ) ) {
						// show warning
					} else {
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

					var cities = circleGroup.selectAll('circle')
						.data( data );
					
					cities.enter()
						.append('circle')
							.attr('class', 'city')
							.attr('cx', function(d) { return projection( [d.lon, d.lat] )[0]; })
							.attr('cy', function(d) { return projection( [d.lon, d.lat] )[1]; })
							.on('mouseover', mouseover)
							.on('mouseout', moseout)
							.text( function(d) { return d.name; } );

					cities.transition()
							.duration( 800 )
							.attr('r', function(d) { return populationCheck ? radius( d.population ) : 3; })
							.attr('fill', function(d) { return color( input, d.zip, colorCheck ); });

					cities.exit()
						.transition()
						.duration( 700 )
						.attr('r', 0)
						.remove();
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
					var circle = d3.select( this )
						.attr('stroke', hoverColor)
						.attr('stroke-width', 5);

					d3.select('.city-tooltip')
						.transition()
						.style('opacity', 1);

					var absMouseCoord = d3.mouse( d3.select( this )[0][0] );

					d3.select('.city-tooltip')
						.html( showTooltip )
						.style('left', absMouseCoord[0] + "px")
						.style('top', absMouseCoord[1] + "px");

					/**
					 * Shows formatted tooltip with information about the city.
					 * 
					 * @return {string} 
					 */
					function showTooltip() {
						var tooltip = '<p>' + city.zip + ' - ' + city.name + '</p>';
						
						if ( document.getElementById('populationCheck').checked ) {
							// create user friendly format for population numbers
							var number = city.population.toString().split('').reverse().join('');
							number = number.replace(/(\d{3})/g, "$1 ");
							number = number.split('').reverse().join('');

							tooltip += '<p>' + number + ' citizens </p>';
						}

						return tooltip;
					}
				}

				/**
				 * Hides the tooltip and resets the stroke of a circle.
				 */
				function moseout() {
					d3.select( this )
						.attr('stroke', 'none');

					d3.select('.city-tooltip')
						.transition()
						.style('opacity', 0);
				}

				/**
				 * Updates the projection acoording to updated zoom scale
				 * and renderes only those cities in the extent of the zoom scale.
				 */
				function zoomed() {
					projection
						.translate( zoom.translate() )
						.scale( zoom.scale() )
						.center( [medianLon, medianLat] );

					circleGroup.selectAll('circle')
						.attr('cx', function(d) { return projection( [d.lon, d.lat] )[0]; })
						.attr('cy', function(d) { return projection( [d.lon, d.lat] )[1]; });
				}
			}
		});
	}	

})( this, document );