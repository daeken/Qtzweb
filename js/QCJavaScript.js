function QCJavaScript(func, params) {
  this.params = params;
  this.outs = {};
  this.func = func;

  this.update = function() {
    this.outs = this.func(this.params);
  };
}
