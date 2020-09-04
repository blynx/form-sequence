import FormSequence, { configure } from "./lib/form-sequence.js"

configure({
  errorTemplateId: 'error-template',
  // errorTemplateTitlePlace: '.alert-title',
  // errorTemplateMessagePlace: '.alert-message'
})

document.addEventListener("DOMContentLoaded", () => {
  customElements.define("form-sequence", FormSequence)
  Array.from(document.querySelectorAll("form-sequence")).forEach(element => {
    element.addEventListener("done", e => console.log("done triggered", e.target))
    element.addEventListener("success", e => console.log("success triggered", e.target))
    element.addEventListener("error", e => console.log("error triggered", e.target))
  })
})
