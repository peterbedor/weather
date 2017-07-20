Wee.fn.make('common', {
	init: function() {
		Wee.weather.init({
			apiKey: '24535d03713aa1b81fd739416bbbea35'
		});

		Wee.search.init({
			apiKey: 'AIzaSyD1TxboAqPH6OmZtxxz3BnmdT6Sulw9zP4',
			select: function(location) {
				Wee.weather.current(location);
			}
		});
	}
});