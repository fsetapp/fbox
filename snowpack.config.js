module.exports = {
  mount: {
    public: { url: "/", static: true },
    src: { url: "/dist" },
    lib: { url: "/lib" }
  },
  plugins: [
    ["@snowpack/plugin-postcss"]
  ],
}
