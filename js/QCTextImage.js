var textcvs = document.createElement('canvas');
textcvs.width = 512;
textcvs.height = 512;
var textctx = textcvs.getContext('2d');

function QCTextImage(params) {
  this.params = params;
  this.outs = {};

  textctx.strokeStyle = 'red';
  textctx.fillStyle = 'green';
  textctx.fillRect(0, 0, 512, 512);

  var tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textcvs);
  this.outs['Image'] = tex;

  this.update = function() {
  }
}
