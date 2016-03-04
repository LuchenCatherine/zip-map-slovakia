/**
 * Visualization of Slovakian zip codes. 
 * 
 * Data downloaded from Wikipedia (https://sk.wikipedia.org/wiki/Zoznam_slovensk%C3%BDch_obc%C3%AD_a_vojensk%C3%BDch_obvodov)
 * Visualization uses Mercator projection; zoom adapted from bl.ocks.org/mbostock/eec4a6cda2f573574a11
 *
 * @author lucyia (ping@lucyia.com)
 */

(function (window, document, undefined) {

	function data2Vis(file){
		d3.tsv(file, function (error, data) {

			if (error) throw error;

			visualize(parseData(data));

			function parseData(data){
				var citiesArray = data.map(function (cityInfo) {
					var zip = cityInfo.zip.replace(/ /g, '');
					var population = parseInt(cityInfo.population.replace(/ /g, ''));
					// gps coordinates
					var coordinates = /(.+)°N (.+)°E/g.exec(cityInfo.gps);
					var lat = parseFloat(coordinates[1].replace(/ /g, ''));
					var lon = parseFloat(coordinates[2].replace(/ /g, ''));

					return new City(cityInfo.name, zip, population, lat, lon);
				});

				return citiesArray;
			}

			function visualize(data) {
				// variables
				var width = 800;
				var height = 500;

				var scaleInitial = 6000;

				var basicColor = "#bbb";
				var hoverColor = "#aaa";

				var medianLat = d3.median(data, function(d){ return d.lat; });
				var medianLon = d3.median(data, function(d){ return d.lon; });

				var populationCheck = document.getElementById("populationCheck").checked;
				var colorCheck = document.getElementById("colorCheck").checked;				

				// scales and functions
				var radius = d3.scale.sqrt()
					.domain(d3.extent(data, function(d){ return d.population; }))
					.range([2, 20]);

				var projection = d3.geo.mercator();

				var zoom = d3.behavior.zoom()
					.translate([width/2, height/2])
					.scale(scaleInitial)
					.scaleExtent([scaleInitial, 15*scaleInitial])
					.on('zoom', zoomed);

				// draw elements
				var svg = d3.select('#vis')
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

				svg.call(zoom)
					.call(zoom.event);

				update(data);

				function update(data){
					var cities = circleGroup.selectAll('circle')
						.data(data);
					
					cities.enter()
						.append('circle')
							.attr('class', 'city')
							.attr('cx', function(d){ return projection([d.lon, d.lat])[0]; })
							.attr('cy', function(d){ return projection([d.lon, d.lat])[1]; })
							.on('mouseover', mouseover)
							.on('mouseout', moseout)
							.text(function(d){ return d.name; })
						.transition()
							.duration(700)
							.attr('r', function(d){ return populationCheck ? radius(d.population) : 5; })
							.attr('fill', function(d){ return colorCheck ? color(d.zip) : basicColor; });

					cities.exit()
						.transition()
						.duration(700)
						.attr('r', 0)
						.remove();
				}

				function color(zip) {
					return '#bbb';
				}

				function mouseover(){
					d3.select(this)
						.attr('stroke', hoverColor)
						.attr('stroke-width', 10);
				}

				function moseout(){
					d3.select(this)
						.attr('stroke', 'none');
				}

				function zoomed(){
					projection
						.translate(zoom.translate())
						.scale(zoom.scale())
						.center([medianLon, medianLat]);

					circleGroup.selectAll('circle')
						.attr('cx', function(d){ return projection([d.lon, d.lat])[0]; })
						.attr('cy', function(d){ return projection([d.lon, d.lat])[1]; })
						.attr('r', function(d){ return radius(d.population*0.001*zoom.scale()); });
				}
			}
		});

		function City(name, zip, population, lat, lon){
			this.name = name;
			this.zip = zip;
			this.population = population;
			this.lat = lat;
			this.lon = lon;
		}
	}

	data2Vis("/data/slovakia_cities.tsv");

})(this, document);