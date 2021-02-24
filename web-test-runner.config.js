process.env.NODE_ENV = "test";

module.exports = {
  coverage: true,
  nodeResolve: true,
  esbuildTarget: "auto",
  files: ["./test/**/*.test.js"],
  coverageConfig: {
    exclude: ["**/*/_snowpack/**/*"],
  },
  /* plugins: [require("@snowpack/web-test-runner-plugin")()], */
}
