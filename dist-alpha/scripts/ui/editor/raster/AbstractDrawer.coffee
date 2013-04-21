define(() ->
	class AbstractDrawer
		applyTransforms: (component, bbox) ->
			rotation = component.get("rotate")
			scale = component.get("scale")

			@g2d.translate(bbox.x, bbox.y)

			if scale?
				@g2d.scale(scale.x, scale.y)

			@g2d.translate(bbox.width/2, bbox.height/2)

			if rotation?
				@g2d.rotate(rotation)

			skewX = component.get("skewX")
			skewY = component.get("skewY")
			if skewX or skewY
				transform = [1,0,0,1,0,0]
				if skewX
					transform[2] = skewX
				if skewY
					transform[1] = skewY
				@g2d.transform.apply(@g2d, transform)
			
			@g2d.translate(-1 * (bbox.width/2 + bbox.x), -1 * (bbox.height/2 + bbox.y))
)