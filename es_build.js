let esbuild = require("esbuild")

const buildOne = pkg => {
  let result = esbuild.build({
    platform: "neutral",
    entryPoints: [`lib/pkgs/${pkg}/index.js`],
    entryNames: `${pkg}.es`,
    bundle: true,
    minify: true,
    treeShaking: true,

    target: ["es2020"],
    outdir: `lib/pkgs/${pkg}/dist`,
    metafile: true,
    sourcemap: true,
  })

  result.then(a => {
    esbuild
      .analyzeMetafile(a.metafile, { verbose: true })
      .then(text => console.log(text))
  })
}
buildOne("model")
buildOne("json")

result = esbuild.build({
  platform: "neutral",
  entryPoints: ["lib/main.js", "lib/main.css"],
  entryNames: "fset.min",
  bundle: true,
  minify: true,
  treeShaking: true,

  mainFields: ["main"],
  target: ["es2020"],
  outdir: "build/dist",
  metafile: true,
  sourcemap: true,
})

result.then(a => {
  esbuild
    .analyzeMetafile(a.metafile, { verbose: true })
    .then(text => console.log(text))
})
