###
@author Matt Crinklaw-Vogt
###
define(["common/Calcium",
		"common/Math2"]
(Backbone, Math2) ->
	Backbone.Model.extend(
		initialize: () ->

		# TODO: pull this up one level in the class hierarchy?
		setInt: (name, value) ->
			if typeof value is "string"
				try
					value = parseInt value
				catch e
					return

			@set(name, Math.round(value))

		setFloat: (name, value, dec) ->
			if typeof value is "string"
				try
					value = parseInt value
				catch e
					return

			dec || (dec = 2)
			value = Math2.round(value, dec)

			@set(name, value)

		constructor: `function SpatialObject() {
			Backbone.Model.prototype.constructor.apply(this, arguments);
		}`
	)
)