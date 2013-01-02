import re, sys
from biplist import readPlist
from pprint import pprint
import yaml
import json
try:
  from jsmin import jsmin as jsmin_
except:
  jsmin_ = lambda x: x
import httplib, urllib

basedeps = ['matrix', 'base']
jsdeps = basedeps[:]

packing = False

nameMap = {}
nameI = 0
def genName(name):
  global nameI
  if not packing:
    return name
  if name not in nameMap:
    i = nameI
    nameI += 1
    rep = '_abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'[i % 53]
    i /= 53
    while i:
      rep += '_abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[i % 63]
      i /= 63
    nameMap[name] = rep
  return nameMap[name]

def pruneUserInfo(data):
  if isinstance(data, list):
    map(pruneUserInfo, data)
  elif isinstance(data, dict):
    if 'userInfo' in data:
      del data['userInfo']
    map(pruneUserInfo, data.values())

def fix(name):
  if name.startswith('input') and len(name) > 5:
    name = name[5:]
  elif name.startswith('output') and len(name) > 6:
    name = name[6:]
  if name[0] in '0123456789':
    return '_' + name
  return name

def closureCompile(code):
  params = urllib.urlencode([
      ('js_code', code),
      ('compilation_level', 'ADVANCED_OPTIMIZATIONS'),
      ('output_format', 'text'),
      ('output_info', 'compiled_code'),
    ])

  headers = { "Content-type": "application/x-www-form-urlencoded" }
  conn = httplib.HTTPConnection('closure-compiler.appspot.com')
  conn.request('POST', '/compile', params, headers)
  response = conn.getresponse()
  data = response.read()
  return data

def shadermin(shader):
  out = [shader]
  gsub = lambda x, y, m=False: out.__setitem__(0, re.sub(x, y, out[0], flags=(re.M if m else 0)|re.I))

  gsub(r'//.*$', '')
  gsub(r'\s+', ' ', True)
  gsub(r'/*.*?\*/', '')
  gsub(r'\.0+([^0-9])', r'.\1')
  gsub(r'0+([1-9]+\.[^a-z_])', r'\1')
  gsub(r'0+([1-9]*\.[0-9])', r'\1')
  gsub(r'\s*(;|{|}|\(|\)|=|\+|-|\*|/|\[|\]|,|\.|%|!|~|\?|:|<|>)\s*', r'\1', True)

  return out[0].strip()

def processJS(code):
  out = ''
  while len(code):
    try:
      first, body = code.split('<shader>', 1)
      body, code = body.split('</shader>', 1)
    except:
      out += code
      break
    out += first
    out += repr(shadermin(body))
  return out

def jsmin(code):
  #return closureCompile(code)
  return jsmin_(code)

def rewriteJS(script):
  script = re.sub(r'/\*[\s\S]*?\*/', '', script, flags=re.M)
  script = re.sub(r'//.*$', '', script, flags=re.M)
  prolog, script = script.split('{', 1)
  #params = prolog.split('main', 1)[1]
  #params = params.split('(', 1)[1].split(')', 1)[0].split(',')
  #params = [param.strip().split(' ')[-1] for param in params]
  script = 'function(params) { with(params) { ' + script + '}'
  return script

def dump(plist):
  #pprint(plist)
  def dumpNode(obj, tab=0):
    def line(x, i=0):
      print '  ' * (tab+i) + x

    line('patch:')
    if 'connections' in obj['state']:
      connections = obj['state']['connections'].values()
    else:
      connections = []
    nodes = obj['state']['nodes']

    anodes = {}
    for node in nodes:
      snode = None
      if 'nodes' in node['state']:
        snode = node
      anodes[node['key']] = (node['class'], node['identifier'] if 'identifier' in node else None, [], [], snode)
      state = node['state']
      if 'customInputPortStates' in state:
        for name in state['customInputPortStates']:
          name = fix(name)
          if name not in anodes[node['key']][2]:
            anodes[node['key']][2].append(name)
      if 'ivarInputPortStates' in state:
        for name in state['ivarInputPortStates']:
          name = fix(name)
          if name not in anodes[node['key']][2]:
            anodes[node['key']][2].append(name)
      if 'fragmentShader' in state:
        anodes[node['key']][2].append('FragmentShader')
      if 'vertexShader' in state:
        anodes[node['key']][2].append('VertexShader')
      if 'expression' in state:
        anodes[node['key']][2].append('Expression')
      for key in state:
        anodes[node['key']][2].append('__state.' + key)

    for conn in connections:
      dest = fix(conn['destinationPort'])
      if dest not in anodes[conn['destinationNode']][2]:
        anodes[conn['destinationNode']][2].append(dest)
      src = fix(conn['sourcePort'])
      if src not in anodes[conn['sourceNode']][3]:
        anodes[conn['sourceNode']][3].append(src)

    for name, (cls, format, inp, out, snode) in anodes.items():
      line('%s(%s%s):' % (name, cls, '.' + format if format else ''), 1)
      if inp:
        line('in:', 2)
        for elem in inp:
          line('- %s' % elem, 3)
      if out:
        line('out:', 2)
        for elem in out:
          line('- %s' % elem, 3)
      if snode:
        dumpNode(snode, tab+2)

  dumpNode(plist['rootPatch'])
  print

class Node(object):
  _inports = ''
  _outports = ''

  def __init__(self):
    self.format = None
    self.cls = self.__class__.__name__
    if self.cls not in jsdeps:
      jsdeps.append(self.cls)
    self.outports = {}
    for port in self._outports:
      port = fix(str(port))
      if port not in self.outports:
        self.outports[port] = OutPort(self, port)

    self.inports = {}
    for port in self._inports:
      port = fix(str(port))
      if port not in self.inports:
        self.inports[port] = None

    self.sub = self.func = None

  def outport(self, name):
    name = fix(name)
    if name not in self.outports:
      self.outports[name] = OutPort(self, name)
    return self.outports[name].ref()

  def inport(self, name, value):
    self.inports[fix(name)] = value

class OutPort(object):
  def __init__(self, srcnode, srcport):
    self.srcnode, self.srcport = srcnode, srcport
    self.refs = 0

  def ref(self):
    self.refs += 1
    return self

  def code(self):
    if self.srcnode.cls == 'QCIteratorVariables':
      return 'this.%s' % self.srcport
    return 'this.nodes.%s.outs.%s' % (self.srcnode.name, self.srcport)

class QCPatch(Node):
  def __init__(self, patch):
    Node.__init__(self)

    if 'key' in patch:
      if patch['class'] == 'QCPatch':
        self.name = patch['key']
      else:
        self.name = '__patch__' + patch['key']
      self.name += str(id(self))
    else:
      self.name = 'rootPatch'
    self.name = genName(self.name)
    self.nodes = {}
    deps = {}
    state = patch['state']
    for elem in state['nodes']:
      if elem['class'] == 'QCPatch':
        self.nodes[genName(elem['key'])] = QCPatch(elem)
        deps[genName(elem['key'])] = []
        continue

      try:
        node = globals()[elem['class']]()
      except:
        print 'No class', elem['class']
        sys.exit()
      node.name = genName(elem['key'])
      if 'identifier' in elem:
        node.format = elem['identifier']
      estate = elem['state']

      _statemap = dict(
        fragmentShader='FragmentShader', 
        vertexShader='VertexShader', 
        expression='Expression', 
        outputCount='OutputCount', 
        inputCount='InputCount', 
        portClass='PortClass', 
        resetOutputs='ResetOutputs', 
        numberOfLights='NumberOfLights', 
        slices='Slices', 
        stacks='Stacks', 
        operationCount='OperationCount', 
      )

      if 'customInputPortStates' in estate:
        for k, v in estate['customInputPortStates'].items():
          if 'value' in v:
            node.inport(k, v['value'])
      if 'ivarInputPortStates' in estate:
        for k, v in estate['ivarInputPortStates'].items():
          node.inport(k, v['value'])
      for k, v in _statemap.items():
        if k in estate:
          node.inport(v, estate[k])
      if 'systemInputPortStates' in estate and '_enable' in estate['systemInputPortStates']:
        node.inport('_enable', estate['systemInputPortStates']['_enable']['value'])

      if 'nodes' in estate:
        node.sub = QCPatch(elem)
      if 'script' in estate:
        node.func = rewriteJS(estate['script'])

      self.nodes[node.name] = node
      deps[node.name] = []

    if 'connections' in state:
      for v in state['connections'].values():
        source = genName(v['sourceNode']), v['sourcePort']
        dest = genName(v['destinationNode']), v['destinationPort']
        sport = self.nodes[source[0]].outport(source[1])
        self.nodes[dest[0]].inport(dest[1], sport)
        if source[0] not in deps[dest[0]]:
          deps[dest[0]].append(source[0])

    # XXX: We should preserve node order in the plist but still handle deps.
    self.order = []
    for name, v in deps.items():
      if self.nodes[name].cls == 'QCClear':
        del deps[name]
        self.order.append(name)
    while len(deps):
      for name, v in deps.items():
        for dep in v:
          if dep not in deps:
            v.remove(dep)
        if not len(v):
          self.order.append(name)
          del deps[name]

  def code(self):
    code = '%s = new QCPatch();\n' % self.name
    for name in self.order:
      node = self.nodes[name]
      if node.cls == 'QCIteratorVariables':
        continue
      args = {}
      if node.format:
        args['_format'] = node.format
      for pname, value in node.inports.items():
        if not isinstance(value, OutPort):
          args[pname] = value
      if node.sub:
        code += node.sub.code()
      if node.cls == 'QCPatch':
        code += '%s.nodes.%s = %s' % (self.name, node.name, node.code())
      else:
        code += '%s.nodes.%s = new %s(%s%s%s);\n' % (self.name, name, node.cls, (node.func + ', ') if node.func else '', (node.sub.name + ', ') if node.sub else '', json.dumps(args))
    code += '%s.update(function() {\n' % self.name
    for name in self.order:
      node = self.nodes[name]
      name = node.name
      if node.cls == 'QCIteratorVariables':
        continue
      for pname, value in node.inports.items():
        if isinstance(value, OutPort):
          code += '\tthis.nodes.%s.params.%s = %s;\n' % (name, pname, value.code())
      code += '\tthis.nodes.%s.update();\n' % name
    code += '});\n'
    return code

classes = yaml.load(file('classes.yaml').read())

for name, elem in classes.items():
  body = dict()
  if 'in' in elem:
    body['_inports'] = elem['in']
  if 'out' in elem:
    body['_outports'] = elem['out']
  globals()['QC' + name] = type('QC' + name, (Node, ), body)

def main(fn, audio='none', debug=False):
  global packing

  data = readPlist(fn)
  try:
    del data['templateImageData']
  except:
    pass
  pruneUserInfo(data)

  #print '<pre>'
  #dump(data)
  #print '</pre>'
  #print '<h1>QtzWeb</h1>'

  if not debug:
    packing = True

  root = QCPatch(data['rootPatch'])
  print '<style>body { margin: 0; overflow: hidden; }</style>'
  if audio != 'none':
    print '<audio id="track"', 
    if debug:
      print 'controls', 
    print 'preload="auto" autobuffer>'
    print '<source src="' + audio + '.mp3">'
    print '<source src="' + audio + '.ogg">'
    print '</audio>'
  if debug:
    print '<div id="time"></div>'
  elif audio == 'none':
    print '<span>'
  print '<script>'
  code = root.code()
  deps = ''
  for depcls in jsdeps:
    try:
      dep = file('js/' + depcls + '.js').read()
      if debug and depcls not in basedeps:
        print >>sys.stderr, 'Patch used:', depcls
    except:
      print >>sys.stderr, 'Unsupported patch class:', depcls
    else:
      deps += processJS(dep)
  deps += 'init();'
  code = deps + code
  if debug:
    print code
  else:
    print jsmin(code)
  print 'run(' + root.name + ', document.getElementById("track"), document.getElementById("time"));'
  print '</script>'

if __name__=='__main__':
  sys.exit(main(*sys.argv[1:]))
