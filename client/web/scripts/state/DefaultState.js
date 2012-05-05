
define(["common/MapResolver"], function(MapResolver) {
  var interface, stateMap;
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
  return interface = {
    get: function(key) {
      return MapResolver.resolveItem(stateMap, key);
    }
  };
});
