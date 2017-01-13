export function xhtSend (url, id, obj) {
  const xhr = new XMLHttpRequest()
  xhr.open('POST', url, true)
  xhr.onload = function () {
    expect(this.status).toEqual(200)
  }
  xhr.send(id + '@' + JSON.stringify(obj))
}

export function randomKey () {
  return String(Math.ceil(Math.random() * 99999))
}
