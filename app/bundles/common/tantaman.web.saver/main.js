define(['./ExitSaver', './TimedSaver'],
function(ExitSaver, TimedSaver) {
	/*
	service will be an auto-saver factory
	so you can get new instance of the auto saver.

	The auto saver takes an object that is exportable.
	*/

	var service = {
		timedSaver: function(exportable) {
			return new TimedSaver(exportable);
		},

		exitSaver: function(exportable) {
			return new ExitSaver(exportable);
		}
	};

	return {
		initialize: function(registry) {
			registry.register({
				interfaces: 'tantaman.web.saver.AutoSavers'
			}, service);
		}
	};
});