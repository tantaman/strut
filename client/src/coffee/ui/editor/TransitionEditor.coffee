###
@author Matt Crinklaw-Vogt
###
define(["vendor/backbone"],
(Backbone) ->
	Backbone.View.extend(
		initialize: () ->
			@name = "Transition Editor"
	)
)