# --- Docker Hub Build & Push Script ---

# 1. Configuration
$DOCKER_HUB_USER = "ravisantosh" 
$VERSION = "latest"

Write-Host "🚀 Starting Build & Push to Docker Hub..." -ForegroundColor Cyan

# 2. Build and Tag Backend
Write-Host "📦 Building Backend..." -ForegroundColor Green
docker build -t "$($DOCKER_HUB_USER)/notify-backend:$VERSION" ./backend

# 3. Build and Tag Frontend
Write-Host "📦 Building Frontend..." -ForegroundColor Green
docker build -t "$($DOCKER_HUB_USER)/notify-frontend:$VERSION" ./frontend

# 4. Push to Docker Hub
Write-Host "📤 Pushing images to Docker Hub..." -ForegroundColor Yellow
docker push "$($DOCKER_HUB_USER)/notify-backend:$VERSION"
docker push "$($DOCKER_HUB_USER)/notify-frontend:$VERSION"

Write-Host "✅ Deployment Complete! Your images are now public on Docker Hub." -ForegroundColor Cyan
Write-Host "Images: $($DOCKER_HUB_USER)/notify-backend, $($DOCKER_HUB_USER)/notify-frontend"
