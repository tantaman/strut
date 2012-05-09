###
@author Matt Crinklaw-Vogt
###
define(["common/Calcium"]
(Backbone) ->
	Backbone.Model.extend(
		initialize: () ->
		constructor: `function SpatialObject() {
			Backbone.Model.prototype.constructor.apply(this, arguments);
		}`
	)
)