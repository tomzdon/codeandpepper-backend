import * as cdk from 'aws-cdk-lib';
import {Template} from 'aws-cdk-lib/assertions';
import {BackendStack} from '../lib/backend-stack';

describe('BackendStack', () => {
    const app = new cdk.App();
    const stack = new BackendStack(app, 'MyTestStack');
    const template = Template.fromStack(stack);

    test('Lambda Function Created', () => {
        template.hasResourceProperties('AWS::Lambda::Function', {
            Handler: 'index.handler',
            Runtime: 'nodejs18.x',
        });
    });

    test('GraphQL API Created', () => {
        template.hasResourceProperties('AWS::AppSync::GraphQLApi', {
            Name: 'SWAPI',
        });
    });
});
