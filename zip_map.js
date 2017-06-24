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

			if ( error ) {
				console.log(error);
				return error;
			}

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

				var hoverColor = '#00bcd4';
				var matchColor = '#000000';
				var nonMatchColor = '#dadada';

				var medianLat = d3.median( data, function(d) { return d.lat; } );
				var medianLon = d3.median( data, function(d) { return d.lon; } );

				// scales and functions
				var radius = d3.scaleSqrt()
					.domain( d3.extent( data, function(d) { return d.population; } ) )
					.range( [2, 20] );

				var cityColor = d3.scaleOrdinal()
					.domain( d3.range( 10 ) )
					.range( ['#2ca02c', '#bcbd22', '#ff7f0e', '#d62728', '#8c564b', '#7f7f7f', '#17becf', '#1f77b4', '#9467bd', '#e377c2'] );

				var projection = d3.geoMercator()
					.translate( [width/2 - scaleInitial/3 - 50, height/2 + scaleInitial - 150] )
					.scale( scaleInitial );

				var zoom = d3.zoom()
					.scaleExtent( [1, 15] )
					.on('zoom', zoomed);

				// add basic tooltip
				d3.select('.vis')
					.append('div')
						.attr('class', 'city-tooltip')
						.style('opacity', 0);

				// draw elements
				var vis = d3.select('.vis')
					.append('svg')
						.attr('width', width)
						.attr('height', height)
						.style('border', '1px solid black')

				var svg = vis.append('g');

				vis.call( zoom );

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
				vis.call( tip );

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

					var cities = svg.selectAll('circle')
						.data( data );

					cities.exit()
						.transition()
						.duration( 700 )
						.attr('r', 0)
						.remove();

					cities.transition()
							.attr('r', function(d) { return populationCheck ? radius( d.population ) : 3; })
							.attr('fill', function(d) { return color( input, d.zip, colorCheck ); });

					cities.enter()
						.append('circle')
							.attr('class', 'city')
							.attr('cx', function(d) { return projection( [d.lon, d.lat] )[0]; })
							.attr('cy', function(d) { return projection( [d.lon, d.lat] )[1]; })
							.on('mouseover', mouseover)
							.on('mouseout', moseout)
							.transition()
							.attr('r', function(d) { return populationCheck ? radius( d.population ) : 3; })
							.attr('fill', function(d) { return color( input, d.zip, colorCheck ); });
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
						.attr('stroke-width', 5);

					tip.show( city );
				}

				/**
				 * Hides the tooltip and resets the stroke of a circle.
				 */
				function moseout() {
					d3.select( this )
						.attr('stroke', 'none');

					tip.hide();
				}

				/**
				 * Updates the projection acoording to updated zoom scale
				 * and renderes only those cities in the extent of the zoom scale.
				 */
				function zoomed() {
					// translate the whole group holding all circles
					svg.attr('transform', d3.event.transform);

					// do not translate each circle individually
					// svg.selectAll('circle')
					// 	.attr('transform', d3.event.transform);
				}
			}
		});
	}

})( this, document );
