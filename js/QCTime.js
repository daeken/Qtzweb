function QCTime(params) {
  this.outs = {};

  this.update = function() {
    this.outs.Time = time;
  }
}