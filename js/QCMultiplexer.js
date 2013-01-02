function QCMultiplexer(params) {
  this.params = params;
  this.outs = {};

  this.update = function() {
    // This should probably do something with PortClass?
    with(this.params) {
      var i = ~~this.params.Input;
      if(i < 0)
        i = 0;
      else if(i >= this.InputCount)
        i = this.InputCount-1;
      this.outs.Value = this.params['source_' + i];
    }
  }
}
