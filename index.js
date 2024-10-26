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
    availabilityZone: "us-east-1a",
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
    publicKey: "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDY4mYGV0ua154jaB92ioWEz1Ii15UysLdxUC7p3XOWG3Zazd0VtCqm36Mh+nIAPF3mfzJY8bNEnEnao2qtj6ntw3vJ++q10mTavrDh+INsxh9xGVmkFFLqP2DfiMPpUwqYGokWsIAg8LAmgPPFahaLIRDLDHtam2MIi/+2k7bAwXy2avc2IPTcdU05jjA0+5zQYql8Z0IPOBMZzX0HxkJ8oROjJKgR9+4UsgAojCez68m2JXs+yGJZLhb1Qj91pNywAPV8NyYf8cDCZ8KTiHpV9RxqmWvMHY/Twqc0YUtOdRqGuHSbHXObB/IYOapmmXm/1XpUjw8H7q8nA3wx2RdP root@4ee96b5b7b03fbcd"
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
