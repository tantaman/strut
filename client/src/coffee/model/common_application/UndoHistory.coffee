define(["common/EventEmitter",
		"common/collections/LinkedList"],
(EventEmitter, LinkedList) ->
		class UndoHistory
			constructor: (@size) ->
				@actions = new LinkedList()
				@cursor = null
				@undoCount = 0

			push: (action) ->
				if (@actions.length - @undoCount) < @size
					if @undoCount > 0
						if not @cursor
							@actions.push(action)
						else
							node =
								prev: @cursor
								next: null
								value: action
							@cursor.next.prev = null
							@cursor.next = node
							@actions.length = @actions.length - @undoCount
						@undoCount = 0
						@cursor = null
					else
						@actions.push(action)
				else
					@actions.shift()
					@actions.push(action)

			undo: () ->
				if @undoCount < @actions.length
					if not @cursor?
						@cursor = @actions.tail
				
					@cursor.value.undo()
					@cursor = @cursor.prev
					++@undoCount

			redo: () ->
				if @undoCount > 0
					if not @cursor?
						@cursor = @actions.head
					else
						@cursor = @cursor.next

					@cursor.value.do()
					--@undoCount

# TODO: extend backbone model so we can enable/disable menu items appropriately.
# TODO: just make a damned JS linked list implementation...  this would be so much less hacky!
	#class UndoHistory
	#	constructor: (@size) ->
	#		@actions = new Array(@size)
	#		@cursor = -1
	#		@start = 0
	#		@end = 0
	#		@cnt = 0
	#		_.extend(@, new EventEmitter())
	#
	#	push: (action) ->
	#		++@cnt
	#		@undoEnd = false
	#		prevCursor = @cursor
	#		@cursor = (@cursor + 1) % @size
	#		@end = @cursor + 1
	#		if @cnt >= @size
	#			@start = @end % @size
	#
	#		@actions[@cursor] = action
	#
	#	undo: () ->
	#		if @cursor is @start
	#			if not @undoEnd
	#				@actions[@cursor].undo()
	#				@undoEnd = true
	#		else if @cursor isnt -1
	#			@actions[@cursor].undo()
	#			--@cursor
	#			if @cursor < 0
	#				@cursor = @actions.length - 1


	#	redo: () ->
	#		tempCursor = (@cursor + 1) % @size
	#		if tempCursor isnt @end
	#			@cursor = tempCursor
	#			@actions[@cursor].do()
	#		else if @undoEnd
	#			@actions[@cursor].do()
	#			@undoEnd = false
)