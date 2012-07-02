###*
* @module model.common_application
* @author Matt Crinklaw-Vogt
*###
define(["common/EventEmitter",
		"common/collections/LinkedList"],
(EventEmitter, LinkedList) ->
	###*
	* Maintains a list of commands in an undo history.
	* Drops commands when they should no longer be reachable
	* via standard undo/redo semantics.
	* @class model.common_application.UndoHistory
	* @constructor
	* @param {Integer} size Number of commands/actions to remember
	*###
	class UndoHistory
		constructor: (@size) ->
			@actions = new LinkedList()
			@cursor = null
			@undoCount = 0
			_.extend(@, new EventEmitter())

		###*
		* Adds a new command to the undo history.
		* This re-sets the re-do history
		* @method push
		* @param {Command} command Command to be added to the history 
		*###
		push: (action) ->
			if (@actions.length - @undoCount) < @size
				if @undoCount > 0
					node =
						prev: null
						next: null
						value: action
					if not @cursor
						@actions.head = node
						@actions.tail = node
						@actions.length = 1
					else
						node.prev = @cursor
						@cursor.next.prev = null
						@cursor.next = node
						@actions.length += 1
						@actions.length = (@actions.length - @undoCount)
					@undoCount = 0
					@cursor = null
				else
					@actions.push(action)
			else
				@actions.shift()
				@actions.push(action)

			@emit("updated")
			@

		###*
		* This is useful for telling the user what command would be undone
		* if they pressed undo.
		* @method undoName
		* @returns {String} name of the next command to be undone
		*###
		undoName: () ->
			if @undoCount < @actions.length
				node = @cursor || @actions.tail
				if node?
					node.value.name
				else
					""
			else
				""

		###*
		* This is useful for telling the user what command would be
		* redone if they pressed redo
		* @method redoName
		* @returns {String} name of the next command to be redone
		*###
		redoName: () ->
			if @undoCount > 0
				if not @cursor?
					node = @actions.head
				else
					node = @cursor.next
				if node?
					node.value.name
				else
					""
			else
				""

		###*
		* Undoes a command
		* @method undo
		* @returns {model.common_application.UndoHistory} this
		*###
		undo: () ->
			if @undoCount < @actions.length
				if not @cursor?
					@cursor = @actions.tail
			
				@cursor.value.undo()
				@cursor = @cursor.prev
				++@undoCount
				@emit("updated")
			@

		###*
		* Redoes a command
		* @method redo
		* @returns {model.common_application.UndoHistory} this
		*###
		redo: () ->
			if @undoCount > 0
				if not @cursor?
					@cursor = @actions.head
				else
					@cursor = @cursor.next

				@cursor.value.do()
				--@undoCount
				@emit("updated")
			@

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