import analyze from 'rollup-plugin-analyzer'

export default {
  mode: "production",
  root: "standalone",
  // Use esbuild directly for build: ROOT/es_build.js
  // build: {
  //   target: "es2020",
  //   minify: true,
  //   outDir: "vite_build",
  //   emptyOutDir: true,
  //   lib: {
  //     entry: "./json.js",
  //     name: "fset-json",
  //     formats: ["es"],
  //     fileName: (_) => "fset-json.js"
  //   },
  //   rollupOptions: {
  //     input: ["standalone/json.js"],
  //     output: [{
  //       entryFileNames: "[name]/[name].min.js",
  //       assetFileNames: "[ext]/[name][extname]",
  //       format: "es"
  //     }]
  //   },
  //   assetsInlineLimit: 0
  // },
  plugins: [analyze()]
}
