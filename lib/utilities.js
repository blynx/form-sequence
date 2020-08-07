export function htmlNodeFromString(string) {
  let node = document.createElement("div")
  node.innerHTML = string
  return node
}

export function nameOrId(s) {
  return `#${s}, [name="${s}"]`
}
