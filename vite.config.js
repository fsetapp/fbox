export default {
  root: "public",
  mode: "production",
  // Use esbuild directly for build: ROOT/es_build.js
  // build: {
  //   root: "/",
  //   target: "es2020",
  //   minify: true,
  //   outDir: "../build/dist",
  //   emptyOutDir: true,
  //   rollupOptions: {
  //     input: ["lib/main.js", "lib/main.css"],
  //     output: {
  //       entryFileNames: "[name].js",
  //       chunkFileNames: "[name][extname]",
  //       assetFileNames: "[name][extname]"
  //     }
  //   },
  //   assetsInlineLimit: 0
  // }
}
