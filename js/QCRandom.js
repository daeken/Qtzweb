function QCRandom(params) {
  this.params = params;
  this.outs = {};

  this.update = function() {
    with(this.params) {
      this.outs.Value = Math.random() * (Max - Min) + Min;
      console.log(this.outs.Value);
    }
  }
}
