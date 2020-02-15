export function queryFormInDocumentString(formName, documentString) {
  let dom = document.createRange().createContextualFragment(documentString)
  return dom.querySelector(`form[name="${formName}"]`)
}

export function nameOrId(s) {
  return `#${s}, [name="${s}"]`
}