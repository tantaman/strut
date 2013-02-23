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
			var taskEntries = registry.get('strut.StartupTask');
			var countdown = new Concurrent.countdown(taskEntries.length,
				this._step, this._complete);
			taskEntries.forEach(function(taskEntry) {
				var task = taskEntry.service();
				task.run(countdown.decrement);
			});
		},

		_step: function(err) {

		},

		_complete: function() {

		}
	};

	return Splash;
});