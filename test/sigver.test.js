function isBrowser () {
  if (typeof window === 'undefined' || (typeof process !== 'undefined' && process.title === 'node')) {
    return false
  }
  return true
}

let WebSocket = null
if (isBrowser()) {
  WebSocket = window.WebSocket
} else {
  try {
    WebSocket = require('uws')
  } catch (err) {
    console.error('Missing uws dependency')
    process.exit(1)
  }
}
const host = 'localhost'
const port = 8001

it('Should accomplish the open/join mechanism', done => {
  let InvitingClient = new WebSocket(`ws://${host}:${port}`)
  let JoiningClient = new WebSocket(`ws://${host}:${port}`)

  let onOpenInviting = () => {
    InvitingClient.send(JSON.stringify({key: '11111'}))

    InvitingClient.onmessage = evt => {
      let msg = JSON.parse(evt.data)
      console.log('InvitingClient: ', msg)
      if ('isKeyOk' in msg) {
        expect(msg.isKeyOk).toBeTruthy()
        JoiningClient.send(JSON.stringify({join: '11111'}))
      } else if ('id' in msg && 'data' in msg) {
        expect(msg.data).toEqual('some data from joining client')
        InvitingClient.send(JSON.stringify({
          id: msg.id,
          data: 'some data from inviting client'
        }))
      } else done.fail()
    }
  }
  if (isBrowser()) InvitingClient.onopen = onOpenInviting
  else InvitingClient.on('open', onOpenInviting)

  let onOpenJoining = () => {
    console.log('JoiningClient open')
    JoiningClient.onmessage = evt => {
      let msg = JSON.parse(evt.data)
      console.log('JoiningClient: ', msg)
      if ('isKeyOk' in msg) {
        expect(msg.isKeyOk).toBeTruthy()
        JoiningClient.send(JSON.stringify({data: 'some data from joining client'}))
      } else if ('data' in msg) {
        expect(msg.data).toEqual('some data from inviting client')
        done()
      }
    }
  }
  if (isBrowser()) JoiningClient.onopen = onOpenJoining
  else JoiningClient.on('open', onOpenJoining)
})
