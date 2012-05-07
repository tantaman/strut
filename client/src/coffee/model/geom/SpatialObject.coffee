###
@author Matt Crinklaw-Vogt
###
define(["vendor/backbone"]
(Backbone) ->
	Backbone.Model.extend(
		initialize: () ->
		constructor: `function SpatialObject() {
			Backbone.Model.prototype.constructor.apply(this, arguments);
		}`
	)
)