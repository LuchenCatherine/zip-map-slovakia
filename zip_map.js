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
				var cities = data.map(function (cityInfo) {
					var zip = cityInfo.zip.replace(/ /g, '');
					var population = parseInt(cityInfo.population.replace(/ /g, ''));
					// gps coordinates
					var coordinates = /(.+)°N (.+)°E/g.exec(cityInfo.gps);
					var lat = parseFloat(coordinates[1].replace(/ /g, ''));
					var lon = parseFloat(coordinates[2].replace(/ /g, ''));

					return new City(cityInfo.name, zip, population, lat, lon);
				});

				return cities;
			}

			function visualize(cities) {
				// attributes
				var width = 800;
				var height = 500;

				// boundaries of data
				var medianLat = d3.median(cities, function(d){return d.lat;});
				var medianLon = d3.median(cities, function(d){return d.lon;});

				var minLat = d3.min(cities, function(d){return d.lat});
				var maxLat = d3.max(cities, function(d){return d.lat});
				
				var minLon = d3.min(cities, function(d){return d.lon});
				var maxLon = d3.max(cities, function(d){return d.lon});				

				var scaleInitial = 6000;

				var projection = d3.geo.mercator();

				var zoom = d3.behavior.zoom()
					.translate([width/2, height/2])
					.scale(scaleInitial)
					.scaleExtent([scaleInitial, 15*scaleInitial])
					.on('zoom', zoomed);

				// draw svg panel with margins
				var svg = d3.select('body')
					.append('svg')
						.attr('width', width)
						.attr('height', height)
						.style('border', '1px solid black')
					.append('g');

				var g = svg.append('g');

				svg.append('rect')
					.attr('class', 'overlay')
					.attr('width', width)
					.attr('height', height);					

				svg
					.call(zoom)
					.call(zoom.event);

				g.selectAll('circle')
					.data(cities)
					.enter()
					.append('circle')
						.attr('cx', function (d) {
							return projection([d.lon, d.lat])[0];
						})
						.attr('cy', function(d){
							return projection([d.lon, d.lat])[1];
						})
						.attr('r', 1)
						.attr('fill', 'black')
						.on('mouseover', function(d){
							
						});

				function zoomed(){
					projection
						.translate(zoom.translate())
						.scale(zoom.scale())
						.center([medianLon, medianLat]);

					g.selectAll('circle')
						.attr('cx', function (d) {
							return projection([d.lon, d.lat])[0];
						})
						.attr('cy', function(d){
							return projection([d.lon, d.lat])[1];
						})
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