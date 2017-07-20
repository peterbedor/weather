Wee.fn.make('search', {
	init: function(conf) {
		// Set the initial configuration with some defaults
		this.conf = $.extend({
			sel: 'ref:searchInput',
			baseUrl: '//maps.googleapis.com/maps/api/geocode/json'
		}, conf);

		// If no API Key is provided, throw an error
		if (! this.conf.apiKey) {
			throw new Error('No API key provided');
		}

		// Set the search input to a class/instance variable
		this.$search = $(this.conf.sel);

		// If the search selection did not return any elements
		// throw an error
		if (! this.$search.length) {
			throw new Error('Invalid or empty selection');
		}

		// Add necessary DOM elements
		this.addDOMElements();

		// Set the data model
		this.model = {
			results: {},
			activeIndex: -1,
			open: false
		};

		// Set the app to a class variable
		this.app = $.app.make('locationSearch', {
			model: this.model,
			target: 'ref:searchResults',
			view: 'searchResults'
		});

		// Create an object with the keyCodes as keys, and the corresponding
		// key names as values for easier readability later
		this.keys = {
			38: 'up',
			40: 'down',
			13: 'enter',
			27: 'esc',
			8: 'backspace'
		};

		// Bind events
		this.bindEvents();
	},
	addDOMElements: function() {
		this.$search
			.wrap('<div class="search" />')
			.after('<div class="search__results-container" data-ref="searchResults" />');
	},
	bindEvents: function() {
		var scope = this;

		$.events.on({
			'ref:searchInput': {
				// Add debounce for throttling
				keyup: scope.debounce(function(e) {
					var key = scope.keys[e.keyCode],
						val = e.target.value;

					// If the key press is not a navication/action key, and
					// the key is not empty, perform the search
					if (scope.validKey(key) && val !== '') {
						scope.search(val);

					// Otherwise, if the key is the backspace and the value is empty
					// close the results (this happens when clearing the input)
					} else if (key === 'backspace' && val === '') {
						scope.closeResults();
					}
				}, 500),
				keydown: function(e) {
					var key = scope.keys[e.keyCode];

					// If the key is up or down, navigate
					if (key === 'up' || key === 'down') {
						scope.navigate(key);

						e.preventDefault();
					} else if (scope.model.open && key === 'enter') {
						scope.setLocation();
					} else if (key === 'esc') {
						scope.closeResults();
					}
				}
			}
		});

		$('ref:searchResult').on('click', function(e, el) {
			// The index of the element is going to correspond to the index
			// of the desired result in our data model array, so use this index
			// to grab and set the location data
			scope.setLocation($(el).index());
		}, {
			delegate: 'ref:searchResults'
		});

		$($._body).on('click', function() {
			scope.closeResults();
		});
	},
	validKey: function(key) {
		return key !== 'enter' && key !== 'up' && key !== 'down' && key !== 'esc';
	},
	setLocation: function(index) {
		var app = this.app,
			results = app.$get('results'),
			activeIndex = app.$get('activeIndex');

		// Allow an optional index to be passed through to this function and use it
		// if it's provided
		index = index || activeIndex;

		// If the search results has the index, set the location and fire the
		// select callback that's provided
		if (results[index]) {
			if (this.conf.select && typeof this.conf.select == 'function') {
				this.conf.select(results[index]);
			}

			$('ref:searchInput').val(results[index].formatted_address);
		}

		this.closeResults();
	},
	closeResults: function() {
		var app = this.app;

		app.$set('results', []);
		app.$set('activeIndex', -1);
		app.$set('open', false);
	},
	navigate: function(key) {
		var app = this.app,
			activeIndex = app.$get('activeIndex'),
			results = app.$get('results');

		if (results[activeIndex]) {
			results[activeIndex].active = false;
		}

		if (key === 'down' && activeIndex < (results.length - 1)) {
			activeIndex += 1;
		} else if (key === 'up' && activeIndex > 0) {
			activeIndex -= 1;
		}

		if (results[activeIndex]) {
			results[activeIndex].active = true;
		}

		app.$set('activeIndex', activeIndex);
	},
	search: function(term) {
		var scope = this,
			query = {
				address: term,
				key: scope.conf.apiKey
			};

		Wee.data.request({
			url: scope.conf.baseUrl,
			method: 'get',
			data: query,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
			},
			success: function(data) {
				if (data) {
					scope.showResults(data);
				}
			}
		});
	},
	showResults: function(data) {
		var $input = $('ref:searchInput'),
			scope = this;

		data = JSON.parse(data);

		scope.results = data.results;

		$input.addClass('-is-active');
		scope.app.$set('results', scope.results);
		scope.model.open = true;
	},
	debounce: function(fn, delay) {
		var scope = this,
			timer = null;

		return function() {
			var context = scope,
				args = arguments;

			clearTimeout(timer);

			timer = setTimeout(function() {
				fn.apply(context, args);
			}, delay);
		};
	}
});