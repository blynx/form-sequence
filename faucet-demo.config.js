module.exports = {
  manifest: {
    webRoot: "./demo/"
  },
  watchDirs: [
    "./demo/",
    "./lib/"
  ],
  js: [{
    source: "./demo.js",
    target: "./demo/script.js",
    esnext: true
  }]
}
