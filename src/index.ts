import { v4 as uuidv4 } from 'uuid';
import { Server, StableBTreeMap, ic } from 'azle';
import express from 'express';

class Message {
    id: string;
    title: string;
    body: string;
    attachmentURL: string;
    createdAt: Date;
    updatedAt: Date | null
 }