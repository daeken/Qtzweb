var vs_mainstub = <shader>
	void main() {
		vec3 pos = aVertexPosition, nor = aVertexNormal;
		vec4 col = aVertexColor;
		_main_renamed_();
	}
</shader>;

function QCGLSLShader(subpatch, params, sparams, stypes) {
  this.subpatch = subpatch;
  this.params = params;

  var uniforms = [
	  'uPMatrix', 
	  'uMVMatrix', 
	  'uNMatrix'
  ];
  for(var i in sparams)
  	uniforms.push(sparams[i]);

  this.program = compile(
    vs_preamble + params.VertexShader.replace(/main/g, '_main_renamed_') + vs_mainstub, 
    fs_preamble + params.FragmentShader, 
    [
      'aVertexPosition', 
      'aVertexNormal', 
      'aVertexColor', 
      'aTexCoord'
    ], 
    uniforms
  );
  this.program.hasNormal = false;

  this.update = function() {
    if(this.params._enable === false)
      return;
    
  	gl.push();
  	gl.pushProgram(this.program);

  	for(var i in sparams) {
  		var param = sparams[i], type = stypes[i];
  		switch(type) {
  			case 'scalar':
  				var val = this.params[param];
  				if(val && val.constructor != WebGLTexture)
  					gl.uniform1f(this.program[param], val);
  				break;
  			case 'vec2':
  				gl.uniform2f(this.program[param], 
  					this.params[param+'_X'], 
  					this.params[param+'_Y'])
  				break;	
  			case 'vec3':
  				gl.uniform3f(this.program[param], 
  					this.params[param+'_X'], 
  					this.params[param+'_Y'], 
  					this.params[param+'_Z'])
  				break;	
  			case 'vec4':
  				gl.uniform4f(this.program[param], 
  					this.params[param+'_X'], 
  					this.params[param+'_Y'], 
  					this.params[param+'_Z'], 
  					this.params[param+'_W'])
  				break;	
  		}
  	}

    this.subpatch.update();
    gl.popProgram();
    gl.pop();
  }
}
