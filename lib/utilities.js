export function htmlNodeFromString(string) {
  let node = document.createElement("div")
  node.innerHTML = string
  return node
}

export function namesOrIds(string) {
  return string
    .split(",")
    .map(s => `#${s.trim()},[name="${s.trim()}"]`)
    .join()
}
