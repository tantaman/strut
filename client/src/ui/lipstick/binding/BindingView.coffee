define(["vendor/backbone", "./Binder"],
(Backbone, Binder) ->
	Backbone.View.extend(
		initialize: () ->
			@_binder = new Binder(model: @model, el: @$el, mapping: @mapping)
	)
)