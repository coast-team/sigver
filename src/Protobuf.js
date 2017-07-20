/*eslint-disable block-scoped-var, no-redeclare, no-control-regex, no-prototype-builtins*/
import * as $protobuf from "protobufjs/minimal";

const $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

export const Incoming = $root.Incoming = (() => {

    function Incoming(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    Incoming.prototype.content = null;
    Incoming.prototype.joined = false;
    Incoming.prototype.ping = false;
    Incoming.prototype.pong = false;

    let $oneOfFields;

    Object.defineProperty(Incoming.prototype, "type", {
        get: $util.oneOfGetter($oneOfFields = ["content", "joined", "ping", "pong"]),
        set: $util.oneOfSetter($oneOfFields)
    });

    Incoming.create = function create(properties) {
        return new Incoming(properties);
    };

    Incoming.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.content != null && message.hasOwnProperty("content"))
            $root.Content.encode(message.content, writer.uint32(10).fork()).ldelim();
        if (message.joined != null && message.hasOwnProperty("joined"))
            writer.uint32(16).bool(message.joined);
        if (message.ping != null && message.hasOwnProperty("ping"))
            writer.uint32(24).bool(message.ping);
        if (message.pong != null && message.hasOwnProperty("pong"))
            writer.uint32(32).bool(message.pong);
        return writer;
    };

    Incoming.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.Incoming();
        while (reader.pos < end) {
            let tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.content = $root.Content.decode(reader, reader.uint32());
                break;
            case 2:
                message.joined = reader.bool();
                break;
            case 3:
                message.ping = reader.bool();
                break;
            case 4:
                message.pong = reader.bool();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    return Incoming;
})();

export const Outcoming = $root.Outcoming = (() => {

    function Outcoming(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    Outcoming.prototype.content = null;
    Outcoming.prototype.isFirst = false;
    Outcoming.prototype.ping = false;
    Outcoming.prototype.pong = false;

    let $oneOfFields;

    Object.defineProperty(Outcoming.prototype, "type", {
        get: $util.oneOfGetter($oneOfFields = ["content", "isFirst", "ping", "pong"]),
        set: $util.oneOfSetter($oneOfFields)
    });

    Outcoming.create = function create(properties) {
        return new Outcoming(properties);
    };

    Outcoming.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.content != null && message.hasOwnProperty("content"))
            $root.Content.encode(message.content, writer.uint32(10).fork()).ldelim();
        if (message.isFirst != null && message.hasOwnProperty("isFirst"))
            writer.uint32(16).bool(message.isFirst);
        if (message.ping != null && message.hasOwnProperty("ping"))
            writer.uint32(24).bool(message.ping);
        if (message.pong != null && message.hasOwnProperty("pong"))
            writer.uint32(32).bool(message.pong);
        return writer;
    };

    Outcoming.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.Outcoming();
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
                message.ping = reader.bool();
                break;
            case 4:
                message.pong = reader.bool();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    return Outcoming;
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
