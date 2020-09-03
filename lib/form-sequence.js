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
  errorTemplateMessagePlace: "p",
  requestHeaders: {},
}

export function configure(c) {
  Object.assign(config, c)
}

export default class FormSequence extends HTMLElement {

  connectedCallback() {
    this._isFirstStep = true
    this._homePathname = window.location.pathname
    this._origin = this.querySelector(nameOrId(this.getAttribute("capture")))

    try {
      let startUrl = this._origin ? new URL(this._origin.getAttribute("href"), window.location.origin) : null
      if (startUrl.origin !== window.location.origin) {
        console.error(new Error("origin mismatch"))
        return;
      }
      this._additionalHiddenInputs = this.querySelector('input[type="hidden"]')
      this._formName = this.getAttribute("form")
      this._origin.addEventListener("click", event => this.handleNextStep(event, startUrl.href))
    } catch(e) {
      console.error(e)
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

  handleNextStep(event, nextThing) {
    if (this._isFirstStep) {
      event.preventDefault()
      this.closeAll()
    }

    let requestUrl, body, method

    // nextThing could be a form or a plain url, prepare fetch
    if (nextThing instanceof HTMLFormElement) {
      method = nextThing.getAttribute("method").toLowerCase()
      requestUrl = nextThing.getAttribute("action")
      body = new URLSearchParams(new FormData(nextThing))
      if (method === 'get') {
        requestUrl += "?" + body.toString()
        body = undefined
      }
    } else {
      requestUrl = nextThing
    }

    this.setAttribute("state", states.LOADING)
    fetch(requestUrl, { method, body, headers: config.requestHeaders })
      .then(response => {
        Promise
          .all([response.ok, response.url, response.text(), response])
          .then(([ok, responseUrl, nextDocumentString, response]) => {

            // test if response is where we came from
            responseUrl = new URL(responseUrl, window.location.href)
            if (responseUrl.pathname === this._homePathname) {
              window.location.href = responseUrl.href
              return
            }

            let nextDocument = htmlNodeFromString(nextDocumentString)
            if (this._isFirstStep) this.initFrame()

            if (ok) {
              let nextForm = nextDocument.querySelector(nameOrId(this._formName))
              if (nextForm) {
                this.insertForm(nextForm)
              }
            } else {
              // some services return json on error with xhr request
              let isJson = response.headers.get('content-type') === 'application/json'
              let errorTitle, errorMessage

              if (isJson) {
                let errorJson = JSON.parse(nextDocumentString)
                errorTitle = errorJson.error ? errorJson.error : undefined
                errorMessage = errorJson.message ? errorJson.message : undefined
              } else {
                let nextErrorTitleElement = nextDocument.querySelector(config.errorTitleSelector)
                let nextErrorMessageElement = nextDocument.querySelector(config.errorMessageSelector)
                errorTitle = nextErrorTitleElement ? nextErrorTitleElement.textContent : undefined
                errorMessage = nextErrorMessageElement ? nextErrorMessageElement.textContent : undefined
              }

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

      let nextTextInput = this._remoteContainer.querySelector("input:not([type=\"hidden\"])")
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
    if (this._submitButton) this._submitButton.addEventListener("click", event => this.handleNextStep(event, node))
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
