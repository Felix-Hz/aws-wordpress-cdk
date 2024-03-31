#!/bin/bash
sudo yum check-update -y && sudo yum upgrade -y
sudo yum install -y httpd gcc-c++ zlib-devel
sudo amazon-linux-extras enable php8.2 && sudo yum clean metadata
sudo yum install php php-cli php-pdo php-fpm php-json php-mysqlnd
sudo systemctl start httpd && sudo systemctl enable httpd
cd /var/www/html && sudo wget https://wordpress.org/latest.tar.gz
sudo tar -xzvf latest.tar.gz && sudo mv wordpress/* .
sudo chown -R apache:apache /var/www/html
sudo rm latest.tar.gz && sudo rmdir wordpress
echo "<?php phpinfo(); ?>" > /var/www/html/phpinfo.php

# Modify the etc/httpd/conf/httpd.conf to take the index.php as entry point
# Modify wp-config.php to use env vars