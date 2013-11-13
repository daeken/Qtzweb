function QCBillboard(params) {
  this.params = params;

  if(QCBillboard.vertBuffer === undefined) {
    QCBillboard.vertBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, QCBillboard.vertBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(QCBillboard.vertices), gl.STATIC_DRAW);
    QCBillboard.vertBuffer.itemSize = 3;
    QCBillboard.vertBuffer.numItems = 4;

    QCBillboard.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, QCBillboard.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(QCBillboard.indices), gl.STATIC_DRAW);
    QCBillboard.indexBuffer.itemSize = 1;
    QCBillboard.indexBuffer.numItems = 6;

    QCBillboard.normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, QCBillboard.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(QCBillboard.normals), gl.STATIC_DRAW);
    QCBillboard.normalBuffer.itemSize = 3;
    QCBillboard.normalBuffer.numItems = 4;

    QCBillboard.texcoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, QCBillboard.texcoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(QCBillboard.texcoords), gl.STATIC_DRAW);
    QCBillboard.texcoordBuffer.itemSize = 2;
    QCBillboard.texcoordBuffer.numItems = 4;

    QCBillboard.colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, QCBillboard.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]), gl.STATIC_DRAW);
    QCBillboard.colorBuffer.itemSize = 4;
    QCBillboard.colorBuffer.numItems = 4;
  }

  this.update = function() {
    if(this.params._enable === false)
      return;
    
    with(this.params) {
      gl.bindBuffer(gl.ARRAY_BUFFER, QCBillboard.vertBuffer);
      gl.vertexAttribPointer(gl.program.aVertexPosition, QCBillboard.vertBuffer.itemSize, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, QCBillboard.normalBuffer);
      gl.vertexAttribPointer(gl.program.aVertexNormal, QCBillboard.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, QCBillboard.colorBuffer);
      gl.vertexAttribPointer(gl.program.aVertexColor, QCBillboard.colorBuffer.itemSize, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, QCBillboard.texcoordBuffer);
      gl.vertexAttribPointer(gl.program.aTexCoord, QCBillboard.texcoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, QCBillboard.indexBuffer);

      gl.push();
      gl.useTexture(Image);

      if(X != 0 || Y != 0)
        mat4.translate(gl.mvMatrix, [X, Y, 0.0]);

      if(Rotation)
        mat4.rotate(gl.mvMatrix, degrad(Rotation), [0, 0, 1]);

      if(Scale != 1)
        mat4.scale(gl.mvMatrix, [Scale, Scale, Scale]);

      gl.matUpdate();
      gl.drawElements(gl.TRIANGLES, QCBillboard.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

      gl.popTexture();
      gl.pop();
    }
  }
}
QCBillboard.vertices = [
  -0.5, -0.5,  0.5,
   0.5, -0.5,  0.5,
   0.5,  0.5,  0.5,
  -0.5,  0.5,  0.5,
];
QCBillboard.indices = [
  0,  1,  2,    0,  2,  3
];
QCBillboard.normals = [
   0.0,  0.0,  1.0,
   0.0,  0.0,  1.0,
   0.0,  0.0,  1.0,
   0.0,  0.0,  1.0,
];
QCBillboard.texcoords = [
  0.0,  0.0,
  1.0,  0.0,
  1.0,  1.0,
  0.0,  1.0
];
