#!/usr/bin/env node
var Y=Object.create;var S=Object.defineProperty;var X=Object.getOwnPropertyDescriptor;var q=Object.getOwnPropertyNames;var Q=Object.getPrototypeOf,Z=Object.prototype.hasOwnProperty;var ee=n=>S(n,"__esModule",{value:!0});var te=(n,r,e,t)=>{if(r&&typeof r=="object"||typeof r=="function")for(let o of q(r))!Z.call(n,o)&&(e||o!=="default")&&S(n,o,{get:()=>r[o],enumerable:!(t=X(r,o))||t.enumerable});return n},u=(n,r)=>te(ee(S(n!=null?Y(Q(n)):{},"default",!r&&n&&n.__esModule?{get:()=>n.default,enumerable:!0}:{value:n,enumerable:!0})),n);var B=require("commander"),I=u(require("fs")),N=u(require("http")),J=u(require("https"));var w=u(require("pino")),ne=process.env.NODE_ENV==="development"?"debug":"info",a=(0,w.default)({name:"sigver",level:ne});var L=u(require("url")),j=u(require("ws"));var H=require("rxjs"),m=require("rxjs/operators");var g=class extends Error{constructor(r,e=""){super();this.name=this.constructor.name,this.code=r,this.message=`${r}: ${e}`}},G=4741,P=4742,v=4743,_=4744,E=4745,$=512;function D(n){if(n==="")throw new g(G,`The key ${n} is an empty string`);if(n.length>$)throw new g(G,`The key length exceeds the limit of ${$} characters`)}var R=new Map;function F(n,r,e,t){let o=n.group||R.get(t);if(o===void 0)return o=new U(t),o.addMember(n,r),R.set(t,o),!0;if(o.size===1){if(n.group!==void 0)return!0;if(o.hasMembersInCommon(e))return o.addMember(n,r),!0;let i=o.getFirstMember();if(n.triedMembers.includes(i.netfluxId))return o.addMember(n,r),o.removeMember(i),i.close(_,"replaced by a peer as prevented him from joining the group"),!0}return o.hasMembersInCommon(e)?(o.addMember(n,r),!0):(o.removeMember(n),n.bindWith(o.selectMemberFor(n)),!1)}var U=class{constructor(r){this.key=r,this.members=new Set}get size(){return this.members.size}getFirstMember(){return this.members.values().next().value}hasMembersInCommon(r){if(r.length!==0){for(let e of this.members)if(r.includes(e.netfluxId))return!0}return!1}addMember(r,e){r.becomeMember(this,e),this.members.add(r)}removeMember(r){r.noLongerAMember(),this.members.delete(r),this.size===0&&R.delete(this.key)}selectMemberFor(r){let e;for(let t of this.members){let o=t.netfluxId;if(o!==void 0&&!r.triedMembers.includes(o)){if(t.favored)return t;e===void 0&&(e=t)}}return e!==void 0?e:(r.triedMembers=[],this.selectMemberFor(r))}};var C=u(require("crypto")),k=new Set;function re(){return C.randomBytes(4).readUInt32BE(0)>>>1}function x(){let n;do n=re();while(n===0||k.has(n));return k.add(n),n}function T(n){k.delete(n)}var l=u(require("protobufjs/minimal")),p=l.Reader,O=l.Writer,y=l.util,d=l.roots.default||(l.roots.default={}),b=d.Message=(()=>{function n(e){if(e)for(let t=Object.keys(e),o=0;o<t.length;++o)e[t[o]]!=null&&(this[t[o]]=e[t[o]])}n.prototype.heartbeat=null,n.prototype.content=null,n.prototype.connect=null,n.prototype.connected=null;let r;return Object.defineProperty(n.prototype,"type",{get:y.oneOfGetter(r=["heartbeat","content","connect","connected"]),set:y.oneOfSetter(r)}),n.encode=function(t,o){return o||(o=O.create()),t.heartbeat!=null&&Object.hasOwnProperty.call(t,"heartbeat")&&o.uint32(8).bool(t.heartbeat),t.content!=null&&Object.hasOwnProperty.call(t,"content")&&d.Content.encode(t.content,o.uint32(18).fork()).ldelim(),t.connect!=null&&Object.hasOwnProperty.call(t,"connect")&&d.GroupData.encode(t.connect,o.uint32(26).fork()).ldelim(),t.connected!=null&&Object.hasOwnProperty.call(t,"connected")&&o.uint32(32).bool(t.connected),o},n.decode=function(t,o){t instanceof p||(t=p.create(t));let i=o===void 0?t.len:t.pos+o,s=new d.Message;for(;t.pos<i;){let c=t.uint32();switch(c>>>3){case 1:s.heartbeat=t.bool();break;case 2:s.content=d.Content.decode(t,t.uint32());break;case 3:s.connect=d.GroupData.decode(t,t.uint32());break;case 4:s.connected=t.bool();break;default:t.skipType(c&7);break}}return s},n})(),Ie=d.Content=(()=>{function n(r){if(r)for(let e=Object.keys(r),t=0;t<e.length;++t)r[e[t]]!=null&&(this[e[t]]=r[e[t]])}return n.prototype.senderId=0,n.prototype.recipientId=0,n.prototype.lastData=!1,n.prototype.data=y.newBuffer([]),n.encode=function(e,t){return t||(t=O.create()),e.senderId!=null&&Object.hasOwnProperty.call(e,"senderId")&&t.uint32(8).uint32(e.senderId),e.recipientId!=null&&Object.hasOwnProperty.call(e,"recipientId")&&t.uint32(16).uint32(e.recipientId),e.lastData!=null&&Object.hasOwnProperty.call(e,"lastData")&&t.uint32(24).bool(e.lastData),e.data!=null&&Object.hasOwnProperty.call(e,"data")&&t.uint32(34).bytes(e.data),t},n.decode=function(e,t){e instanceof p||(e=p.create(e));let o=t===void 0?e.len:e.pos+t,i=new d.Content;for(;e.pos<o;){let s=e.uint32();switch(s>>>3){case 1:i.senderId=e.uint32();break;case 2:i.recipientId=e.uint32();break;case 3:i.lastData=e.bool();break;case 4:i.data=e.bytes();break;default:e.skipType(s&7);break}}return i},n})(),Me=d.GroupData=(()=>{function n(r){if(this.members=[],r)for(let e=Object.keys(r),t=0;t<e.length;++t)r[e[t]]!=null&&(this[e[t]]=r[e[t]])}return n.prototype.id=0,n.prototype.members=y.emptyArray,n.encode=function(e,t){if(t||(t=O.create()),e.id!=null&&Object.hasOwnProperty.call(e,"id")&&t.uint32(8).uint32(e.id),e.members!=null&&e.members.length){t.uint32(18).fork();for(let o=0;o<e.members.length;++o)t.uint32(e.members[o]);t.ldelim()}return t},n.decode=function(e,t){e instanceof p||(e=p.create(e));let o=t===void 0?e.len:e.pos+t,i=new d.GroupData;for(;e.pos<o;){let s=e.uint32();switch(s>>>3){case 1:i.id=e.uint32();break;case 2:if(i.members&&i.members.length||(i.members=[]),(s&7)===2){let c=e.uint32()+e.pos;for(;e.pos<c;)i.members.push(e.uint32())}else i.members.push(e.uint32());break;default:e.skipType(s&7);break}}return i},n})();var oe=3,ie=5e3,se=b.encode({heartbeat:!0}).finish(),ce=b.encode({connected:!0}).finish(),ae=b.encode({connected:!1}).finish(),A=class extends H.Subject{constructor(r,e,t,o){super();this.favored=e,this.triedMembers=[],this.netfluxId=void 0,this.signalingId=x(),this.closeFunc=o,this.sendFunc=t,this.subscribe(s=>{switch(s.type){case"connect":{let{id:c,members:f}=s.connect;F(this,c,f,r)?t(ce):t(ae);break}case"heartbeat":i=0;break;case void 0:this.close(v,"Wrong message format or unknown message");break}});let i=0;this.heartbeatInterval=setInterval(()=>{i++,i>=oe&&(clearInterval(this.heartbeatInterval),this.close(P,"Too many missed heartbeats")),t(se)},ie)}send(r){this.sendFunc(b.encode(r).finish())}close(r,e){this.closeFunc(r,e)}onMessage(r){try{this.next(b.decode(r))}catch(e){this.close(v,e.message)}}becomeMember(r,e){this.group=r,this.triedMembers=[],this.netfluxId=e}noLongerAMember(){this.group=void 0,this.netfluxId=void 0}onClose(){clearInterval(this.heartbeatInterval),this.group!==void 0&&this.group.removeMember(this),this.complete(),T(this.signalingId)}bindWith(r){this.subToMember!==void 0&&this.subToMember.unsubscribe(),this.subToJoining!==void 0&&this.subToJoining.unsubscribe(),T(this.signalingId),this.signalingId=x(),this.triedMembers.push(r.netfluxId),this.subToMember=r.pipe((0,m.filter)(({content:e})=>e!=null&&e.recipientId===this.signalingId),(0,m.map)(e=>e.content)).subscribe({next:({lastData:e,data:t})=>{this.send({content:{recipientId:this.signalingId,senderId:0,data:t}}),e&&this.subToMember.unsubscribe()},error:()=>this.send({content:{recipientId:this.signalingId,senderId:0}}),complete:()=>this.send({content:{recipientId:this.signalingId,senderId:0}})}),this.subToJoining=this.pipe((0,m.filter)(({content:e})=>e!=null),(0,m.map)(e=>e.content)).subscribe({next:({lastData:e,data:t})=>{r.send({content:{recipientId:0,senderId:this.signalingId,data:t}}),e&&this.subToJoining.unsubscribe()},error:()=>r.send({content:{recipientId:0,senderId:this.signalingId}}),complete:()=>r.send({content:{recipientId:0,senderId:this.signalingId}})})}};function W(n){let r=new j.default.Server({perMessageDeflate:!1,server:n});return r.on("error",e=>a.fatal("WebSocketServer error",e)),r.on("connection",(e,t)=>{try{if(t.url===void 0)throw new Error("URL is undefined");let{key:o,favored:i}=de(t.url);D(o);let s=new A(o,i,c=>{try{e.send(c)}catch(f){a.error("Fail to send data",f.message),e.close(E,f.message)}},(c,f)=>e.close(c,f));e.onmessage=({data:c})=>{c instanceof Uint8Array?s.onMessage(c):(a.error("Wrong data type"),s.close(v,"Wrong data type"))},e.onerror=c=>s.error(c),e.onclose=()=>s.onClose()}catch(o){a.error("WebSocket connection error: ",o.message),e.close(o.code,o.message)}}),r}function de(n){let{pathname:r,query:e}=L.parse(n,!0);if(r==null)throw new g(E,"URL pathname is undefined");return{key:r.slice(1),favored:"favored"in e}}var le="0.0.0.0",ue="8000",M=new B.Command;M.version("21.1.0").description("Signaling server for WebRTC. Used by Netflux API (https://coast-team.github.io/netflux/)").option("-h, --host <ip>","Select host address to bind to",le).option("-p, --port <number>","Select port to use",ue).option("-k, --key <file path>","Private key for the certificate.").option("-c, --cert <file path>","The server certificate.").option("-a, --ca <file path>","The additional intermediate certificate or certificates that web browsers will need in order to validate the server certificate.");M.addHelpText("after",`
Examples:

  $ sigver                       # Signaling server is listening on 0.0.0.0:8000
  $ sigver -h 192.168.0.1 -p 80  # Signaling server is listening on 192.168.0.1:80
  $ sigver --key ./private.key --cert ./primary.crt --ca ./intermediate.crt --port 443  # Signaling server is listening on 0.0.0.0:443`);M.parse(process.argv);var{host:fe,port:pe,key:K,cert:V,ca:z}=M.opts(),h;K&&V&&z?h=J.default.createServer({key:I.default.readFileSync(K),cert:I.default.readFileSync(V),ca:I.default.readFileSync(z)}):h=N.default.createServer();W(h);h.on("clientError",(n,r)=>{a.fatal("Client error: ",n),r.end()});h.listen(pe,fe,()=>{let n=h.address();n==null?a.fatal("Signaling server has no address"):typeof n=="string"?a.info(`Signaling server is listening on ${n}`):a.info(`Signaling server is listening on ${n.address}:${n.port}`)});
