function QCIterator(subpatch, params) {
  this.subpatch = subpatch;
  this.params = params;

  this.update = function() {
    var count = this.subpatch.Count = ~~this.params.Count;
    
    for(var i = 0; i < count; ++i) {
      this.subpatch.Index = i;
      this.subpatch.Position = i / (count - 1);
      this.subpatch.update();
    }
  }
}
