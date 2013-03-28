/*
Load in startup tasks
Go through each and "start" it
Show progress of each task on splash.

Startup tasks:
-locate storage providers
-locate last used provider
-connect with providers
*/
define(function() {
	function Splash(registry) {
		this.$el = $('<div class="splashScreen">');
	}

	Splash.prototype = {
		render: function() {
			this.$el.html('');
		},

		start: function() {
			
		},

		_step: function(err) {

		},

		_complete: function() {

		}
	};

	return Splash;
});