// cannister code goes here
import { $query, $update, Record, StableBTreeMap, Vec, match, Result, nat64, ic, Opt } from 'azle';
import { v4 as uuidv4 } from 'uuid';

type Message = Record<{
    id: string;
    title: string;
    body: string;
    senderId: string;
    recipientId: string;
    read: boolean;
    createdAt: nat64;
    updatedAt: Opt<nat64>;
}>

type MessagePayload = Record<{
    title: string;
    body: string;
    recipientId: string;
}>

type Participant = Record<{
    id: string;
    username: string;
    password: string;
    lastLogin: Opt<nat64>;
    createdAt: nat64;
    updatedAt: Opt<nat64>;
}>

type ParticipantPayload = Record<{
    username: string;
    password: string;
}>

const messageStorage = new StableBTreeMap<string, Message>(0, 44, 1024);
const participantStorage = new StableBTreeMap<string, Participant>(1, 44, 1024);
let currentUser: Participant | null = null;

$update;
export function login(username: string, password: string): Result<string, string> {
    const users = participantStorage.values().filter(user => user.username === username);
    if (users.length === 0) {
        return Result.Err('Invalid username');
    }

    if (users[0].password !== password) {
        return Result.Err('Invalid password');
    }

    // user successfully logged-in, checking for new messages
    currentUser = users[0];
    users[0].lastLogin = Opt.Some(ic.time());
    participantStorage.insert(users[0].id, users[0]);

    const newMessages = messageStorage.values().filter(msg => msg.read === false && msg.recipientId === currentUser?.id);
    if (newMessages.length === 0) {
        return Result.Ok('You have no new messages');
    }

    return Result.Ok(`You have ${newMessages.length} new messages`);
}

export function logout(): Result<string, string> {
    if (currentUser === null) {
        return Result.Err('No logged-in user to logout');
    }

    currentUser = null;

    return Result.Ok('User successfully logged out');
}

$query;
export function getMessages(): Result<Vec<Message>, string> {
    return Result.Ok(messageStorage.values());
}

$update;
export function getMyMessages(): Result<Vec<Message>, string> {
    if (currentUser === null) {
        return Result.Err('No logged-in user');
    }

    const newMessages = messageStorage.values().filter(msg => msg.read === false && msg.recipientId === currentUser?.id);
    if (newMessages.length === 0) {
        return Result.Err('You have no new messages.');
    }

    // mark all messages as read
    newMessages.forEach(msg => {
        msg.read = true;
        messageStorage.insert(msg.id, msg);
    });

    return Result.Ok(newMessages);
}

$query;
export function getMessagesContainingString(searchPhrase: string): Result<Vec<Message>, string> {
    const allMessages: Vec<Message> = messageStorage.values();
    const filteredMessages = allMessages.filter(msg => msg.body.indexOf(searchPhrase) !== -1);

    if (filteredMessages.length > 0) {
        return Result.Ok(filteredMessages);
    } else {
        return Result.Err(`No messages found containing: ${searchPhrase}`);
    }
}

$query;
export function getMessage(id: string): Result<Message, string> {
    return match(messageStorage.get(id), {
        Some: (message) => Result.Ok<Message, string>(message),
        None: () => Result.Err<Message, string>(`a message with id=${id} not found`)
    });
}

$update;
export function addMessage(payload: MessagePayload): Result<Message, string> {
    if (currentUser === null) {
        return Result.Err('No logged-in user');
    }

    const recipientExists = participantStorage.containsKey(payload.recipientId);
    if (!recipientExists) {
        return Result.Err(`No participant exists with ID ${payload.recipientId}`);
    }

    const message: Message = {
        id: uuidv4(),
        read: false,
        senderId: currentUser.id,
        createdAt: ic.time(),
        updatedAt: Opt.None,
        ...payload
    };
    messageStorage.insert(message.id, message);
    return Result.Ok(message);
}

$update;
export function updateMessage(id: string, payload: MessagePayload): Result<Message, string> {
    return match(messageStorage.get(id), {
        Some: (message) => {
            const updatedMessage: Message = {...message, ...payload, updatedAt: Opt.Some(ic.time())};
            messageStorage.insert(message.id, updatedMessage);
            return Result.Ok<Message, string>(updatedMessage);
        },
        None: () => Result.Err<Message, string>(`couldn't update a message with id=${id}. message not found`)
    });
}

$update;
export function deleteMessage(id: string): Result<Message, string> {
    return match(messageStorage.remove(id), {
        Some: (deletedMessage) => Result.Ok<Message, string>(deletedMessage),
        None: () => Result.Err<Message, string>(`couldn't delete a message with id=${id}. message not found.`)
    });
}

$query;
export function getParticipants(): Result<Vec<Participant>, string> {
    const participants = participantStorage.values();

    return Result.Ok(participants);
}

$update;
export function addParticipant(payload: ParticipantPayload): Result<Participant, string> {
    const recipientExists = participantStorage.containsKey(payload.username);
    if (recipientExists) {
        return Result.Err(`Username ${payload.username} already taken`);
    }

    const participant: Participant = {
        id: uuidv4(),
        lastLogin: Opt.None,
        createdAt: ic.time(),
        updatedAt: Opt.None,
        ...payload
    };
    participantStorage.insert(participant.id, participant);

    return Result.Ok(participant);
}

globalThis.crypto = {
    // @ts-ignore
   getRandomValues: () => {
       let array = new Uint8Array(32)

       for (let i = 0; i < array.length; i++) {
           array[i] = Math.floor(Math.random() * 256)
       }

       return array
   }
}