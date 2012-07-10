define(["vendor/amd/backbone"],
(Backbone) ->
	Backbone.View.extend(
		initialize: (callbacks) ->
			@buttonBarOptions = callbacks

		optionChosen: (e) ->
			option = $(e.currentTarget).attr("data-option")
			@buttonBarOptions[option].call(@, e)
	)
)