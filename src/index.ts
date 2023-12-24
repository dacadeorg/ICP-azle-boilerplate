import { $query, $update, Record, StableBTreeMap, match, Vec, Result, nat64, ic, Opt  } from "azle";
import { v4 as uuidv4 } from "uuid";

/**
 * This type represents a profile that can be listed on platform
 */
type Profile = Record<{
    id:             string;
    name:           string;
    surname:        string;
    pseudo:         string;
    description:    string;
    contact:        string;
    attachmentsURL: string;
    createdAt:      nat64;
    updatedAt:      Opt<nat64>;
}>
type ProfilePayload = Record<{
    name:           string;
    surname:        string;
    pseudo:         string;
    description:    string;
    contact:        string;
    attachmentsURL: string;
}>

const ProfileStorage = new StableBTreeMap<string, Profile>(0, 44, 1024);

// CRUD Profiles
$query;
export function getProfiles(): Result<Vec<Profile>, string> {
    return Result.Ok(ProfileStorage.values);
}

$query;
export function getProfile(id: string): Result<Profile, string> {
    return match(ProfileStorage.get(id), {
        Some:   (profile) => Result.Ok<Profile, string>(profile),
        None:   () => Result.Err<Profile, string>(`No profile found with id=${id}`),
    })
}

$update;
export function addProfile(profile: ProfilePayload): Result<Profile, string> {
    const newProfile: Profile = {id: uuidv4(), createdAt: ic.time(), updatedAt: Opt.None, ...profile};
    ProfileStorage.insert(newProfile.id, newProfile);
    return Result.Ok(newProfile);
}

$update;
export function updateProfile(id: string, payload: ProfilePayload): Result<Profile, string> {
    return match(ProfileStorage.get(id), {
        Some: (profile) => {
            const updatedProfile: Profile = { ...profile, ...payload, updatedAt: Opt.Some(ic.time())};
            ProfileStorage.insert(id, updatedProfile);
            return Result.Ok<Profile, string>(updatedProfile);
        },
        None: () => Result.Err<Profile, string>(`No profile with id=${id} found`)
    });
}

$update;
export function deleteProfile(id: string): Result<Profile, string> {
    return match(ProfileStorage.remove(id), {
        Some: (deletedProfile) => Result.Ok<Profile, string>(deletedProfile),
        None: () => Result.Err<Profile, string>(`No profile with id=${id} found`)
    });
}

// workaround to make uuid work with Azle
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