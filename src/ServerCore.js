const networks = new Map()

/**
 * The core of the signaling server (WebSocket and SSE) containing the main logic
 */
export default class ServerCore {
  init ({ peer, key }) {
    const net = networks.get(key)

    // Check whether the first peer or not in the network identified by the key
    if (net !== undefined) {
      peer.connect(net.selectMember())
      peer.send({ isFirst: false })
    } else {
      const net = new Network(key, peer)
      networks.set(key, net)
      peer.send({ isFirst: true })
      peer.startHeartbeat()
    }

    // Subscribe to peer messages
    peer.subscribe(
      ({ type }) => {
        switch (type) {
          case 'joined':
            this.becomeMember(peer)
            break
          case 'heartbeat':
            peer.missedHeartbeat = 0
            break
        }
      },
      err => {
        log.error('ServerCore', { id: peer.id, isOpener: peer.network !== undefined, err })
        peer.clean()
      },
      () => peer.clean()
    )
  }

  becomeMember (peer) {
    if (peer.network === undefined) {
      const net = networks.get(peer.key)
      if (net !== undefined) {
        net.addMember(peer)
      } else {
        log.warn('Uncommon Open; create new Network', { id: peer.id, key: peer.key })
        const net = new Network(peer.key, peer)
        networks.add(peer.key, net)
      }
      peer.startHeartbeat()
    }
  }
}

class Network {
  constructor (key, peer) {
    this.key = key
    this.members = new Set()
    this.addMember(peer)
  }

  selectMember () {
    return this.members.values().next().value
  }

  addMember (peer) {
    peer.network = this
    this.members.add(peer)
    log.info('ADD Member', {id: peer.id, key: this.key, size: this.members.size})
  }

  removeMember (peer) {
    if (this.members.size === 1) {
      networks.delete(this.key)
      log.info('REMOVE Network', { id: peer.id, key: peer.key })
    } else {
      this.members.delete(peer)
      log.info('DELETE Member', { id: peer.id, key: peer.key })
    }
  }
}
