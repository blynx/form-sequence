require('browser-env')()
let test = require("ava")

let nameOrId = require("../lib/utilities.js").nameOrId
let htmlNodeFromString = require("../lib/utilities.js").htmlNodeFromString

test("utility: nameOrId()", t => {
  let name = "pete"
  let expected = '#pete, [name="pete"]'
  let result = nameOrId(name)

  t.is(result, expected, "builds a correct query string")
})

test("utility: htmlNodeFromString()", t => {
  let node = htmlNodeFromString("<html><head><title>bye</title></head><body><div><p>yep</p></div></body></html>", "p")
  t.is(node instanceof HTMLDivElement, true, "returns a div dom node from string")
})
