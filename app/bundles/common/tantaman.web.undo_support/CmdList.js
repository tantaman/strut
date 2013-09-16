define([
  "common/EventEmitter",
  "common/collections/LinkedList",
  "./Commands"],
  function (EventEmitter, LinkedList, Commands) {

    /**
     * Maintains a list of commands in an undo history. Drops commands when they should no longer be reachable via
     * standard undo/redo semantics.
     *
     * @class UndoHistory
     * @param {Integer} size Number of commands/actions to remember.
     */
    var UndoHistory = (function () {

      function UndoHistory(size) {
        this.size = size;
        this.actions = new LinkedList();
        this.cursor = null;
        this.recording = false;
        this.undoCount = 0;
        _.extend(this, new EventEmitter());
      }

      /**
       * Clears undo history.
       *
       * @method clear
       */
      UndoHistory.prototype.clear = function () {
        this.cursor = null;
        this.undoCount = null;
        this.actions = new LinkedList();
      };

      /**
       * Adds a new command to the undo history. This re-sets the re-do history.
       *
       * @param {Command} command Command to be added to the history
       */
      UndoHistory.prototype.push = function (command) {
        if (this.recording) {
          this.recorded.push(command);
        }
        else {
          var node;
          if ((this.actions.length - this.undoCount) < this.size) {
            if (this.undoCount > 0) {
              node = {
                prev: null,
                next: null,
                value: command
              };
              if (!this.cursor) {
                this.actions.head = node;
                this.actions.length = 1;
              } else {
                node.prev = this.cursor;
                this.cursor.next.prev = null;
                this.cursor.next = node;
                this.actions.length += 1;
                this.actions.length = this.actions.length - this.undoCount;
              }
              this.actions.tail = node;
              this.undoCount = 0;
              this.cursor = null;
            } else {
              this.actions.push(command);
              this.cursor = null;
            }
          } else {
            this.actions.shift();
            this.actions.push(command);
          }
          this.emit("updated");
          return this;
        }
      };

      /**
       * Alias for executing "do" and "push".
       *
       * @param {*} command
       * @returns {*} Results of "do".
       */
      UndoHistory.prototype.pushdo = function (command) {
        if (this.recording) {
          this.recorded.push(command);
        }
        else {
          var result = command.do();
          this.push(command);
          return result;
        }
      };

      /**
       * Alias for executing "do" and "push".
       *
       * @param {Command} command
       * @returns {*} Results of "do".
       */
      UndoHistory.prototype.record = function (callback, name) {
        this.recording = true;
        this.recorded = [];
        callback();
        this.recording = false;

				if (this.recorded.length) {
					var cmd = new Commands.CombinedCommand(this.recorded, name);
					this.push(cmd);
					return cmd;
				}
      };

      /**
       * This is useful for telling the user what command would be undone if they pressed undo.
       *
       * @returns {string} Name of the next command to be undone.
       */
      UndoHistory.prototype.undoName = function () {
        var node;
        if (this.undoCount < this.actions.length) {
          node = this.cursor || this.actions.tail;
          if (node != null) {
            return node.value.name;
          } else {
            return "";
          }
        } else {
          return "";
        }
      };

      /**
       * This is useful for telling the user what command would be redone if they pressed redo.
       *
       * @returns {string} Name of the next command to be redone.
       */
      UndoHistory.prototype.redoName = function () {
        var node;
        if (this.undoCount > 0) {
          if (!(this.cursor != null)) {
            node = this.actions.head;
          } else {
            node = this.cursor.next;
          }
          if (node != null) {
            return node.value.name;
          } else {
            return "";
          }
        } else {
          return "";
        }
      };

      /**
       * Undoes a command.
       *
       * @returns UndoHistory this
       */
      UndoHistory.prototype.undo = function () {
        if (this.undoCount < this.actions.length) {
          if (!(this.cursor != null)) {
            this.cursor = this.actions.tail;
          }
          this.cursor.value.undo();
          this.cursor = this.cursor.prev;
          ++this.undoCount;
          this.emit("updated");
        }
        return this;
      };

      /**
       * Redoes a command.
       *
       * @returns UndoHistory this
       */
      UndoHistory.prototype.redo = function () {
        if (this.undoCount > 0) {
          if (!(this.cursor != null)) {
            this.cursor = this.actions.head;
          } else {
            this.cursor = this.cursor.next;
          }
          this.cursor.value["do"]();
          --this.undoCount;
          this.emit("updated");
        }
        return this;
      };

      return UndoHistory;

    })();
    return UndoHistory;
  });