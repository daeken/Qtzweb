function QCColorFromComponents(params) {
  this.params = params;
  this.outs = {};

  this.update = function() {
    var elems = [this.params._1, this.params._2, this.params._3, this.params.Alpha];
    switch(this.params._format) {
      case 'hsl':
        this.outs.Color = hslToRgb(elems[0], elems[1], elems[2], elems[3]);
        break;
      case 'rgb':
        this.outs.Color = elems;
        break;
    }
  }
}
