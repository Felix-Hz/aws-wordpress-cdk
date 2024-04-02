# Infrastructure-as-Code for a CMS on AWS ⚙️

> I have used the free tiers as initial configurations to relieve costs, but documented the production stack settings on every service that needs it (ELB, ASG, RDS, S3).

![Diagram_Infrastructure](https://github.com/Felix-Hz/aws-wordpress-cdk/assets/71148989/be284bdd-f0f2-4852-9a7a-dc2935216309)

<details>
<summary><strong>Detailed Services Configuration</strong></summary>

#### VPC

The custom VPC setup in this stack creates a Virtual Private Cloud (VPC) with two Availability Zones (AZs) for high availability.

#### Security Groups

1. **Auto Scaling Group Security Group (ASG)**:

   - Allows inbound traffic on ports 22 (SSH), 80 (HTTP), and 443 (HTTPS) from any IPv4 address.
   - Allows all outbound traffic.

2. **Load Balancer Security Group (ELB)**:
   - Allows inbound traffic on ports 80 (HTTP) and 443 (HTTPS) from any IPv4 address.
   - Allows all outbound traffic.

#### Database

- Engine: Aurora MySQL
- Instance type: M5.LARGE
- Storage encrypted: true
- Removal Policy: SNAPSHOT
- Multi-AZ: true
- Backup Retention: 14 days
- Deletion Protection: true

#### Auto Scaling Group (ASG)

The Auto Scaling Group provisions EC2 instances for the WordPress application.

- Machine Image: Custom AMI with WordPress bootstrapped.
- Instance type: T3.MEDIUM/LARGE
- Min capacity: 2
- Uses an IAM role with permissions to access Secrets Manager and describe EC2 images.
- UserData installs Apache, PHP, and WordPress, sets up Apache, downloads and extracts WordPress files, adjusts Apache ownership and starts the service.

#### Application Load Balancer (ALB)

- Internet facing
- Listens on port 80 (HTTP) [⚠️ When domain is registered, issue a SSL certificate for the ALB to listen on Port 443 (HTTPS)]
- Target group configured to use traffic port 80 for health checks.
- ALB logs access logs to an S3 bucket.
- CloudWatch alarm set to trigger if any unhealthy hosts are detected in the target group.

#### S3 Bucket

This S3 bucket is created to store media assets to be delivered as a CDN. It's configured with a removal policy of SNAPSHOT.

</details>

## Overview

<details>
<summary><strong>Secure</strong></summary>

My architecture is designed with security in mind. I utilize Virtual Private Cloud (VPC) to isolate resources, ensuring that only authorized traffic can access my infrastructure. Security groups are used to control inbound and outbound traffic at the network level. I could also employ AWS Web Application Firewall (WAF) to protect the site against common web exploits and attacks.

</details>
<details>
<summary><strong>Performant</strong></summary>

Elastic Compute Cloud (EC2) hosts the CMS app servers, deployed in Auto Scaling Groups to dynamically adjust capacity based on demand. Depending on customer requirements, a CDN like CloudFront could accelerate the content delivery by caching static assets closer to end-users, reducing latency and improving load times.

</details>
<details>
<summary><strong>Scalable</strong></summary>

Auto Scaling Groups allow to automatically add or remove EC2 instances based on demand, ensuring that the application can handle fluctuations of traffic elegantly. Additionally, I utilize Multi-AZ deployments for high availability, distributing my resources across multiple Availability Zones to increase fault tolerance.

</details>
<details>
<summary><strong>Cost-effective</strong></summary>
By leveraging managed services and pay-as-you-go pricing models, I can minimize infrastructure costs while still meeting my performance and scalability requirements.
</details>

### References

1. [AWS Reference Architecture for WordPress](https://github.com/aws-samples/aws-refarch-wordpress)
2. [AWS Best Practices for WordPress](https://docs.aws.amazon.com/whitepapers/latest/best-practices-wordpress/welcome.html?did=wp_card&trk=wp_card)
3. [Solodev](https://aws.amazon.com/marketplace/solutions/public-sector/content-management)
4. [WordPress EC2 AMI Setup](https://harshit-gola.medium.com/beginners-guide-to-deploying-build-a-wordpress-website-on-aws-infrastructure-c45d85603264)

### Harden the AWS account

1. CloudTrail is set up to monitor AWS account activity, providing visibility into actions taken within the AWS environment.
2. AWS Cost Anomaly Detection is enabled to alarm when unusual billing happens.
3. AWS GuardDuty is enabled to detect unusual activity and potential security threats.
4. Multi-Factor Authentication (MFA) is enable for user, preventing unauthorized access.
5. Permissions and policies have to be configured following the Least Privilege principle.
6. Check Trusted Advisor regularly.
7. Pending:
   - Set up AWS Budget to create alarms on thresholds.
   - MFA for Root user.

### Additional Notes

- Once a domain is purchased and registered, SSL certificates can be issued through Certificate Authorities like Let's Encrypt or AWS Certificate Manager, enabling secure HTTPS communication. Update Load Balancer configurations to listen on Port 443 for HTTPS traffic.
- I have used the free tiers as initial configurations, but documented the production stack settings on every service (ELB, ASG, RDS):
  - RDS database is deployed without Multi-AZ and with optimized instance types to manage initial costs effectively.
  - Aurora MySQL would be the ideal engine as it leverages vertical scaling.
  - In my custom AMI, I would use a T3.MEDIUM or LARGE for the compute general-purpose instance of the hosting server.
- A Slave-Master configuration for the database would offload the read requests to the read-replica, while keeping the masters computing power for the write requests.
- In future iterations, separate server configuration and provisioning by using the custom AMI from WordPress core files by mounting the Elastic File System (EFS).
- Resources are deployed in a Multi AZ configuration for high availability and fault tolerance.
- CloudFront can be utilized to cache dynamic content and improve user experience for sites with high traffic.
- CI/CD pipelines should be configured for automated deployments, with options for Blue/Green or Canary Deployment strategies to minimize downtime and risk.
- AWS WAF can help prevent common attacks and can be customized to meet specific security requirements.
- Fargate containers could provide a different option for deployment, offering flexibility and scalability without the need to manage underlying infrastructure.
- While AWS LightSail offers ease of use, it may be more expensive and less customizable compared to setting up EC2 instances manually.
