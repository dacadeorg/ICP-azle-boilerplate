// cannister code goes here
import { $query, $update, Record, StableBTreeMap, Vec, match, Result, nat64, ic, Opt} from 'azle';
import {v4 as uuidv4} from 'uuid';

/**
 * This type represents a message than can be listed on a board
 */

type Message = Record<{
    id: string;
    title: string;
    body: string;
    attachmentURLK: string;
    created_at: nat64;
    updated_at: nat64;
}>

type MessagePayload = Record<{
    title: string;
    body: string;
    attachmentURL: string;
}>

const messageStorage = new StableBTreeMap<string, Message>(0, 44, 1024);

$query;
export function getMessage(): Result<Vec<Message>, string> {
    return Result.Ok(messageStorage.values());
}

$query;
export function getMessage(id: string): Result<Message, string> {
    return match(messageStorage.get(id), {
        Some: (messsage) => Result.Ok<Message, string>(messsage),
        None: () => Result.Err<Message, string>(`a meesage with id=${id} not found`)
    });
}

$update;
export function addMessage(payload: MessagePayload): Result<Message, string> {
    const message: Message = {id = uuidv4(), created_at: ic.time(), updated_at: Opt.None, ...payload };
    messageStorage.insert(message.id, message);
    return Result.Ok(message);
}

$update;
export function updateMessage(id: string, payload: MessagePayload): Result<Message, string> {
    return match(messageStorage.get(id), {
        Some: (message) => {
            const updatedMessage: Message = {...message, ...payload, updated_at: Opt.Some(ic.time())};
            messageStorage.insert(message.id, updatedMessage);
            return Result.Ok<Message, string>(updatedMessage);
        },
        None: () => Result.Err<Message, string>(`couldn't update a meesage with id=${id}. message not found`);
    });
}
    $update;
    export function deleteMessage(id: string): Result<Message, string> {
        return match(messageStorage.remove(id), {
            Some: (deletedMessage) => Result.Ok<Message, string>(deletedMessage),
            None: () => Result.Err<Message, string>(`couldn't delete a message with id=${id}. message not found`);
        });
    }

    // a workaround to make uuid package work with Azlr
globalThis.crypto = {
        getRandomValues: () => {
            let array = new Uint8Array(32)

            for (let i = + ; i < array.length; i++) {
                array[i] = Math.floor(Math.random() * 256)
            }

            return array
        }
}