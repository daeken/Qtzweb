function QCDemultiplexer(params) {
  this.params = params;
  this.outs = {};

  this.update = function() {
    with(this.params) {
      switch(PortClass) {
        case 'QCBooleanPort':
          if(ResetOutputs)
            for(var i = 0; i < OutputCount; ++i)
              this.outs['destination_' + i] = Reset;
          this.outs['destination_' + (~~Index)] = input;
          break;
      }
    }
  }
}
