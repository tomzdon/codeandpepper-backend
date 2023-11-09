import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import * as path from 'path'
import {AmplifyGraphqlApi, AmplifyGraphqlDefinition} from "@aws-amplify/graphql-api-construct";
import {DynamoDBSeeder, Seeds} from '@cloudcomponents/cdk-dynamodb-seeder';

export class BackendStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

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
    }
}
