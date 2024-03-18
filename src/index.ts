// cannister code goes here
import { v4 as uuidv4 } from 'uuid';
import { Server, StableBTreeMap, ic } from 'azle';
import express from 'express';

class NameRecord {
    id: string;
    name: string;
    owner: string;
    createdAt: Date;
    updatedAt: Date | null;
}

const nameRecordsStorage = StableBTreeMap<string, NameRecord>(0);

export default Server(() => {
    const app = express();
    app.use(express.json());

    app.post("/names", (req, res) => {
        const { name, owner } = req.body;
        if (!name || !owner) {
            res.status(400).send("Name and owner are required.");
            return;
        }

        const existingRecord = nameRecordsStorage.values().find(record => record.name === name);
        if (existingRecord) {
            res.status(409).send("Name already exists.");
            return;
        }

        const nameRecord: NameRecord = {
            id: uuidv4(),
            name,
            owner,
            createdAt: getCurrentDate(),
            updatedAt: null,
        };
        nameRecordsStorage.insert(nameRecord.id, nameRecord);
        res.json(nameRecord);
    });

    app.get("/names", (req, res) => {
        res.json(nameRecordsStorage.values());
    });

    app.get("/names/:id", (req, res) => {
        const nameId = req.params.id;
        const nameRecordOpt = nameRecordsStorage.get(nameId);
        if ("None" in nameRecordOpt) {
            res.status(404).send(`Name with id=${nameId} not found.`);
        } else {
            res.json(nameRecordOpt.Some);
        }
    });

    app.put("/names/:id", (req, res) => {
        const nameId = req.params.id;
        const { name, owner } = req.body;
        const nameRecordOpt = nameRecordsStorage.get(nameId);
        if ("None" in nameRecordOpt) {
            res.status(404).send(`Name with id=${nameId} not found.`);
        } else {
            const existingRecord = nameRecordsStorage.values().find(record => record.name === name && record.id !== nameId);
            if (existingRecord) {
                res.status(409).send("Name already exists.");
                return;
            }

            const nameRecord = nameRecordOpt.Some;
            nameRecord.name = name || nameRecord.name;
            nameRecord.owner = owner || nameRecord.owner;
            nameRecord.updatedAt = getCurrentDate();
            nameRecordsStorage.insert(nameRecord.id, nameRecord);
            res.json(nameRecord);
        }
    });

    app.delete("/names/:id", (req, res) => {
        const nameId = req.params.id;
        const deletedNameRecord = nameRecordsStorage.remove(nameId);
        if ("None" in deletedNameRecord) {
            res.status(404).send(`Name with id=${nameId} not found.`);
        } else {
            res.json(deletedNameRecord.Some);
        }
    });

    return app.listen();
});

function getCurrentDate() {
    const timestamp = new Number(ic.time());
    return new Date(timestamp.valueOf() / 1000000);
}
