require 'pp'
require 'rubygems'
require 'sinatra'
require 'sinatra/reloader'

def patchsrc
	''
end

def shadermin(shader)
	shader.gsub! /\/\/.*$/, ''
	shader.gsub! /\s+/m, ' '
	shader.gsub! /\/\*.*?\*\//, ''
	shader.gsub! /\.0+([^0-9])/, '.\1'
	shader.gsub! /0+([1-9]+\.[^a-z_])/i, '\1'
	shader.gsub! /0+([1-9]*\.[0-9])/, '\1'
	shader.gsub! /\s*(;|\{|\}|\(|\)|=|\+|-|\*|\/|\[|\]|,|\.|%|!|~|\?|:|<|>)\s*/m, '\1'
	shader.strip!
	shader
end

def preprocess(src)
	src.gsub /<shader>(.*?)<\/shader>/m do |body|
		shadermin(body[8...-9]).inspect
	end
end

get '/' do
	tpl = File.read 'index.html'
	fns = []
	Dir.glob('*.coffee').each do |fn|
		fns << fn.gsub('.coffee', '.js')
	end
	(Dir.glob('*.js') + Dir.glob('../js/*.js')).each do |fn|
		fns << fn.split('/').last
	end
	fns.sort!
	scripts = "<script>#{patchsrc}</script>"
	fns.each do |fn|
		scripts << '<script src="' + fn + '"></script>'
	end
	tpl.gsub '%SCRIPTS%', scripts
end

get '/*.js' do |fn|
	content_type "text/javascript"
	begin
		contents = preprocess(File.read(fn + '.coffee'))
	rescue
		begin
			return preprocess(File.read fn + '.js')
		rescue
			return preprocess(File.read '../js/' + fn + '.js')
		end
	end
	begin
		coffee contents, :bare => true
	rescue
		ret = 'alert("Coffeescript ' + fn + ' failed to compile.");'
		ret += 'console.log("Coffeescript ' + fn + ' failed to compile.");'
		ret += 'console.log(' + $!.to_s.inspect + ');'
	end
end
