let esbuild = require('esbuild')

let result = esbuild.build({
  platform: "neutral",
  entryPoints: ["standalone/json.js"],
  entryNames: "[name]/fset.min",
  bundle: true,
  minify: true,
  treeShaking: true,

  target: ["es2020"],
  outdir: "standalone",
  external: ["snarkdown"],
  metafile: true,
})

result.then(a => {
  esbuild
    .analyzeMetafile(a.metafile, { verbose: true })
    .then(text => console.log(text))
})
