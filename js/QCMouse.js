function QCMouse(params) {
  this.params = params;
  this.outs = {};

  var x = 0, y = 0;

  elem.addEventListener('mousemove', function(e) {
    console.log(e);
    x =   e.x / elem.width  * 2.0 - 1.0 ;
    y = -(e.y / elem.height * 2.0 - 1.0);
  });

  this.update = function() {
    this.outs.X = x;
    this.outs.Y = y;
  }
}
