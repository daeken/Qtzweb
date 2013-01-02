function QCSplitter(params) {
  this.params = params;
  this.outs = {};

  this.update = function() {
    this.outs.output = this.params.input;
  }
}
