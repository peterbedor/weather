Wee.fn.make('weather', {
	init: function(conf) {
		this.conf = $.extend({
			baseUrl: 'https://api.darksky.net/',
			sel: 'ref:weather'
		}, conf);

		this.model = {
			location: {},
			weather: {}
		};

		Wee.view.addHelper('date', function() {
			var date = new Date(0);
			date.setUTCSeconds(this.val);

			return date.toLocaleDateString();
		});

		this.app = $.app.make('weather', {
			model: this.model,
			view: 'weather',
			target: 'ref:weather'
		});
	},
	current: function(location) {
		this.get('forecast', location);
	},
	get: function(type, location) {
		var scope = this,
			conf = scope.conf,
			loc = location.geometry.location;

		Wee.data.request({
			url: '/api.php',
			method: 'post',
			data: $.serialize({
				url: conf.baseUrl + type,
				apiKey: conf.apiKey,
				lat: loc.lat,
				lng: loc.lng
			}),
			success: function(data) {
				data = JSON.parse(data);
				scope.setData(location, data);
			}
		});
	},
	setData: function(location, weather) {
		var app = this.app,
			current = weather.currently;

		app.$set('location', this.getLocation(location));
		app.$set('weather', {
			daily: weather.daily,
			current: {
				temp: this.format(current.temperature, 'temp'),
				humidity: this.format(current.humidity, 'humidity')
			}
		});
	},
	format: function(val, type) {
		switch (type) {
			case 'temp':
				return val.toFixed(1) + '°F';
			case 'humidity':
				return Math.floor(val * 100) + '%';
		}
	},
	getLocation: function(location) {
		var components = location.address_components,
			loc = {},
			c = 0,
			t = 0,
			types;

		if (components.length) {
			for (; c < components.length; c += 1) {
				if (components[c].types.length) {
					types = components[c].types;

					for (; t < types.length; t += 1) {
						if (types[t] === 'locality') {
							loc.city = components[c].long_name;
						} else if (types[t] === 'administrative_area_level_1') {
							loc.state = components[c].long_name;
						}

						break;
					}
				}
			}
		}

		return loc;
	}
});