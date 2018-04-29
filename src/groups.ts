import { Peer } from './Peer'
import { ERR_BLOCKING_MEMBER } from './Util'

const groups = new Map<string, Group>()

export function isAGroupMember(peer: Peer, id: number, members: number[], key: string): boolean {
  const group = peer.group || groups.get(key) || new Group(key)
  if (peer.group) {
    if (group.size === 1 || group.hasMembersInCommon(members)) {
      return true
    }
    group.removeMember(peer)
  } else {
    if (group.size === 0) {
      group.addMember(peer, id)
      return true
    } else if (group.size === 1) {
      const member = group.getFirstMember()
      if (peer.triedMembers.includes(member.id)) {
        group.addMember(peer, id)
        group.removeMember(member)
        member.close(
          ERR_BLOCKING_MEMBER,
          'replaced by a peer as prevents him from joining the group'
        )
        return true
      }
    }
  }
  peer.bindWith(group.selectMemberFor(peer))
  return false
}

export class Group {
  public key: string

  private members: Set<Peer>

  constructor(key: string) {
    this.key = key
    this.members = new Set()
  }

  get size() {
    return this.members.size
  }

  getFirstMember(): Peer {
    return this.members.values().next().value
  }

  hasMembersInCommon(members: number[]) {
    for (const m of this.members) {
      if (members.includes(m.id)) {
        return true
      }
    }
    return false
  }

  addMember(peer: Peer, id: number): boolean {
    peer.group = this
    peer.triedMembers = []
    peer.id = id
    this.members.add(peer)
    return true
  }

  removeMember(peer: Peer) {
    peer.group = undefined
    this.members.delete(peer)
    if (this.size === 0) {
      groups.delete(this.key)
    }
  }

  selectMemberFor(joining: Peer): Peer {
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
