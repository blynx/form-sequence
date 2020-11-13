import FormSequence, { configure } from "./lib/form-sequence.js"

configure({
  errorTemplateId: 'error-template',
  // errorTemplateTitlePlace: '.alert-title',
  // errorTemplateMessagePlace: '.alert-message'
})

document.addEventListener("DOMContentLoaded", () => {
  customElements.define("form-sequence", FormSequence)
  Array.from(document.querySelectorAll("form-sequence")).forEach(element => {
    element.addEventListener("start", e => console.log("start triggered", e.target, e.detail))
    element.addEventListener("done", e => console.log("done triggered", e.target))
    element.addEventListener("success", e => console.log("success triggered", e.target))
    element.addEventListener("error", e => console.log("error triggered", e.target, e.detail))
    element.addEventListener("return", e => console.log("return triggered", e.target))
    element.addEventListener("cancel", e => console.log("cancel triggered", e.target))

    element.addEventListener("return", e => {
      alert("Form sequence returned. Will do page reload!")
      window.location.href = e.detail.url.href
    })

    element.addEventListener("cancel", e => {
      console.log("cancel --->", e)
      alert("Form sequence cancelled. Will do page reload!")
      window.location.href = e.detail.homeUrl.href
    })
  })
})
