function QCSprite(params) {
  this.params = params;
  this.outs = {};
  
  this.update = function() {
    with(this.params) {
      if(this.elem === undefined) {
        this.elem = document.createElement('span');
        document.body.appendChild(this.elem);
        this.elem.innerHTML = this.params.Image.String;
      }
    }
  }
}
