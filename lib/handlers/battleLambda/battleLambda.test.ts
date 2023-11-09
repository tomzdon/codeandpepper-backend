import {apiId, handler} from './index';
import {mockClient} from 'aws-sdk-client-mock';
import {DynamoDBDocumentClient, ScanCommand} from "@aws-sdk/lib-dynamodb";
import {ResourceType} from "./types";
import {Callback, Context} from "aws-lambda";

const ddbMock = mockClient(DynamoDBDocumentClient);
const mockCallback: Callback = jest.fn();
const mockContext: Context = {
    callbackWaitsForEmptyEventLoop: false,
    functionName: 'mockFunctionName',
    functionVersion: '1',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:mockFunctionName',
    memoryLimitInMB: '128',
    awsRequestId: '12345678-1234-1234-1234-123456789012',
    logGroupName: '/aws/lambda/mockFunctionName',
    logStreamName: '2019/05/27/[$LATEST]abcdefgh1234567890',
    getRemainingTimeInMillis: () => 5000,
} as any;
beforeEach(() => {
    ddbMock.reset();
});

describe('Lambda Function Handler Test', () => {
    it('Successfully selects a winner for Person entities based on mass', async () => {
        ddbMock.on(ScanCommand, {
            TableName: `Person-${apiId}-NONE`,
        }).resolves({
            Items: [
                {name: 'Person A', mass: 70},
                {name: 'Person B', mass: 85},
            ],
        });
        ddbMock.on(ScanCommand, {
            TableName: `Starship-${apiId}-NONE`,
        }).resolves({
            Items: [
                {name: 'Starship A', crew: '100-'},
                {name: 'Starship B', crew: '150'},
            ],
        });
        const event = {resourceType: ResourceType.PERSON};
        const result = await handler(event, mockContext, mockCallback)

        expect(result.winner).toEqual({"mass": 85, "name": "Person B"});
    });

    it('Successfully selects a winner for Starship entities based on crew size', async () => {
        ddbMock.on(ScanCommand, {
            TableName: `Person-${apiId}-NONE`,
        }).resolves({
            Items: [
                {name: 'Person A', mass: 70},
                {name: 'Person B', mass: 85},
            ],
        });
        ddbMock.on(ScanCommand, {
            TableName: `Starship-${apiId}-NONE`,
        }).resolves({
            Items: [
                {name: 'Starship A', crew: '100-'},
                {name: 'Starship B', crew: '150'},
            ],
        });

        const event = {resourceType: ResourceType.STARSHIP};
        const result = await handler(event, mockContext, mockCallback)

        expect(result.winner).toEqual({"crew": "150", "name": "Starship B"});
    });

    it('Handles empty scan results gracefully', async () => {
        ddbMock.on(ScanCommand, {
            TableName: `Person-${apiId}-NONE`,
        }).resolves({
            Items: [],
        });
        ddbMock.on(ScanCommand, {
            TableName: `Starship-${apiId}-NONE`,
        }).resolves({
            Items: [],
        });

        const event = {resourceType: ResourceType.PERSON};
        const result = await handler(event, mockContext, mockCallback)

        expect(result.message).toBeDefined();
    });
    it('Handles a tie for Person entities based on mass', async () => {
        ddbMock.on(ScanCommand, {
            TableName: `Person-${apiId}-NONE`,
        }).resolves({
            Items: [
                {name: 'Person A', mass: 70},
                {name: 'Person B', mass: 70},
            ],
        });
        ddbMock.on(ScanCommand, {
            TableName: `Starship-${apiId}-NONE`,
        }).resolves({
            Items: [
                {name: 'Starship A', crew: '100-'},
                {name: 'Starship B', crew: '150'},
            ],
        });

        const event = {resourceType: ResourceType.PERSON};
        const result = await handler(event, mockContext, mockCallback)

        expect(result.winner).toBe('Tie');
    });

    it('Handles a tie for Starship entities based on crew size', async () => {
        ddbMock.on(ScanCommand, {
            TableName: `Person-${apiId}-NONE`,
        }).resolves({
            Items: [
                {name: 'Person A', mass: 70},
                {name: 'Person B', mass: 85},
            ],
        });
        ddbMock.on(ScanCommand, {
            TableName: `Starship-${apiId}-NONE`,
        }).resolves({
            Items: [
                {name: 'Starship A', crew: '100'},
                {name: 'Starship B', crew: '100'},
            ],
        });

        const event = {resourceType: ResourceType.STARSHIP};
        const result = await handler(event, mockContext, mockCallback)

        expect(result.winner).toBe('Tie');
    });
});
