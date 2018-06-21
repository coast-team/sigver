import { Peer } from './peer'
import { ERR_BLOCKING_MEMBER } from './util'

const groups = new Map<string, Group>()

export function isAGroupMember(peer: Peer, id: number, members: number[], key: string): boolean {
  let group = peer.group || groups.get(key)
  if (!group) {
    group = new Group(key)
    group.addMember(peer, id)
    groups.set(key, group)
    return true
  }

  if (group.size === 1) {
    if (peer.group) {
      return true
    }
    if (group.hasMembersInCommon(members)) {
      group.addMember(peer, id)
      return true
    }
    const member = group.getFirstMember()
    if (peer.triedMembers.includes(member.netfluxId as number)) {
      group.addMember(peer, id)
      group.removeMember(member)
      member.close(
        ERR_BLOCKING_MEMBER,
        'replaced by a peer as prevented him from joining the group'
      )
      return true
    }
  }
  if (group.hasMembersInCommon(members)) {
    group.addMember(peer, id)
    return true
  } else {
    group.removeMember(peer)
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
    if (members.length !== 0) {
      for (const m of this.members) {
        if (members.includes(m.netfluxId as number)) {
          return true
        }
      }
    }
    return false
  }

  addMember(peer: Peer, id: number): boolean {
    peer.becomeMember(this, id)
    this.members.add(peer)
    return true
  }

  removeMember(peer: Peer) {
    peer.noLongerAMember()
    this.members.delete(peer)
    if (this.size === 0) {
      groups.delete(this.key)
    }
  }

  selectMemberFor(joiningPeer: Peer): Peer {
    let notFavoredMember: Peer | undefined
    for (const member of this.members) {
      if (!joiningPeer.triedMembers.includes(member.netfluxId as number)) {
        if (member.favored) {
          return member
        } else if (!notFavoredMember) {
          notFavoredMember = member
        }
      }
    }
    if (notFavoredMember) {
      return notFavoredMember
    }
    joiningPeer.triedMembers = []
    return this.selectMemberFor(joiningPeer)
  }
}
