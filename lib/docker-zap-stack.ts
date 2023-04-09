import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import { Construct } from 'constructs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecr_assets from 'aws-cdk-lib/aws-ecr-assets';


export class DockerZapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'MyVpc', {
      maxAzs: 2,
    });
 
    
    // Create an ECS cluster
    const cluster = new ecs.Cluster(this, 'MyCluster', {
      vpc: vpc,
      containerInsights: true
    });

    const ecrRepo = new ecr.Repository(this, 'ECRRepo',{
      repositoryName: 'demo-repo',
    });

    const asset = new ecr_assets.DockerImageAsset(this, 'flask_image', {
      directory: './src',
      target: ecrRepo.repositoryName
    });

    // Create a task definition for your container
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'MyTaskDefinition', {
      memoryLimitMiB: 512,
      cpu: 256,
    });

    // Add a container to the task definition
    const container = taskDefinition.addContainer('MyContainer', {
      image: ecs.ContainerImage.fromRegistry('nginx'),
      memoryReservationMiB: 256,
      logging: ecs.LogDriver.awsLogs({ streamPrefix: 'my-container-logs' }),
    });

    container.addPortMappings({
      containerPort: 80,
    });

    const securityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
      vpc,
      allowAllOutbound: true,
    });
    
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'allow HTTP traffic');
    

    // Create a service for the container
    const service = new ecs.FargateService(this, 'MyService', {
      cluster: cluster,
      taskDefinition: taskDefinition,
      desiredCount: 1,
      serviceName: 'my-service-name',
      assignPublicIp: true,
      securityGroups: [securityGroup]
    });
  }
}