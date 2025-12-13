#!/bin/bash

# Mentor-Mentee Deployment Script
# Run this script on your VPS after uploading the code

set -e

echo "🚀 Starting Mentor-Mentee Deployment..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Docker and Docker Compose
echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo systemctl enable docker
sudo systemctl start docker

# Install Docker Compose
echo "🐳 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p uploads storage

# Set proper permissions
echo "🔐 Setting permissions..."
sudo chown -R $USER:$USER .

# Build and start services
echo "🏗️ Building and starting services..."
docker-compose build --no-cache
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to start..."
sleep 30

# Run database migrations
echo "🗄️ Running database migrations..."
docker-compose exec -T api npx prisma migrate deploy

# Seed data
echo "🌱 Seeding data..."
docker-compose exec -T api npm run seed:rbac
docker-compose exec -T api npm run seed:admin

# Check services status
echo "📊 Checking services status..."
docker-compose ps

# Show logs
echo "📋 Showing recent logs..."
docker-compose logs --tail=50

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📍 Access URLs:"
echo "Frontend: http://129.212.235.114"
echo "Backend API: http://129.212.235.114:3000"
echo "Admin Login: admin@example.com / Admin@123456"
echo ""
echo "🔧 Useful commands:"
echo "View logs: docker-compose logs -f"
echo "Restart: docker-compose restart"
echo "Update: docker-compose pull && docker-compose up -d"
echo ""
echo "⚠️ Remember to:"
echo "- Change admin password after first login"
echo "- Configure SSL certificate for HTTPS"
echo "- Setup firewall rules"
echo "- Configure backup strategy"