process.env.NODE_ENV = "test";

export default {
  coverage: true,
  nodeResolve: true,
  esbuildTarget: "es2020",
  files: ["./test/**/*.test.js"],
  coverageConfig: {
    exclude: ["**/node_modules/**/*", "**/test/**/*"],
  }
}
