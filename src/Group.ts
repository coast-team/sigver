import { Peer } from './Peer'
import { ERR_BLOCKING_MEMBER } from './SigError'

export class Group {

  private onNoMembers: () => void
  private members: Set<Peer>

  constructor (peer: Peer, onNoMembers: () => void) {
    this.members = new Set()
    this.onNoMembers = onNoMembers
    this.addMember(peer)
  }

  get size () {
    return this.members.size
  }

  switchPeers (peer: Peer) {
    if (this.size === 1) {
      const blockingMember = this.members.values().next().value
      this.addMember(peer)
      blockingMember.close(ERR_BLOCKING_MEMBER, 'prevent other peers from joining the group')
    }
  }

  oneLeftAndAlreadyTried (peer: Peer): boolean {
    if (this.size === 1) {
      const id = this.members.values().next().value.id
      return peer.triedMembers.includes(id)
    }
    return false
  }

  selectMemberFor (joining: Peer): Peer {
    const peersToTry: Peer[] = []
    this.members.forEach((member) => {
      if (!joining.triedMembers.includes(member.id)) {
        peersToTry.push(member)
      }
    })
    if (peersToTry.length !== 0) {
      return peersToTry[0]
    } else {
      joining.triedMembers = []
      return this.selectMemberFor(joining)
    }
  }

  addMember (peer: Peer) {
    peer.group = this
    this.members.add(peer)
    log.info('Member JOINED', {key: peer.key, id: peer.id, size: this.members.size})
  }

  removeMember (peer: Peer) {
    this.members.delete(peer)
    log.info('Member LEFT', { key: peer.key, id: peer.id, size: this.members.size })
    if (this.members.size === 0) {
      this.onNoMembers()
    }
  }

}
