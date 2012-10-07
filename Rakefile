# This rakefile:
# -compiles coffee scripts
# -compiles templates
# -compiles stylus styles
# -eventually cleans up web to be a dist only thinger


#node ../../r.js -o name=main out=main-built.js baseUrl=. paths.css=vendor/amd_plugins/css paths.text=vendor/amd_plugins/text

require 'rake'
require 'fileutils'

myDir = Dir.pwd

cmdPprefix = ""
if ENV['OS'] != nil
	if ENV['OS']['Windows'] != nil
		cmdPrefix = "powershell "
	end
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

# TODO: add the ability to watch js files for changes
task :copyjs, :watch do |t, args|
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

task :copyresources, :watch do |tar, args|
	FileList["src/main/resources/**/*"].exclude(/templates/).each do |fname|
		if not File.directory? fname
			dest = File.dirname(fname).sub("src/main/resources", "web/scripts")
			FileUtils.mkdir_p dest
			FileUtils.cp fname, dest
		end
	end
end

task :devbuild => [:coffee, :templates, :copyjs, :copyresources] do
end

task :clean do
	FileUtils.rm_rf "web/scripts"
end

task :productionbuild => [:coffee, :templates, :copyjs, :copyresources, :minify] do
end

task :compileStylus do
end

task :buildVendor do
	system "#{cmdPrefix}rm web/scripts/vendor/vendor-built.js"
	system "#{cmdPrefix}rm web/scripts/vendor/temp/*"
	FileList["web/scripts/vendor/*.js"].each do |fname|
		system %{uglifyjs #{fname} > web/scripts/vendor/temp/#{File.basename(fname, ".js")}.min.js}
	end

	if cmdPrefix != ""
		system %{type web\\scripts\\vendor\\temp\\* >> web\\scripts\\vendor\\vendor-built.js}
	else
		system %{cat web/scripts/vendor/temp/* >> web/scripts/vendor/vendor-built.js}
	end
end

task :zipForLocal => [:coffee, :templates] do
	system "tar -c web > Strut.tar"
	system "gzip Strut.tar"
end

task :docs do
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