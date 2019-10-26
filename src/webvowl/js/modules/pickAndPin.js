var _ = require("lodash/array");
var elementTools = require("../util/elementTools")();

module.exports = function (){
  var pap = {},
    enabled = false,
    pinnedElements = [],
    navTargetIri = null;

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
        let iri = selection.iri();
        if (navTargetIri !== iri) {
          // Selected something different, so do NOT navigate, but change target to this.
          navTargetIri = iri;
          console.log("Click the same node again to navigate to " + navTargetIri);
        } else {
          // Select the same node again, so navigate to it, and clear navTargetIri for next sequence.
          navTargetIri = null;
          console.log("Navigating to " + iri);
          let bgloadUrl = "data/load?iri=" + encodeURIComponent(iri);
          d3.xhr(bgloadUrl, "text/plain", function ( error, request ) {
            if (error) {
              console.log("Error loading data using " + bgloadUrl);
            } else {
              // Server should return us a JSON file name (without the extension)
              // which we will use as the new fragment of the URL, which in turn
              // causes a refresh of the graph.
              let file_json = request.responseText;
              console.log("Response from loading data is " + file_json);

              // Santy check, require file name to be less than 20 characters in case
              // something other than the expected is returned.
              if (file_json && file_json.length < 20) {
                location.hash = encodeURIComponent(file_json);
              } else if (file_json === "") {
                // Indicates no result for the selected entity.
                window.alert("No results for\n\n" + iri);
              }
            }
          });
        }
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
