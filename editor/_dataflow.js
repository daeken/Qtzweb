/*! dataflow.js - v0.0.1 - 2013-01-02 (11:45:33 PM EST)
* https://github.com/meemoo/dataflow
* Copyright (c) 2013 Forrest Oliphant; Licensed MIT, GPL */

// Structure with guidance from http://weblog.bocoup.com/organizing-your-backbone-js-application-with-modules/

(function(){
  var App = Backbone.Model.extend({
    // "$el": $("#app"),
    "$": function(query) {
      return this.$el.children(query);
    },
    initialize: function(q){
      this.el = document.createElement("div");
      this.el.className = "dataflow";
      this.$el = $(this.el);
      this.$el.append('<div class="plugins"/>');
      this.$el.append('<div class="navigation"/>');
    },
    // Create the object to contain the modules
    modules: {},
    module: function(name) {
      // Create a new module reference scaffold or load an existing module.
      // If this module has already been created, return it.
      if (this.modules[name]) {
        return this.modules[name];
      }
      // Create a module scaffold and save it under this name
      return this.modules[name] = {};
    },
    // Create the object to contain the nodes
    nodes: {},
    node: function(name) {
      // Create a new node reference scaffold or load an existing node.
      // If this node has already been created, return it.
      if (this.nodes[name]) {
        return this.nodes[name];
      }
      // Create a node scaffold and save it under this name
      return this.nodes[name] = {};
    },
    addPlugin: function(name, html) {
      var title = $('<h1 />')
        .text(name)
        .click(function(){
          $(this).next().toggle();
        });
      var section = $('<div />')
        .html(html)
        .hide();
      this.$(".plugins")
        .append(title)
        .append(section);
    },
    loadGraph: function(source) {
      if (this.graph) {
        if (this.currentGraph.view) {
          this.currentGraph.view.remove();
        }
        if (this.graph.view) {
          this.graph.view.remove();
        }
        this.graph.remove();
      }
      var Graph = this.module("graph");
      var newGraph = new Graph.Model(source);
      newGraph.view = new Graph.View({model: newGraph});
      this.$el.append(newGraph.view.render().el);

      // For debugging
      this.graph = this.currentGraph = newGraph;

      return newGraph;
    },
    showGraph: function(graph){
      // Hide current
      this.currentGraph.view.$el.detach();
      // Show new
      this.$el.append(graph.view.el);
      graph.view.render();
      this.currentGraph = graph;
    },
    debug: false,
    log: function(message) {
      this.trigger("log", message, arguments);
      if (this.debug) {
        console.log("Dataflow: ", arguments);
      }
    },
    types: [
      "all",
      "canvas:2d",
      "canvas:webgl",
      "string",
      "number",
      "int",
      "object",
      "array"
    ]
  });

  // Our global
  window.Dataflow = new App();

  // Append main el to page body when ready
  jQuery(function($) {
    $('body').append(Dataflow.el);
  });

  // Backbone hacks
  // Discussed here http://stackoverflow.com/a/13075845/592125
  Backbone.View.prototype.addEvents = function(events) {
    this.delegateEvents( _.extend(_.clone(this.events), events) );
  };

  // Simple collection view
  Backbone.CollectionView = Backbone.Model.extend({
    // this.tagName and this.itemView should be set
    initialize: function(){
      this.el = document.createElement(this.tagName);
      this.$el = $(this.el);
      var collection = this.get("collection");
      collection.each(this.addItem, this);
      collection.on("add", this.addItem, this);
      collection.on("remove", this.removeItem, this);
    },
    addItem: function(item){
      item.view = new this.itemView({model:item});
      this.$el.append(item.view.render().el);
    },
    removeItem: function(item){
      item.view.remove();
    }
  });

}());

// All code has been downloaded and evaluated and app is ready to be initialized.
jQuery(function($) {

  // Router
  var DataflowRouter = Backbone.Router.extend({
    routes: {
      "": "index"
    },
    index: function() {

    }
  });
  Dataflow.router = new DataflowRouter();
  Backbone.history.start();

});

(function(Graph) {
 
  // Dependencies
  var Node = Dataflow.module("node");
  var Edge = Dataflow.module("edge");

  Graph.Model = Backbone.Model.extend({
    defaults: {
      nodes: [],
      edges: []
    },
    initialize: function() {
      var i;

      // Set up nodes 
      var nodes = this.nodes = new Node.Collection();
      nodes.parentGraph = this;
      // Node events
      nodes.on("all", function(){
        this.trigger("change");
      }, this);
      nodes.on("add", function(node){
        Dataflow.trigger("node:add", this, node);
      }, this);
      nodes.on("remove", function(node){
        // Remove related edges and unload running processes if defined
        node.remove();
        Dataflow.trigger("node:remove", this, node);
      }, this);
      // Convert nodes array to backbone collection
      var nodesArray = this.get("nodes");
      for(i=0; i<nodesArray.length; i++) {
        var node = nodesArray[i];
        node.parentGraph = this;
        if (node.type && Dataflow.nodes[node.type]) {
          node = new Dataflow.nodes[node.type].Model(node);
          nodes.add(node);
        } else {
          Dataflow.log("node "+node.id+" not added: node type ("+node.type+") not found", node);
        }
      }

      // Set up edges
      var edges = this.edges = new Edge.Collection();
      edges.parentGraph = this;
      // Edge events
      edges.on("all", function(){
        this.trigger("change");
      }, this);
      edges.on("add", function(edge){
        Dataflow.trigger("edge:add", this, edge);
      }, this);
      edges.on("remove", function(edge){
        Dataflow.trigger("edge:remove", this, edge);
      }, this);
      // Convert edges array to backbone collection
      var edgesArray = this.get("edges");
      for(i=0; i<edgesArray.length; i++) {
        var edge = edgesArray[i];
        edge.parentGraph = this;
        edge.id = edge.source.node+":"+edge.source.port+"→"+edge.target.node+":"+edge.target.port;
        // Check that nodes and ports exist
        var sourceNode = nodes.get(edge.source.node);
        var targetNode = nodes.get(edge.target.node);
        if (sourceNode && targetNode && sourceNode.outputs.get(edge.source.port) && targetNode.inputs.get(edge.target.port)) {
          edge = new Edge.Model(edge);
          edges.add(edge);
        } else {
          Dataflow.log("edge "+edge.id+" not added: node or port not found", edge);
        }
      }
      // Attach collections to graph
      this.set({
        nodes: nodes,
        edges: edges
      });

      // Pass events up to Dataflow global
      this.on("change", function(){
        Dataflow.trigger("change", this);
      }, this);
    },
    remove: function(){
      while(this.nodes.length > 0){
        this.nodes.remove(this.nodes.at(this.nodes.length-1));
      }
    },
    toJSON: function(){
      return {
        nodes: this.nodes,
        edges: this.edges
      };
    }
  });

}(Dataflow.module("graph")) );

/*
*   NOTE: this has nothing to do with server-side Node.js (so far at least)
*/

( function(Node) {
 
  // Dependencies
  var Input = Dataflow.module("input");
  var Output = Dataflow.module("output");

  Node.Model = Backbone.Model.extend({
    defaults: {
      label: "",
      type: "test",
      x: 200,
      y: 100
    },
    initialize: function() {
      this.parentGraph = this.get("parentGraph");
      this.type = this.get("type");

      // Default label to type
      if (this.get("label")===""){
        this.set({
          "label": this.get("type")
        });
      }

      // Convert inputs array to backbone collection
      var inputArray = this.inputs;
      this.inputs = new Input.Collection();
      this.inputs.parentNode = this;
      for(var i=0; i<inputArray.length; i++) {
        var input = inputArray[i];
        input.parentNode = this;
        input = new Input.Model(input);
        this.inputs.add(input);
      }

      // Convert outputs array to backbone collection
      var outputArray = this.outputs;
      this.outputs = new Input.Collection();
      this.outputs.parentNode = this;
      for(i=0; i<outputArray.length; i++) {
        var output = outputArray[i];
        output.parentNode = this;
        output = new Input.Model(output);
        this.outputs.add(output);
      }

    },
    remove: function(){
      // Node removed from graph's nodes collection
      // Remove related edges
      var relatedEdges = this.parentGraph.edges.filter(function(edge){
        // Find connected edges
        return edge.isConnectedToNode(this);
      }, this);
      for (var i=0; i<relatedEdges.length; i++) {
        // Remove connected edges
        var edge = relatedEdges[i];
        edge.collection.remove(edge);
      }
      this.unload();
    },
    unload: function(){
      // Stop any processes that need to be stopped
    },
    toString: function(){
      return this.id + " ("+this.type+")";
    },
    toJSON: function(){
      return {
        id: this.get("id"),
        label: this.get("label"),
        type: this.get("type"),
        x: this.get("x"),
        y: this.get("y")
      };
    },
    inputs:[
      // {
      //   id: "input",
      //   type: "all"
      // }
    ],
    outputs:[
      // {
      //   id:"output",
      //   type: "all"
      // }
    ]
  });

  Node.Collection = Backbone.Collection.extend({
    model: Node.Model,
    comparator: function(node) {
      // Sort nodes by x position
      return node.get("x");
    }
  });

}(Dataflow.module("node")) );

( function(Input) {
 
  Input.Model = Backbone.Model.extend({
    defaults: {
      id: "input",
      label: "",
      type: "all"
    },
    initialize: function() {
      this.parentNode = this.get("parentNode");
      if (this.get("label")===""){
        this.set({label: this.id});
      }
    },
    remove: function(){
      // Port removed from node's inputs collection
      // Remove related edges
      var relatedEdges = this.parentNode.parentGraph.edges.filter(function(edge){
        // Find connected edges
        return edge.isConnectedToPort(this);
      }, this);
      _.each(relatedEdges, function(edge){
        edge.collection.remove(edge);
      }, this);
    }

  });

  Input.Collection = Backbone.Collection.extend({
    model: Input.Model
  });

}(Dataflow.module("input")) );

( function(Output) {
 
  Output.Model = Backbone.Model.extend({
    defaults: {
      id: "output",
      label: "",
      type: "all"
    },
    initialize: function() {
      this.parentNode = this.get("parentNode");
      if (this.get("label")===""){
        this.set({label: this.id});
      }
    },
    remove: function(){
      // Port removed from node's outputs collection
      // Remove related edges
      var relatedEdges = this.parentNode.parentGraph.edges.filter(function(edge){
        // Find connected edges
        return edge.isConnectedToPort(this);
      }, this);
      _.each(relatedEdges, function(edge){
        edge.collection.remove(edge);
      }, this);
    }

  });

  Output.Collection = Backbone.Collection.extend({
    model: Output.Model
  });

}(Dataflow.module("output")) );

( function(Edge) {
 
  // Dependencies

  Edge.Model = Backbone.Model.extend({
    initialize: function() {
      var nodes;
      var preview = this.get("preview");
      if (preview) {
        // Preview edge
        nodes = this.get("parentGraph").nodes;
        var source = this.get("source");
        var target = this.get("target");
        if (source) {
          this.source = nodes.get(this.get("source").node).outputs.get(this.get("source").port);
        } else if (target) {
          this.target = nodes.get(this.get("target").node).inputs.get(this.get("target").port);
        }
      } else {
        // Real edge
        this.parentGraph = this.get("parentGraph");
        nodes = this.parentGraph.nodes;
        try{
          this.source = nodes.get(this.get("source").node).outputs.get(this.get("source").port);
          this.target = nodes.get(this.get("target").node).inputs.get(this.get("target").port);
        }catch(e){
          Dataflow.log("node or port not found for edge", this);
        }
      }
    },
    isConnectedToPort: function(port) {
      return ( this.source === port || this.target === port );
    },
    isConnectedToNode: function(node) {
      return ( this.source.parentNode === node || this.target.parentNode === node );
    },
    toString: function(){
      return this.get("source").node+":"+this.get("source").port+"→"+this.get("target").node+":"+this.get("target").port;
    },
    toJSON: function(){
      return {
        source: this.get("source"),
        target: this.get("target")
      };
    }
  });

  Edge.Collection = Backbone.Collection.extend({
    model: Edge.Model
  });

}(Dataflow.module("edge")) );

(function(Graph) {
 
  var template = 
    '<div class="edges">'+
      '<svg class="svg-edges" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg" width="800" height="800">'+
        // '<defs>'+  
        //   '<filter id="drop-shadow" >'+ // FIXME Crops the edge when there is no slope
        //     '<feOffset in="SourceAlpha" result="the-shadow" dx="1" dy="1"/>'+
        //     '<feBlend in="SourceGraphic" in2="the-shadow" mode="normal" />'+
        //   '</filter>'+
        // '</defs>'+
      '</svg>'+
    '</div>'+
    '<div class="nodes" />'+
    '<div class="graph-controls" />';

  // Dependencies
  var Node = Dataflow.module("node");
  var Edge = Dataflow.module("edge");

  Graph.View = Backbone.View.extend({
    template: _.template(template),
    className: "graph",
    initialize: function() {
      // Graph container
      this.$el.html(this.template(this.model.toJSON()));

      var nodes = this.model.get("nodes");
      var edges = this.model.get("edges");

      // Initialize nodes
      this.nodes = nodes.view = {};
      this.model.nodes.each(this.addNode, this);
      this.model.nodes.on("add", this.addNode, this);
      this.model.nodes.on("remove", this.removeNode, this);
      // Initialize edges
      this.edges = edges.view = {};
      this.model.edges.each(this.addEdge, this);
      this.model.edges.on("add", this.addEdge, this);
      this.model.edges.on("remove", this.removeEdge, this);

      // For subgraphs only: breadcrumbs to navigate up
      var parentNode = this.model.get("parentNode");
      if (parentNode){
        // This subgraph's label
        this.$(".graph-controls")
          .text( parentNode.get("label") );

        // Buttons up
        var parentGraph, upButton, upLabel;
        var showGraph = function(graph) {
          return function () {
            Dataflow.showGraph(graph);
            return false;
          };
        };
        while(parentNode){
          parentGraph = parentNode.get("parentGraph");
          parentNode = parentGraph.get("parentNode");
          if (parentNode) {
            upLabel = parentNode.get("label");
          } else {
            upLabel = "main";
          }
          upButton = $('<a href="#">')
            .text( upLabel )
            .click( showGraph(parentGraph) );
          this.$(".graph-controls")
            .prepend(" / ")
            .prepend(upButton);
        }
      }
    },
    render: function() {
      // HACK to get them to show correct positions on load
      var self = this;
      _.defer(function(){
        self.rerenderEdges();
      }, this);

      return this;
    },
    addNode: function(node){
      // Initialize
      var CustomType = Dataflow.nodes[node.type];
      if (CustomType && CustomType.View) {
        node.view = new CustomType.View({model:node});
      } else {
        var BaseNode = Dataflow.node("base");
        node.view = new BaseNode.View({model:node});
      }
      // Save to local collection
      this.nodes[node.id] = node.view;
      // Render
      node.view.render();
      this.$(".nodes").append(node.view.el);
    },
    removeNode: function(node){
      node.view.remove();
      this.nodes[node.id] = null;
      delete this.nodes[node.id];
    },
    addEdge: function(edge){
      // Initialize
      edge.view = new Edge.View({model:edge});
      // Save to local collection
      this.edges[edge.id] = edge.view;
      // Render
      edge.view.render();
      this.$('.svg-edges')[0].appendChild(edge.view.el);
    },
    removeEdge: function(edge){
      edge.view.remove();
      this.edges[edge.id] = null;
      delete this.edges[edge.id];
    },
    rerenderEdges: function(){
      _.each(this.edges, function(edgeView){
        edgeView.render();
      }, this);
    },
    sizeSVG: function(){
      // TODO timeout to not do this with many edge resizes at once
      try{
        var svg = this.$('.svg-edges')[0];
        var rect = svg.getBBox();
        svg.setAttribute("width", Math.round(rect.x+rect.width+50));
        svg.setAttribute("height", Math.round(rect.y+rect.height+50));
      } catch (error) {}
    }
  });

}(Dataflow.module("graph")) );

( function(Node) {

  var template = 
    '<div class="outer" />'+
    '<h1 class="title"><%- id %>: <span class="label"><%- label %></span> <input class="label-edit" value="<%- label %>" type="text" /></h1>'+
    '<div class="controls">'+
      '<button class="delete">delete</button>'+
      '<button class="save">save</button>'+
      '<button class="cancel">cancel</button>'+
    '</div>'+
    '<button class="edit">edit</button>'+
    '<div class="ports ins" />'+
    '<div class="ports outs" />'+
    '<div class="inner" />';

  var innerTemplate = "";

  // Dependencies
  var Input = Dataflow.module("input");
  var Output = Dataflow.module("output");
 
  Node.View = Backbone.View.extend({
    template: _.template(template),
    innerTemplate: _.template(innerTemplate),
    className: "node",
    events: function(){
      return {
        "click .title": "select",
        "click .delete": "removeModel",
        "dragstart":     "dragStart",
        "drag":          "drag",
        "dragstop":      "dragStop",
        "click .edit":   "showControls",
        "click .cancel": "hideControls",
        "click .save":   "saveLabel"
      };
    },
    initialize: function() {
      this.$el.html(this.template(this.model.toJSON()));

      // Add type class
      this.$el.addClass(this.model.type);

      // Initialize i/o views
      this.inputs = this.model.inputs.view = new Input.CollectionView({
        collection: this.model.inputs
      });
      // Outs
      this.outputs = this.model.outputs.view = new Output.CollectionView({
        collection: this.model.outputs
      });

      var self = this;
      this.$el.draggable({
        handle: "h1",
        // helper: "node helper"
        helper: function(){
          var node = self.$el;
          var width = node.width();
          var height = node.height();
          return $('<div class="node helper" style="width:'+width+'px; height:'+height+'px">');
        }
      });

      this.$el.data("dataflow-node-view", this);

      // Inner template
      this.$(".inner").append(this.innerTemplate);
    },
    render: function() {
      // Initial position
      this.$el.css({
        left: this.model.get("x"),
        top: this.model.get("y")
      });

      this.$(".ins").html(this.inputs.el);
      this.$(".outs").html(this.outputs.el);

      // Hide controls
      this.$(".controls").hide();
      this.$(".title .label-edit").hide();

      return this;
    },
    _alsoDrag: [],
    _dragDelta: {},
    dragStart: function(event, ui){
      // Select this
      if (!this.$el.hasClass("ui-selected")){
        this.select(event);
      }

      // Make helper and save start position of all other selected
      var self = this;
      this._alsoDrag = [];
      this.model.parentGraph.view.$(".ui-selected").each(function() {
        if (self.el !== this) {
          var el = $(this);
          var position = {
            left: parseInt(el.css('left'), 10), 
            top: parseInt(el.css('top'), 10)
          };
          el.data("ui-draggable-alsodrag-initial", position);
          // Add helper
          var helper = $('<div class="node helper">').css({
            width: el.width(),
            height: el.height(),
            left: position.left,
            top: position.top
          });
          el.parent().append(helper);
          el.data("ui-draggable-alsodrag-helper", helper);
          // Add to array
          self._alsoDrag.push(el);
        }
      });
    },
    drag: function(event, ui){
      // Drag other helpers
      if (this._alsoDrag.length) {
        var self = $(event.target).data("draggable");
        var op = self.originalPosition;
        var delta = {
          top: (self.position.top - op.top) || 0, 
          left: (self.position.left - op.left) || 0
        };

        _.each(this._alsoDrag, function(el){
          var initial = el.data("ui-draggable-alsodrag-initial");
          var helper = el.data("ui-draggable-alsodrag-helper");
          helper.css({
            left: initial.left + delta.left,
            top: initial.top + delta.top
          });
        });
      }
    },
    dragStop: function(event, ui){
      var x = parseInt(ui.position.left, 10);
      var y = parseInt(ui.position.top, 10);
      this.moveToPosition(x,y);
      // Also drag
      if (this._alsoDrag.length) {
        _.each(this._alsoDrag, function(el){
          var initial = el.data("ui-draggable-alsodrag-initial");
          var helper = el.data("ui-draggable-alsodrag-helper");
          var node = el.data("dataflow-node-view");
          // Move other node
          node.moveToPosition(parseInt(helper.css("left"), 10), parseInt(helper.css("top"), 10));
          // Remove helper
          helper.remove();
          el.data("ui-draggable-alsodrag-initial", null);
          el.data("ui-draggable-alsodrag-helper", null);
        });
        this._alsoDrag = [];
      }
    },
    moveToPosition: function(x, y){
      this.$el.css({
        left: x,
        top: y
      });
      this.model.set({
        x: x,
        y: y
      });
    },
    showControls: function(){
      // Show label edit
      this.$(".title .label").hide();
      this.$(".title .label-edit").show();
      // Show controls
      this.$(".edit").hide();
      this.$(".controls").show();
    },
    hideControls: function(){
      // Hide label edit
      this.$(".title .label-edit").hide();
      this.$(".title .label").show();
      // Hide controls
      this.$(".controls").hide();
      this.$(".edit").show();
    },
    saveLabel: function(){
      // Save new label
      var newLabel = this.$(".title .label-edit").val();
      if (this.model.get("label") !== newLabel) {
        this.model.set("label", newLabel);
        this.$(".title .label").text(newLabel);
      }
      this.hideControls();
    },
    removeModel: function(){
      this.model.collection.remove(this.model);
    },
    select: function(event){
      if (event) {
        // Called from click
        if (event.ctrlKey || event.metaKey) {
          // Command key is pressed, toggle selection
          this.$el.toggleClass("ui-selected");
        } else {
          // Command key isn't pressed, deselect others and select this one
          this.model.parentGraph.view.$(".ui-selected").removeClass("ui-selected");
          this.$el.addClass("ui-selected");
        }
        // Bring to top
        var topZ = 0;
        this.model.collection.each(function(node){
          var thisZ = parseInt(node.view.el.style.zIndex, 10);
          if (thisZ > topZ) {
            topZ = thisZ;
          }
        }, this);
        this.el.style.zIndex = topZ+1;
      } else {
        // Called from code
        this.$el.addClass("ui-selected");
      }
    }
  });

}(Dataflow.module("node")) );

( function(Input) {

  var Edge = Dataflow.module("edge");

  var template = 
    '<span class="plug in" title="drag to edit wire"></span>'+ //i18n
    '<span class="hole in" title="drag to make new wire"></span>'+ //i18n
    '<span class="label in"><%= label %></span>';
 
  Input.View = Backbone.View.extend({
    template: _.template(template),
    tagName: "li",
    className: "port in",
    events: {
      "dragstart .hole":  "newEdgeStart",
      "drag      .hole":  "newEdgeDrag",
      "dragstop  .hole":  "newEdgeStop",
      "click     .plug":  "highlightEdge",
      "dragstart .plug":  "changeEdgeStart",
      "drag      .plug":  "changeEdgeDrag",
      "dragstop  .plug":  "changeEdgeStop",
      "drop":             "connectEdge"
    },
    initialize: function() {
      this.$el.html(this.template(this.model.toJSON()));
      this.$el.addClass(this.model.get("type"));
      var self = this;
      this.$(".plug").draggable({
        helper: function(){
          return $('<span class="plug in helper" />');
        },
        disabled: true
      });
      this.$(".hole").draggable({
        helper: function(){
          return $('<span class="plug out helper" />')
            .data({port: self.model});
        }
      });
      this.$el.droppable({
        accept: ".plug.in, .hole.out",
        activeClassType: "droppable-hover"
      });
    },
    render: function(){
      return this;
    },
    newEdgeStart: function(event, ui){
      // Don't drag node
      event.stopPropagation();
      this.previewEdgeNew = new Edge.Model({
        target: {
          node: this.model.parentNode.id,
          port: this.model.id
        },
        parentGraph: this.model.parentNode.parentGraph,
        preview: true
      });
      this.previewEdgeNewView = new Edge.View({
        model: this.previewEdgeNew
      });
      var graphSVGElement = this.model.parentNode.parentGraph.view.$('.svg-edges')[0];
      graphSVGElement.appendChild(this.previewEdgeNewView.el);
    },
    newEdgeDrag: function(event, ui){
      // Don't drag node
      event.stopPropagation();
      this.previewEdgeNewView.render(ui.offset);
      this.model.parentNode.parentGraph.view.sizeSVG();
    },
    newEdgeStop: function(event, ui){
      // Don't drag node
      event.stopPropagation();

      // Clean up preview edge
      this.previewEdgeNewView.remove();
      delete this.previewEdgeNew;
      delete this.previewEdgeNewView;
    },
    highlightEdge: function() {
      if (this.isConnected){
      }
    },
    changeEdgeStart: function(event, ui){
      // Don't drag node
      event.stopPropagation();

      if (this.isConnected){
        var changeEdge = this.model.parentNode.parentGraph.edges.find(function(edge){
          return edge.target === this.model;
        }, this);
        if (changeEdge){
          this.changeEdge = changeEdge;
          this.changeEdge.view.fade();
          ui.helper.data({
            port: changeEdge.source
          });
          this.previewEdgeChange = new Edge.Model({
            source: changeEdge.get("source"),
            parentGraph: this.model.parentNode.parentGraph,
            preview: true
          });
          this.previewEdgeChangeView = new Edge.View({
            model: this.previewEdgeChange
          });
          var graphSVGElement = this.model.parentNode.parentGraph.view.$('.svg-edges')[0];
          graphSVGElement.appendChild(this.previewEdgeChangeView.el);
        }
      }
    },
    changeEdgeDrag: function(event, ui){
      // Don't drag node
      event.stopPropagation();
      
      if (this.previewEdgeChange) {
        this.previewEdgeChangeView.render(ui.offset);
        this.model.parentNode.parentGraph.view.sizeSVG();
      }
    },
    changeEdgeStop: function(event, ui){
      // Don't drag node
      event.stopPropagation();

      // Clean up preview edge
      if (this.previewEdgeChange) {
        this.previewEdgeChangeView.remove();
        if (this.changeEdge) {
          this.changeEdge.view.unfade();
          if (ui.helper.data("removeChangeEdge")){
            this.changeEdge.collection.remove(this.changeEdge);
          } else {
            //TODO delete edge confirm
          }
          this.changeEdge = null;
        }
        delete this.previewEdgeChange;
        delete this.previewEdgeChangeView;
      }
    },
    connectEdge: function(event, ui) {
      // Dropped to this el
      var otherPort = ui.helper.data("port");
      var oldLength = this.model.parentNode.parentGraph.edges.length;
      this.model.parentNode.parentGraph.edges.add({
        id: otherPort.parentNode.id+":"+otherPort.id+"→"+this.model.parentNode.id+":"+this.model.id,
        parentGraph: this.model.parentNode.parentGraph,
        source: {
          node: otherPort.parentNode.id,
          port: otherPort.id
        },
        target: {
          node: this.model.parentNode.id,
          port: this.model.id
        }
      });
      // Tells changeEdgeStop to remove to old edge
      ui.helper.data("removeChangeEdge", (oldLength < this.model.parentNode.parentGraph.edges.length));
    },
    holePosition: function(){
      return this.$(".hole").offset();
    },
    isConnected: false,
    plugSetActive: function(){
      this.$(".plug").draggable("enable");
      this.$(".plug").addClass("active");
      this.isConnected = true;
    },
    plugCheckActive: function(){
      var isConnected = this.model.parentNode.parentGraph.edges.some(function(edge){
        return (edge.target === this.model);
      }, this);
      if (!isConnected) {
        this.$(".plug").draggable("disable");
        this.$(".plug").removeClass("active");
        this.isConnected = false;
      }
    }
  });

  Input.CollectionView = Backbone.CollectionView.extend({
    tagName: "ul",
    itemView: Input.View
  }); 

}(Dataflow.module("input")) );

( function(Output) {

  var Edge = Dataflow.module("edge");
 
  var template = 
    '<span class="label out"><%= label %></span>'+
    '<span class="hole out" title="drag to make new wire"></span>'+
    '<span class="plug out" title="drag to edit wire"></span>';

  Output.View = Backbone.View.extend({
    template: _.template(template),
    tagName: "li",
    className: "port out",
    events: {
      "dragstart .hole":  "newEdgeStart",
      "drag .hole":       "newEdgeDrag",
      "dragstop .hole":   "newEdgeStop",
      "dragstart .plug":  "changeEdgeStart",
      "drag .plug":       "changeEdgeDrag",
      "dragstop .plug":   "changeEdgeStop",
      "drop":             "connectEdge"
    },
    initialize: function () {
      this.$el.html(this.template(this.model.toJSON()));
      this.$el.addClass(this.model.get("type"));
      var self = this;
      this.$(".plug").draggable({
        helper: function(){
          return $('<span class="plug out helper" />');
        },
        disabled: true
      });
      this.$(".hole").draggable({
        helper: function(){
          return $('<span class="plug in helper" />')
            .data({port: self.model});
        }
      });
      this.$el.droppable({
        accept: ".plug.out, .hole.in",
        activeClassType: "droppable-hover"
      });

      // this.model.parentNode.on("change:x change:y change:w", this.movedHole, this);
    },
    render: function () {
      return this;
    },
    newEdgeStart: function(event, ui){
      // Don't drag node
      event.stopPropagation();
      this.previewEdge = new Edge.Model({
        source: {
          node: this.model.parentNode.id,
          port: this.model.id
        },
        parentGraph: this.model.parentNode.parentGraph,
        preview: true
      });
      this.previewEdgeView = new Edge.View({
        model: this.previewEdge
      });
      var graphSVGElement = this.model.parentNode.parentGraph.view.$('.svg-edges')[0];
      graphSVGElement.appendChild(this.previewEdgeView.el);
    },
    newEdgeDrag: function(event, ui){
      // Don't drag node
      event.stopPropagation();
      this.previewEdgeView.render(ui.offset);
      this.model.parentNode.parentGraph.view.sizeSVG();
    },
    newEdgeStop: function(event, ui){
      // Don't drag node
      event.stopPropagation();

      // Clean up preview edge
      this.previewEdgeView.remove();
      delete this.previewEdge;
      delete this.previewEdgeView;
    },
    changeEdgeStart: function(event, ui){
      // Don't drag node
      event.stopPropagation();

      if (this.isConnected){
        var changeEdge = this.model.parentNode.parentGraph.edges.find(function(edge){
          return edge.source === this.model;
        }, this);
        if (changeEdge){
          this.changeEdge = changeEdge;
          this.changeEdge.view.fade();
          ui.helper.data({
            port: changeEdge.target
          });
          this.previewEdgeChange = new Edge.Model({
            target: changeEdge.get("target"),
            parentGraph: this.model.parentNode.parentGraph,
            preview: true
          });
          this.previewEdgeChangeView = new Edge.View({
            model: this.previewEdgeChange
          });
          var graphSVGElement = this.model.parentNode.parentGraph.view.$('.svg-edges')[0];
          graphSVGElement.appendChild(this.previewEdgeChangeView.el);
        }
      }
    },
    changeEdgeDrag: function(event, ui){
      // Don't drag node
      event.stopPropagation();

      if (this.previewEdgeChange) {
        this.previewEdgeChangeView.render(ui.offset);
        this.model.parentNode.parentGraph.view.sizeSVG();
      }
    },
    changeEdgeStop: function(event, ui){
      // Don't drag node
      event.stopPropagation();

      // Clean up preview edge
      if (this.previewEdgeChange) {
        this.previewEdgeChangeView.remove();
        if (this.changeEdge) {
          this.changeEdge.view.unfade();
          if (ui.helper.data("removeChangeEdge")){
            this.changeEdge.collection.remove(this.changeEdge);
          } else {
            //TODO delete edge confirm
          }
          this.changeEdge = null;
        }
        delete this.previewEdgeChange;
        delete this.previewEdgeChangeView;
      }
    },
    connectEdge: function(event, ui) {
      // Dropped to this el
      var otherPort = ui.helper.data("port");
      var oldLength = this.model.parentNode.parentGraph.edges.length;
      this.model.parentNode.parentGraph.edges.add({
        id: this.model.parentNode.id+":"+this.model.id+"→"+otherPort.parentNode.id+":"+otherPort.id,
        parentGraph: this.model.parentNode.parentGraph,
        source: {
          node: this.model.parentNode.id,
          port: this.model.id
        },
        target: {
          node: otherPort.parentNode.id,
          port: otherPort.id
        }
      });
      // Tells changeEdgeStop to remove to old edge
      ui.helper.data("removeChangeEdge", (oldLength < this.model.parentNode.parentGraph.edges.length));
    },
    // _holePosition: null,
    holePosition: function () {
      // if (!this._holePosition){
      //   this._holePosition = this.$(".hole").offset();
      // }
      // return this._holePosition;
      return this.$(".hole").offset();
    },
    // movedHole: function(){
    //   this._holePosition = null;
    // },
    plugSetActive: function(){
      this.$(".plug").draggable("enable");
      this.$(".plug").addClass("active");
      this.isConnected = true;
    },
    plugCheckActive: function(){
      var isConnected = this.model.parentNode.parentGraph.edges.some(function(edge){
        return (edge.source === this.model);
      }, this);
      if (!isConnected) {
        this.$(".plug").draggable("disable");
        this.$(".plug").removeClass("active");
        this.isConnected = false;
      }
    }
  });

  Output.CollectionView = Backbone.CollectionView.extend({
    tagName: "ul",
    itemView: Output.View
  }); 

}(Dataflow.module("output")) );

( function(Edge) {

  // Thanks bobince http://stackoverflow.com/a/3642265/592125
  var makeSvgElement = function(tag, attrs) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (var k in attrs) {
      if (k === "xlink:href") {
        // Pssh namespaces...
        svg.setAttributeNS('http://www.w3.org/1999/xlink','href', attrs[k]);
      } else {
        svg.setAttribute(k, attrs[k]);
      }
    }
    return svg;
  };
  
  Edge.View = Backbone.View.extend({
    tagName: "div",
    className: "edge",
    positions: null,
    initialize: function() {
      this.positions = {
        from: null, 
        to: null
      };
      // Render on source/target view move
      if (this.model.source) {
        this.model.source.parentNode.on("change:x change:y change:w", this.render, this);
        // this.model.source.parentNode.inputs.on("add remove", this.render, this);
        // this.model.source.parentNode.outputs.on("add remove", this.render, this);
      }
      if (this.model.target) {
        this.model.target.parentNode.on("change:x change:y", this.render, this);
      }
      // Set port plug active
      if (this.model.source) {
        this.model.source.view.plugSetActive();
      }
      if (this.model.target) {
        this.model.target.view.plugSetActive();
      }
      // Made SVG elements
      this.el = makeSvgElement("g", {
        "class": "edge"
      });
      this.elEdge = makeSvgElement("path", {
        "class": "edge-wire"
      });
      this.elShadow = makeSvgElement("path", {
        "class": "edge-shadow"
      });

      this.el.appendChild(this.elShadow);
      this.el.appendChild(this.elEdge);

      // Click handler
      var self = this;
      this.el.addEventListener("click", function(event){
        self.showEdit(event);
      });
    },
    render: function(previewPosition){
      var source = this.model.source;
      var target = this.model.target;
      if (source) {
        this.positions.from = source.view.holePosition();
      }
      else {
        // Preview 
        this.positions.from = previewPosition;
      }
      if (target) {
        this.positions.to = target.view.holePosition();
      } else {
        // Preview
        this.positions.to = previewPosition;
      }
      var pathD = this.edgePath(this.positions);
      this.elEdge.setAttribute("d", pathD);
      this.elShadow.setAttribute("d", pathD);
      // Bounding box
      if (this.model.parentGraph && this.model.parentGraph.view){
        this.model.parentGraph.view.sizeSVG();
      }
    },
    fade: function(){
      this.el.setAttribute("class", "edge fade");
    },
    unfade: function(){
      this.el.setAttribute("class", "edge");
    },
    highlight: function(){
      this.el.setAttribute("class", "edge highlight");
    },
    unhighlight: function(){
      this.el.setAttribute("class", "edge");
    },
    edgePath: function(positions){
      return "M " + positions.from.left + " " + positions.from.top + 
        " L " + (positions.from.left+50) + " " + positions.from.top +
        " L " + (positions.to.left-50) + " " + positions.to.top +
        " L " + positions.to.left + " " + positions.to.top;
    },
    remove: function(){
      var source = this.model.source;
      var target = this.model.target;
      // Remove listeners
      if (source) {
        source.parentNode.off(null, null, this);
      }
      if (target) {
        target.parentNode.off(null, null, this);
      }
      // Check if port plug is still active
      if (source) {
        source.view.plugCheckActive();
      }
      if (target) {
        target.view.plugCheckActive();
      }
      // Remove element
      this.el.parentNode.removeChild(this.el);
    },
    showEdit: function(event){
      // Hide others
      $(".modal-bg").remove();

      // Highlight
      this.highlight();
      this.bringToTop();

      // Show box 
      var self = this;
      var modalBox = $('<div class="modal-bg" style="width:'+$(document).width()+'px; height:'+$(document).height()+'px;" />')
        .click(function(){
          $(".modal-bg").remove();
          self.unhighlight();
        });
      var editBox = $('<div class="edge-edit-box" style="left:'+event.pageX+'px; top:'+event.pageY+'px;" />');
      editBox.append(this.model.id+"<br />");
      var deleteButton = $('<button>delete</button>')
        .click(function(){
          self.removeModel();
          $(".modal-bg").remove();
        });
      editBox.append(deleteButton);
      modalBox.append(editBox);
      this.model.parentGraph.view.$el.append(modalBox);
    },
    bringToTop: function(){
      var parent = this.el.parentNode;
      if(parent){
        parent.removeChild(this.el);
        parent.appendChild(this.el);
      }
    },
    removeModel: function(){
      this.model.collection.remove(this.model);
    }
  });

}(Dataflow.module("edge")) );

( function(Dataflow) {
 
  // Dependencies
  var Node = Dataflow.module("node");
  var Base = Dataflow.node("base");

  Base.Model = Node.Model.extend({
    defaults: {
      label: "",
      type: "base",
      x: 200,
      y: 100
    },
    initialize: function() {
      Node.Model.prototype.initialize.call(this);
    },
    unload: function(){
      // Stop any processes that need to be stopped
    },
    inputs:[
      // {
      //   id: "input",
      //   type: "all"
      // }
    ],
    outputs:[
    ]
  });

  Base.View = Node.View.extend({
  });

}(Dataflow) );

( function(Dataflow) {
 
  // Dependencies
  var Base = Dataflow.node("base");
  var BaseResizable = Dataflow.node("base-resizable");

  BaseResizable.Model = Base.Model.extend({
    defaults: {
      label: "",
      type: "base-resizable",
      x: 200,
      y: 100,
      w: 200,
      h: 200
    },
    initialize: function() {
      Base.Model.prototype.initialize.call(this);
    },
    unload: function(){
      // Stop any processes that need to be stopped
    },
    toJSON: function(){
      var json = Base.Model.prototype.toJSON.call(this);
      json.w = this.get("w");
      json.h = this.get("h");
      return json;
    },
    inputs:[
    ],
    outputs:[
    ]
  });

  BaseResizable.View = Base.View.extend({
    initialize: function() {
      Base.View.prototype.initialize.call(this);
      // Initial size
      this.$el.css({
        width: this.model.get("w"),
        height: this.model.get("h")
      });
      // Make resizable
      var self = this;
      this.$el.resizable({
        helper: "node helper",
        stop: function(event, ui) {
          self.resizeStop(event, ui);
        }
      });
      // The simplest way to extend the events hash
      // this.addEvents({
      //   'resizestop': 'resizeStop'
      // });
    },
    resizeStop: function(event, ui) {
      this.model.set({
        "w": ui.size.width,
        "h": ui.size.height
      });
    }
  });

}(Dataflow) );

/*
*   NOTE: this has nothing to do with server-side Node.js (so far at least)
*/

( function(Dataflow) {
 
  // Dependencies
  var BaseResizable = Dataflow.node("base-resizable");
  var Test = Dataflow.node("test");

  Test.Model = BaseResizable.Model.extend({
    defaults: {
      label: "",
      type: "test",
      x: 200,
      y: 100,
      w: 200,
      h: 200
    },
    inputs:[
      {
        id: "input",
        type: "all"
      },
      {
        id: "input2",
        type: "all"
      }
    ],
    outputs:[
      {
        id: "output",
        type: "all"
      }
    ]
  });

  Test.View = BaseResizable.View.extend({
    initialize: function(){
      BaseResizable.View.prototype.initialize.call(this);
      this.$(".inner").text("the node view .inner div can be used for info, ui, etc...");
    }
  });

}(Dataflow) );

( function(Dataflow) {
 
  // Dependencies
  var Base = Dataflow.node("base");
  var DataflowInput = Dataflow.node("dataflow-input");

  DataflowInput.Model = Base.Model.extend({
    defaults: {
      label: "",
      type: "dataflow-input",
      x: 200,
      y: 100,
      "input-type": "all"
    },
    initialize: function(){
      if (this.get("label")===""){
        this.set({label:"input"+this.id});
      }
      // super
      Base.Model.prototype.initialize.call(this);
    },
    toJSON: function(){
      var json = Base.Model.prototype.toJSON.call(this);
      json["input-type"] = this.get("input-type");
      return json;
    },
    inputs:[
      // {
      //   id: "data",
      //   type: "all"
      // },
    ],
    outputs:[
      {
        id: "data",
        type: "all"
      }
    ]
  });

  // DataflowInput.View = Base.View.extend({
  // });

}(Dataflow) );

( function(Dataflow) {
 
  // Dependencies
  var Base = Dataflow.node("base");
  var DataflowOutput = Dataflow.node("dataflow-output");

  DataflowOutput.Model = Base.Model.extend({
    defaults: {
      label: "",
      type: "dataflow-output",
      x: 200,
      y: 100,
      "output-type": "all"
    },
    initialize: function(){
      if (this.get("label")===""){
        this.set({label:"output"+this.id});
      }
      // super
      Base.Model.prototype.initialize.call(this);
    },
    toJSON: function(){
      var json = Base.Model.prototype.toJSON.call(this);
      json["output-type"] = this.get("output-type");
      return json;
    },
    inputs:[
      {
        id: "data",
        type: "all"
      }
    ],
    outputs:[
      // {
      //   id: "data",
      //   type: "all"
      // }
    ]
  });

  // DataflowOutput.View = Base.View.extend({
  // });

}(Dataflow) );

( function(Dataflow) {
 
  // Dependencies
  var BaseResizable = Dataflow.node("base-resizable");
  var DataflowSubgraph = Dataflow.node("dataflow-subgraph");

  var Graph = Dataflow.module("graph");
  var Input = Dataflow.module("input");
  var Output = Dataflow.module("output");

  DataflowSubgraph.Model = BaseResizable.Model.extend({
    defaults: {
      label: "subgraph",
      type: "dataflow-subgraph",
      x: 200,
      y: 100,
      graph: {
        nodes:[
          {id: "1", label: "in", type:"dataflow-input",  x:180, y: 15},
          {id:"99", label:"out", type:"dataflow-output", x:975, y:500}
        ]
      }
    },
    initialize: function() {
      BaseResizable.Model.prototype.initialize.call(this);

      var graph = this.get("graph");
      graph.parentNode = this;
      this.graph = new Graph.Model(graph);

      // Initialize i/o from subgraph
      var inputs = this.graph.nodes.filter(function(node){
        return (node.type === "dataflow-input");
      });
      _.each(inputs, this.addInput, this);
      var outputs = this.graph.nodes.filter(function(node){
        return (node.type === "dataflow-output");
      });
      _.each(outputs, this.addOutput, this);

      // Listen for new i/o
      this.graph.nodes.on("add", function(node){
        if (node.type === "dataflow-input") {
          this.addInput(node);
        } else if (node.type === "dataflow-output") {
          this.addOutput(node);
        }
      }, this);

      // Listen for removing i/o
      this.graph.nodes.on("remove", function(node){
        if (node.type === "dataflow-input") {
          this.removeInput(node);
        } else if (node.type === "dataflow-output") {
          this.removeOutput(node);
        }
      }, this);
    },
    addInput: function(input){
      var newInput = new Input.Model({
        id: input.id,
        label: input.get("label"),
        type: input.get("input-type"),
        parentNode: this,
        inputNode: input
      });
      this.inputs.add(newInput);
    },
    addOutput: function(output){
      var newOutput = new Output.Model({
        id: output.id,
        label: output.get("label"),
        type: output.get("output-type"),
        parentNode: this,
        outputNode: output
      });
      this.outputs.add(newOutput);
    },
    removeInput: function(node){
      var input = this.inputs.get(node.id);
      input.remove();
      this.inputs.remove(input);
    },
    removeOutput: function(node){
      var output = this.outputs.get(node.id);
      output.remove();
      this.outputs.remove(output);
    },
    toJSON: function(){
      var json = BaseResizable.Model.prototype.toJSON.call(this);
      json.graph = this.graph;
      return json;
    },
    remove: function(){
      BaseResizable.Model.prototype.remove.call(this);
      this.graph.remove();
    },
    inputs:[
    ],
    outputs:[
    ]
  });

  var innerTemplate = '<button class="show-subgraph">edit subgraph</button>';

  DataflowSubgraph.View = BaseResizable.View.extend({
    events: function(){
      var events = BaseResizable.View.prototype.events.call(this);
      events["click .show-subgraph"] = "showSubgraph";
      return events;
    },
    innerTemplate: _.template(innerTemplate),
    initialize: function() {
      BaseResizable.View.prototype.initialize.call(this);
      this.model.graph.view = new Graph.View({model:this.model.graph});

      // Listen for label changes
      this.model.inputs.each(this.addInput, this);
      this.model.inputs.on("add", this.addInput, this);
      this.model.outputs.each(this.addOutput, this);
      this.model.outputs.on("add", this.addOutput, this);
    },
    addInput: function(input){
      // Listen for label changes
      input.get("inputNode").on("change:label", function(i){
        input.view.$(".label").text(i.get("label"));
      }, this);
    },
    addOutput: function(output){
      // Listen for label changes
      output.get("outputNode").on("change:label", function(o){
        output.view.$(".label").text(o.get("label"));
      }, this);
    },
    showSubgraph: function(){
      Dataflow.showGraph(this.model.graph);
    }
  });

}(Dataflow) );

( function(Dataflow) {
 
  var buttons = $(
    '<div class="dataflow-plugin-edit">'+
      '<button class="selectall">Select All (A)</button><br />'+
      '<button class="cut">Cut (X)</button><br />'+
      '<button class="copy">Copy (C)</button><br />'+
      '<button class="paste">Paste (V)</button><br />'+
    '</div>'
  );

  Dataflow.addPlugin("edit", buttons);

  //
  // A
  //

  function selectAll(){
    Dataflow.currentGraph.view.$(".node").addClass("ui-selected");
  }
  buttons.children(".selectall").click(selectAll);

  //
  // X
  //

  function cut(){
    // Copy selected
    copy();
    // Move back so paste in original place
    _.each(copied.nodes, function(node){
      node.x -= 50;
      node.y -= 50;
    });
    // Remove selected
    var toRemove = Dataflow.currentGraph.nodes.filter(function(node){
      return node.view.$el.hasClass("ui-selected");
    });
    _.each(toRemove, function(node){
      node.collection.remove(node);
    });
  }
  buttons.children(".cut").click(cut);

  //
  // C
  //

  var copied = {};
  function copy(){
    copied = {};
    // nodes
    copied.nodes = [];
    Dataflow.currentGraph.nodes.each(function(node){
      if (node.view.$el.hasClass("ui-selected")) {
        copied.nodes.push( JSON.parse(JSON.stringify(node)) );
      }
    });
    // edges
    copied.edges = [];
    Dataflow.currentGraph.edges.each(function(edge){
      // Only copy the edges between nodes being copied
      var connectedSource = _.any(copied.nodes, function(node){
        return (edge.source.parentNode.id === node.id);
      });
      var connectedTarget = _.any(copied.nodes, function(node){
        return (edge.target.parentNode.id === node.id);
      });
      if (connectedSource && connectedTarget){
        copied.edges.push( JSON.parse(JSON.stringify(edge)) );
      }
    });
  }
  buttons.children(".copy").click(copy);

  //
  // V
  //

  function paste(){
    if (copied && copied.nodes.length > 0) {
      // Deselect all
      Dataflow.currentGraph.view.$(".node").removeClass("ui-selected");
      // Add nodes
      _.each(copied.nodes, function(node){
        // Offset pasted
        node.x += 50;
        node.y += 50;
        node.parentGraph = Dataflow.currentGraph;
        var oldId = node.id;
        // Make unique id
        while (Dataflow.currentGraph.nodes.get(node.id)){
          node.id++;
        }
        // Update copied edges with new node id
        if (oldId !== node.id) {
          _.each(copied.edges, function(edge){
            if (edge.source.node === oldId) {
              edge.source.node = node.id;
            }
            if (edge.target.node === oldId) {
              edge.target.node = node.id;
            }
          });
        }
        var newNode = new Dataflow.nodes[node.type].Model(node);
        Dataflow.currentGraph.nodes.add(newNode);
        // Select it
        newNode.view.select();
      });
      // Add edges
      _.each(copied.edges, function(edge){
        // Clone edge object (otherwise weirdness on multiple pastes)
        edge = JSON.parse(JSON.stringify(edge));
        // Add it
        edge.parentGraph = Dataflow.currentGraph;
        edge.id = edge.source.node+":"+edge.source.port+"→"+edge.target.node+":"+edge.target.port;
        var newEdge = new Dataflow.modules.edge.Model(edge);
        Dataflow.currentGraph.edges.add(newEdge);
      });
    }
    // Rerender edges
    _.defer(function(){
      Dataflow.currentGraph.view.rerenderEdges();
    });
  }
  buttons.children(".paste").click(paste);


}(Dataflow) );

( function(Dataflow) {
 
  var $form = $( 
    '<form class="dataflow-plugin-view-source" style="width: 330px;">'+
      '<textarea class="code" style="width: 100%; height: 400px;"></textarea><br/>'+
      '<input class="apply" type="submit" value="apply changes" />'+
    '</form>'
  );
  var $code = $form.children(".code");

  Dataflow.addPlugin("view source", $form);

  // On change update code view
  Dataflow.on("change", function(graph){
    if (Dataflow.graph) {
      var scrollBackTop = $code.prop("scrollTop");
      $code.val( JSON.stringify(Dataflow.graph.toJSON(), null, "  ") );
      $code.scrollTop( scrollBackTop );
    }
  });

  // Apply source to test graph
  $form.submit(function(){
    var graph;
    try {
      graph = JSON.parse( $code.val() );
    } catch(error){
      Dataflow.log("Invalid JSON");
      return false;
    }
    if (graph) {
      var g = Dataflow.loadGraph(graph);
      g.trigger("change");
    }
    return false;
  });

}(Dataflow) );

( function(Dataflow) {
 
  var $log = $(
    '<div class="dataflow-plugin-log" style="width:400px; height: 250px; overflow: auto;">'+
      '<ol class="loglist"></ol>'+
    '</div>'
  );

  Dataflow.addPlugin("log", $log);

  // Log message and scroll
  function log(message){
    message = _.escape(message);
    $log.children(".loglist").append("<li>" + message + "</li>");
    $log.scrollTop( $log.prop("scrollHeight") );
  }

  // Log
  Dataflow.on("log", function(message){
    log("log: " + message);
  });

  // Log graph changes
  Dataflow.on("node:add", function(graph, node){
    log("node added: " + node.toString());
  });
  Dataflow.on("node:remove", function(graph, node){
    log("node removed: " + node.toString());
  });
  Dataflow.on("edge:add", function(graph, edge){
    log("edge added: " + edge.toString());
  });
  Dataflow.on("edge:remove", function(graph, edge){
    log("edge removed: " + edge.toString());
  });

}(Dataflow) );
