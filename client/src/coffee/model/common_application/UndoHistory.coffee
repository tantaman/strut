define(["common/EventEmitter"],
(EventEmitter) ->
	class UndoHistory
		constructor: (@size) ->
			@actions = new Array(@size)
			@cursor = -1
			_.extend(@, new EventEmitter())

		push: (action) ->
		pop: (action) ->
)