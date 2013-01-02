function QCInterpolation(params) {
  this.params = params;
  this.outs = {};

  this.update = function() {
    with(this.params)
      switch(Repeat) {
        case 0: // None
          if(time < Duration) {
            this.outs.Value = interp(Value1, Value2, time / Duration, Interpolation);
          } else
            this.outs.Value = this.params.Value2;
          break;
        case 1: // Loop
          var comp = (time % this.params.Duration) / this.params.Duration;
          this.outs.Value = interp(Value1, Value2, comp, Interpolation);
          break;
        case 2: // Mirrored loop
          var comp = time % (this.params.Duration * 2);
          if(comp >= this.params.Duration) {
            comp -= this.params.Duration;
            comp = this.params.Duration - comp;
          }
          comp /= this.params.Duration;
          this.outs.Value = interp(Value1, Value2, comp, Interpolation);
          break;
        case 3: // Mirrored loop once
          if(time < this.params.Duration * 2) {
            var comp = time;
            if(comp >= this.params.Duration) {
              comp -= this.params.Duration;
              comp = this.params.Duration - comp;
            }
            comp /= this.params.Duration;
            this.outs.Value = interp(Value1, Value2, comp, Interpolation);
          } else
            this.outs.Value = this.params.Value1;
          break;
      }
  }
}
