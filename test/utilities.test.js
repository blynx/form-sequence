require('browser-env')()
let test = require("ava")

let nameOrId = require("../lib/utilities.js").nameOrId
let queryInHtmlString = require("../lib/utilities.js").queryInHtmlString

test("utility: nameOrId()", t => {
  let name = "pete"
  let expected = '#pete, [name="pete"]'
  let result = nameOrId(name)

  t.is(result, expected, "builds a correct query string")
})

test("utility: queryInHtmlString()", t => {
  let node = queryInHtmlString("<html><head><title>bye</title></head><body><div><p>yep</p></div></body></html>", "p")
  t.is(node.textContent, "yep", "queries a single node in a string of html")
})
