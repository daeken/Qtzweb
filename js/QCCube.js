function QCCube(params) {
  this.params = params;

  if(QCCube.vertBuffer === undefined) {
    QCCube.vertBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, QCCube.vertBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(QCCube.vertices), gl.STATIC_DRAW);
    QCCube.vertBuffer.itemSize = 3;
    QCCube.vertBuffer.numItems = 24;

    QCCube.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, QCCube.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(QCCube.indices), gl.STATIC_DRAW);
    QCCube.indexBuffer.itemSize = 1;
    QCCube.indexBuffer.numItems = 36;

    QCCube.normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, QCCube.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(QCCube.normals), gl.STATIC_DRAW);
    QCCube.normalBuffer.itemSize = 3;
    QCCube.normalBuffer.numItems = 24;

    QCCube.colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, QCCube.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, QCCube.colors = new Float32Array(24*4), gl.DYNAMIC_DRAW);
    QCCube.colorBuffer.itemSize = 4;
    QCCube.colorBuffer.numItems = 24;
    QCCube.curColor = [[],[],[],[],[],[]];
  }

  this.update = function() {
    with(this.params) {
      gl.bindBuffer(gl.ARRAY_BUFFER, QCCube.vertBuffer);
      gl.vertexAttribPointer(gl.program.aVertexPosition, QCCube.vertBuffer.itemSize, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, QCCube.normalBuffer);
      gl.vertexAttribPointer(gl.program.aVertexNormal, QCCube.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, QCCube.colorBuffer);
      var colors = [
        ColorFront, 
        ColorBack, 
        ColorTop, 
        ColorBottom, 
        ColorRight, 
        ColorLeft
      ];
      var updated = false;
      for(var i in colors) {
        var c = color(colors[i]);
        if(c[0] != QCCube.curColor[i][0] || 
           c[1] != QCCube.curColor[i][1] || 
           c[2] != QCCube.curColor[i][2] || 
           c[3] != QCCube.curColor[i][3]
        ) {
          for(var j = 0; j < 16; j += 4) {
            QCCube.colors[i*16+j  ] = c[0];
            QCCube.colors[i*16+j+1] = c[1];
            QCCube.colors[i*16+j+2] = c[2];
            QCCube.colors[i*16+j+3] = c[3];
          }
          QCCube.curColor[i] = c;
          updated = true;
        } else
          break; // Hack while all cubes are similarly colored.
      }

      if(updated) {
        gl.bufferData(gl.ARRAY_BUFFER, QCCube.colors, gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(gl.program.aVertexColor, QCCube.colorBuffer.itemSize, gl.FLOAT, false, 0, 0);
      }

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, QCCube.indexBuffer);

      gl.push();

      if(X != 0 || Y != 0 || Z != 0)
        mat4.translate(gl.mvMatrix, [X, Y, Z]);

      if(RX)
        mat4.rotate(gl.mvMatrix, degrad(RX), [1, 0, 0]);
      if(RY)
        mat4.rotate(gl.mvMatrix, degrad(RY), [0, 1, 0]);
      if(RZ)
        mat4.rotate(gl.mvMatrix, degrad(RZ), [0, 0, 1]);

      if(Width != 1 || Height != 1 || Depth != 1)
        mat4.scale(gl.mvMatrix, [Width, Height, Depth]);

      gl.matUpdate();
      gl.drawElements(gl.TRIANGLES, QCCube.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

      gl.pop();
    }
  }
}
QCCube.vertices = [
  // Front face
  -0.5, -0.5,  0.5,
   0.5, -0.5,  0.5,
   0.5,  0.5,  0.5,
  -0.5,  0.5,  0.5,

  // Back face
  -0.5, -0.5, -0.5,
  -0.5,  0.5, -0.5,
   0.5,  0.5, -0.5,
   0.5, -0.5, -0.5,

  // Top face
  -0.5,  0.5, -0.5,
  -0.5,  0.5,  0.5,
   0.5,  0.5,  0.5,
   0.5,  0.5, -0.5,

  // Bottom face
  -0.5, -0.5, -0.5,
   0.5, -0.5, -0.5,
   0.5, -0.5,  0.5,
  -0.5, -0.5,  0.5,

  // Right face
   0.5, -0.5, -0.5,
   0.5,  0.5, -0.5,
   0.5,  0.5,  0.5,
   0.5, -0.5,  0.5,

  // Left face
  -0.5, -0.5, -0.5,
  -0.5, -0.5,  0.5,
  -0.5,  0.5,  0.5,
  -0.5,  0.5, -0.5
];
QCCube.indices = [
  0,  1,  2,    0,  2,  3,    // Front face
  4,  5,  6,    4,  6,  7,    // Back face
  8,  9,  10,   8,  10, 11,  // Top face
  12, 13, 14,   12, 14, 15, // Bottom face
  16, 17, 18,   16, 18, 19, // Right face
  20, 21, 22,   20, 22, 23  // Left face
];
QCCube.normals = [
  // Front
   0.0,  0.0,  1.0,
   0.0,  0.0,  1.0,
   0.0,  0.0,  1.0,
   0.0,  0.0,  1.0,
   
  // Back
   0.0,  0.0, -1.0,
   0.0,  0.0, -1.0,
   0.0,  0.0, -1.0,
   0.0,  0.0, -1.0,
   
  // Top
   0.0,  1.0,  0.0,
   0.0,  1.0,  0.0,
   0.0,  1.0,  0.0,
   0.0,  1.0,  0.0,
   
  // Bottom
   0.0, -1.0,  0.0,
   0.0, -1.0,  0.0,
   0.0, -1.0,  0.0,
   0.0, -1.0,  0.0,
   
  // Right
   1.0,  0.0,  0.0,
   1.0,  0.0,  0.0,
   1.0,  0.0,  0.0,
   1.0,  0.0,  0.0,
   
  // Left
  -1.0,  0.0,  0.0,
  -1.0,  0.0,  0.0,
  -1.0,  0.0,  0.0,
  -1.0,  0.0,  0.0
];
