define(() ->
	AddComponent = (@slide, @component) ->

	AddComponent.prototype =
		do: () ->
			@slide.__doAdd(@component)

		undo: () ->
			@slide.__doRemove(@component)

		name: "Add Comp"

	RemoveComponent = (@slide, @component) ->

	RemoveComponent.prototype =
		do: () ->
			@slide.__doRemove(@component)

		undo: () ->
			@slide.__doAdd(@component)

		name: "Remove Comp"

	result =
		Add: AddComponent
		Remove: RemoveComponent
)