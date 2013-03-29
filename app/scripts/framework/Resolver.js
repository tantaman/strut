define(function() {
	/*
	Go through all loaded bundles
	(do a config.json or feature.json and pass that data
	to the framework initializer?)

	Just go ahead and put the "bundle" -> "location"
	mapping in the features.json?

	Might as well.. I don't think the rmap should be abstracted
	out at this point...

	well it may screw up the requirejs optimizer...
	so we'll have to make that feature aware...

	We'll also have to make it aware of packages
	that are exported from bundles with new paths...

	Just check to see if every desired import
	exists for every desired export.

	And then configure the paths appropriately.

	Later:
	version checking...
	how can requirejs help us with the versioning issue?

	And later:
	metadata and capability checking
	(Provides and Requires - capability)
	*/
});