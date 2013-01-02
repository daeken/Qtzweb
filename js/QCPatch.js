function QCPatch() {
  this.nodes = {};
  this.params = {}

  this.update = function(sub) {
    if(sub !== undefined)
      this.updater = sub;
    else if(this.params._enable !== false)
      this.updater();
  }
}
