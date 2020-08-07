import { htmlNodeFromString, nameOrId } from "./utilities.js"

let states = {
  LOADING: "loading",
  ERROR: "error",
  DONE: "done"
}

let config = {
  errorTitleSelector: "h1",
  errorMessageSelector: "pre",
  errorTemplateId: "error-template",
  errorTemplateTitlePlace: "h1, h2, h3, h4, h5, h6, [role=\"title\"]",
  errorTemplateMessagePlace: "p"
}

export function configure(c) {
  Object.assign(config, c)
}

export default class FormSequence extends HTMLElement {

  connectedCallback() {
    this._isFirstStep = true
    this._homePathname = window.location.pathname
    this._origin = this.querySelector(nameOrId(this.getAttribute("capture")))

    let startUrl = this._origin ? this._origin.getAttribute("href") : null
    if (startUrl) {
      this._additionalHiddenInputs = this.querySelector('input[type="hidden"]')
      this._formName = this.getAttribute("form")
      this._origin.addEventListener("click", event => this.handleNextStep(event, startUrl))
    }
  }

  initFrame() {
    let heading = this._origin.textContent.trim() || ""
    let frame = document.createRange().createContextualFragment(
      '<div role="heading"></div><div origin></div><div remote></div>')

    let headingElement = frame.querySelector('[role="heading"]')
    let originContainer = frame.querySelector("[origin]")
    let remoteContainer = frame.querySelector("[remote]")

    if (heading !== "") headingElement.textContent = heading

    window.requestAnimationFrame(() => {
      originContainer.append(this._origin)
      this.append(frame)
    })

    this._remoteContainer = remoteContainer
  }

  handleNextStep(event, url) {
    if (this._isFirstStep) {
      event.preventDefault()
      this.closeAll()
    }

    let responseUrl = new URL(url, window.location.href)
    if (responseUrl.pathname === this._homePathname) {
      window.location.href = responseUrl.href
      return
    }

    this.setAttribute("state", states.LOADING)
    fetch(url)
      .then(response => {
        Promise
          .all([response.ok, response.text()])
          .then(([ok, nextDocumentString]) => {
            let nextDocument = htmlNodeFromString(nextDocumentString)
            if (this._isFirstStep) this.initFrame()
            if (ok) {
              let nextForm = nextDocument.querySelector(nameOrId(this._formName))
              if (nextForm) {
                this.insertForm(nextForm)
              }
            } else {
              let errorTitle, errorMessage
              let nextErrorTitleElement = nextDocument.querySelector(config.errorTitleSelector)
              let nextErrorMessageElement = nextDocument.querySelector(config.errorMessageSelector)
              errorTitle = nextErrorTitleElement ? nextErrorTitleElement.textContent : undefined
              errorMessage = nextErrorMessageElement ? nextErrorMessageElement.textContent : undefined
              this.insertError({
                error: errorTitle, 
                message: errorMessage
              })
            }
          })
      })
      .catch(error => {
        this.setAttribute("state", states.ERROR)
        console.error(error)
        // release preventDefault() ?
        // event.isDefaultPrevented = () => false
      })
  }

  insertForm(form) {
    if (this._additionalHiddenInputs) {
      form.append(this._additionalHiddenInputs)
    }

    this.captureNextActions(form)
    window.requestAnimationFrame(() => {
      this._remoteContainer.innerHTML = ""
      this._remoteContainer.appendChild(form)
      this.setAttribute("state", states.DONE)
      this.setAttribute("active", true)
      this.setStep(this.getStep() + 1)

      let nextTextInput = this._remoteContainer.querySelector("input")
      if (nextTextInput) nextTextInput.focus()
      this.dispatchSuccessEvent()
    })
  }

  insertError({title, message}) {
    window.requestAnimationFrame(() => {
      let template = document.querySelector("#" + config.errorTemplateId)
      let errorTemplateClone = template.content.cloneNode(true)
      let titlePlace = errorTemplateClone.querySelector(config.errorTemplateTitlePlace)
      let messagePlace = errorTemplateClone.querySelector(config.errorTemplateMessagePlace)

      if (title && titlePlace) titlePlace.textContent = title
      if (message && messagePlace) messagePlace.textContent = message

      this._remoteContainer.innerHTML = ""
      this._remoteContainer.appendChild(errorTemplateClone)
      this.captureNextActions(this._remoteContainer)
      this.setAttribute("state", states.DONE)
      this.setAttribute("active", true)

      this._remoteContainer.focus()
      this.dispatchSuccessEvent()
    })
  }

  captureNextActions(node) {
    this._cancelButton = node.querySelector(nameOrId(this.getAttribute("cancel")))
    this._submitButton = node.querySelector('[type="submit"]')
    if (this._cancelButton) this._cancelButton.addEventListener("click", event => this.handleCancel({event}))
    if (this._submitButton) this._submitButton.addEventListener("click", event => this.handleSubmit({event, node}))
  }

  handleSubmit({event, node: form}) {
    event.preventDefault()
    let method = form.getAttribute("method").toLowerCase()
    let action = form.getAttribute("action")
    let body = new URLSearchParams(new FormData(form))

    if(method === "get") {
      action += "?" + body.toString()
      body = undefined
    }

    fetch(action, {method, body})
      .then(response => this.handleNextStep(event, response.url))
  }

  handleCancel({event}) {
    event.preventDefault()
    this.close()
  }

  dispatchSuccessEvent() {
    this.dispatchEvent(new CustomEvent("done"))
  }

  /**
   * close
   *
   * close and revert this form sequence
   *
   * @return {[type]} [description]
   */
  close() {
    // this implementation, yay or nay?
    window.requestAnimationFrame(() => this.innerHTML = "")
    window.requestAnimationFrame(() => this.append(this._origin))

    // reset these, keep those set in connectedCallback()
    delete this._homePathname
    delete this._cancelButton
    delete this._submitButton

    this.removeAttribute("active")
    this.setStep(0)
  }

  /**
   * closeAll
   *
   * close and revert all form sequences on the same page
   *
   * @return {[type]} [description]
   */
  closeAll() {
    let allInstances = document.querySelectorAll(this.tagName)
    if (allInstances) Array.from(allInstances).forEach(instance => instance.close())
  }



  // getters setters

  setStep(nextStep) {
    this._step = nextStep
    this.setAttribute("data-step", this._step)
  }

  getStep() {
    return this._step || 0
  }
}
