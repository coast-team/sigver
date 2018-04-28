import * as $protobuf from "protobufjs";

/** Properties of a Message. */
export interface IMessage {

    /** Message heartbeat */
    heartbeat?: (boolean|null);

    /** Message content */
    content?: (IContent|null);

    /** Message check */
    check?: (ICheck|null);

    /** Message connected */
    connected?: (boolean|null);
}

/** Represents a Message. */
export class Message implements IMessage {

    /**
     * Constructs a new Message.
     * @param [properties] Properties to set
     */
    constructor(properties?: IMessage);

    /** Message heartbeat. */
    public heartbeat: boolean;

    /** Message content. */
    public content?: (IContent|null);

    /** Message check. */
    public check?: (ICheck|null);

    /** Message connected. */
    public connected: boolean;

    /** Message type. */
    public type?: ("heartbeat"|"content"|"check"|"connected");

    /**
     * Creates a new Message instance using the specified properties.
     * @param [properties] Properties to set
     * @returns Message instance
     */
    public static create(properties?: IMessage): Message;

    /**
     * Encodes the specified Message message. Does not implicitly {@link Message.verify|verify} messages.
     * @param message Message message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: IMessage, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a Message message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns Message
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): Message;
}

/** Properties of a Content. */
export interface IContent {

    /** Content id */
    id?: (number|null);

    /** Content unsubscribe */
    unsubscribe?: (boolean|null);

    /** Content data */
    data?: (Uint8Array|null);
}

/** Represents a Content. */
export class Content implements IContent {

    /**
     * Constructs a new Content.
     * @param [properties] Properties to set
     */
    constructor(properties?: IContent);

    /** Content id. */
    public id: number;

    /** Content unsubscribe. */
    public unsubscribe: boolean;

    /** Content data. */
    public data: Uint8Array;

    /**
     * Creates a new Content instance using the specified properties.
     * @param [properties] Properties to set
     * @returns Content instance
     */
    public static create(properties?: IContent): Content;

    /**
     * Encodes the specified Content message. Does not implicitly {@link Content.verify|verify} messages.
     * @param message Content message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: IContent, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a Content message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns Content
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): Content;
}

/** Properties of a Check. */
export interface ICheck {

    /** Check id */
    id?: (number|null);

    /** Check members */
    members?: (number[]|null);
}

/** Represents a Check. */
export class Check implements ICheck {

    /**
     * Constructs a new Check.
     * @param [properties] Properties to set
     */
    constructor(properties?: ICheck);

    /** Check id. */
    public id: number;

    /** Check members. */
    public members: number[];

    /**
     * Creates a new Check instance using the specified properties.
     * @param [properties] Properties to set
     * @returns Check instance
     */
    public static create(properties?: ICheck): Check;

    /**
     * Encodes the specified Check message. Does not implicitly {@link Check.verify|verify} messages.
     * @param message Check message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ICheck, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a Check message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns Check
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): Check;
}
