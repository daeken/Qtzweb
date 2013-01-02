window.requestAnimationFrame = window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame;

// From http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
function hslToRgb(h, s, l, a){
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [r, g, b, a];
}

function degrad(angle) {
  return angle * Math.PI / 180;
}

function color(x, components) {
  if(components == 3)
    return [x.red || x[0] || x, x.green || x[1] || x, x.blue || x[2] || x];
  else
    return [x.red || x[0] || x, x.green || x[1] || x, x.blue || x[2] || x, x.alpha || x[3] || 1.0];
}

function interp(a, b, mix, type) {
  if(a == b)
    return a;
  switch(type) {
    case 0:
      return (b - a) * mix + a;
    default:
      throw 'Unknown interpolation: ' + type;
  }
}

var default_vs = <shader>
  attribute vec3 aVertexPosition;
  attribute vec3 aVertexNormal;
  attribute vec4 aVertexColor;
  uniform mat4 uMVMatrix;
  uniform mat4 uPMatrix;
  uniform mat4 uNMatrix;
  varying vec4 vColor;
  varying vec4 vPosition;
  varying vec3 vNormal;
  void main(void) {
    vPosition = uMVMatrix * vec4(aVertexPosition, 1.0);
    gl_Position = uPMatrix * vPosition;
    vNormal = (uNMatrix * vec4(aVertexNormal, 1.0)).xyz;
    vColor = aVertexColor;
  }
</shader>;

var default_fs = <shader>
  precision mediump float;
  varying vec4 vColor;
  varying vec4 vPosition;
  varying vec3 vNormal;
  uniform bool useLighting;
  uniform vec3 ambientColor;
  uniform float specular, shininess;
  uniform vec3 lightPosition, lightColor;
  void main(void) {
    vec3 weight;
    if (!useLighting)
      gl_FragColor = vColor;
    else {
      vec3 normal = normalize(vNormal);
      float spec, ndotl = max(dot(normal, lightPosition), 0.0);
      vec3 light = ambientColor + lightColor * ndotl;
      if(ndotl >= 0.0) {
        vec3 viewDir = normalize(-vPosition.xyz);
        spec = specular * pow(max(0.0, dot(reflect(-normalize(lightPosition), normal), viewDir)), shininess);
      } else {
        spec = 0.0;
      }
      gl_FragColor = vec4(vColor.rgb * light + spec, vColor.a);
    }
  }
</shader>;

function compile(vs, fs, attribs, uniforms) {
  function sub(src, type) {
    var shdr = gl.createShader(type);
    gl.shaderSource(shdr, src);
    gl.compileShader(shdr);

    if(!gl.getShaderParameter(shdr, gl.COMPILE_STATUS)) {
      console.log('Shader compilation failed');
      console.log(gl.getShaderInfoLog(shdr));
    }

    return shdr;
  }

  var prog = gl.createProgram();
  gl.attachShader(prog, sub(vs, gl.VERTEX_SHADER));
  gl.attachShader(prog, sub(fs, gl.FRAGMENT_SHADER));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  for(var i in attribs)
    gl.enableVertexAttribArray(prog[attribs[i]] = gl.getAttribLocation(prog, attribs[i]));
  for(var i in uniforms)
    prog[uniforms[i]] = gl.getUniformLocation(prog, uniforms[i]);

  return prog;
}

function init() {
  elem = document.createElement('canvas');
  elem.width = 640;
  elem.height = 480;
  document.body.appendChild(elem);

  gl = elem.getContext('experimental-webgl') || elem.getContext('webgl');
  if(!gl)
    alert('No WebGL support :(');

  gl.enable(gl.DEPTH_TEST);

  gl.program = compile(
    default_vs, 
    default_fs, 
    [
      'aVertexPosition', 
      'aVertexColor', 
      'aVertexNormal'
    ], 
    [
      'uPMatrix', 
      'uMVMatrix', 
      'uNMatrix',  
      'useLighting', 
      'ambientColor', 
      'specular', 
      'shininess', 
      'lightPosition', 
      'lightColor'
    ]
  );

  gl.mvMatrix = mat4.create();
  gl.mvStack = [];
  gl.pMatrix = mat4.create();
  gl.push = function() {
    var _ = mat4.create();
    mat4.set(this.mvMatrix, _);
    gl.mvStack.push(_);
  };
  gl.pop = function() {
    gl.mvMatrix = gl.mvStack.pop();
  };
  gl.matUpdate = function() {
    gl.uniformMatrix4fv(gl.program.uPMatrix, false, gl.pMatrix);
    gl.uniformMatrix4fv(gl.program.uMVMatrix, false, gl.mvMatrix);

    var nMatrix = mat4.create();
    mat4.inverse(gl.mvMatrix, nMatrix);
    mat4.transpose(nMatrix);
    gl.uniformMatrix4fv(gl.program.uNMatrix, false, nMatrix);
  };

  gl.width = elem.width;
  gl.height = elem.height;

  gl.uniform1i(gl.program.useLighting, false);

  gl.cullFace(gl.BACK);
}


function run(patch, audio, div) {
  if(audio)
  	audio.play();
  else
  	var start = new Date;
  
  function render() {
    if(!div) {
      elem.width = gl.width = window.innerWidth;
      elem.height = gl.height = window.innerHeight;
    }
    gl.viewport(0, 0, gl.width, gl.height);
    mat4.perspective(45, gl.width / gl.height, 0.1, 100, gl.pMatrix);
    mat4.identity(gl.mvMatrix);

    mat4.translate(gl.mvMatrix, [0.0, 0.0, -1.8]);

    if(audio)
	    time = audio.currentTime;
	else
		time = (new Date - start) / 1000;
    if(div)
      div.innerHTML = time;
    patch.update();
    window.requestAnimationFrame(render, elem);
  }
  render()
}
