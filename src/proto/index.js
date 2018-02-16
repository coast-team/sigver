/*eslint-disable block-scoped-var, no-redeclare, no-control-regex, no-prototype-builtins*/
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
     * @property {IContent|null} [content] Message content
     * @property {boolean|null} [isFirst] Message isFirst
     * @property {boolean|null} [stable] Message stable
     * @property {boolean|null} [heartbeat] Message heartbeat
     * @property {boolean|null} [tryAnother] Message tryAnother
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
     * Message content.
     * @member {IContent|null|undefined} content
     * @memberof Message
     * @instance
     */
    Message.prototype.content = null;

    /**
     * Message isFirst.
     * @member {boolean} isFirst
     * @memberof Message
     * @instance
     */
    Message.prototype.isFirst = false;

    /**
     * Message stable.
     * @member {boolean} stable
     * @memberof Message
     * @instance
     */
    Message.prototype.stable = false;

    /**
     * Message heartbeat.
     * @member {boolean} heartbeat
     * @memberof Message
     * @instance
     */
    Message.prototype.heartbeat = false;

    /**
     * Message tryAnother.
     * @member {boolean} tryAnother
     * @memberof Message
     * @instance
     */
    Message.prototype.tryAnother = false;

    // OneOf field names bound to virtual getters and setters
    let $oneOfFields;

    /**
     * Message type.
     * @member {"content"|"isFirst"|"stable"|"heartbeat"|"tryAnother"|undefined} type
     * @memberof Message
     * @instance
     */
    Object.defineProperty(Message.prototype, "type", {
        get: $util.oneOfGetter($oneOfFields = ["content", "isFirst", "stable", "heartbeat", "tryAnother"]),
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
        if (message.content != null && message.hasOwnProperty("content"))
            $root.Content.encode(message.content, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
        if (message.isFirst != null && message.hasOwnProperty("isFirst"))
            writer.uint32(/* id 2, wireType 0 =*/16).bool(message.isFirst);
        if (message.stable != null && message.hasOwnProperty("stable"))
            writer.uint32(/* id 3, wireType 0 =*/24).bool(message.stable);
        if (message.heartbeat != null && message.hasOwnProperty("heartbeat"))
            writer.uint32(/* id 4, wireType 0 =*/32).bool(message.heartbeat);
        if (message.tryAnother != null && message.hasOwnProperty("tryAnother"))
            writer.uint32(/* id 5, wireType 0 =*/40).bool(message.tryAnother);
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
                message.content = $root.Content.decode(reader, reader.uint32());
                break;
            case 2:
                message.isFirst = reader.bool();
                break;
            case 3:
                message.stable = reader.bool();
                break;
            case 4:
                message.heartbeat = reader.bool();
                break;
            case 5:
                message.tryAnother = reader.bool();
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
     * @property {number|null} [id] Content id
     * @property {Uint8Array|null} [data] Content data
     * @property {boolean|null} [isError] Content isError
     * @property {boolean|null} [isEnd] Content isEnd
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
     * Content id.
     * @member {number} id
     * @memberof Content
     * @instance
     */
    Content.prototype.id = 0;

    /**
     * Content data.
     * @member {Uint8Array} data
     * @memberof Content
     * @instance
     */
    Content.prototype.data = $util.newBuffer([]);

    /**
     * Content isError.
     * @member {boolean} isError
     * @memberof Content
     * @instance
     */
    Content.prototype.isError = false;

    /**
     * Content isEnd.
     * @member {boolean} isEnd
     * @memberof Content
     * @instance
     */
    Content.prototype.isEnd = false;

    // OneOf field names bound to virtual getters and setters
    let $oneOfFields;

    /**
     * Content type.
     * @member {"data"|"isError"|"isEnd"|undefined} type
     * @memberof Content
     * @instance
     */
    Object.defineProperty(Content.prototype, "type", {
        get: $util.oneOfGetter($oneOfFields = ["data", "isError", "isEnd"]),
        set: $util.oneOfSetter($oneOfFields)
    });

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
        if (message.data != null && message.hasOwnProperty("data"))
            writer.uint32(/* id 2, wireType 2 =*/18).bytes(message.data);
        if (message.isError != null && message.hasOwnProperty("isError"))
            writer.uint32(/* id 3, wireType 0 =*/24).bool(message.isError);
        if (message.isEnd != null && message.hasOwnProperty("isEnd"))
            writer.uint32(/* id 4, wireType 0 =*/32).bool(message.isEnd);
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
                message.id = reader.uint32();
                break;
            case 2:
                message.data = reader.bytes();
                break;
            case 3:
                message.isError = reader.bool();
                break;
            case 4:
                message.isEnd = reader.bool();
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

export { $root as default };
