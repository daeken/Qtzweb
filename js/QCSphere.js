function QCSphere(params) {
  this.params = params;

  if(QCSphere.vertBuffer === undefined) {
    var stacks = 24, slices = 24; // This is in theory defined by the spheres in the file, but... good luck.

    var verts = new Float32Array(stacks * slices * 3), vi = 0;
    var indices = new Uint16Array(stacks * slices * 6), ii = 0;
    var texcoords = new Float32Array(stacks * slices * 2), ti = 0;
    QCSphere.colors = new Float32Array(stacks * slices * 4);
    for(var i = 0; i < stacks.slices * 4; ++i)
      QCSphere.colors[i] = -1.0;
    QCSphere.curColor = [-1, -1, -1, -1];

    stacks -= 1;
    slices -= 1;

    for(var stack = 0; stack <= stacks; ++stack) {
      var theta = stack * Math.PI / stacks;
      var sint = Math.sin(theta);
      var cost = Math.cos(theta);

      for(var slice = 0; slice <= slices; ++slice) {
        var phi = slice * 2 * Math.PI / slices;
        var sinp = Math.sin(phi);
        var cosp = Math.cos(phi);

        var x = cosp * sint, y = cost, z = sinp * sint;
        var u = 1 - (slice / slices), v = 1 - (stack / stacks);
        
        texcoords[ti++] = u;
        texcoords[ti++] = v;

        verts[vi++] = x;
        verts[vi++] = y;
        verts[vi++] = z;
      }
    }

    for(var stack = 0; stack < stacks; ++stack) {
      for(var slice = 0; slice < slices; ++slice) {
        var first = (stack * (slices + 1)) + slice;
        var second = first + slices + 1;

        indices[ii++] = first;
        indices[ii++] = second;
        indices[ii++] = first + 1;

        indices[ii++] = second;
        indices[ii++] = second + 1;
        indices[ii++] = first + 1;
      }
    }

    QCSphere.vertBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, QCSphere.vertBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
    QCSphere.vertBuffer.itemSize = 3;
    QCSphere.vertBuffer.numItems = verts.length / 3;
    
    QCSphere.colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, QCSphere.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, QCSphere.colors, gl.DYNAMIC_DRAW);
    QCSphere.colorBuffer.itemSize = 4;
    QCSphere.colorBuffer.numItems = verts.length / 3;
    
    QCSphere.texcoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, QCSphere.texcoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texcoords, gl.STATIC_DRAW);
    QCSphere.texcoordBuffer.itemSize = 2;
    QCSphere.texcoordBuffer.numItems = texcoords.length / 3;
    
    QCSphere.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, QCSphere.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    QCSphere.indexBuffer.itemSize = 1;
    QCSphere.indexBuffer.numItems = indices.length;
  }

  this.update = function() {
    if(this.params._enable === false)
      return;
    
    with(this.params) {
      // Yep, our vertex and normal buffers are the same.
      gl.bindBuffer(gl.ARRAY_BUFFER, QCSphere.vertBuffer);
      gl.vertexAttribPointer(gl.program.aVertexPosition, QCSphere.vertBuffer.itemSize, gl.FLOAT, false, 0, 0);
      gl.vertexAttribPointer(gl.program.aVertexNormal, QCSphere.vertBuffer.itemSize, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, QCSphere.texcoordBuffer);
      gl.vertexAttribPointer(gl.program.aTexCoord, QCSphere.texcoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, QCSphere.colorBuffer);
      var c = color(Color), colors = QCSphere.colors, cur = QCSphere.curColor;
      if(c[0] != cur[0] || c[1] != cur[1] || c[2] != cur[2] || c[3] != cur[3]) {
        for(var i = 0, j = colors.length; i < j; i += 4) {
          colors[i  ] = c[0];
          colors[i+1] = c[1];
          colors[i+2] = c[2];
          colors[i+3] = c[3];
        }

        QCSphere.curColor = c;

        gl.bufferData(gl.ARRAY_BUFFER, colors, gl.DYNAMIC_DRAW);
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, QCSphere.colorBuffer);
      gl.vertexAttribPointer(gl.program.aVertexColor, QCSphere.colorBuffer.itemSize, gl.FLOAT, false, 0, 0);

      gl.push();
      if(params.Image != null)
        gl.useTexture(Image);

      if(X != 0 || Y != 0 || Z != 0)
        mat4.translate(gl.mvMatrix, [X, Y, Z]);

      if(RX)
        mat4.rotate(gl.mvMatrix, degrad(RX), [1, 0, 0]);
      if(RY)
        mat4.rotate(gl.mvMatrix, degrad(RY), [0, 1, 0]);
      if(RZ)
        mat4.rotate(gl.mvMatrix, degrad(RZ), [0, 0, 1]);

      mat4.scale(gl.mvMatrix, [Scale / 2, Scale / 2, Scale / 2]);

      gl.matUpdate();

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, QCSphere.indexBuffer);
      gl.drawElements(gl.TRIANGLES, QCSphere.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

      if(params.Image != null)
        gl.popTexture();
      gl.pop();
    }
  }
}
