import { Peer } from './Peer'
import { ERR_BLOCKING_MEMBER } from './SigError'

export class Group {
  private onNoMembers: () => void
  private members: Set<Peer>

  constructor(peer: Peer, onNoMembers: () => void) {
    this.members = new Set()
    this.onNoMembers = onNoMembers
    this.addMember(peer)
  }

  get size() {
    return this.members.size
  }

  isConnectedToAtLeastOneMember(members: number[]) {
    for (const peer of this.members) {
      if (members.includes(peer.id)) {
        return true
      }
    }
    return false
  }

  subscribeToOrReplaceMember(peer: Peer): boolean {
    if (this.size === 1) {
      if (this.members.has(peer)) {
        return true
      }
      const member = this.members.values().next().value
      if (peer.triedMembers.includes(member.id)) {
        log.info('ONE LEFT AND ALREADY TRIED: replace him', { key: peer.key })
        this.addMember(peer)
        member.close(ERR_BLOCKING_MEMBER, 'prevents other peers from joining the group')
        return true
      }
    }
    peer.bindWith(this.selectMemberFor(peer))
    return false
  }

  addMember(peer: Peer): boolean {
    peer.group = this
    peer.triedMembers = []
    this.members.add(peer)
    return true
    // log.info('Member JOINED', { key: peer.key, id: peer.id, size: this.members.size })
  }

  removeMember(peer: Peer) {
    peer.group = undefined
    this.members.delete(peer)
    // log.info('Member LEFT', { key: peer.key, id: peer.id, size: this.members.size })
    if (this.members.size === 0) {
      this.onNoMembers()
    }
  }

  private selectMemberFor(joining: Peer): Peer {
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
}
