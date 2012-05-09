###
@author Tantaman
###
define(["./ComponentView"],
(ComponentView) ->
	ComponentView.extend(
		className: "component imageView"
		tagName: "div"
		initialize: () ->
			ComponentView.prototype.initialize.apply(@, arguments)

		render: () ->
			ComponentView.prototype.render.call(@)
			$img = $("<img src=#{@model.get('src')}></img>")
			$img.bind("dragstart", (e) -> e.preventDefault(); false)
			@$el.find(".content").append($img);
			@$el.css({
				top: @model.get("y")
				left: @model.get("x")
			})
			@$el
	)
)