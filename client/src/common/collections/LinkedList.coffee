###
@author Matt Crinklaw-Vogt
###
define(() ->
	class LinkedList
		constructor: () ->
			@head = @tail = null
			@length = 0

		push: (value) ->
			newNode =
				prev: null
				next: null
				value: value

			if @tail?
				@tail.next = newNode
				newNode.prev = @tail
				@tail = newNode
			else
				@head = @tail = newNode

			++@length

			@

		pop: () ->
			if not @tail?
				throw "List is empty"

			value = @tail.value
			if @tail is @head
				@tail = @head = null
			else
				@tail = @tail.prev
				@tail.next = null

			--@length

			value

		shift: () ->
			if not @head?
				throw "List is empty"

			value = @head.value
			if @tail is @head
				@tail = @head = null
			else
				@head = @head.next
				@head.prev = null

			--@length

			value

		unshift: (value) ->
			newNode =
				prev: null
				next: null
				value: value

			if @head?
				@head.prev = newNode
				newNode.next = @head
				@head = newNode
			else
				@head = @tail = newNode

			++@length

			@

		first: () ->
			@head.value

		last: () ->
			@tail.value

		forEach: (cb) ->
			cursor = @head
			idx = 0
			while (cursor isnt null)
				cb(cursor.value, idx++, @)
				cursor = cursor.next
)