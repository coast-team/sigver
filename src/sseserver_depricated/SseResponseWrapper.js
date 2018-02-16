/**
 * A wrapper around ServerResponse object to simulate Socket API.
 */
export default class SseResponseWrapper {
  constructor (id, sse, res) {
    this.id = id
    this.sse = sse
    this.res = res
    this.res.$channel = this
    this.onclose = () => {}
  }

  close () {
    this.onclose()
  }

  send (msg) {
    this.sse.send(msg, [this.res])
  }
}
