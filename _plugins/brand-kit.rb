require "fileutils"

Jekyll::Hooks.register :polyglot, :post_write do |site|
  kit = site.data.fetch("resources").fetch("brand_kit")
  archive = File.join(site.dest, kit.fetch("file").delete_prefix("/"))
  FileUtils.mkdir_p(File.dirname(archive))
  FileUtils.rm_f(archive)
  system("zip", "-q", "-r", archive, "Manual de Marca",
         chdir: File.join(site.source, "assets", kit.fetch("version")), exception: true)
end
