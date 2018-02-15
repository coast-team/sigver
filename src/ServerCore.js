const groups = new Map()

/**
 * The core of the signaling server (WebSocket and SSE) containing the main logic
 */
export default class ServerCore {
  init ({ peer, key }) {
    peer.startHeartbeat()
    this.bindToMember(peer)

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
            this.bindToMember(peer)
            break
          }
        }
      },
      err => {
        log.error('ServerCore', { id: peer.id, isOpener: peer.groups !== undefined, err })
        peer.clean()
      },
      () => peer.clean()
    )
  }

  bindToMember (peer) {
    const group = groups.get(peer.key)

    // Check whether the first peer or not in the group identified by the key
    if (group !== undefined) {
      peer.bindWith(group.selectMemberFor(peer))
      peer.send({ isFirst: false })
    } else {
      const group = new Group(peer)
      groups.set(peer.key, group)
      peer.send({ isFirst: true })
    }
  }

  becomeMember (peer) {
    if (peer.groups === undefined) {
      const group = groups.get(peer.key)
      if (group !== undefined) {
        group.addMember(peer)
      } else {
        log.warn('Uncommon Open; create new Group', { id: peer.id, key: peer.key })
        const group = new Group(peer.key, peer)
        groups.add(peer.key, group)
      }
    }
  }
}

class Group {
  constructor (peer) {
    this.key = peer.key
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
    peer.groups = this
    this.members.add(peer)
    log.info('NEW Member', {id: peer.id, key: this.key, currentSize: this.members.size})
  }

  removeMember (peer) {
    if (this.members.size === 1) {
      groups.delete(this.key)
      log.info('REMOVE Group', { id: peer.id, key: peer.key })
    } else {
      this.members.delete(peer)
      log.info('Member GONE', { id: peer.id, key: peer.key, currentSize: this.members.size })
    }
  }
}
