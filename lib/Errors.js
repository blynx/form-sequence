export class RemotePageError extends Error {
  constructor(message) {
    super(message)
    this.name = "RemotePageError"
  }
}
