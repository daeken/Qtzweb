function QCCounter(params) {
  this.params = params;
  this.outs = {};

  var count = 0;

  this.update = function() {
    if(this.params.SignalDown)
      count--;
    if(this.params.Signal)
      count++;
    if(this.params.SignalReset)
      count = 0;
    this.outs.Count = count;
  }
}
