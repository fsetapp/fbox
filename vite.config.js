export default {
  root: "public",
  mode: "production",
  build: {
    rollupOptions: {
      input: {
        "main.css": "lib/main.css",
        "model.css": "lib/css/model.css",
        "sch-meta.css": "lib/css/sch-meta.css",
        "file.css": "lib/css/file.css",
        "sheet.css": "lib/css/sheet.css",
        "html.css": "lib/css/html.css",
        "json.css": "lib/css/json.css",
      },
      output: {
        // entryFileNames: "[name]",
        // chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "[ext]/[name][extname]",
      }
    },
    target: "esnext",
    outDir: "../lib/pkgs/fset/dist",
    emptyOutDir: false,
    sourcemap: !process.env.PUBLISH,
    minify: !!process.env.PUBLISH
  }
}
