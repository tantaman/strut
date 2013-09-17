define(function() {
  var CombinedCommand;

  /**
   * Special kind of command, which allows to pack several commands into single undo/redo item.
   *
   * @class CombinedCommand
   * @param {*} command
   * @param {string} name Name of the command (will be shown in undo history and undo/redo hints).
   */
  CombinedCommand = function(commands, name) {
    this.commands = commands;
    this.name = name;
  };
  CombinedCommand.prototype = {
    "do": function() {
      this.commands.forEach(function(command){
        command.do();
      });
    },
    undo: function() {
      this.commands.reverse().forEach(function(command){
        command.undo();
      });
    }
  };

  return {
    CombinedCommand: CombinedCommand,
  };
});