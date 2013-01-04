( function(Dataflow) {
 
  var library = $('<ul class="dataflow-plugin-library" style="list-style:none; padding-left:0" />');

  var exclude = ["base", "base-resizable"];

  var overlap = function(x, y) {
    function sep(a, b, e) { return Math.abs(a - b) < e; }

    return Dataflow.currentGraph.nodes.some(function(node) {
      return sep(x, node.attributes.x, 25) && sep(y, node.attributes.y, 25);
    });
  }

  var addNode = function(node, x, y) {
    return function(){
      // Deselect others
      Dataflow.currentGraph.view.$(".node").removeClass("ui-selected");
      // Find vacant id
      var id = 1;
      while (Dataflow.currentGraph.nodes.get(id)){
        id++;
      }
      // Position
      if (x===undefined || y === undefined) {
        x = window.scrollX - 100 + Math.floor($(window).width()/2);
        y = window.scrollY - 100 + Math.floor($(window).height()/2);

        while(overlap(x, y))
          x += 50, y += 50;
      }

      // Add node
      var newNode = new node.Model({
        id: id,
        x: x,
        y: y,
        parentGraph: Dataflow.currentGraph
      });
      Dataflow.currentGraph.nodes.add(newNode);
      // Select and bring to top
      newNode.view.select();
    };
  };

  _.each(Dataflow.nodes, function(node, index){
    if (exclude.indexOf(index) === -1) {
      var addButton = $('<a class="button">+</a>')
        .attr("title", "click or drag")
        .draggable({
          helper: function(){
            return $('<div class="node helper" style="width:100px; height:100px">'+index+'</div>');
          },
          stop: function(event, ui) {
            addNode(node, ui.position.left, ui.position.top).call();
          }
        })
        .click(addNode(node));
      var item = $("<li />")
        .append(addButton)
        .append(index);
        // .append(drag);
      library.append(item);
    }
  });

  Dataflow.addPlugin("library", library);

}(Dataflow) );
