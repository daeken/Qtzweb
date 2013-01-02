function QCLighting(subpatch, params) {
  this.subpatch = subpatch;
  this.params = params;

  this.update = function() {
    if(this.params._enable === false)
      return;

    QCLighting.stack.push(QCLighting.current);
    QCLighting.current = this;
    this.register();
    this.subpatch.update();
    QCLighting.current = QCLighting.stack.pop();
    if(QCLighting.current)
      QCLighting.current.register();
    else
      gl.uniform1i(gl.program.useLighting, false);
  }

  this.register = function() {
    with(this.params) {
      gl.uniform1i(gl.program.useLighting, true);
      gl.uniform3fv(gl.program.ambientColor, color(AmbientColor, 3));
      gl.uniform1f(gl.program.specular, ObjectSpecular);
      gl.uniform1f(gl.program.shininess, ObjectShininess);
      // XXX: Support lightcount != 1
      gl.uniform3f(gl.program.lightPosition, positionX_1, positionY_1, positionZ_1);
      gl.uniform3fv(gl.program.lightColor, color(color_1, 3));
    }
  }
}
QCLighting.stack = [];