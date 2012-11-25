
/*
@author Matt Crinklaw-Vogt
*/


(function() {

  define(["common/MapResolver"], function(MapResolver) {
    var iface, stateMap;
    stateMap = {
      editor: {
        slideEditor: {
          buttonBar: {
            fontSize: 72,
            fontFamily: "'Lato', sans-serif",
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

}).call(this);
