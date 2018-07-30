/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
import * as $protobuf from "protobufjs/minimal";

// Common aliases
const $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

export const Message = $root.Message = (() => {

    /**
     * Properties of a Message.
     * @exports IMessage
     * @interface IMessage
     * @property {boolean|null} [heartbeat] Message heartbeat
     * @property {IContent|null} [content] Message content
     * @property {IGroupData|null} [connect] Message connect
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
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
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
     * Message connect.
     * @member {IGroupData|null|undefined} connect
     * @memberof Message
     * @instance
     */
    Message.prototype.connect = null;

    /**
     * Message connected.
     * @member {boolean} connected
     * @memberof Message
     * @instance
     */
    Message.prototype.connected = false;

    // OneOf field names bound to virtual getters and setters
    let $oneOfFields;

    /**
     * Message type.
     * @member {"heartbeat"|"content"|"connect"|"connected"|undefined} type
     * @memberof Message
     * @instance
     */
    Object.defineProperty(Message.prototype, "type", {
        get: $util.oneOfGetter($oneOfFields = ["heartbeat", "content", "connect", "connected"]),
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
        if (message.connect != null && message.hasOwnProperty("connect"))
            $root.GroupData.encode(message.connect, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
        if (message.connected != null && message.hasOwnProperty("connected"))
            writer.uint32(/* id 4, wireType 0 =*/32).bool(message.connected);
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
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.Message();
        while (reader.pos < end) {
            let tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.heartbeat = reader.bool();
                break;
            case 2:
                message.content = $root.Content.decode(reader, reader.uint32());
                break;
            case 3:
                message.connect = $root.GroupData.decode(reader, reader.uint32());
                break;
            case 4:
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

export const Content = $root.Content = (() => {

    /**
     * Properties of a Content.
     * @exports IContent
     * @interface IContent
     * @property {number|null} [senderId] Content senderId
     * @property {number|null} [recipientId] Content recipientId
     * @property {boolean|null} [lastData] Content lastData
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
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * Content senderId.
     * @member {number} senderId
     * @memberof Content
     * @instance
     */
    Content.prototype.senderId = 0;

    /**
     * Content recipientId.
     * @member {number} recipientId
     * @memberof Content
     * @instance
     */
    Content.prototype.recipientId = 0;

    /**
     * Content lastData.
     * @member {boolean} lastData
     * @memberof Content
     * @instance
     */
    Content.prototype.lastData = false;

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
        if (message.senderId != null && message.hasOwnProperty("senderId"))
            writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.senderId);
        if (message.recipientId != null && message.hasOwnProperty("recipientId"))
            writer.uint32(/* id 2, wireType 0 =*/16).uint32(message.recipientId);
        if (message.lastData != null && message.hasOwnProperty("lastData"))
            writer.uint32(/* id 3, wireType 0 =*/24).bool(message.lastData);
        if (message.data != null && message.hasOwnProperty("data"))
            writer.uint32(/* id 4, wireType 2 =*/34).bytes(message.data);
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
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.Content();
        while (reader.pos < end) {
            let tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.senderId = reader.uint32();
                break;
            case 2:
                message.recipientId = reader.uint32();
                break;
            case 3:
                message.lastData = reader.bool();
                break;
            case 4:
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

export const GroupData = $root.GroupData = (() => {

    /**
     * Properties of a GroupData.
     * @exports IGroupData
     * @interface IGroupData
     * @property {number|null} [id] GroupData id
     * @property {Array.<number>|null} [members] GroupData members
     */

    /**
     * Constructs a new GroupData.
     * @exports GroupData
     * @classdesc Represents a GroupData.
     * @implements IGroupData
     * @constructor
     * @param {IGroupData=} [properties] Properties to set
     */
    function GroupData(properties) {
        this.members = [];
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * GroupData id.
     * @member {number} id
     * @memberof GroupData
     * @instance
     */
    GroupData.prototype.id = 0;

    /**
     * GroupData members.
     * @member {Array.<number>} members
     * @memberof GroupData
     * @instance
     */
    GroupData.prototype.members = $util.emptyArray;

    /**
     * Creates a new GroupData instance using the specified properties.
     * @function create
     * @memberof GroupData
     * @static
     * @param {IGroupData=} [properties] Properties to set
     * @returns {GroupData} GroupData instance
     */
    GroupData.create = function create(properties) {
        return new GroupData(properties);
    };

    /**
     * Encodes the specified GroupData message. Does not implicitly {@link GroupData.verify|verify} messages.
     * @function encode
     * @memberof GroupData
     * @static
     * @param {IGroupData} message GroupData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    GroupData.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.id != null && message.hasOwnProperty("id"))
            writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.id);
        if (message.members != null && message.members.length) {
            writer.uint32(/* id 2, wireType 2 =*/18).fork();
            for (let i = 0; i < message.members.length; ++i)
                writer.uint32(message.members[i]);
            writer.ldelim();
        }
        return writer;
    };

    /**
     * Decodes a GroupData message from the specified reader or buffer.
     * @function decode
     * @memberof GroupData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {GroupData} GroupData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    GroupData.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.GroupData();
        while (reader.pos < end) {
            let tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.id = reader.uint32();
                break;
            case 2:
                if (!(message.members && message.members.length))
                    message.members = [];
                if ((tag & 7) === 2) {
                    let end2 = reader.uint32() + reader.pos;
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

    return GroupData;
})();

export { $root as default };
