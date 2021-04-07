module.exports = {
  mount: {
    public: { url: "/", static: true },
    lib: { url: "/lib" }
  },
  plugins: [
    ["@snowpack/plugin-postcss"]
  ],
}
