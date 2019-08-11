var _ = require("lodash/array");
var elementTools = require("../util/elementTools")();

module.exports = function (){
  var pap = {},
    enabled = false,
    pinnedElements = [];
  
  pap.addPinnedElement = function ( element ){
    // check if element is already in list
    var indexInArray = pinnedElements.indexOf(element);
    if ( indexInArray === -1 ) {
      pinnedElements.push(element);
    }
  };
  
  pap.handle = function ( selection, forced ){
    if ( !enabled ) {
      // FinanceIT@CSE: do my magic here.
      if (elementTools.isNode(selection)) {
        var iri = selection.iri();
        console.log("please load items related to " + iri);

        var bgloadUrl = "data/load?iri=" + encodeURIComponent(iri);
        d3.xhr(bgloadUrl, "application/text", function ( error, request ){
          if (error) {
            console.log("Error loading data using " + bgloadUrl);
          } else {
            // Server should return us a JSON file name (without the extension)
            // which we will use as the new fragment of the URL, which in turn
            // causes a refresh of the graph.
            var file_json = request.responseText;
            console.log("Response from loading data is " + file_json);
          }
        });
      }
      return;
    }
    
    if ( !forced ) {
      if ( wasNotDragged() ) {
        return;
      }
    }
    if ( elementTools.isProperty(selection) ) {
      if ( selection.inverse() && selection.inverse().pinned() ) {
        return;
      } else if ( hasNoParallelProperties(selection) ) {
        return;
      }
    }
    
    if ( !selection.pinned() ) {
      selection.drawPin();
      pap.addPinnedElement(selection);
    }
  };
  
  function wasNotDragged(){
    return !d3.event.defaultPrevented;
  }
  
  function hasNoParallelProperties( property ){
    return _.intersection(property.domain().links(), property.range().links()).length === 1;
  }
  
  pap.enabled = function ( p ){
    if ( !arguments.length ) return enabled;
    enabled = p;
    return pap;
  };
  
  pap.reset = function (){
    pinnedElements.forEach(function ( element ){
      element.removePin();
    });
    // Clear the array of stored nodes
    pinnedElements.length = 0;
  };
  
  return pap;
};
