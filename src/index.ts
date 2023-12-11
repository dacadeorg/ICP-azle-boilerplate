import { $query,int, $update,text,Principal,float64, Record, 
    StableBTreeMap, Vec, match, Result, nat64, ic, Opt }
 from 'azle';
import { v4 as uuidv4 } from 'uuid';


// user
const User = Record({
    id: Principal,
    username: text,
    password: text,
    amount: float64,
});

// Expenses
const Expenses = Record({
    id : Principal,
    name : text,
    userId : Principal,
    amount : float64,
    description : text,
    type : text,
    location : text // where the expenses take place
});

// income
const Income = Record({
    id : Principal,
    name : text,
    userId : Principal,
    amount : float64,
    description : text,
    type : text,
    location : text // where the income take place
});

// tracker
const Tracker = Record({
    totalExpenses : float64,
    totalIncome : float64,
    balance : float64,
    users : Vec(User)
});

// tracker storage
const TrackerStorage : typeof Tracker = {
    totalExpenses : 0,
    totalIncome : 0,
    balance : 0,
    users : []
}
