import yaml

classes = yaml.load(file('classes.yaml').read())

completed = []
partial = []
nil = []
for cls in classes.keys():
	try:
		js = file('js/QC%s.js' % cls, 'r').read()
		if '// PARTIAL' in js:
			partial.append(cls)
		else:
			completed.append(cls)
	except:
		nil.append(cls)

header = ''
body = ''
def dump(elems, title):
	global header, body
	header += '%s: **%i/%i**  \n' % (title, len(elems), len(classes))
	body += '\n'
	body += '#%s:\n\n' % (title)
	for elem in sorted(elems):
		body += '- %s\n' % elem

dump(completed, 'Completed')
dump(partial, 'Partial')
dump(nil, 'Not implemented')

fp = file('Compatibility.md', 'w')
fp.write(header+body)
fp.close()
