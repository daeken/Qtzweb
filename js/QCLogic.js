function QCLogic(params) {
  this.params = params;
  this.outs = {};

  this.update = function() {
    with(this.params) {
      switch(Operation) {
        case 0: // AND
          this.outs.Result = Value1 && Value2;
          break;
        case 1: // OR
          this.outs.Result = Value1 || Value2;
          break;
        case 2: // XOR
          this.outs.Result = (Value1 || Value2) && !(Value1 && Value2);
          break;
        case 3: // NOT
          this.outs.Result = !Value1;
          break;
        case 4: // NAND
          this.outs.Result = !(Value1 && Value2);
          break;
        case 5: // NOR
          this.outs.Result = !(Value1 || Value2);
          break;
        case 6: // NXOR
          this.outs.Result = !((Value1 || Value2) && !(Value1 && Value2));
          break;
      }
    }
  }
}
