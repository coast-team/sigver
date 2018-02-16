import { Peer } from './Peer'

export class Group {

  private members: Set<Peer>
  private onNoMembers: () => void

  constructor (peer: Peer, onNoMembers: () => void) {
    this.members = new Set()
    this.onNoMembers = onNoMembers
    this.addMember(peer)
  }

  selectMemberFor (joining: Peer): Peer {
    const peersToTry: Peer[] = []
    this.members.forEach((member) => {
      if (!joining.triedMembers.includes(member.id)) {
        peersToTry.push(member)
      }
    })
    if (peersToTry.length !== 0) {
      return peersToTry[Math.floor(Math.random() * peersToTry.length)]
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
