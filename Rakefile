LANG="en_US.UTF-8"
LC_ALL="en_US.UTF-8"

require 'rake'
require 'fileutils'


myDir = Dir.pwd

def setWinPath()
	ENV['PATH'] = '.\\node_modules\\.bin;' + ENV['PATH']
end

def setNixPath()
	ENV['PATH'] = './node_modules/.bin:' + ENV['PATH']
end

cmdPprefix = ""
if ENV['OS'] != nil
	if ENV['OS']['Windows'] != nil
		cmdPrefix = "powershell "
		setWinPath()
	else
		setNixPath()
	end
else
	setNixPath()
end

task :updateCoffeeIgnore do
	system "./updateCoffeeIgnore.sh"
end

task :coffee, :watch do |t,args|
	watch = ""
	if args[:watch]
		watch = "--watch"
	end

	system %{coffee #{watch} -b --compile --output web/scripts/ src/main/coffee}
end

# TODO: add the ability to watch templates for changes
task :templates, :pretty do |t, args|
	FileList[myDir + "/src/main/resources/ui/**/templates"].each do |filename|
		pretty = args[:pretty]
		puts "Processing: #{filename}"
		compiledTemplates = '''
		define(["vendor/amd/Handlebars"], function(Handlebars) {
			return {
		'''

		first = true
		FileList["#{filename}/*.bars"].each do |fname|
			pipe = IO.popen("handlebars -s #{fname}")
			result = pipe.readlines
			pipe.close

			joined = result.join
			if not pretty
				joined = joined.gsub(/\\r\\n|\n|\\n/, "");
			end
			templateFileName = File.basename(fname, ".bars");

			if first
				compiledTemplates += "\n\"#{templateFileName}\": Handlebars.template(#{joined})"
				first = false
			else
				compiledTemplates += ",\n\"#{templateFileName}\": Handlebars.template(#{joined})"
			end
  		end

  		destination = filename.sub("/src/main/resources/ui/", "/web/scripts/ui/").sub("/templates", "")
  		FileUtils.mkdir_p destination
  		puts "#{destination}/Templates.js"
  		File.open("#{destination}/Templates.js", 'w') {|f|
  			f.write(compiledTemplates)
  			f.write("\n}});");
  		}
	end
end

task :copyjs, :watch do |t, args|
	puts "Copying intial js files"
	FileList["src/main/js/**/*.js"].each do |fname|
		dest = File.dirname(fname).sub("src/main/js", "web/scripts")
		FileUtils.mkdir_p dest
		FileUtils.cp fname, dest
	end

	FileList["src/vendor/**/*.js"].each do |fname|
		dest = File.dirname(fname).sub("src/vendor", "web/scripts/vendor")
		FileUtils.mkdir_p dest
		FileUtils.cp fname, dest
	end
end

def copyResources(destination)
	puts "Copying initial resources"
	FileList["src/main/resources/**/*"].exclude(/templates/).each do |fname|
		if not File.directory? fname
			dest = File.dirname(fname).sub("src/main/resources", destination)
			FileUtils.mkdir_p dest
			FileUtils.cp fname, dest
		end
	end
end

task :copyresources, :watch do |t, args|
	copyResources "web/scripts"
end

task :devbuild, [:watch] => [:coffee, :templates, :copyjs, :copyresources] do |t, args|
end

task :clean do
	FileUtils.rm_r "web/scripts"
	FileUtils.rm_r "web-dist"
end

task :minify => [:buildVendor] do
	puts "Minifying"
	Dir.chdir("web/scripts") do
		system "node ../../r.js -o name=main out=main-built.js baseUrl=. paths.css=vendor/amd_plugins/css paths.text=vendor/amd_plugins/text"
	end
end

task :productionbuild => [:coffee, :templates, :copyjs, :copyresources, :minify] do
	distDir = "web-dist"

	FileUtils.mkdir_p "#{distDir}/scripts/vendor"

	FileUtils.cp_r "web/preview_export", distDir
	FileUtils.cp_r "web/zip", distDir
	FileUtils.cp_r "web/res", distDir

	FileUtils.cp "web/scripts/main-built.js", "#{distDir}/scripts"
	FileUtils.cp "web/scripts/vendor/vendor-built.js", "#{distDir}/scripts/vendor"
	FileUtils.cp "web/scripts/vendor/require.js", "#{distDir}/scripts/vendor"

	copyResources "#{distDir}/scripts"

	ignore = false
	newIndex = File.open("#{distDir}/index.html", "w")
	File.readlines("web/index.html").each do |line|
		if not ignore
			newIndex.write line
		end

		# just keep a map of "tagname" -> "replacement"
		if line["/VENDOR"]
			ignore = false
		elsif line["VENDOR"]
			newIndex.write '<script type="text/javascript" src="scripts/vendor/vendor-built.js"></script>'
			ignore = true
		elsif line["/MAIN"]
			ignore = false
		elsif line["MAIN"]
			newIndex.write '<script type="text/javascript" data-main="scripts/main-built" src="scripts/vendor/require.js"></script>'
			ignore = true
		end
	end
end

task :compileStylus do
end

task :buildVendor do
	puts "Minifying vendor"
	FileUtils.mkdir_p "web/scripts/vendor/temp"
	system "#{cmdPrefix}rm web/scripts/vendor/vendor-built.js"
	system "#{cmdPrefix}rm web/scripts/vendor/temp/*"
	FileList["web/scripts/vendor/*.js"].exclude(/require/).each do |fname|
		system %{uglifyjs #{fname} > web/scripts/vendor/temp/#{File.basename(fname, ".js")}.min.js}
	end

	if cmdPrefix != ""
		system %{type web\\scripts\\vendor\\temp\\* >> web\\scripts\\vendor\\vendor-built.js}
	else
		system %{cat web/scripts/vendor/temp/* >> web/scripts/vendor/vendor-built.js}
	end

	FileUtils.rm_r "web/scripts/vendor/temp"
end

task :zipForLocal => [:coffee, :templates] do
	system "tar -c web > Strut.tar"
	system "gzip Strut.tar"
end

# yuidoc only parses javascript code (afaik) so we have to compile it first.
task :docs => [:coffee, :copyjs] do
	system %{yuidoc web/scripts -o docs}
end

task :refactor, :source, :destination do |t, args|
	source = args[:source]
	destination = args[:destination]

	if !destination
		puts "usage: rake refactor[source,destination]"
		exit
	end

	FileList["./**/*.js"].each do |fname|
		#puts fname
		pipe = IO.popen("amdRefactor #{source} < #{fname}")
		result = pipe.readlines
		pipe.close

		if result.length > 0
			# line col_start col_end
			importLoc = result[0].split(",")
			line = Integer(importLoc[0]) - 1
			colStart = Integer(importLoc[1]) - 1
			colEnd = Integer(importLoc[2])

			lines = File.readlines(fname);
			theLine = lines[line]
			theLine = 
				"#{theLine[0..colStart]}#{destination}#{theLine[colEnd..theLine.length]}"

			lines[line] = theLine

			puts "Refactoring: #{fname}"
			File.open(fname, 'w') { |f| f << lines }
			#puts lines
		end
	end
end

task :showDeps, :package do |t, args|
	myPkg = args[:package]

	if !myPkg
		puts "usage: rake showDeps[package]"
		exit
	end

	FileList["web/scripts/#{myPkg}/**/*.js"].each do |fname|
		pipe = IO.popen("amdDeps #{myPkg} < #{fname}")
		result = pipe.readlines
		pipe.close

		if result.length > 0
			puts result
		end
	end
end