define(['./ExitSaver', './TimedSaver'],
function(ExitSaver, TimedSaver) {
	/*
	service will be an auto-saver factory
	so you can get new instance of the auto saver.

	The auto saver takes an object that is exportable.
	*/

	var service = {
		createTimedSaver: function(exportable) {
			return new TimedSaver();
		},

		createExitSaver: function(exportable) {
			return new ExitSaver();
		}
	};

	return {
		initialize: function(registry) {
			registry.register({
				interfaces: 'tantaman.web.AutoSavers'
			}, service);
		}
	};
});