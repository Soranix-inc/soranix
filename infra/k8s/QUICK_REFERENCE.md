# Soranix Kubernetes Quick Reference

> **Note**: All commands are run from the **root directory** using the main Makefile.

## 🚀 Quick Start Commands

### Deploy to Environment

```bash
# Deploy to development (default)
make k8s-deploy

# Deploy to staging
make k8s-deploy ENV=staging

# Deploy to production
make k8s-deploy ENV=production
```

### Check Status

```bash
# Check all resources
make k8s-status ENV=staging

# Check pods only
make k8s-watch ENV=production RESOURCE=pods

# Check services
make k8s-watch ENV=development RESOURCE=services
```

### View Logs

```bash
# View logs for specific service
make k8s-logs ENV=production SERVICE=auth

# Follow logs in real-time (same as above)
make k8s-logs ENV=staging SERVICE=ai

# View logs for all services (use kubectl directly)
kubectl logs -f -l app.kubernetes.io/part-of=soranix-platform -n soranix-{env}
```

### Scale Services

```bash
# Scale up service
make k8s-scale ENV=production SERVICE=ai REPLICAS=5

# Scale down service
make k8s-scale ENV=staging SERVICE=auth REPLICAS=1
```

### Debug & Troubleshoot

```bash
# Describe service details
kubectl describe deployment auth -n soranix-{env}

# Execute shell in pod
make k8s-exec ENV=staging SERVICE=auth

# Port forward to service
make k8s-port-forward ENV=development SERVICE=auth

# Health check all services
kubectl get pods -n soranix-{env} -o wide
kubectl get endpoints -n soranix-{env}
```

### Watch Resources

```bash
# Watch pods in real-time
make k8s-watch ENV=staging RESOURCE=pods

# Watch services
make k8s-watch ENV=production RESOURCE=services

# Watch deployments
make k8s-watch ENV=development RESOURCE=deployments
```

### Validation & Testing

```bash
# Validate configuration
kustomize build infra/k8s/overlays/{env} --enable-helm

# Dry run (see what would be deployed)
kubectl apply -k infra/k8s/overlays/{env} --dry-run=client

# Show differences from current deployment
kubectl diff -k infra/k8s/overlays/{env}
```

### Backup & Restore

```bash
# Backup current configuration
make k8s-backup ENV=production

# Restore from backup
make k8s-restore ENV=production BACKUP_FILE=backup-production-20241201-143022.yaml
```

### Infrastructure Setup

```bash
# Setup namespace and basic infrastructure
make k8s-setup ENV=staging

# Setup ingress controller (one-time)
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml

# Setup cert-manager (one-time)
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
```

## 🎯 Common Use Cases

### Daily Development Workflow

```bash
# 1. Deploy to development
make k8s-deploy

# 2. Check status
make k8s-status

# 3. View logs for your service
make k8s-logs SERVICE=auth

# 4. Port forward for local testing
make k8s-port-forward SERVICE=auth
```

### Production Deployment

```bash
# 1. Validate configuration
kustomize build infra/k8s/overlays/production --enable-helm

# 2. Dry run to check changes
kubectl apply -k infra/k8s/overlays/production --dry-run=client

# 3. Deploy
make k8s-deploy ENV=production

# 4. Monitor deployment
make k8s-watch ENV=production RESOURCE=pods

# 5. Health check
kubectl get pods -n soranix-prod -o wide
```

### Troubleshooting Production Issues

```bash
# 1. Check overall status
make k8s-status ENV=production

# 2. View specific service logs
make k8s-logs ENV=production SERVICE=auth

# 3. Describe service for details
kubectl describe deployment auth -n soranix-prod

# 4. Execute shell for debugging
make k8s-exec ENV=production SERVICE=auth

# 5. Restart service if needed
make k8s-restart ENV=production SERVICE=auth
```

### Scaling for High Load

```bash
# 1. Scale up AI service (most resource-intensive)
make k8s-scale ENV=production SERVICE=ai REPLICAS=10

# 2. Scale up other services
make k8s-scale ENV=production SERVICE=auth REPLICAS=5
make k8s-scale ENV=production SERVICE=payments REPLICAS=5

# 3. Monitor scaling
make k8s-watch ENV=production RESOURCE=pods
kubectl get hpa -n soranix-prod
```

## 🔧 Environment Variables

You can override these variables:

```bash
# Use specific Kubernetes context
make k8s-deploy ENV=production KUBE_CONTEXT=my-cluster

# Set custom namespace (defaults to soranix-{env})
make k8s-deploy ENV=staging NAMESPACE=custom-namespace
```

## 📋 Service Names

Available services for commands that require `SERVICE` parameter:

### Frontend Applications

- `client` - Next.js client app
- `web` - Vite web app
- `admin` - Admin dashboard

### Backend Services

- `auth` - Authentication service
- `ai` - AI/ML service
- `banking` - Banking service
- `payments` - Payments service
- `users` - User management service
- `money-management` - Money management service
- `transfers` - Transfer service
- `bills-payment` - Bills payment service
- `notification` - Notification service
- `flows` - Workflow service
- `portfolio` - Portfolio service
- `billing` - Billing service

## 🚀 Quick Workflows

### Complete Development Setup

```bash
# Setup everything for development
make setup

# Or step by step:
make install
make docker-build
make k8s-setup ENV=development
make k8s-deploy ENV=development
```

### Complete Production Deployment

```bash
# Build, push, and deploy to production
make deploy-prod

# Or step by step:
make docker-build
make docker-push
make k8s-deploy ENV=production
```

## ⚠️ Important Notes

1. **Root Directory**: All commands must be run from the **root directory** of the project
2. **Default Environment**: Commands default to `development` if `ENV` is not specified
3. **Namespace**: Automatically uses `soranix-{environment}` namespace
4. **Context**: Uses current kubectl context unless `KUBE_CONTEXT` is specified
5. **Safety**: Always use `--dry-run=client` before production deployments
6. **Backup**: Always backup before major changes in production

## 🆘 Getting Help

```bash
# Show all available commands
make help

# Show help for specific command
make help | grep -A 5 "k8s-deploy"

# Show Kubernetes-specific commands
make help | grep -A 20 "Kubernetes Management"
```

## 📁 Directory Structure

```
soranix/
├── Makefile                    # Main application Makefile
├── infra/
│   └── k8s/
│       ├── base/               # Base Kubernetes resources
│       ├── overlays/           # Environment-specific overlays
│       │   ├── development/
│       │   ├── staging/
│       │   └── production/
│       ├── deploy.sh           # Alternative deployment script
│       ├── README.md           # Detailed documentation
│       └── QUICK_REFERENCE.md  # This file
└── ...
```
