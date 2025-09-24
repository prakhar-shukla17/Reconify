# ITAM Docker Setup Guide

This guide provides comprehensive instructions for containerizing and deploying the ITAM application using Docker.

## 🐳 Overview

The ITAM application is containerized with the following components:
- **Frontend**: Next.js application (React)
- **Backend**: Node.js/Express API server
- **Database**: MongoDB
- **Cache**: Redis
- **Reverse Proxy**: Nginx

## 📁 Docker Files Structure

```
ITAM/
├── docker-compose.yml              # Production environment
├── docker-compose.dev.yml          # Development environment
├── client/
│   ├── Dockerfile                  # Production client image
│   ├── Dockerfile.dev              # Development client image
│   └── .dockerignore               # Client ignore rules
├── server/
│   ├── Dockerfile                  # Production server image
│   ├── Dockerfile.dev              # Development server image
│   └── .dockerignore               # Server ignore rules
├── nginx/
│   └── nginx.conf                  # Nginx configuration
├── scripts/
│   ├── docker-build.sh             # Build script
│   ├── docker-deploy.sh            # Deployment script
│   └── mongo-init.js               # MongoDB initialization
└── DOCKER_SETUP.md                 # This file
```

## 🚀 Quick Start

### Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Git

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd ITAM

# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

### 2. Development Environment

```bash
# Build and start development environment
docker-compose -f docker-compose.dev.yml up --build

# Or use the deployment script
chmod +x scripts/docker-deploy.sh
./scripts/docker-deploy.sh --dev
```

### 3. Production Environment

```bash
# Build and start production environment
docker-compose up --build -d

# Or use the deployment script
./scripts/docker-deploy.sh
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://admin:password123@mongodb:27017/itam?authSource=admin

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here

# Server Configuration
NODE_ENV=production
PORT=3000

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# PayPal Configuration
PAYPAL_CLIENT_ID=your_paypal_client_id_here
PAYPAL_CLIENT_SECRET=your_paypal_client_secret_here
PAYPAL_MODE=sandbox

# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here

# Frontend URLs
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id_here
```

## 🛠️ Development Workflow

### Hot Reload Development

```bash
# Start development environment with hot reload
docker-compose -f docker-compose.dev.yml up

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Execute commands in containers
docker-compose -f docker-compose.dev.yml exec server npm run seed
docker-compose -f docker-compose.dev.yml exec client npm run lint
```

### Database Management

```bash
# Access MongoDB shell
docker-compose exec mongodb mongosh

# Backup database
docker-compose exec mongodb mongodump --archive --gzip > backup.gz

# Restore database
docker-compose exec -T mongodb mongorestore --archive --gzip < backup.gz
```

## 🚢 Production Deployment

### Build Scripts

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Build production images
./scripts/docker-build.sh

# Build development images
./scripts/docker-build.sh --dev

# Build and push to registry
./scripts/docker-build.sh --push
```

### Deployment Scripts

```bash
# Deploy production environment
./scripts/docker-deploy.sh

# Deploy development environment
./scripts/docker-deploy.sh --dev

# Deploy without backup
./scripts/docker-deploy.sh --no-backup

# Deploy without migration
./scripts/docker-deploy.sh --no-migrate
```

### Health Checks

```bash
# Check all services
curl http://localhost/health

# Check individual services
curl http://localhost:3000/api/auth/health  # Backend
curl http://localhost:3001                 # Frontend
curl http://localhost:6379                 # Redis (ping)
```

## 🔒 Security Considerations

### Production Security

1. **Environment Variables**: Never commit `.env` files
2. **SSL/TLS**: Configure HTTPS in production
3. **Firewall**: Restrict access to database ports
4. **Updates**: Regularly update base images
5. **Secrets**: Use Docker secrets for sensitive data

### SSL Configuration

```bash
# Generate SSL certificates
mkdir nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem

# Update nginx.conf to enable HTTPS
```

## 📊 Monitoring and Logging

### Container Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f server
docker-compose logs -f client
docker-compose logs -f mongodb

# View logs with timestamps
docker-compose logs -f -t
```

### Resource Monitoring

```bash
# Check container resource usage
docker stats

# Check disk usage
docker system df

# Clean up unused resources
docker system prune -a
```

## 🔄 Backup and Recovery

### Automated Backups

```bash
# Create backup script
cat > scripts/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d-%H%M%S)
mkdir -p "$BACKUP_DIR"
docker-compose exec -T mongodb mongodump --archive --gzip > "$BACKUP_DIR/itam-$DATE.tar.gz"
EOF

chmod +x scripts/backup.sh

# Schedule with cron
echo "0 2 * * * /path/to/ITAM/scripts/backup.sh" | crontab -
```

### Data Volumes

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect itam_mongodb_data

# Backup volume
docker run --rm -v itam_mongodb_data:/data -v $(pwd):/backup alpine tar czf /backup/mongodb-data.tar.gz /data
```

## 🐛 Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Check port usage
   netstat -tulpn | grep :3000
   
   # Stop conflicting services
   sudo systemctl stop apache2  # or nginx
   ```

2. **Permission Issues**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   chmod +x scripts/*.sh
   ```

3. **Memory Issues**
   ```bash
   # Increase Docker memory limit
   # Edit Docker Desktop settings or docker-compose.yml
   ```

4. **Database Connection Issues**
   ```bash
   # Check MongoDB logs
   docker-compose logs mongodb
   
   # Test connection
   docker-compose exec server node -e "console.log('DB connected')"
   ```

### Debug Mode

```bash
# Run with debug output
DEBUG=* docker-compose up

# Access container shell
docker-compose exec server sh
docker-compose exec client sh
```

## 📈 Scaling

### Horizontal Scaling

```bash
# Scale specific services
docker-compose up --scale server=3
docker-compose up --scale client=2

# Load balancer configuration needed in nginx.conf
```

### Resource Limits

```yaml
# Add to docker-compose.yml
services:
  server:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

## 🎯 Best Practices

1. **Use Multi-stage Builds**: Reduce image size
2. **Layer Caching**: Optimize build times
3. **Health Checks**: Monitor service health
4. **Security Scanning**: Scan images for vulnerabilities
5. **Regular Updates**: Keep base images updated
6. **Resource Limits**: Set appropriate resource constraints
7. **Log Management**: Implement log rotation
8. **Backup Strategy**: Regular automated backups

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Next.js Docker Guide](https://nextjs.org/docs/deployment#docker-image)
- [MongoDB Docker Hub](https://hub.docker.com/_/mongo)
- [Nginx Docker Hub](https://hub.docker.com/_/nginx)

## 🆘 Support

For Docker-related issues:
1. Check container logs: `docker-compose logs -f`
2. Verify environment variables: `docker-compose config`
3. Test individual services: `docker-compose exec <service> <command>`
4. Check resource usage: `docker stats`
5. Review this documentation and troubleshooting section





