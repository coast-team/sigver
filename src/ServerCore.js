const groups = new Map()

/**
 * The core of the signaling server (WebSocket and SSE) containing the main logic
 */
export default class ServerCore {
  init (peer) {
    this.bindToMember(peer)

    // Subscribe to peer messages
    peer.subscribe(({ type }) => {
      switch (type) {
        case 'stable':
          this.becomeMember(peer)
          break
        case 'heartbeat':
          peer.missedHeartbeat = 0
          break
        case 'tryAnother': {
          this.bindToMember(peer)
          break
        }
      }
    })
  }

  bindToMember (peer) {
    const group = groups.get(peer.key)

    // Check whether the first peer or not in the group identified by the key
    if (group) {
      peer.bindWith(group.selectMemberFor(peer))
      peer.send({ isFirst: false })
    } else {
      groups.set(peer.key, new Group(peer))
      peer.send({ isFirst: true })
    }
  }

  becomeMember (peer) {
    if (peer.group === undefined) {
      const group = groups.get(peer.key)
      if (group) {
        group.addMember(peer)
      } else {
        groups.set(peer.key, new Group(peer, peer))
      }
    }
  }
}

class Group {
  constructor (peer) {
    this.members = new Set()
    this.addMember(peer)
  }

  selectMemberFor (peer) {
    const ids = []
    this.members.forEach((id) => {
      if (!peer.triedMembers.includes(id)) {
        ids[ids.length] = id
      }
    })
    if (ids.length !== 0) {
      return ids[Math.floor(Math.random() * ids.length)]
    } else {
      peer.triedMembers = []
      return this.selectMemberFor(peer)
    }
  }

  addMember (peer) {
    peer.group = this
    this.members.add(peer)
    log.info('NEW Member', {id: peer.id, key: peer.key, currentSize: this.members.size})
  }

  removeMember (peer) {
    if (this.members.size === 1) {
      groups.delete(peer.key)
      log.info('REMOVE Group', { id: peer.id, key: peer.key })
    } else {
      this.members.delete(peer)
      log.info('Member GONE', { id: peer.id, key: peer.key, currentSize: this.members.size })
    }
  }
}
