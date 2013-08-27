define(['./ExitSaver', './TimedSaver', './Saver'],
function(ExitSaver, TimedSaver) {
	/*
	service will be an auto-saver factory
	so you can get new instance of the auto saver.

	The auto saver takes an object that is exportable.
	*/

	var service = {
		timedSaver: function(exportable, duration, storageInterface) {
			return new TimedSaver(exportable, duration, storageInterface);
		},

		exitSaver: function(exportable, storageInterface) {
			return new ExitSaver(exportable, storageInterface);
		},

		manualSaver: function(exportable, storageInterface) {
			return new Saver(exportable, storageInterface);
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