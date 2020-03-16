export function queryInHtmlString(string, query) {
  let helperNode = document.createElement("div")
  helperNode.innerHTML = string
  return helperNode.querySelector(query)
}

export function nameOrId(s) {
  return `#${s}, [name="${s}"]`
}
