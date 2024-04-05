# Infrastructure-as-Code for a CMS on AWS ⚙️

<br>

> The settings are thought for a medium-sized blog, with wide space for scaling thanks to how it's setup. The stack only includes a `dev` environment to alleviate the billing.

<br>

![Infra-min](https://github.com/Felix-Hz/aws-wordpress-cdk/assets/71148989/e06064f7-9ab9-45c2-80c8-b6898f9ec576)

<details>
<summary><strong>Detailed Services Configuration</strong></summary>

#### VPC

The custom VPC setup in this stack creates a Virtual Private Cloud (VPC) with two Availability Zones (AZs) for high availability.

#### Security Groups

1. **Auto Scaling Group Security Group (ASG)**:

   - Allows inbound traffic on ports 22 (SSH), 80 (HTTP), and 443 (HTTPS) from any IPv4 address
   - Allows all outbound traffic

2. **Load Balancer Security Group (ELB)**:
   - Allows inbound traffic on ports 80 (HTTP) and 443 (HTTPS) from any IPv4 address
   - Allows all outbound traffic
     
3. **Bastion Host Security Group (EC2)**:
   - Allows inbound traffic on ports 22 (SSH)
   - Allows all outbound traffic
   
#### Database

- Engine: Aurora MySQL
- Instance type: T3.MEDIUM/LARGE
- Storage encrypted: True
- Removal Policy: Snapshot
- Multi-AZ: True
- Backup Retention: 14 days
- Deletion Protection: True

#### Auto Scaling Group (ASG)

- Machine Image: Custom AMI with WordPress bootstrapped
- Instance type: T3.MEDIUM
- Min capacity: 2
- Uses an IAM role with permissions to access Secrets Manager and describe EC2 images
- UserData installs Apache, PHP and WordPress, sets up Apache adjusting WP ownership and starting the service

#### Application Load Balancer (ALB)

- Internet facing
- Listens on port 443 (HTTPS)
- Listens on and redirects Port 80 (HTTP) to Port 443 (HTTPS)
- Target group configured to use traffic port 80 for health checks
- ALB logs access logs to an S3 bucket
- CloudWatch alarm set to trigger if any unhealthy hosts are detected in the target group

  #### Bastion Host (EC2)

- Machine Image: Amazon Linux 2
- Instance type: T3.MICRO
- UserData updates packages

#### S3 Bucket

This S3 bucket is created to store media assets. Integration is done via the `WP Offload Media Lite` plugin. If required, can be configured with a CDN

</details>

## Overview

<details>
<summary><strong>Secure</strong></summary>
<br>
My architecture is designed with security in mind. I used a Virtual Private Cloud (VPC) to isolate resources, ensuring that only authorized traffic can access the infrastructure. Security groups are used to control inbound and outbound traffic at the network level. Three network segments have been used: public that hosts a Bastion Host to connect to SSH into the instances, private with NAT gateway egress for the Server and a private isolated segment for the Aurora Database. I explored the possibility of using AWS WAF but seemed like overkill for the project.
<br>
</details>
<details>
<summary><strong>Performant</strong></summary>
<br>
The EC2 hosts the CMS app servers and are deployed in Auto Scaling Groups to dynamically adjust capacity based on the current demand. The scaling policies should be tailored following the behaviour of the instance, users and overall analytics. Depending on customer requirements, a CDN like CloudFront could accelerate the content delivery by caching static assets closer to end-users and improving load times.
<br>
</details>
<details>
<summary><strong>Scalable</strong></summary>
<br>
Auto Scaling Groups allow to automatically add or remove EC2 instances based on demand, ensuring that the application can handle fluctuations of traffic elegantly. RDS Aurora has built-in Multi-AZ configuration, read-replica and scales up on demand. All of this also allows high availability to increase fault tolerance.
<br>
</details>
<details>
<summary><strong>Cost-effective</strong></summary>
<br>
By leveraging managed services and pay-as-you-go pricing models, infrastructure costs can be minimized while still meeting performance and scalability requirements.
<br>
</details>

### References

1. [AWS Reference Architecture for WordPress](https://github.com/aws-samples/aws-refarch-wordpress)
2. [AWS Best Practices for WordPress](https://docs.aws.amazon.com/whitepapers/latest/best-practices-wordpress/welcome.html?did=wp_card&trk=wp_card)
3. [WordPress EC2 AMI Setup](https://harshit-gola.medium.com/beginners-guide-to-deploying-build-a-wordpress-website-on-aws-infrastructure-c45d85603264)
4. [How to write CDK tests](https://thomasstep.com/blog/how-to-write-aws-cdk-tests)

### Harden the AWS account

1. CloudTrail is set up to monitor AWS account activity, providing visibility into actions taken within the AWS environment.
2. AWS Cost Anomaly Detection is enabled to alarm when unusual billing happens.
3. AWS GuardDuty is enabled to detect unusual activity and potential security threats.
4. AWS Security Hub is enable to receive security insights and correct potential misconfigurations.
5. Multi-Factor Authentication (MFA) is enable for user, preventing unauthorized access.
6. Permissions and policies have to be configured following the Least Privilege principle.
7. Check Trusted Advisor regularly.
8. **Pending:**
   - Integration tests [🛠️ WIP].
   - Set up AWS Budget to create alarms on thresholds.
   - MFA for Root user.
   - Fine-grain IAM roles access.
   - CI/CD integration.

### Additional Notes

- While AWS LightSail offers ease of use, it may be more expensive and less customizable compared to setting up EC2 instances manually.
- For future iterations:
  - Separate server configuration and provisioning by using the custom AMI from WordPress core files by mounting the Elastic File System (EFS).
  - CloudFront can be utilized to cache dynamic content and improve user experience for sites with high traffic.
  - CI/CD pipelines should be configured for automated deployments with a deployment strategy such as Green/Blue.
  - AWS WAF can help prevent common attacks and can be customized to meet specific security requirements.
