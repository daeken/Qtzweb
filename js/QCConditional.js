function QCConditional(params) {
  this.params = params;
  this.outs = {};

  this.update = function() {
    with(this.params) {
      var diff = Value2 - Value1;
      switch(Test) {
        case 0: // Is Equal
          this.outs.Result = Math.abs(diff) <= Tolerance;
          break;
        case 1: // Is Not Equal
          this.outs.Result = Math.abs(diff) > Tolerance;
          break;
        case 2: // Is Greater Than
          this.outs.Result = Value1 > Value2 - Tolerance;
          break;
        case 3: // Is Lower Than
          this.outs.Result = Value1 < Value2 + Tolerance;
          break;
        case 4: // Is Greater Than or Equal To
          this.outs.Result = Value1 >= Value2 - Tolerance;
          break;
        case 5: // Is Lower Than or Equal To
          this.outs.Result = Value1 <= Value2 + Tolerance;
          break;
      }
    }
  }
}
