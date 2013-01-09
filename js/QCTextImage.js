// PARTIAL

function QCTextImage(params) {
  this.params = params;
  this.outs = {};

  this.update = function() {
    this.outs['Image'] = this.params;
  }
}
