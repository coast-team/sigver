import { ERR_ALL_MEMBERS_TESTED } from './SigError'

const networks = new Map()

/**
 * The core of the signaling server (WebSocket and SSE) containing the main logic
 */
export default class ServerCore {
  init ({ peer, key }) {
    const net = networks.get(key)

    // Check whether the first peer or not in the network identified by the key
    if (net !== undefined) {
      const member = net.selectMember()
      if (member) {
        peer.bindWith(member)
      } else {
        peer.close(ERR_ALL_MEMBERS_TESTED, 'All members have been tested')
      }
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
          case 'stable':
            this.becomeMember(peer)
            break
          case 'heartbeat':
            peer.missedHeartbeat = 0
            break
          case 'tryAnother': {
            const member = net.selectMember(peer.triedMembers)
            if (member) {
              peer.bindWith(member)
            } else {
              peer.close(ERR_ALL_MEMBERS_TESTED, 'All members have been tested')
            }
            break
          }
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

  selectMember (excludeMembers = []) {
    const ids = []
    this.members.forEach((id) => {
      if (!excludeMembers.includes(id)) {
        ids[ids.length] = id
      }
    })
    if (ids.length !== 0) {
      return ids[Math.floor(Math.random() * ids.length)]
    } else {
      return undefined
    }
  }

  addMember (peer) {
    peer.network = this
    this.members.add(peer)
    log.info('NEW Member', {id: peer.id, key: this.key, currentSize: this.members.size})
  }

  removeMember (peer) {
    if (this.members.size === 1) {
      networks.delete(this.key)
      log.info('REMOVE Network', { id: peer.id, key: peer.key })
    } else {
      this.members.delete(peer)
      log.info('Member GONE', { id: peer.id, key: peer.key, currentSize: this.members.size })
    }
  }
}
