# Soranix Kubernetes Configuration

This directory contains the Kubernetes configuration for the Soranix AI-powered finance platform using Kustomize for environment-specific deployments.

## 🏗️ Architecture Overview

### Base Configuration (`base/`)

- **Namespace**: `soranix` with proper labels and annotations
- **RBAC**: Service accounts, roles, and role bindings
- **Network Policies**: Security policies for frontend and backend tiers
- **Frontend Apps**: Client (Next.js), Web (Vite/React), Admin applications
- **Backend Services**: Auth, AI, Banking, Payments, Users services
- **Horizontal Pod Autoscalers**: Automatic scaling based on CPU/memory usage
- **Ingress**: Nginx ingress with SSL/TLS configuration
- **ConfigMaps & Secrets**: Environment configuration and sensitive data

### Environment Overlays

- **Development**: Local development with minimal resources
- **Staging**: Pre-production testing environment
- **Production**: High-availability production environment

## 📁 Directory Structure

```
infra/k8s/
├── base/                          # Base configuration
│   ├── namespace.yaml             # Namespace definition
│   ├── rbac.yaml                  # RBAC configuration
│   ├── network-policies.yaml      # Network security policies
│   ├── frontend-apps.yaml         # Frontend applications
│   ├── backend-services.yaml      # Backend microservices
│   ├── hpa.yaml                   # Horizontal Pod Autoscalers
│   ├── ingress.yaml               # Ingress configuration
│   ├── config.yaml                # ConfigMaps and Secrets
│   └── kustomization.yaml         # Base kustomization
├── overlays/                      # Environment-specific overlays
│   ├── development/               # Development environment
│   │   ├── kustomization.yaml
│   │   └── patches/
│   │       ├── namespace-patch.yaml
│   │       ├── deployment-patch.yaml
│   │       └── ingress-patch.yaml
│   ├── staging/                   # Staging environment
│   │   ├── kustomization.yaml
│   │   └── patches/
│   │       ├── namespace-patch.yaml
│   │       ├── deployment-patch.yaml
│   │       └── ingress-patch.yaml
│   └── production/                # Production environment
│       ├── kustomization.yaml
│       └── patches/
│           ├── namespace-patch.yaml
│           ├── deployment-patch.yaml
│           └── ingress-patch.yaml
├── deploy.sh                      # Deployment script
└── README.md                      # This file
```

## 🚀 Quick Start

### Prerequisites

- Kubernetes cluster (1.20+)
- kubectl configured
- kustomize installed
- nginx-ingress controller
- cert-manager (for SSL certificates)

### Deploy to Development

```bash
./deploy.sh development
```

### Deploy to Staging

```bash
./deploy.sh staging
```

### Deploy to Production

```bash
./deploy.sh production
```

## 🔧 Manual Deployment

### Validate Configuration

```bash
# Validate base configuration
kubectl kustomize base/

# Validate specific environment
kubectl kustomize overlays/development/
```

### Apply Configuration

```bash
# Apply to specific environment
kubectl apply -k overlays/development/
kubectl apply -k overlays/staging/
kubectl apply -k overlays/production/
```

## 📊 Resource Requirements

### Development

- **CPU**: 400m total
- **Memory**: 768Mi total
- **Replicas**: 1 per service

### Staging

- **CPU**: 1.2 total
- **Memory**: 2.5Gi total
- **Replicas**: 2 per service

### Production

- **CPU**: 3.6 total
- **Memory**: 7.5Gi total
- **Replicas**: 3 per service

## 🌐 Networking

### Frontend Applications

- **Client**: `app.soranix.com` (Next.js)
- **Web**: `web.soranix.com` (Vite/React)
- **Admin**: `admin.soranix.com` (Admin Panel)

### Backend API

- **API Gateway**: `api.soranix.com`
  - `/auth` → Auth Service
  - `/ai` → AI Service
  - `/banking` → Banking Service
  - `/payments` → Payments Service
  - `/users` → Users Service

## 🔒 Security Features

### Network Policies

- **Frontend Tier**: Allows HTTP/HTTPS traffic, restricted backend access
- **Backend Tier**: Internal communication only, DNS access for external APIs

### RBAC

- **Service Account**: `soranix-sa`
- **Role**: Namespace-scoped permissions
- **Role Binding**: Links service account to role

### Secrets Management

- Database credentials
- JWT secrets
- API keys (Stripe, OpenAI)
- Redis passwords

## 📈 Autoscaling

### Horizontal Pod Autoscalers

- **Frontend**: 70% CPU, 80% Memory utilization
- **Backend**: 70% CPU, 80% Memory utilization
- **AI Service**: 60% CPU, 70% Memory utilization (higher limits)

### Scaling Ranges

- **Development**: 1-3 replicas
- **Staging**: 2-10 replicas
- **Production**: 2-20 replicas

## 🔍 Monitoring & Health Checks

### Health Endpoints

- **Frontend**: `/api/health` (Next.js), `/` (Vite)
- **Backend**: `/health` (all services)

### Probes

- **Liveness**: 30-60s initial delay, 10-30s period
- **Readiness**: 5-30s initial delay, 5-10s period

## 🛠️ Customization

### Environment Variables

Modify the `configMapGenerator` and `secretGenerator` sections in each overlay's `kustomization.yaml`:

```yaml
configMapGenerator:
  - name: soranix-config
    behavior: merge
    literals:
      - NODE_ENV=production
      - LOG_LEVEL=warn

secretGenerator:
  - name: soranix-secrets
    behavior: merge
    literals:
      - database-url=your-database-url
      - jwt-secret=your-jwt-secret
```

### Resource Limits

Modify the deployment patches in each overlay:

```yaml
resources:
  requests:
    cpu: '200m'
    memory: '256Mi'
  limits:
    cpu: '1000m'
    memory: '1Gi'
```

## 🚨 Troubleshooting

### Common Issues

1. **Image Pull Errors**

   ```bash
   kubectl describe pod <pod-name> -n soranix-<env>
   ```

2. **Ingress Not Working**

   ```bash
   kubectl get ingress -n soranix-<env>
   kubectl describe ingress soranix-ingress -n soranix-<env>
   ```

3. **Service Not Accessible**
   ```bash
   kubectl get svc -n soranix-<env>
   kubectl describe svc <service-name> -n soranix-<env>
   ```

### Useful Commands

```bash
# Check pod status
kubectl get pods -n soranix-<env>

# View logs
kubectl logs -f deployment/<deployment-name> -n soranix-<env>

# Port forward for debugging
kubectl port-forward svc/<service-name> 8080:80 -n soranix-<env>

# Check events
kubectl get events -n soranix-<env> --sort-by='.lastTimestamp'
```

## 📝 Notes

- All secrets in this configuration are placeholders and should be replaced with actual values
- SSL certificates are managed by cert-manager with Let's Encrypt
- Network policies are restrictive by default for security
- Resource limits are conservative and should be adjusted based on actual usage
- The AI service has higher resource requirements due to ML workloads
