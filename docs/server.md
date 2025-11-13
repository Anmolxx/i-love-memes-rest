# Server Setup Guide: EC2 + Nginx + Docker + PostgreSQL + Let's Encrypt

## 1. SSH Into EC2 Instance

```sh
ssh -i /path/to/key.pem ubuntu@<EC2_PUBLIC_IP>
```

## 2. Update & Install Prerequisites

```sh
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw
```

## 3. Install Docker & Docker Compose

```sh
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
# Log out and back in for group changes to take effect
sudo apt install -y docker-compose
```

## 4. Setup Dockerized PostgreSQL with Persistent Volume

```sh
mkdir -p ~/postgres-data
cat > ~/docker-compose.postgres.yaml <<EOF
version: '3.8'
services:
  postgres:
    image: postgres:15
    restart: always
    environment:
      POSTGRES_USER: ilovememes
      POSTGRES_PASSWORD: strongpassword
      POSTGRES_DB: ilovememesdb
    ports:
      - "5432:5432"
    volumes:
      - ~/postgres-data:/var/lib/postgresql/data
EOF
```

Start PostgreSQL container:

```sh
docker compose -f ~/docker-compose.postgres.yaml up -d
```

## 5. Install Nginx

```sh
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

## 6. Configure Nginx Reverse Proxy for Multiple Domains

Edit or create config for each domain:

```sh
sudo vim /etc/nginx/sites-available/staging.ilovememes.com.conf
```

Example config:

```nginx
server {
listen 80;
server_name staging.ilovememes.com;

    location ^~ /api {
        proxy_pass http://127.0.0.1:3002$request_uri;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    location / {
        proxy_pass http://127.0.0.1:3000$request_uri;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

```

Enable the site and reload nginx:

```sh
sudo ln -s /etc/nginx/sites-available/staging.ilovememes.com.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 7. Install Certbot & Setup Let's Encrypt SSL

```sh
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d staging.ilovememes.com
```

Follow prompts to complete SSL setup. Certbot will automatically update your nginx config for HTTPS.

## 8. Firewall (UFW) Setup

```sh
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## 9. Dockerized App Deployment (Example)

```sh
# Place your app's docker-compose.yaml in ~/app/
cd ~/app
# Edit environment variables as needed
# Start app containers
sudo docker compose up -d
```

---

## Summary

- SSH into EC2
- Install Docker, Docker Compose, Nginx
- Run PostgreSQL in Docker with persistent volume
- Configure Nginx reverse proxy for all domains
- Secure with Let's Encrypt SSL
- Open firewall for SSH and web traffic
- Deploy app containers as needed
