function QCCamera(subpatch, params) {
  this.subpatch = subpatch;
  this.params = params;

  this.update = function() {
    with(this.params) {
      gl.push();

      // rotation around an origin point, followed by translation, followed by scale around an origin point.
      mat4.scale(gl.mvMatrix, [ScaleX, ScaleY, ScaleZ]);

      mat4.translate(gl.mvMatrix, [TranslateX, TranslateY, TranslateZ]);

      mat4.rotate(gl.mvMatrix, degrad(RotateX), [1, 0, 0]);
      mat4.rotate(gl.mvMatrix, degrad(RotateY), [0, 1, 0]);
      mat4.rotate(gl.mvMatrix, degrad(RotateZ), [0, 0, 1]);
      
      mat4.translate(gl.mvMatrix, [OriginX, OriginY, OriginZ]);

      this.subpatch.update();
      gl.pop();
    }
  }
}
