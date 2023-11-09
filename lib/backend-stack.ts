import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import * as path from 'path'
import * as lambda from "aws-cdk-lib/aws-lambda";
import {AmplifyGraphqlApi, AmplifyGraphqlDefinition} from "@aws-amplify/graphql-api-construct";
import {DynamoDBSeeder, Seeds} from '@cloudcomponents/cdk-dynamodb-seeder';
import {PolicyStatement} from "aws-cdk-lib/aws-iam";

export class BackendStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const battleLambda = new lambda.Function(this, "SelectAndBattleLambda", {
            functionName: "SelectAndBattleLambda",
            code: lambda.Code.fromAsset(
                path.join(__dirname, "handlers/battleLambda")
            ),
            handler: "index.handler",
            runtime: lambda.Runtime.NODEJS_18_X,
            timeout: cdk.Duration.seconds(300),
        });

        const api = new AmplifyGraphqlApi(this, "SWAPI", {
            apiName: "SWAPI",
            definition: AmplifyGraphqlDefinition.fromFiles(
                path.join(__dirname, "schema.graphql")
            ),
            authorizationModes: {
                defaultAuthorizationMode: "API_KEY",
                apiKeyConfig: {
                    expires: cdk.Duration.days(30),
                },
            },
            functionNameMap: {battleLambda},
        });

        const PersonTable = api.resources.tables['Person'];
        const StarshipTable = api.resources.tables['Starship'];

        const seedsPerson: Seeds = Seeds.fromInline([
            {id: '1', name: 'Jan', birthYear: '1992-10-11', gender: 'Male', height: 180, mass: 3.14},
            {id: '2', name: 'Tomasz', birthYear: '1992-07-11', gender: 'Male', height: 182, mass: 2.14},
            {id: '3', name: 'Beata', birthYear: '1991-07-11', gender: 'Female', height: 172, mass: 4.14},
        ]);

        const seedsStarship: Seeds = Seeds.fromInline([
            {id: '1', name: 'Altom', model: '12-1W', length: 10.2, crew: '3'},
            {id: '2', name: 'FerGon', model: 'AC-1W', length: 18.2, crew: '2'},
            {id: '3', name: 'SorGan', model: '2-1W', length: 1.2, crew: '1'},
        ]);

        new DynamoDBSeeder(this, 'InlineSeederPerson', {
            table: PersonTable,
            seeds: seedsPerson,
        });
        new DynamoDBSeeder(this, 'InlineSeederStarship', {
            table: StarshipTable,
            seeds: seedsStarship,
        });

        battleLambda.addEnvironment('API_ID', api.apiId)

        battleLambda.grantPrincipal.addToPrincipalPolicy(
            new PolicyStatement({
                resources: [
                    `arn:aws:dynamodb:us-east-1:400274549739:table/Person-${api.apiId}-NONE`,
                    `arn:aws:dynamodb:us-east-1:400274549739:table/Starship-${api.apiId}-NONE`,
                ],
                actions: ["dynamodb:GetItem", "dynamodb:ListTables", "dynamodb:Scan", "dynamodb:PutItem"],
            })
        );
    }
}
