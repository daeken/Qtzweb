function QCReplicator(subpatch, params) {
  this.subpatch = subpatch;
  this.params = params;

  this.update = function() {
    with(this.params)
      for(var i = 0; i < Copies; ++i) {
        var comp = i / (Copies - 1);
        gl.push();
        var scale = (Scale - 1.0) * comp + 1.0;
        mat4.scale(gl.mvMatrix, [scale, scale, scale]);

        mat4.translate(gl.mvMatrix, [TranslationX * comp, TranslationY * comp, TranslationZ * comp]);

        mat4.rotate(gl.mvMatrix, degrad(RotationX * comp), [1, 0, 0]);
        mat4.rotate(gl.mvMatrix, degrad(RotationY * comp), [0, 1, 0]);
        mat4.rotate(gl.mvMatrix, degrad(RotationZ * comp), [0, 0, 1]);
        
        mat4.translate(gl.mvMatrix, [OriginX, OriginY, OriginZ]);

        mat4.rotate(gl.mvMatrix, degrad(OrientationX * comp), [1, 0, 0]);
        mat4.rotate(gl.mvMatrix, degrad(OrientationY * comp), [0, 1, 0]);
        mat4.rotate(gl.mvMatrix, degrad(OrientationZ * comp), [0, 0, 1]);

        this.subpatch.update();
        gl.pop();
      }
  }
}
