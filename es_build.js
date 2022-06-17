let esbuild = require("esbuild")

const commonOpts = {
  platform: "neutral",
  bundle: true,
  minify: !!process.env.PUBLISH,
  treeShaking: true,
  metafile: true,
  sourcemap: !process.env.PUBLISH,
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

// buildOne("model")
// buildOne("json")
// buildOne("html")
result = esbuild.build({
  ...commonOpts,
  entryPoints: [
    "lib/main.css",
    "lib/css/file.css",
    "lib/css/sheet.css",
    "lib/css/html.css",
    "lib/css/json.css",

    "lib/main.js",
    "lib/pkgs/file/index.js",
    "lib/pkgs/model/index.js",
    "lib/pkgs/json/index.js",
    "lib/pkgs/html/index.js",
    "lib/pkgs/sheet/index.js"
  ],
  entryNames: "[dir]/[name]",
  chunkNames: "chunks/[name]-[hash]",
  mainFields: ["main"],
  splitting: true,
  outdir: "lib/pkgs/fset/dist"
})
report(result)
