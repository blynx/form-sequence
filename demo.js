import FormSequence, { configure } from "./lib/form-sequence.js"

configure({
  errorTemplateId: 'error-template',
  // errorTemplateTitlePlace: '.alert-title',
  // errorTemplateMessagePlace: '.alert-message'
})

document.addEventListener("DOMContentLoaded", () => {
  customElements.define("form-sequence", FormSequence)
})
