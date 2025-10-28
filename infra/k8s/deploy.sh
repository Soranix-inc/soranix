#!/bin/bash

# Soranix Kubernetes Deployment Script
# Usage: ./deploy.sh [development|staging|production]

set -e

ENVIRONMENT=${1:-development}

if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    echo "Error: Environment must be one of: development, staging, production"
    echo "Usage: ./deploy.sh [development|staging|production]"
    exit 1
fi

echo "🚀 Deploying Soranix to $ENVIRONMENT environment..."

# Validate kustomization
echo "📋 Validating kustomization..."
kubectl kustomize overlays/$ENVIRONMENT > /dev/null

# Apply the configuration
echo "🔧 Applying Kubernetes configuration..."
kubectl apply -k overlays/$ENVIRONMENT

# Wait for deployments to be ready
echo "⏳ Waiting for deployments to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment --all -n soranix-$ENVIRONMENT

# Show status
echo "📊 Deployment status:"
kubectl get pods -n soranix-$ENVIRONMENT
kubectl get services -n soranix-$ENVIRONMENT
kubectl get ingress -n soranix-$ENVIRONMENT

echo "✅ Deployment to $ENVIRONMENT completed successfully!"
