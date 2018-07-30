import * as $protobuf from "protobufjs";
/** Properties of a Message. */
export interface IMessage {

    /** Message heartbeat */
    heartbeat?: (boolean|null);

    /** Message content */
    content?: (IContent|null);

    /** Message connect */
    connect?: (IGroupData|null);

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

    /** Message connect. */
    public connect?: (IGroupData|null);

    /** Message connected. */
    public connected: boolean;

    /** Message type. */
    public type?: ("heartbeat"|"content"|"connect"|"connected");

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

    /** Content senderId */
    senderId?: (number|null);

    /** Content recipientId */
    recipientId?: (number|null);

    /** Content lastData */
    lastData?: (boolean|null);

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

    /** Content senderId. */
    public senderId: number;

    /** Content recipientId. */
    public recipientId: number;

    /** Content lastData. */
    public lastData: boolean;

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

/** Properties of a GroupData. */
export interface IGroupData {

    /** GroupData id */
    id?: (number|null);

    /** GroupData members */
    members?: (number[]|null);
}

/** Represents a GroupData. */
export class GroupData implements IGroupData {

    /**
     * Constructs a new GroupData.
     * @param [properties] Properties to set
     */
    constructor(properties?: IGroupData);

    /** GroupData id. */
    public id: number;

    /** GroupData members. */
    public members: number[];

    /**
     * Creates a new GroupData instance using the specified properties.
     * @param [properties] Properties to set
     * @returns GroupData instance
     */
    public static create(properties?: IGroupData): GroupData;

    /**
     * Encodes the specified GroupData message. Does not implicitly {@link GroupData.verify|verify} messages.
     * @param message GroupData message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: IGroupData, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a GroupData message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns GroupData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): GroupData;
}
