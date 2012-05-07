/*
@author Matt Crinklaw-Vogt
*/
define(["common/MapResolver"], function(MapResolver) {
  var iface, stateMap;
  stateMap = {
    editor: {
      slideEditor: {
        buttonBar: {
          fontSize: 72,
          fontFamily: "Calibri",
          fontColor: "grey",
          fontStyle: "",
          fontWeight: ""
        }
      }
    }
  };
  return iface = {
    get: function(key) {
      return MapResolver.resolveItem(stateMap, key);
    }
  };
});
