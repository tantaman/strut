/*
@author Tantaman
*/
define(["./Image", "./Table", "./TextBox"], function(Image, Table, TextBox) {
  var ComponentFactory;
  return ComponentFactory = {
    createTextBox: function(configuration) {
      return new TextBox(configuration);
    },
    createImage: function(configuration) {
      return new Image(configuration);
    }
  };
});
