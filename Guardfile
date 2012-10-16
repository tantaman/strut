# TODO: Share the code that is common between the Rakefile and Guardfile

system 'rake devbuild'

guard 'coffeescript', :input => 'src/main/coffee', :output => 'web/scripts'

guard 'shell' do
	watch(%r{src/main/js/.+\.js}) {|m| 
		copyItem("src/main/js", "web/scripts", m[0])
	}

	watch(%r{src/main/resources/.+\.(css|png|jpg|gif)}) { |m|
		copyItem("src/main/resources", "web/scripts", m[0])
	}
end

guard 'rake', :task => 'templates' do
	watch(%r{src/main/resources/.*/templates/.*\.bars})
end

guard 'livereload' do
  watch(%r{web/.+\.(css|js|html|png|jpg|gif)})
end

def copyItem(srcPrefix, destPrefix, fname)
	dest = File.dirname(fname).sub(srcPrefix, destPrefix)
	FileUtils.mkdir_p dest
	FileUtils.cp fname, dest
end
