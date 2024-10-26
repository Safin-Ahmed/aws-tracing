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
    publicKey: "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDArapWxwBNgudufV9sVvXYahfFAkmUEjZ5E7K9/hWkIxkUqh0pceYynJAbz/u6BSaXEOmQ1nsnt7Cln0VVGDyCWbgD6pAz5cmdg+iezFz1aNDC9eo4J1cWzhASYvKYNBeaIVl6rT4/bZNsH86BRvkJoB5Mfn2F+IdtgzNgpQ2zNoNpFYByT7lEG3150eD/a3ANIeHrMIrOxqGhvbNd4ED38TYY1B+eDxUDN64fBvDtTdaIdG5Bn7t9F+8VC6MkUp5jEkuHNC2s4btTm4E1GFwEHMU+wPHTusT1eTkfZR7Sb5QXhj78CmvjZvnY+7LwdLu7XNdOgEqmwlmqDu2L2wi3 "
})

// Create two EC2 instances
const createEC2Instance = (name, az) => {
    return new aws.ec2.Instance(name, {
        instanceType: "t3.small",
        ami: "ami-04b6019d38ea93034",
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
