define(function() {
    /**
    	* Provides a linked list implementation
    	* @class common.collections.LinkedList
    	*
    */

    var LinkedList;
    return LinkedList = (function() {

      function LinkedList() {
        this.head = this.tail = null;
        this.length = 0;
      }

      LinkedList.prototype.push = function(value) {
        var newNode;
        newNode = {
          prev: null,
          next: null,
          value: value
        };
        if (this.tail != null) {
          this.tail.next = newNode;
          newNode.prev = this.tail;
          this.tail = newNode;
        } else {
          this.head = this.tail = newNode;
        }
        ++this.length;
        return this;
      };

      LinkedList.prototype.pop = function() {
        var value;
        if (!(this.tail != null)) {
          throw "List is empty";
        }
        value = this.tail.value;
        if (this.tail === this.head) {
          this.tail = this.head = null;
        } else {
          this.tail = this.tail.prev;
          this.tail.next = null;
        }
        --this.length;
        return value;
      };

      LinkedList.prototype.shift = function() {
        var value;
        if (!(this.head != null)) {
          throw "List is empty";
        }
        value = this.head.value;
        if (this.tail === this.head) {
          this.tail = this.head = null;
        } else {
          this.head = this.head.next;
          this.head.prev = null;
        }
        --this.length;
        return value;
      };

      LinkedList.prototype.unshift = function(value) {
        var newNode;
        newNode = {
          prev: null,
          next: null,
          value: value
        };
        if (this.head != null) {
          this.head.prev = newNode;
          newNode.next = this.head;
          this.head = newNode;
        } else {
          this.head = this.tail = newNode;
        }
        ++this.length;
        return this;
      };

      LinkedList.prototype.first = function() {
        return this.head.value;
      };

      LinkedList.prototype.last = function() {
        return this.tail.value;
      };

      LinkedList.prototype.forEach = function(cb) {
        var cursor, idx, _results;
        cursor = this.head;
        idx = 0;
        _results = [];
        while (cursor !== null) {
          cb(cursor.value, idx++, this);
          _results.push(cursor = cursor.next);
        }
        return _results;
      };

      return LinkedList;

    })();
  });