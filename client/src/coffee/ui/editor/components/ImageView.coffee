###
@author Tantaman
###
define(["./ComponentView"],
	ComponentView.extend(
		className: "component imageView"
		tagName: "div"
		initialize: () ->
			ComponentView.prototype.initialize.apply(@, arguments)

		render: () ->
			ComponentView.prototype.render.call(@)
			@$el.find(".content").append("<img src=#{@model.get('src')}></img>");
	)
)