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
def dump(elems, title, color):
	global header, body
	header += '<font color=%s>%s</font>: <b>%i/%i</b><br>' % (color, title, len(elems), len(classes))
	body += '<br><h1>%s:</h1>' % (title)
	body += '<ul>'
	for elem in sorted(elems):
		body += '<li><font color="%s">%s</font></li>' % (color, elem)
	body += '</ul>'

dump(completed, 'Completed', 'green')
dump(partial, 'Partial', 'blue')
dump(nil, 'Not implemented', 'red')

fp = file('Compatibility.html', 'w')
fp.write(header+body)
fp.close()
