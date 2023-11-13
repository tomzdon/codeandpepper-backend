import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {DynamoDBDocumentClient, ScanCommand} from "@aws-sdk/lib-dynamodb";
import {Entity, Person, ResourceType, Starship} from "./types";
import {Handler} from "aws-lambda";


const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
export const apiId = process.env.API_ID;

export const handler: Handler = async (event) => {

    const resourceType: ResourceType =event.arguments.resourceType as ResourceType;

    const tableName = resourceType === ResourceType.PERSON ? 'Person' : 'Starship';

    const scanResults = await docClient.send(new ScanCommand({TableName: `${tableName}-${apiId}-NONE`}));
    const items: Entity[] = scanResults.Items as Entity[];

    if (!items || items.length < 2) {
        return {message: 'Not enough entities to compare.'};
    }

    const selectedIndices = getRandomIndices(items.length);
    const entity1 = items[selectedIndices[0]];
    const entity2 = items[selectedIndices[1]];
    const winner = determineWinner(entity1, entity2, resourceType);
    // Before returning, add the __typename field to each entity
    const entity1WithType = {...entity1, __typename: getResourceTypeName(entity1)};
    const entity2WithType = {...entity2, __typename: getResourceTypeName(entity2)};
    const winnerWithType = winner ? {...winner, __typename: getResourceTypeName(winner)} : null;

    return {
        player1: entity1WithType,
        player2: entity2WithType,
        winner: winnerWithType
    };

};

function getRandomIndices(length: number): number[] {
    const index1 = Math.floor(Math.random() * length);
    let index2 = Math.floor(Math.random() * length);
    while (index2 === index1) {
        index2 = Math.floor(Math.random() * length);
    }
    return [index1, index2];
}

function determineWinner(entity1: Entity, entity2: Entity, resourceType: ResourceType): Entity | null {
    if (resourceType === ResourceType.PERSON) {
        if (!isPerson(entity1) || !isPerson(entity2)) {
            throw new Error('Expected both entities to be persons.');
        }
        if (entity1.mass === entity2.mass) return null;
        return entity1.mass > entity2.mass ? entity1 : entity2;
    } else {
        const crew1 = parseCrewSize((entity1 as Starship).crew);
        const crew2 = parseCrewSize((entity2 as Starship).crew);
        if (crew1 === crew2) return null;
        return crew1 > crew2 ? entity1 : entity2;
    }
}

function parseCrewSize(crew: string): number {
    if (crew && crew.includes('-')) {
        return Math.max(...crew.split('-').map(Number));
    }
    return Number(crew);
}

function isPerson(entity: Entity): entity is Person {
    return (entity as Person).mass !== undefined;
}

function getResourceTypeName(entity: Entity): string {
    if (isPerson(entity)) {
        return 'Person';
    } else {
        return 'Starship';
    }
}
