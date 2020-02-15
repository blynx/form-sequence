module.exports = {
  js: [{
    source: "./lib/form-sequnce.js",
    target: "./dist/form-sequnce.js",
    esnext: true
  }, {
    source: "./lib/form-sequnce.js",
    target: "./dist/form-sequnce.min.js",
    esnext: true,
    compact: "mangle"
  }]
}
