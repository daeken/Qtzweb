require 'pp'
require 'rubygems'
require 'sinatra'
require 'sinatra/reloader'
require 'json'
require 'yaml'

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
	scripts = ''
	fns.each do |fn|
		scripts << "<script src=\"#{fn}\"></script>\n" if fn[0] != '_'
	end
	scripts += "<script>#{patchsrc}</script>"
	tpl.gsub '%SCRIPTS%', scripts
end

get '/gen/nodes.js' do
	content_type 'text/javascript'

	src = ''

	nodes = YAML.load_file('../classes.yaml')
	nodes.each {|name, elems|
		inputs = []
		outputs = []
		if elems != '_' and elems.has_key? 'in'
			elems['in'].each {|name|
				inputs << {
					:id => name, 
					:type => 'all'
				}
			}
		end
		if elems != '_' and elems.has_key? 'out'
			elems['out'].each {|name|
				outputs << {
					:id => name, 
					:type => 'all'
				}
			}
		end
		src += <<-eos
( function(Dataflow) {
  var Base = Dataflow.node("base");
  var node = Dataflow.node("#{name}");

  node.Model = Base.Model.extend({
    defaults: {
      label: "",
      type: "#{name}",
      x: 200,
      y: 100
    },
    initialize: function(){
      if (this.get("label")===""){
        this.set({label:"#{name}"+this.id});
      }
      // super
      Base.Model.prototype.initialize.call(this);
    },
    toJSON: function(){
      var json = Base.Model.prototype.toJSON.call(this);
      return json;
    },
    inputs:#{inputs.to_json},
    outputs:#{outputs.to_json}
  });

}(Dataflow) );

		eos
	}
	src
end

get '/*.js' do |fn|
	content_type 'text/javascript'
	contents = nil
	%w{./ ../js/}.each{|dir|
		begin
			contents = preprocess(File.read(dir + fn + '.coffee'))
			break
		rescue
			begin
				x = preprocess(File.read(dir + fn + '.js'))
				return x
			rescue
			end
		end
	}

	halt 404 if contents == nil

	begin
		coffee contents, :bare => true
	rescue
		ret = 'alert("Coffeescript ' + fn + ' failed to compile.");'
		ret += 'console.log("Coffeescript ' + fn + ' failed to compile.");'
		ret += 'console.log(' + $!.to_s.inspect + ');'
	end
end

get '/dataflow.css' do
	content_type "text/css"

	File.read('dataflow/dataflow.css')
end
