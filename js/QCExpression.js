// sin(), cos(), tan(), asin(), acos(), atan(), atan2(), sinh(), cosh(), tanh(), exp(),
// ln(), log(), abs(), sqrt(), ceil(), floor(), min(), max(), rand(), fmod(), and round().
var degmath = {
  abs: Math.abs,
  sin: function(x) { return Math.sin(degrad(x)); }, 
  fmod: function(x, m) { return x % m; }, 
  cos: function(x) { return Math.cos(degrad(x)); }, 
  atan: Math.atan, 
};

function QCExpression(params) {
  this.params = params;
  this.outs = {};

  this.update = new Function('with(this.params) with(degmath) this.outs.Result = ' + params.Expression);
}
