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

				var projection = d3.geo.mercator()
					.scale(6000)
					.translate([width/2,height/2])
					.center([medianLon, medianLat]);

				// draw svg panel with margins
				var svg = d3.select('body')
					.append('svg')
						.attr('width', width)
						.attr('height', height)
						.style('border', '1px solid black');

				// tooltip
				var tooltip = svg.append('text')
					.attr('x', width-150)
					.attr('y', height-100)
					.attr('fill', 'black')
					.text('Name of a city');

				// draw cities as circles
				svg.selectAll('circle')
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
							tooltip.text(d.name);
						});
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