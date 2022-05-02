let esbuild = require("esbuild")

const commonOpts = {
  platform: "neutral",
  bundle: true,
  minify: true,
  treeShaking: true,
  metafile: true,
  sourcemap: true,
  target: ["es2020"],
}

const report = result =>
  result.then(a => {
    esbuild
      .analyzeMetafile(a.metafile, { verbose: true })
      .then(text => console.log(text))
  })

const buildOne = pkg => {
  let result = esbuild.build({
    ...commonOpts,
    platform: "neutral",
    entryPoints: [`lib/pkgs/${pkg}/index.js`],
    entryNames: `${pkg}.es`,
    outdir: `lib/pkgs/${pkg}/dist`,
  })
  report(result)
}

buildOne("model")
buildOne("json")
result = esbuild.build({
  ...commonOpts,
  entryPoints: ["lib/main.js", "lib/pkgs/model/index.js", "lib/main.css"],
  entryNames: "[dir]/[name]",
  chunkNames: "chunks/[name]-[hash]",
  mainFields: ["main"],
  splitting: true,
  outdir: "lib/pkgs/fset/dist"
})
report(result)
