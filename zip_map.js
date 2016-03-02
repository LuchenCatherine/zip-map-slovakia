(function (window, document, undefined) {

	function data2Vis(file){
		d3.tsv(file, function (error, data) {

			if (error) throw error;

			var cities = data.map(function (cityInfo) {
				var zip = cityInfo.zip.replace(/ /g, '');
				var population = parseInt(cityInfo.population.replace(/ /g, ''));
				// gps coordinates
				var coordinates = /(.+)°N (.+)°E/g.exec(cityInfo.gps);
				var lat = parseFloat(coordinates[1].replace(/ /g, ''));
				var lon = parseFloat(coordinates[2].replace(/ /g, ''));

				return new City(cityInfo.name, zip, population, lat, lon);
			});
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