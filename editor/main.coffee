class Node
	constructor: (@svg, x, y) ->
		@dragStart = null
		@translate = [x, y]
		@build()

	build: ->
		@elem = @svg.append('g')
			.style('opacity', 0.5)
			.style('-webkit-transform', 'translate(' + @translate[0] + 'px, ' + @translate[1] + 'px)')
			.style('-moz-transform', 'translate(' + @translate[0] + 'px, ' + @translate[1] + 'px)')
			.on('mouseover', @mouseover)
			.on('mouseout', @mouseout)
			.on('mousedown', @mousedown)
			.on('mouseup', @mouseup)
			.on('mousemove', @mousemove)

		@elem.append('rect')
			.style('fill', '#aaa')
			.style('stroke', 'black')
			.attr('rx', 45)
			.attr('width', 400).attr('height', 300)

	mouseover: =>
		@elem.transition()
			.duration(1000)
			.style('opacity', 1)
	mouseout: =>
		@dragStart = null
		@elem.transition()
			.duration(1000)
			.style('opacity', 0.5)

	mousedown: =>
		@dragStart = d3.mouse @svg.node()
	mouseup: => @dragStart = null
	mousemove: =>
		return if !@dragStart
		mouse = d3.mouse @svg.node()
		@translate[0] += mouse[0] - @dragStart[0]
		@translate[1] += mouse[1] - @dragStart[1]
		@dragStart = mouse
		@elem.style('-webkit-transform', 'translate(' + @translate[0] + 'px, ' + @translate[1] + 'px)')
		@elem.style('-moz-transform', 'translate(' + @translate[0] + 'px, ' + @translate[1] + 'px)')

$(document).ready ->
	svg = d3.select('#graph')
		.append('svg')
		.attr('width', 800).attr('height', 600)

	node = new Node svg, 100, 100
