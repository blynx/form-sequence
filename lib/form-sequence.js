import { htmlNodeFromString, namesOrIds } from "./utilities.js"
import { RemotePageError } from "./Errors"

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
    this._frameInitialised = false
    this.setStep(0)
    this._homePathname = window.location.pathname
    this._origin = this.querySelector(namesOrIds(this.getAttribute("capture"))) || this.querySelector("a")

    try {
      let startUrl = this._origin ? new URL(this._origin.getAttribute("href"), window.location.origin) : null
      if (startUrl.origin !== window.location.origin) {
        console.warn(new Error(`(${this.tagName}) origin mismatch: target ${startUrl.origin} != current ${window.location.origin}. Ignoring.`))
        return
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

  handleNextStep(event, nextThing, options) {
    this.closeAll()
    event.preventDefault()
    if (!this._frameInitialised) {
      this.initFrame()
      this._frameInitialised = true
    }

    const req = {
      url: undefined,
      method: undefined,
      body: undefined,
      headers: Object.assign({}, config.requestHeaders)
    }

    // nextThing could be a form or a plain url, prepare fetch
    if (nextThing instanceof HTMLFormElement) {
      req.method = nextThing.getAttribute("method").toLowerCase()
      req.url = nextThing.getAttribute("action")
      req.body = new URLSearchParams(new FormData(nextThing))
      if (options && options.addValue) {
        req.body.append(options.addValue[0], options.addValue[1])
      }
      if (req.method === "get") {
        req.url += "?" + req.body.toString()
        req.body = undefined
      }
    } else {
      req.url = nextThing
    }

    this.dispatchStartEvent()
    fetch(req.url, {
      method: req.method,
      body: req.body,
      headers: req.headers
    })
      .then(response => {
        Promise
          .all([response.ok, response.url, response.text(), response])
          .then(([ok, responseUrl, nextDocumentString, response]) => {
            // test if response is where we came from
            responseUrl = new URL(responseUrl, window.location.href)
            if (responseUrl.pathname === this._homePathname) {
              this.dispatchReturnEvent({
                response,
                url: responseUrl,
              })
              return
            }

            let nextDocument = htmlNodeFromString(nextDocumentString)

            if (ok) {
              let nextForm = nextDocument.querySelector(namesOrIds(this._formName)) || nextDocument.querySelector("form")
              if (nextForm) {
                this.insertForm(nextForm)
              }
            } else {
              // some services return json on error with xhr request
              let isJson = response.headers.get("content-type") === "application/json"
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
        this.dispatchErrorEvent(error)
        console.error(error)
        // release preventDefault() ?
        // event.isDefaultPrevented = () => false
      })
  }

  insertForm(form) {
    if (this._additionalHiddenInputs) {
      form.append(this._additionalHiddenInputs)
    }

    window.requestAnimationFrame(() => {
      this._remoteContainer.innerHTML = form.outerHTML
      this.captureNextActions(this._remoteContainer.querySelector("form"))
      this.setAttribute("active", true)
      this.setStep(this.getStep() + 1)

      let nextTextInput = this._remoteContainer.querySelector("input:not([type=\"hidden\"])")
      if (nextTextInput) nextTextInput.focus()
      this.dispatchDoneEvent()
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
      this.setAttribute("active", true)

      this._remoteContainer.focus()
      this.dispatchDoneEvent()
      this.dispatchErrorEvent(new RemotePageError(message))
    })
  }

  captureNextActions(node) {
    this._cancelButton = node.querySelector(namesOrIds(this.getAttribute("cancel")))
    this._submitButtons = Array.from(node.querySelectorAll('[type="submit"]'))
    if (this._cancelButton)
      this._cancelButton.addEventListener("click", event => this.handleCancel(event))
    if (this._submitButtons.length > 0)
      this._submitButtons.forEach(btn => {
        let additionalButtonValue
        if (btn.name) additionalButtonValue = [btn.name, btn.value]
        btn.addEventListener("click", event => this.handleNextStep(event, node, { addValue: additionalButtonValue }))
      })
  }

  handleCancel(event) {
    event.preventDefault()
    this.close()
  }

  dispatchStartEvent() {
    this.setAttribute("state", states.LOADING)
    this.dispatchEvent(new CustomEvent("start"))
  }

  dispatchDoneEvent() {
    this.setAttribute("state", states.DONE)
    this.dispatchEvent(new CustomEvent("done"))
  }

  dispatchSuccessEvent() {
    this.dispatchEvent(new CustomEvent("success"))
  }

  dispatchErrorEvent(e) {
    this.setAttribute("state", states.ERROR)
    this.dispatchEvent(new CustomEvent("error", { detail: e }))
  }

  dispatchReturnEvent(detail) {
    this.removeAttribute("state")
    this.dispatchEvent(new CustomEvent("return", { detail }))
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
    delete this._submitButtons

    this.removeAttribute("active")
    this.connectedCallback()
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
    if (allInstances) Array.from(allInstances).forEach(instance => {
      if (instance !== this) instance.close()
    })
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
