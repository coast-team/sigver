/*eslint-disable block-scoped-var, no-redeclare, no-control-regex, no-prototype-builtins*/
import * as $protobuf from "protobufjs/minimal";

const $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

export const Message = $root.Message = (() => {

    function Message(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    Message.prototype.content = null;
    Message.prototype.isFirst = false;
    Message.prototype.stable = false;
    Message.prototype.heartbeat = false;
    Message.prototype.tryAnother = false;

    let $oneOfFields;

    Object.defineProperty(Message.prototype, "type", {
        get: $util.oneOfGetter($oneOfFields = ["content", "isFirst", "stable", "heartbeat", "tryAnother"]),
        set: $util.oneOfSetter($oneOfFields)
    });

    Message.create = function create(properties) {
        return new Message(properties);
    };

    Message.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.content != null && message.hasOwnProperty("content"))
            $root.Content.encode(message.content, writer.uint32(10).fork()).ldelim();
        if (message.isFirst != null && message.hasOwnProperty("isFirst"))
            writer.uint32(16).bool(message.isFirst);
        if (message.stable != null && message.hasOwnProperty("stable"))
            writer.uint32(24).bool(message.stable);
        if (message.heartbeat != null && message.hasOwnProperty("heartbeat"))
            writer.uint32(32).bool(message.heartbeat);
        if (message.tryAnother != null && message.hasOwnProperty("tryAnother"))
            writer.uint32(40).bool(message.tryAnother);
        return writer;
    };

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

    function Content(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    Content.prototype.id = 0;
    Content.prototype.data = $util.newBuffer([]);
    Content.prototype.isError = false;
    Content.prototype.isEnd = false;

    let $oneOfFields;

    Object.defineProperty(Content.prototype, "type", {
        get: $util.oneOfGetter($oneOfFields = ["data", "isError", "isEnd"]),
        set: $util.oneOfSetter($oneOfFields)
    });

    Content.create = function create(properties) {
        return new Content(properties);
    };

    Content.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.id != null && message.hasOwnProperty("id"))
            writer.uint32(8).uint32(message.id);
        if (message.data != null && message.hasOwnProperty("data"))
            writer.uint32(18).bytes(message.data);
        if (message.isError != null && message.hasOwnProperty("isError"))
            writer.uint32(24).bool(message.isError);
        if (message.isEnd != null && message.hasOwnProperty("isEnd"))
            writer.uint32(32).bool(message.isEnd);
        return writer;
    };

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
