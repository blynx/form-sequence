let test = require("ava")

let nameOrId = require("../lib/utilities.js").nameOrId

test("utility: nameOrId()", t => {
  let name = "pete"
  let expected = '#pete, [name="pete"]'
  let result = nameOrId(name)

  t.is(result, expected, "builds a correct query string")
})
