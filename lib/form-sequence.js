import { queryInHtmlString, nameOrId } from "./utilities.js"

let states = {
  LOADING: "loading",
  ERROR: "error",
  DONE: "done"
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
      .then(response => response.text())
      .then(nextDocumentString => {
        let nextForm = queryInHtmlString(nextDocumentString, nameOrId(this._formName))
        if (nextForm) {
          if (this._isFirstStep) this.initFrame()
          this.insertForm(nextForm)
        }
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

      let nextTextInput = this._remoteContainer.querySelector('input[type="text"]')
      if (nextTextInput) nextTextInput.focus()
      this.dispatchSuccessEvent()
    })
  }

  captureNextActions(form) {
    this._cancelButton = form.querySelector(nameOrId(this.getAttribute("cancel")))
    this._submitButton = form.querySelector('[type="submit"]')
    this._cancelButton.addEventListener("click", event => this.handleCancel({event}))
    this._submitButton.addEventListener("click", event => this.handleSubmit({event, form}))
  }

  handleSubmit({event, form}) {
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
