"use strict"
const pulumi = require("@pulumi/pulumi")
const aws = require("@pulumi/aws")

// Create a VPC
const vpc = new aws.ec2.Vpc("my-vpc", {
    cidrBlock: "10.0.0.0/16",
    enableDnsHostnames: true,
    enableDnsSupport: true,
    tags: {
        Name: "my-vpc"
    }
})

// Create an Internet Gateway
const internetGateway = new aws.ec2.InternetGateway("my-igw", {
    vpcId: vpc.id,
    tags: {
        Name: "my-igw"
    }
})

// Create a public subnet
const publicSubnet = new aws.ec2.Subnet("public-subnet", {
    vpcId: vpc.id,
    cidrBlock: "10.0.1.0/24",
    availabilityZone: "ap-southeast-1a",
    mapPublicIpOnLaunch: true,
    tags: {
        Name: "public-subnet"
    }
})

// Create a Route Table
const routeTable = new aws.ec2.RouteTable("public-rt", {
    vpcId: vpc.id,
    routes: [
        {
            cidrBlock: "0.0.0.0/0",
            gatewayId: internetGateway.id
        }
    ],
    tags: {
        Name: "public-rt"
    }
})

// Associate the Route Table with Public Subnet
const routeTableAssociation = new aws.ec2.RouteTableAssociation("public-rta", {
    subnetId: publicSubnet.id,
    routeTableId: routeTable.id
})

// Create a security group
const securityGroup = new aws.ec2.SecurityGroup("web-sg", {
    description: "Allow inbound HTTP and SSH Traffic",
    vpcId: vpc.id,
    ingress: [
        {
            protocol: "tcp",
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ["0.0.0.0/0"]
        },
        {
            protocol: "tcp",
            fromPort: 22,
            toPort: 22,
            cidrBlocks: ["0.0.0.0/0"]
        }
    ],
    egress: [{
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ["0.0.0.0/0"]
    }],
    tags: {
        Name: "web-sg"
    }
})

// Create key pair
const keyPair = new aws.ec2.KeyPair("my-key-pair", {
    publicKey: "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDXUVAI1MI88+huM6HefFbfleoSMm0cFrX3hLiJ0W3Od5eCqPPR5CG5vWvOgOF5lV82yG4YPgF6+ISjqdSIgNNFvrPQQufUKcHHtRT4CN280Oj51lMeaqBtge2YIXVIx8BlHV+1JOjSJoAf8xzlFfOKun9DiedGeVq/frTruWEIVAFqsarCXNwrFx44gq4Xt4knZOg/32Pdkt0Ndaf8/oPQZFLGV5XLJWJ+K5myL4lnfyzcLhG/8WF005C/jyWzl40gA9Zn2Cippc07gHbem2NLj81gL0t/xYv0enYbD/8n/ROs7YHG5IeAlbYPsWwAN6PFiQt+VAXw4QYnS8vXy5h7 root@14fed3042a0675aa"
})

// Create two EC2 instances
const createEC2Instance = (name, az) => {
    return new aws.ec2.Instance(name, {
        instanceType: "t3.small",
        ami: "ami-047126e50991d067b",
        subnetId: publicSubnet.id,
        associatePublicIpAddress: true,
        vpcSecurityGroupIds: [securityGroup.id],
        availabilityZone: az,
        keyName: keyPair.keyName,
        tags: {
            Name: name
        }
    })
}

const instance1 = createEC2Instance("instance-1", "ap-southeast-1a");
const instance2 = createEC2Instance("instance-2", "ap-southeast-1a");

exports.vpcId = vpc.id;
exports.instance1PublicIp = instance1.publicIp;
exports.instance2PublicIp = instance2.publicIp;
