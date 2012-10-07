define(() ->
	result = 
		cut: () ->
			slide = @model.get("activeSlide")
			if slide?
				@_clipboard.set("item", slide)
				@model.removeSlide(slide)
				slide.set("selected", false)
				false

		copy: () ->
			slide = @model.get("activeSlide")
			if slide?
				@_clipboard.set("item", slide.clone())
				false

		paste: () ->
			item = @_clipboard.get("item")
			if item?
				newItem = item.clone()
				# TODO: h4x hax
				newItem.set("x", null)
				newItem.set("y", null)
				@model.addSlide(newItem)
)