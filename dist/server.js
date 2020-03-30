#!/usr/bin/env node
!function(e){var t={};function n(r){if(t[r])return t[r].exports;var o=t[r]={i:r,l:!1,exports:{}};return e[r].call(o.exports,o,o.exports,n),o.l=!0,o.exports}n.m=e,n.c=t,n.d=function(e,t,r){n.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:r})},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},n.t=function(e,t){if(1&t&&(e=n(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var r=Object.create(null);if(n.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var o in e)n.d(r,o,function(t){return e[t]}.bind(null,o));return r},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="",n(n.s=13)}([function(e,t){e.exports=require("protobufjs/minimal")},function(e,t){e.exports=require("rxjs/operators")},function(e,t){e.exports=require("fs")},function(e,t){e.exports=require("commander")},function(e,t){e.exports=require("http")},function(e,t){e.exports=require("https")},function(e,t){e.exports=require("bunyan")},function(e,t){e.exports=require("url")},function(e,t){e.exports=require("ws")},function(e,t){e.exports=require("rxjs")},function(e,t){e.exports=require("crypto")},function(e,t){e.exports=require("../package.json")},function(e,t){e.exports=require("./package.json")},function(e,t,n){"use strict";n.r(t);var r=n(3),o=n.n(r),i=n(2),s=n.n(i),a=n(4),c=n.n(a),u=n(5),l=n.n(u),d=n(6);const p=n.n(d).a.createLogger({name:"sigver",level:"trace"});var h=n(7),f=n(8),b=n.n(f),m=n(9),g=n(1),y=n(10);const v=new Set;class I extends Error{constructor(e,t=""){super(),this.name=this.constructor.name,this.code=e,this.message=`${e}: ${t}`}}function k(){let e=y.randomBytes(4).readUInt32BE(0);return e>2147483647&&(e-=2147483647),0===e||v.has(e)?k():(v.add(e),e)}function M(e){v.delete(e)}const w=new Map;class x{constructor(e){this.key=e,this.members=new Set}get size(){return this.members.size}getFirstMember(){return this.members.values().next().value}hasMembersInCommon(e){if(0!==e.length)for(const t of this.members)if(e.includes(t.netfluxId))return!0;return!1}addMember(e,t){return e.becomeMember(this,t),this.members.add(e),!0}removeMember(e){e.noLongerAMember(),this.members.delete(e),0===this.size&&w.delete(this.key)}selectMemberFor(e){let t;for(const n of this.members){const r=n.netfluxId;if(void 0!==r&&!e.triedMembers.includes(r)){if(n.favored)return n;void 0===t&&(t=n)}}return void 0!==t?t:(e.triedMembers=[],this.selectMemberFor(e))}}var S=n(0);const O=S.Reader,j=S.Writer,T=S.util,P=S.roots.default||(S.roots.default={}),q=P.Message=(()=>{function e(e){if(e)for(let t=Object.keys(e),n=0;n<t.length;++n)null!=e[t[n]]&&(this[t[n]]=e[t[n]])}let t;return e.prototype.heartbeat=!1,e.prototype.content=null,e.prototype.connect=null,e.prototype.connected=!1,Object.defineProperty(e.prototype,"type",{get:T.oneOfGetter(t=["heartbeat","content","connect","connected"]),set:T.oneOfSetter(t)}),e.create=function(t){return new e(t)},e.encode=function(e,t){return t||(t=j.create()),null!=e.heartbeat&&e.hasOwnProperty("heartbeat")&&t.uint32(8).bool(e.heartbeat),null!=e.content&&e.hasOwnProperty("content")&&P.Content.encode(e.content,t.uint32(18).fork()).ldelim(),null!=e.connect&&e.hasOwnProperty("connect")&&P.GroupData.encode(e.connect,t.uint32(26).fork()).ldelim(),null!=e.connected&&e.hasOwnProperty("connected")&&t.uint32(32).bool(e.connected),t},e.decode=function(e,t){e instanceof O||(e=O.create(e));let n=void 0===t?e.len:e.pos+t,r=new P.Message;for(;e.pos<n;){let t=e.uint32();switch(t>>>3){case 1:r.heartbeat=e.bool();break;case 2:r.content=P.Content.decode(e,e.uint32());break;case 3:r.connect=P.GroupData.decode(e,e.uint32());break;case 4:r.connected=e.bool();break;default:e.skipType(7&t)}}return r},e})(),F=(P.Content=(()=>{function e(e){if(e)for(let t=Object.keys(e),n=0;n<t.length;++n)null!=e[t[n]]&&(this[t[n]]=e[t[n]])}return e.prototype.senderId=0,e.prototype.recipientId=0,e.prototype.lastData=!1,e.prototype.data=T.newBuffer([]),e.create=function(t){return new e(t)},e.encode=function(e,t){return t||(t=j.create()),null!=e.senderId&&e.hasOwnProperty("senderId")&&t.uint32(8).uint32(e.senderId),null!=e.recipientId&&e.hasOwnProperty("recipientId")&&t.uint32(16).uint32(e.recipientId),null!=e.lastData&&e.hasOwnProperty("lastData")&&t.uint32(24).bool(e.lastData),null!=e.data&&e.hasOwnProperty("data")&&t.uint32(34).bytes(e.data),t},e.decode=function(e,t){e instanceof O||(e=O.create(e));let n=void 0===t?e.len:e.pos+t,r=new P.Content;for(;e.pos<n;){let t=e.uint32();switch(t>>>3){case 1:r.senderId=e.uint32();break;case 2:r.recipientId=e.uint32();break;case 3:r.lastData=e.bool();break;case 4:r.data=e.bytes();break;default:e.skipType(7&t)}}return r},e})(),P.GroupData=(()=>{function e(e){if(this.members=[],e)for(let t=Object.keys(e),n=0;n<t.length;++n)null!=e[t[n]]&&(this[t[n]]=e[t[n]])}return e.prototype.id=0,e.prototype.members=T.emptyArray,e.create=function(t){return new e(t)},e.encode=function(e,t){if(t||(t=j.create()),null!=e.id&&e.hasOwnProperty("id")&&t.uint32(8).uint32(e.id),null!=e.members&&e.members.length){t.uint32(18).fork();for(let n=0;n<e.members.length;++n)t.uint32(e.members[n]);t.ldelim()}return t},e.decode=function(e,t){e instanceof O||(e=O.create(e));let n=void 0===t?e.len:e.pos+t,r=new P.GroupData;for(;e.pos<n;){let t=e.uint32();switch(t>>>3){case 1:r.id=e.uint32();break;case 2:if(r.members&&r.members.length||(r.members=[]),2==(7&t)){let t=e.uint32()+e.pos;for(;e.pos<t;)r.members.push(e.uint32())}else r.members.push(e.uint32());break;default:e.skipType(7&t)}}return r},e})(),q.encode(q.create({heartbeat:!0})).finish()),D=q.encode(q.create({connected:!0})).finish(),C=q.encode(q.create({connected:!1})).finish();class W extends m.Subject{constructor(e,t,n,r){super(),this.favored=t,this.triedMembers=[],this.netfluxId=void 0,this.signalingId=k(),this.closeFunc=r,this.sendFunc=n,this.subscribe(t=>{switch(t.type){case"connect":{const{id:r,members:o}=t.connect;!function(e,t,n,r){let o=e.group||w.get(r);if(void 0===o)return o=new x(r),o.addMember(e,t),w.set(r,o),!0;if(1===o.size){if(void 0!==e.group)return!0;if(o.hasMembersInCommon(n))return o.addMember(e,t),!0;const r=o.getFirstMember();if(e.triedMembers.includes(r.netfluxId))return o.addMember(e,t),o.removeMember(r),r.close(4744,"replaced by a peer as prevented him from joining the group"),!0}return o.hasMembersInCommon(n)?(o.addMember(e,t),!0):(o.removeMember(e),e.bindWith(o.selectMemberFor(e)),!1)}(this,r,o,e)?n(C):n(D);break}case"heartbeat":o=0;break;case void 0:this.close(4743,"Wrong message format or unknown message")}});let o=0;this.heartbeatInterval=setInterval(()=>{o++,o>=3&&(clearInterval(this.heartbeatInterval),this.close(4742,"Too many missed hearbeats")),n(F)},5e3)}send(e){this.sendFunc(q.encode(q.create(e)).finish())}close(e,t){this.closeFunc(e,t)}onMessage(e){try{this.next(q.decode(e))}catch(e){this.close(4743,e.message)}}becomeMember(e,t){this.group=e,this.triedMembers=[],this.netfluxId=t}noLongerAMember(){this.group=void 0,this.netfluxId=void 0}onClose(){clearInterval(this.heartbeatInterval),void 0!==this.group&&this.group.removeMember(this),this.complete(),M(this.signalingId)}bindWith(e){void 0!==this.subToMember&&this.subToMember.unsubscribe(),void 0!==this.subToJoining&&this.subToJoining.unsubscribe(),M(this.signalingId),this.signalingId=k(),this.triedMembers.push(e.netfluxId),this.subToMember=e.pipe(Object(g.filter)(({content:e})=>null!=e&&e.recipientId===this.signalingId),Object(g.pluck)("content")).subscribe(({lastData:e,data:t})=>{this.send({content:{recipientId:this.signalingId,senderId:0,data:t}}),e&&this.subToMember.unsubscribe()},()=>this.send({content:{recipientId:this.signalingId,senderId:0}}),()=>this.send({content:{recipientId:this.signalingId,senderId:0}})),this.subToJoining=this.pipe(Object(g.filter)(({content:e})=>null!=e),Object(g.pluck)("content")).subscribe(({lastData:t,data:n})=>{e.send({content:{recipientId:0,senderId:this.signalingId,data:n}}),t&&this.subToJoining.unsubscribe()},()=>e.send({content:{recipientId:0,senderId:this.signalingId}}),()=>e.send({content:{recipientId:0,senderId:this.signalingId}}))}}let $;try{$=n(11).version}catch(e){try{$=n(12).version}catch(e){}$=""}o.a.version($).description("Signaling server for WebRTC. Used by Netflux API (https://coast-team.github.io/netflux/)").option("-h, --host <ip>","Select host address to bind to","0.0.0.0").option("-p, --port <number>","Select port to use","8000").option("-k, --key <file path>","Private key for the certificate.").option("-c, --cert <file path>","The server certificate.").option("-a, --ca <file path>","The additional intermediate certificate or certificates that web browsers will need in order to validate the server certificate.").on("--help",()=>{console.log("\nExamples:\n\n  $ sigver                       # Signaling server is listening on 0.0.0.0:8000\n  $ sigver -h 192.168.0.1 -p 80  # Signaling server is listening on 192.168.0.1:80\n  $ sigver --key ./private.key --cert ./primary.crt --ca ./intermediate.crt --port 443  # Signaling server is listening on 0.0.0.0:443")}).parse(process.argv);const{host:_,port:A,key:E,cert:G,ca:L}=o.a;let U;U=E&&G&&L?l.a.createServer({key:s.a.readFileSync(E),cert:s.a.readFileSync(G),ca:s.a.readFileSync(L)}):c.a.createServer(),function(e){const t=new b.a.Server({perMessageDeflate:!1,server:e});t.on("error",e=>p.fatal("WebSocketServer error",e)),t.on("connection",(e,t)=>{try{if(void 0===t.url)throw new Error("URL is undefined");const{key:n,favored:r}=function(e){const{pathname:t,query:n}=h.parse(e,!0);if(null==t)throw new I(4745,"URL pathname is undefined");return{key:t.substr(1),favored:"favored"in n}}(t.url);!function(e){if(""===e)throw new I(4741,`The key ${e} is an empty string`);if(e.length>512)throw new I(4741,"The key length exceeds the limit of 512 characters")}(n);const o=new W(n,r,t=>{try{e.send(t)}catch(t){p.error("Fail to send data",t.message),e.close(4745,t.message)}},(t,n)=>e.close(t,n));e.onmessage=({data:e})=>{e instanceof Uint8Array?o.onMessage(e):(p.error("Wrong data type"),o.close(4743,"Wrong data type"))},e.onerror=e=>o.error(e),e.onclose=()=>o.onClose()}catch(t){p.error("WebSocket connection error: ",t.message),e.close(t.code,t.message)}})}(U),U.on("clientError",(e,t)=>{p.fatal("Client error: ",e),t.end()}),U.listen(A,_,()=>{const e=U.address();null==e?p.fatal("Signaling server has no address"):"string"==typeof e?console.log(`Signaling server is listening on ${e}`):console.log(`Signaling server is listening on ${e.address}:${e.port}`)})}]);