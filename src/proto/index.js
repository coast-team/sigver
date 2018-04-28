/*eslint-disable block-scoped-var, no-redeclare, no-control-regex, no-prototype-builtins*/
(function(global, factory) { /* global define, require, module */

    /* AMD */ if (typeof define === 'function' && define.amd)
        define(["protobufjs/minimal"], factory);

    /* CommonJS */ else if (typeof require === 'function' && typeof module === 'object' && module && module.exports)
        module.exports = factory(require("protobufjs/minimal"));

})(this, function($protobuf) {
    "use strict";

    // Common aliases
    var $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;
    
    // Exported root namespace
    var $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});
    
    $root.Message = (function() {
    
        /**
         * Properties of a Message.
         * @exports IMessage
         * @interface IMessage
         * @property {boolean|null} [heartbeat] Message heartbeat
         * @property {IContent|null} [content] Message content
         * @property {ICheck|null} [check] Message check
         * @property {boolean|null} [tryAnother] Message tryAnother
         * @property {boolean|null} [connected] Message connected
         */
    
        /**
         * Constructs a new Message.
         * @exports Message
         * @classdesc Represents a Message.
         * @implements IMessage
         * @constructor
         * @param {IMessage=} [properties] Properties to set
         */
        function Message(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }
    
        /**
         * Message heartbeat.
         * @member {boolean} heartbeat
         * @memberof Message
         * @instance
         */
        Message.prototype.heartbeat = false;
    
        /**
         * Message content.
         * @member {IContent|null|undefined} content
         * @memberof Message
         * @instance
         */
        Message.prototype.content = null;
    
        /**
         * Message check.
         * @member {ICheck|null|undefined} check
         * @memberof Message
         * @instance
         */
        Message.prototype.check = null;
    
        /**
         * Message tryAnother.
         * @member {boolean} tryAnother
         * @memberof Message
         * @instance
         */
        Message.prototype.tryAnother = false;
    
        /**
         * Message connected.
         * @member {boolean} connected
         * @memberof Message
         * @instance
         */
        Message.prototype.connected = false;
    
        // OneOf field names bound to virtual getters and setters
        var $oneOfFields;
    
        /**
         * Message type.
         * @member {"heartbeat"|"content"|"check"|"tryAnother"|"connected"|undefined} type
         * @memberof Message
         * @instance
         */
        Object.defineProperty(Message.prototype, "type", {
            get: $util.oneOfGetter($oneOfFields = ["heartbeat", "content", "check", "tryAnother", "connected"]),
            set: $util.oneOfSetter($oneOfFields)
        });
    
        /**
         * Creates a new Message instance using the specified properties.
         * @function create
         * @memberof Message
         * @static
         * @param {IMessage=} [properties] Properties to set
         * @returns {Message} Message instance
         */
        Message.create = function create(properties) {
            return new Message(properties);
        };
    
        /**
         * Encodes the specified Message message. Does not implicitly {@link Message.verify|verify} messages.
         * @function encode
         * @memberof Message
         * @static
         * @param {IMessage} message Message message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Message.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.heartbeat != null && message.hasOwnProperty("heartbeat"))
                writer.uint32(/* id 1, wireType 0 =*/8).bool(message.heartbeat);
            if (message.content != null && message.hasOwnProperty("content"))
                $root.Content.encode(message.content, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
            if (message.check != null && message.hasOwnProperty("check"))
                $root.Check.encode(message.check, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
            if (message.tryAnother != null && message.hasOwnProperty("tryAnother"))
                writer.uint32(/* id 4, wireType 0 =*/32).bool(message.tryAnother);
            if (message.connected != null && message.hasOwnProperty("connected"))
                writer.uint32(/* id 5, wireType 0 =*/40).bool(message.connected);
            return writer;
        };
    
        /**
         * Decodes a Message message from the specified reader or buffer.
         * @function decode
         * @memberof Message
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {Message} Message
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Message.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.Message();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.heartbeat = reader.bool();
                    break;
                case 2:
                    message.content = $root.Content.decode(reader, reader.uint32());
                    break;
                case 3:
                    message.check = $root.Check.decode(reader, reader.uint32());
                    break;
                case 4:
                    message.tryAnother = reader.bool();
                    break;
                case 5:
                    message.connected = reader.bool();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };
    
        return Message;
    })();
    
    $root.Content = (function() {
    
        /**
         * Properties of a Content.
         * @exports IContent
         * @interface IContent
         * @property {number|null} [id] Content id
         * @property {boolean|null} [unsubscribe] Content unsubscribe
         * @property {Uint8Array|null} [data] Content data
         */
    
        /**
         * Constructs a new Content.
         * @exports Content
         * @classdesc Represents a Content.
         * @implements IContent
         * @constructor
         * @param {IContent=} [properties] Properties to set
         */
        function Content(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }
    
        /**
         * Content id.
         * @member {number} id
         * @memberof Content
         * @instance
         */
        Content.prototype.id = 0;
    
        /**
         * Content unsubscribe.
         * @member {boolean} unsubscribe
         * @memberof Content
         * @instance
         */
        Content.prototype.unsubscribe = false;
    
        /**
         * Content data.
         * @member {Uint8Array} data
         * @memberof Content
         * @instance
         */
        Content.prototype.data = $util.newBuffer([]);
    
        /**
         * Creates a new Content instance using the specified properties.
         * @function create
         * @memberof Content
         * @static
         * @param {IContent=} [properties] Properties to set
         * @returns {Content} Content instance
         */
        Content.create = function create(properties) {
            return new Content(properties);
        };
    
        /**
         * Encodes the specified Content message. Does not implicitly {@link Content.verify|verify} messages.
         * @function encode
         * @memberof Content
         * @static
         * @param {IContent} message Content message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Content.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.id != null && message.hasOwnProperty("id"))
                writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.id);
            if (message.unsubscribe != null && message.hasOwnProperty("unsubscribe"))
                writer.uint32(/* id 2, wireType 0 =*/16).bool(message.unsubscribe);
            if (message.data != null && message.hasOwnProperty("data"))
                writer.uint32(/* id 3, wireType 2 =*/26).bytes(message.data);
            return writer;
        };
    
        /**
         * Decodes a Content message from the specified reader or buffer.
         * @function decode
         * @memberof Content
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {Content} Content
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Content.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.Content();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.id = reader.uint32();
                    break;
                case 2:
                    message.unsubscribe = reader.bool();
                    break;
                case 3:
                    message.data = reader.bytes();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };
    
        return Content;
    })();
    
    $root.Check = (function() {
    
        /**
         * Properties of a Check.
         * @exports ICheck
         * @interface ICheck
         * @property {number|null} [myId] Check myId
         * @property {Array.<number>|null} [members] Check members
         */
    
        /**
         * Constructs a new Check.
         * @exports Check
         * @classdesc Represents a Check.
         * @implements ICheck
         * @constructor
         * @param {ICheck=} [properties] Properties to set
         */
        function Check(properties) {
            this.members = [];
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }
    
        /**
         * Check myId.
         * @member {number} myId
         * @memberof Check
         * @instance
         */
        Check.prototype.myId = 0;
    
        /**
         * Check members.
         * @member {Array.<number>} members
         * @memberof Check
         * @instance
         */
        Check.prototype.members = $util.emptyArray;
    
        /**
         * Creates a new Check instance using the specified properties.
         * @function create
         * @memberof Check
         * @static
         * @param {ICheck=} [properties] Properties to set
         * @returns {Check} Check instance
         */
        Check.create = function create(properties) {
            return new Check(properties);
        };
    
        /**
         * Encodes the specified Check message. Does not implicitly {@link Check.verify|verify} messages.
         * @function encode
         * @memberof Check
         * @static
         * @param {ICheck} message Check message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Check.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.myId != null && message.hasOwnProperty("myId"))
                writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.myId);
            if (message.members != null && message.members.length) {
                writer.uint32(/* id 2, wireType 2 =*/18).fork();
                for (var i = 0; i < message.members.length; ++i)
                    writer.uint32(message.members[i]);
                writer.ldelim();
            }
            return writer;
        };
    
        /**
         * Decodes a Check message from the specified reader or buffer.
         * @function decode
         * @memberof Check
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {Check} Check
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Check.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.Check();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.myId = reader.uint32();
                    break;
                case 2:
                    if (!(message.members && message.members.length))
                        message.members = [];
                    if ((tag & 7) === 2) {
                        var end2 = reader.uint32() + reader.pos;
                        while (reader.pos < end2)
                            message.members.push(reader.uint32());
                    } else
                        message.members.push(reader.uint32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };
    
        return Check;
    })();

    return $root;
});
