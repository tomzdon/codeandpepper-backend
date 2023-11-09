export enum ResourceType {
    PERSON = 'PERSON',
    STARSHIP = 'STARSHIP'
}

export interface Person {
    name: string;
    birthYear: string;
    gender: string;
    height: number;
    mass: number;
}

export interface Starship {
    name: string;
    model: string;
    length: number;
    crew: string;
}

export type Entity = Person | Starship;
