function QCColorMixer(params) {
  this.params = params;
  this.outs = {};

  this.update = function() {
    var a = color(this.params.Color1);
    var b = color(this.params.Color2);
    this.outs.Color = [
      interp(a[0], b[0], this.params.Mix, this.params.Interpolation), 
      interp(a[1], b[1], this.params.Mix, this.params.Interpolation), 
      interp(a[2], b[2], this.params.Mix, this.params.Interpolation), 
      interp(a[3], b[3], this.params.Mix, this.params.Interpolation)
    ];
  }
}
