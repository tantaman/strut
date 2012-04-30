define(["common/EventEmitter"],
(EventEmitter) ->
	class UndoHistory
		constructor: (@size) ->
			@actions = new Array(@size)
			@cursor = -1
			@start = 0
			@end = 0
			_.extend(@, new EventEmitter())

		push: (action) ->
			@undoEnd = false
			prevCursor = @cursor
			@cursor = (@cursor + 1) % @size
			@end = @cursor + 1
			if prevCursor isnt -1
				@start = @end % @size

			@actions[@cursor] = action

		undo: () ->
			if @cursor is @start
				if not @undoEnd
					@actions[@cursor].undo()
					@undoEnd = true
			else if @cursor isnt -1
				@actions[@cursor].undo()
				--@cursor
				if @cursor < 0
					@cursor = @actions.length - 1


		redo: () ->
			tempCursor = (@cursor + 1) % @size
			if tempCursor isnt @end
				@cursor = tempCursor
				@actions[@cursor].do()
			else if @undoEnd
				@actions[@cursor].do()
				@undoEnd = false
)