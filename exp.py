from pprint import pprint
from glob import glob
from biplist import readPlist

def fix(name):
	name = name.lstrip('_')
	if name.startswith('input'):
		return name[5:]
	elif name.startswith('output'):
		return name[6:]
	return name

fp = file('classes.yaml', 'w')

for fn in glob('xmls/QC*.xml'):
	cls = fn[7:-4]
	node = readPlist(fn)
	if cls in 'Patch GLSLShader ImageLoader Keyboard OpenCL OSCBroadcaster Splitter'.split(' '):
		continue
	print >>fp, '%s:' % cls
	#pprint(node)

	inp = {}
	outp = {}

	if '.identifiers' in node:
		print >>fp, '  identifiers:'
		for ident, sub in node['.identifiers'].items():
			print >>fp, '    - %s # %s' % (ident, sub['nodeAttributes']['name'])
			if 'inputAttributes' in sub:
				for name, elem in sub['inputAttributes'].items():
					name = fix(name)
					if name not in inp:
						inp[name] = [[], None]
					if not isinstance(elem, dict):
						elem = dict(name=elem)
					inp[name][0].append(elem['name'])
			if 'outputAttributes' in sub:
				for name, elem in sub['outputAttributes'].items():
					name = fix(name)
					if name not in outp:
						outp[name] = []
					outp[name].append(elem['name'])

	if 'inputAttributes' in node:
		for name, info in node['inputAttributes'].items():
			if not isinstance(info, dict):
				continue
			name = fix(name)
			if name not in inp:
				inp[name] = [[], None]
			inp[name][0].append(info['name'])
			if 'menu' in info:
				inp[name][1] = info['menu']

	if 'outputAttributes' in node:
		for name, info in node['outputAttributes'].items():
			name = fix(name)
			if name not in outp:
				outp[name] = []
			outp[name].append(info['name'])

	if len(inp):
		print >>fp, '  in:'
		for name, (names, menu) in inp.items():
			print >>fp, '    - %s # %s' % (name, '/'.join(names))
			if menu:
				for elem in menu:
					print >>fp, '        # %s' % elem

	if len(outp):
		print >>fp, '  out:'
		for name, names in outp.items():
			print >>fp, '    - %s # %s' % (name, '/'.join(names))

	print >>fp
