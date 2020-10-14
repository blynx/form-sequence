require('browser-env')()
let test = require("ava")

let namesOrIds = require("../lib/utilities.js").namesOrIds
let htmlNodeFromString = require("../lib/utilities.js").htmlNodeFromString

test("utility: namesOrIds()", t => {
  let list = "this, or, that"
  let expected = '#this,[name="this"],#or,[name="or"],#that,[name="that"]'
  let result = namesOrIds(list)

  t.is(result, expected, "builds a correct query string from comma separated list")
})

test("utility: htmlNodeFromString()", t => {
  let node = htmlNodeFromString("<html><head><title>bye</title></head><body><div><p>yep</p></div></body></html>", "p")
  t.is(node instanceof HTMLDivElement, true, "returns a div dom node from string")
})
