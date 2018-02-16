import * as $protobuf from "protobufjs";

/** Properties of a Message. */
export interface IMessage {

    /** Message content */
    content?: (IContent|null);

    /** Message isFirst */
    isFirst?: (boolean|null);

    /** Message stable */
    stable?: (boolean|null);

    /** Message heartbeat */
    heartbeat?: (boolean|null);

    /** Message tryAnother */
    tryAnother?: (boolean|null);
}

/** Represents a Message. */
export class Message implements IMessage {

    /**
     * Constructs a new Message.
     * @param [properties] Properties to set
     */
    constructor(properties?: IMessage);

    /** Message content. */
    public content?: (IContent|null);

    /** Message isFirst. */
    public isFirst: boolean;

    /** Message stable. */
    public stable: boolean;

    /** Message heartbeat. */
    public heartbeat: boolean;

    /** Message tryAnother. */
    public tryAnother: boolean;

    /** Message type. */
    public type?: ("content"|"isFirst"|"stable"|"heartbeat"|"tryAnother");

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

    /** Content data */
    data?: (Uint8Array|null);

    /** Content isError */
    isError?: (boolean|null);

    /** Content isEnd */
    isEnd?: (boolean|null);
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

    /** Content data. */
    public data: Uint8Array;

    /** Content isError. */
    public isError: boolean;

    /** Content isEnd. */
    public isEnd: boolean;

    /** Content type. */
    public type?: ("data"|"isError"|"isEnd");

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
