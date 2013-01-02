function QCClear(params) {
  this.params = params;

  this.update = function() {
    var c = color(this.params.Color);
    gl.clearColor(c[0], c[1], c[2], c[3]);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  }
}
