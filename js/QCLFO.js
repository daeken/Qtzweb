// PARTIAL

function QCLFO(params) {
  this.params = params;
  this.outs = {};

  this.update = function() {
    with(this.params)
      switch(Type) {
        case 0: // Sin
          this.outs.Value = Math.sin(time / Period * 2 * Math.PI + degrad(Phase)) * Amplitude + Offset;
          break;
        case 1: // Cos
          this.outs.Value = Math.cos(time / Period * 2 * Math.PI + degrad(Phase)) * Amplitude + Offset;
          break;
      }
  }
}
