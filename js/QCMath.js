function QCMath(params) {
  this.params = params;
  this.outs = {};

  this.update = function() {
    var value = this.params.Value;
    for(var i = 1, count = this.params.OperationCount+1; i < count; ++i) {
      var operand = this.params['operand_' + i];
      switch(this.params['operation_' + i]) {
        case 0:
          value += operand;
          break;
        case 1:
          value -= operand;
          break;
        case 2:
          value *= operand;
          break;
        case 3:
          value /= operand;
          break;
        case 4:
          value %= operand;
          break;
      }
    }
    this.outs.Value = value;
  }
}
