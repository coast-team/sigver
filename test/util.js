export function randomKey () {
  return String(Math.ceil(Math.random() * 99999))
}

export class RichEventSource {
  constructor (url) {
    this.auth = ''
    this._onopen = () => {}
    this._onerror = () => {}
    this._onclose = () => {}
    this.es = new EventSource(url)
    this.es.addEventListener('auth', evtMsg => {
      this.auth = evtMsg.data
      this._onopen()
    })
    this.es.addEventListener('close', evtMsg => {
      let data = JSON.parse(evtMsg.data)
      this.es.close()
      this._onclose(new CloseEvent('close', {
        wasClean: true,
        code: data.code,
        reason: data.reason
      }))
    })
    this.es.onerror = this._onerror
  }

  get OPEN () { return this.es.OPEN }
  get url () { return this.es.url }
  get readyState () { return this.es.readyState }

  get onopen () { return this._onopen }
  set onopen (cb) { this._onopen = cb }

  get onmessage () { return this.es.onmessage }
  set onmessage (cb) { this.es.onmessage = cb }

  get onclose () { return this._onclose }
  set onclose (cb) { this._onclose = cb }

  get onerror () { return this._onerror }
  set onerror (cb) { this._onerror = cb }

  close () {
    this.es.close()
    this._onclose(new CloseEvent('close', {wasClean: true, code: 1000}))
  }

  send (str = '') {
    fetch(this.url, { method: 'POST', body: `${this.auth}@${str}` })
      .then(response => {
        if (response.status !== 200) {
          this._onerror(new Error(response.status + ': ' + response.statusText))
        }
      })
      .catch(err => this._onerror(err))
  }
}
