# Soranix Application Management Makefile
# Usage: make <command> [ENV=development|staging|production]

# Default environment
ENV ?= development

# Kubernetes context (can be overridden)
KUBE_CONTEXT ?= 

# Namespace based on environment
NAMESPACE = soranix-$(ENV)

# Base directory for kustomize overlays
OVERLAY_DIR = infra/k8s/overlays/$(ENV)

# Colors for output
RED = \033[0;31m
GREEN = \033[0;32m
YELLOW = \033[1;33m
BLUE = \033[0;34m
PURPLE = \033[0;35m
CYAN = \033[0;36m
NC = \033[0m # No Color

.PHONY: help install setup dev build test lint format clean docker-build docker-push docker-compose-up docker-compose-down k8s-deploy k8s-delete k8s-status k8s-logs k8s-scale k8s-restart k8s-port-forward k8s-exec k8s-watch k8s-backup k8s-restore k8s-setup pulumi-up pulumi-destroy pulumi-preview pulumi-refresh terraform-init terraform-plan terraform-apply terraform-destroy

# Default target
help:
	@echo "$(BLUE)Soranix Application Management Commands$(NC)"
	@echo ""
	@echo "$(YELLOW)📦 Application Management:$(NC)"
	@echo "  make install                    - Install all dependencies"
	@echo "  make setup                      - Setup development environment"
	@echo "  make dev                        - Start development servers"
	@echo "  make build                      - Build all applications"
	@echo "  make test                       - Run all tests"
	@echo "  make lint                       - Lint all code"
	@echo "  make format                     - Format all code"
	@echo "  make clean                      - Clean build artifacts"
	@echo ""
	@echo "$(YELLOW)🐳 Docker Management:$(NC)"
	@echo "  make docker-build [SERVICE=service-name] - Build Docker images"
	@echo "  make docker-push [SERVICE=service-name]  - Push Docker images"
	@echo "  make docker-compose-up [ENV=local]       - Start Docker Compose"
	@echo "  make docker-compose-down                 - Stop Docker Compose"
	@echo ""
	@echo "$(YELLOW)☸️  Kubernetes Management:$(NC)"
	@echo "  make k8s-deploy [ENV=development|staging|production] - Deploy to K8s"
	@echo "  make k8s-delete [ENV=development|staging|production] - Delete from K8s"
	@echo "  make k8s-status [ENV=development|staging|production] - Show K8s status"
	@echo "  make k8s-logs [ENV=env] [SERVICE=service-name] - Get K8s logs"
	@echo "  make k8s-scale [ENV=env] [SERVICE=service] [REPLICAS=3] - Scale service"
	@echo "  make k8s-restart [ENV=env] [SERVICE=service] - Restart service"
	@echo "  make k8s-port-forward [ENV=env] [SERVICE=service] - Port forward"
	@echo "  make k8s-exec [ENV=env] [SERVICE=service] - Execute shell in pod"
	@echo "  make k8s-watch [ENV=env] [RESOURCE=pods] - Watch K8s resources"
	@echo "  make k8s-backup [ENV=env] - Backup K8s configuration"
	@echo "  make k8s-restore [ENV=env] [BACKUP_FILE=file] - Restore K8s configuration"
	@echo "  make k8s-setup [ENV=env] - Setup K8s infrastructure"
	@echo ""
	@echo "$(YELLOW)🏗️  Infrastructure as Code:$(NC)"
	@echo "  make pulumi-up [STACK=dev] - Deploy with Pulumi"
	@echo "  make pulumi-destroy [STACK=dev] - Destroy Pulumi stack"
	@echo "  make pulumi-preview [STACK=dev] - Preview Pulumi changes"
	@echo "  make pulumi-refresh [STACK=dev] - Refresh Pulumi state"
	@echo "  make terraform-init [ENV=dev] - Initialize Terraform"
	@echo "  make terraform-plan [ENV=dev] - Plan Terraform changes"
	@echo "  make terraform-apply [ENV=dev] - Apply Terraform changes"
	@echo "  make terraform-destroy [ENV=dev] - Destroy Terraform resources"
	@echo ""
	@echo "$(YELLOW)🚀 Quick Workflows:$(NC)"
	@echo "  make deploy-dev                  - Deploy to development"
	@echo "  make deploy-staging              - Deploy to staging"
	@echo "  make deploy-prod                 - Deploy to production"
	@echo "  make ci-build                    - CI build pipeline"
	@echo "  make ci-deploy                   - CI deploy pipeline"
	@echo ""
	@echo "$(YELLOW)Examples:$(NC)"
	@echo "  make k8s-deploy ENV=staging"
	@echo "  make k8s-logs ENV=production SERVICE=auth"
	@echo "  make docker-build SERVICE=auth"
	@echo "  make pulumi-up STACK=prod"

# =============================================================================
# Application Management
# =============================================================================

# Install all dependencies
install:
	@echo "$(GREEN)Installing dependencies...$(NC)"
	@npm install
	@cd apps/client && npm install
	@cd apps/web && npm install
	@cd services/auth && npm install
	@cd packages/ui && npm install
	@cd packages/logging && npm install
	@echo "$(GREEN)Dependencies installed!$(NC)"

# Setup development environment
setup:
	@echo "$(GREEN)Setting up development environment...$(NC)"
	@make install
	@make docker-build
	@make k8s-setup ENV=development
	@echo "$(GREEN)Development environment ready!$(NC)"

# Start development servers
dev:
	@echo "$(GREEN)Starting development servers...$(NC)"
	@turbo dev

# Build all applications
build:
	@echo "$(GREEN)Building all applications...$(NC)"
	@turbo build

# Run all tests
test:
	@echo "$(GREEN)Running tests...$(NC)"
	@turbo test

# Lint all code
lint:
	@echo "$(GREEN)Linting code...$(NC)"
	@turbo lint

# Format all code
format:
	@echo "$(GREEN)Formatting code...$(NC)"
	@turbo format

# Clean build artifacts
clean:
	@echo "$(BLUE)Cleaning build artifacts...$(NC)"
	@turbo clean
	@rm -rf node_modules
	@rm -rf apps/*/node_modules
	@rm -rf services/*/node_modules
	@rm -rf packages/*/node_modules
	@rm -f backup-*.yaml
	@echo "$(GREEN)Cleanup completed!$(NC)"

# =============================================================================
# Docker Management
# =============================================================================

# Build Docker images
docker-build:
	@if [ -n "$(SERVICE)" ]; then \
		echo "$(GREEN)Building Docker image for $(SERVICE)...$(NC)"; \
		docker build -t soranix/$(SERVICE):latest ./$(SERVICE); \
	else \
		echo "$(GREEN)Building all Docker images...$(NC)"; \
		docker build -t soranix/client:latest ./apps/client; \
		docker build -t soranix/web:latest ./apps/web; \
		docker build -t soranix/auth:latest ./services/auth; \
		docker build -t soranix/ai:latest ./services/ai; \
		docker build -t soranix/banking:latest ./services/banking; \
		docker build -t soranix/payments:latest ./services/payments; \
		docker build -t soranix/users:latest ./services/users; \
		docker build -t soranix/money-management:latest ./services/moneyManagement; \
		docker build -t soranix/transfers:latest ./services/transfers; \
		docker build -t soranix/bills-payment:latest ./services/billsPayment; \
		docker build -t soranix/notification:latest ./services/notification; \
		docker build -t soranix/flows:latest ./services/flows; \
		docker build -t soranix/portfolio:latest ./services/portfolio; \
		docker build -t soranix/billing:latest ./services/billing; \
	fi
	@echo "$(GREEN)Docker build completed!$(NC)"

# Push Docker images
docker-push:
	@if [ -n "$(SERVICE)" ]; then \
		echo "$(GREEN)Pushing Docker image for $(SERVICE)...$(NC)"; \
		docker push soranix/$(SERVICE):latest; \
	else \
		echo "$(GREEN)Pushing all Docker images...$(NC)"; \
		docker push soranix/client:latest; \
		docker push soranix/web:latest; \
		docker push soranix/auth:latest; \
		docker push soranix/ai:latest; \
		docker push soranix/banking:latest; \
		docker push soranix/payments:latest; \
		docker push soranix/users:latest; \
		docker push soranix/money-management:latest; \
		docker push soranix/transfers:latest; \
		docker push soranix/bills-payment:latest; \
		docker push soranix/notification:latest; \
		docker push soranix/flows:latest; \
		docker push soranix/portfolio:latest; \
		docker push soranix/billing:latest; \
	fi
	@echo "$(GREEN)Docker push completed!$(NC)"

# Start Docker Compose
docker-compose-up:
	@echo "$(GREEN)Starting Docker Compose...$(NC)"
	@if [ "$(ENV)" = "local" ]; then \
		docker-compose -f docker-compose.local.yaml up -d; \
	else \
		docker-compose up -d; \
	fi

# Stop Docker Compose
docker-compose-down:
	@echo "$(YELLOW)Stopping Docker Compose...$(NC)"
	@docker-compose down

# =============================================================================
# Kubernetes Management
# =============================================================================

# Deploy to Kubernetes
k8s-deploy:
	@echo "$(GREEN)Deploying to $(ENV) environment...$(NC)"
	@if [ -n "$(KUBE_CONTEXT)" ]; then \
		kubectl --context=$(KUBE_CONTEXT) apply -k $(OVERLAY_DIR); \
	else \
		kubectl apply -k $(OVERLAY_DIR); \
	fi
	@echo "$(GREEN)Deployment to $(ENV) completed!$(NC)"

# Delete from Kubernetes
k8s-delete:
	@echo "$(YELLOW)Deleting deployment from $(ENV) environment...$(NC)"
	@if [ -n "$(KUBE_CONTEXT)" ]; then \
		kubectl --context=$(KUBE_CONTEXT) delete -k $(OVERLAY_DIR); \
	else \
		kubectl delete -k $(OVERLAY_DIR); \
	fi
	@echo "$(GREEN)Deletion from $(ENV) completed!$(NC)"

# Show Kubernetes status
k8s-status:
	@echo "$(BLUE)Status for $(ENV) environment:$(NC)"
	@if [ -n "$(KUBE_CONTEXT)" ]; then \
		kubectl --context=$(KUBE_CONTEXT) get all -n $(NAMESPACE); \
	else \
		kubectl get all -n $(NAMESPACE); \
	fi

# Get Kubernetes logs
k8s-logs:
	@if [ -z "$(SERVICE)" ]; then \
		echo "$(RED)Error: SERVICE parameter is required$(NC)"; \
		echo "Usage: make k8s-logs ENV=production SERVICE=auth"; \
		exit 1; \
	fi
	@echo "$(BLUE)Logs for $(SERVICE) in $(ENV):$(NC)"
	@if [ -n "$(KUBE_CONTEXT)" ]; then \
		kubectl --context=$(KUBE_CONTEXT) logs -f deployment/$(SERVICE) -n $(NAMESPACE); \
	else \
		kubectl logs -f deployment/$(SERVICE) -n $(NAMESPACE); \
	fi

# Scale Kubernetes service
k8s-scale:
	@if [ -z "$(SERVICE)" ] || [ -z "$(REPLICAS)" ]; then \
		echo "$(RED)Error: SERVICE and REPLICAS parameters are required$(NC)"; \
		echo "Usage: make k8s-scale ENV=production SERVICE=auth REPLICAS=5"; \
		exit 1; \
	fi
	@echo "$(GREEN)Scaling $(SERVICE) to $(REPLICAS) replicas in $(ENV)...$(NC)"
	@if [ -n "$(KUBE_CONTEXT)" ]; then \
		kubectl --context=$(KUBE_CONTEXT) scale deployment $(SERVICE) --replicas=$(REPLICAS) -n $(NAMESPACE); \
	else \
		kubectl scale deployment $(SERVICE) --replicas=$(REPLICAS) -n $(NAMESPACE); \
	fi

# Restart Kubernetes service
k8s-restart:
	@if [ -z "$(SERVICE)" ]; then \
		echo "$(RED)Error: SERVICE parameter is required$(NC)"; \
		echo "Usage: make k8s-restart ENV=production SERVICE=auth"; \
		exit 1; \
	fi
	@echo "$(YELLOW)Restarting $(SERVICE) in $(ENV)...$(NC)"
	@if [ -n "$(KUBE_CONTEXT)" ]; then \
		kubectl --context=$(KUBE_CONTEXT) rollout restart deployment $(SERVICE) -n $(NAMESPACE); \
	else \
		kubectl rollout restart deployment $(SERVICE) -n $(NAMESPACE); \
	fi

# Port forward to Kubernetes service
k8s-port-forward:
	@if [ -z "$(SERVICE)" ]; then \
		echo "$(RED)Error: SERVICE parameter is required$(NC)"; \
		echo "Usage: make k8s-port-forward ENV=production SERVICE=auth"; \
		exit 1; \
	fi
	@echo "$(BLUE)Port forwarding $(SERVICE) in $(ENV)...$(NC)"
	@if [ -n "$(KUBE_CONTEXT)" ]; then \
		kubectl --context=$(KUBE_CONTEXT) port-forward service/$(SERVICE)-service 8080:80 -n $(NAMESPACE); \
	else \
		kubectl port-forward service/$(SERVICE)-service 8080:80 -n $(NAMESPACE); \
	fi

# Execute shell in Kubernetes pod
k8s-exec:
	@if [ -z "$(SERVICE)" ]; then \
		echo "$(RED)Error: SERVICE parameter is required$(NC)"; \
		echo "Usage: make k8s-exec ENV=production SERVICE=auth"; \
		exit 1; \
	fi
	@echo "$(BLUE)Executing shell in $(SERVICE) pod in $(ENV)...$(NC)"
	@if [ -n "$(KUBE_CONTEXT)" ]; then \
		kubectl --context=$(KUBE_CONTEXT) exec -it deployment/$(SERVICE) -n $(NAMESPACE) -- /bin/bash; \
	else \
		kubectl exec -it deployment/$(SERVICE) -n $(NAMESPACE) -- /bin/bash; \
	fi

# Watch Kubernetes resources
k8s-watch:
	@if [ -z "$(RESOURCE)" ]; then \
		RESOURCE=pods; \
	fi
	@echo "$(BLUE)Watching $(RESOURCE) in $(ENV) environment:$(NC)"
	@if [ -n "$(KUBE_CONTEXT)" ]; then \
		kubectl --context=$(KUBE_CONTEXT) get $(RESOURCE) -n $(NAMESPACE) -w; \
	else \
		kubectl get $(RESOURCE) -n $(NAMESPACE) -w; \
	fi

# Backup Kubernetes configuration
k8s-backup:
	@echo "$(GREEN)Backing up $(ENV) configuration...$(NC)"
	@if [ -n "$(KUBE_CONTEXT)" ]; then \
		kubectl --context=$(KUBE_CONTEXT) get all -n $(NAMESPACE) -o yaml > backup-$(ENV)-$(shell date +%Y%m%d-%H%M%S).yaml; \
	else \
		kubectl get all -n $(NAMESPACE) -o yaml > backup-$(ENV)-$(shell date +%Y%m%d-%H%M%S).yaml; \
	fi
	@echo "$(GREEN)Backup saved to backup-$(ENV)-$(shell date +%Y%m%d-%H%M%S).yaml$(NC)"

# Restore Kubernetes configuration
k8s-restore:
	@if [ -z "$(BACKUP_FILE)" ]; then \
		echo "$(RED)Error: BACKUP_FILE parameter is required$(NC)"; \
		echo "Usage: make k8s-restore ENV=production BACKUP_FILE=backup.yaml"; \
		exit 1; \
	fi
	@echo "$(YELLOW)Restoring $(ENV) configuration from $(BACKUP_FILE)...$(NC)"
	@if [ -n "$(KUBE_CONTEXT)" ]; then \
		kubectl --context=$(KUBE_CONTEXT) apply -f $(BACKUP_FILE); \
	else \
		kubectl apply -f $(BACKUP_FILE); \
	fi

# Setup Kubernetes infrastructure
k8s-setup:
	@echo "$(GREEN)Setting up Kubernetes infrastructure for $(ENV)...$(NC)"
	@kubectl create namespace $(NAMESPACE) --dry-run=client -o yaml | kubectl apply -f -
	@kubectl apply -f infra/k8s/base/rbac.yaml -n $(NAMESPACE)
	@kubectl apply -f infra/k8s/base/network-policies.yaml -n $(NAMESPACE)
	@echo "$(GREEN)Kubernetes infrastructure setup completed!$(NC)"

# =============================================================================
# Infrastructure as Code (Pulumi)
# =============================================================================

# Deploy with Pulumi
pulumi-up:
	@if [ -z "$(STACK)" ]; then \
		STACK=dev; \
	fi
	@echo "$(GREEN)Deploying with Pulumi to $(STACK) stack...$(NC)"
	@cd infra/pulumi && pulumi up --stack $(STACK) --yes

# Destroy Pulumi stack
pulumi-destroy:
	@if [ -z "$(STACK)" ]; then \
		STACK=dev; \
	fi
	@echo "$(YELLOW)Destroying Pulumi $(STACK) stack...$(NC)"
	@cd infra/pulumi && pulumi destroy --stack $(STACK) --yes

# Preview Pulumi changes
pulumi-preview:
	@if [ -z "$(STACK)" ]; then \
		STACK=dev; \
	fi
	@echo "$(BLUE)Previewing Pulumi changes for $(STACK) stack...$(NC)"
	@cd infra/pulumi && pulumi preview --stack $(STACK)

# Refresh Pulumi state
pulumi-refresh:
	@if [ -z "$(STACK)" ]; then \
		STACK=dev; \
	fi
	@echo "$(BLUE)Refreshing Pulumi state for $(STACK) stack...$(NC)"
	@cd infra/pulumi && pulumi refresh --stack $(STACK)

# =============================================================================
# Infrastructure as Code (Terraform)
# =============================================================================

# Initialize Terraform
terraform-init:
	@if [ -z "$(ENV)" ]; then \
		ENV=dev; \
	fi
	@echo "$(GREEN)Initializing Terraform for $(ENV) environment...$(NC)"
	@cd infra/terraform/$(ENV) && terraform init

# Plan Terraform changes
terraform-plan:
	@if [ -z "$(ENV)" ]; then \
		ENV=dev; \
	fi
	@echo "$(BLUE)Planning Terraform changes for $(ENV) environment...$(NC)"
	@cd infra/terraform/$(ENV) && terraform plan

# Apply Terraform changes
terraform-apply:
	@if [ -z "$(ENV)" ]; then \
		ENV=dev; \
	fi
	@echo "$(GREEN)Applying Terraform changes for $(ENV) environment...$(NC)"
	@cd infra/terraform/$(ENV) && terraform apply --auto-approve

# Destroy Terraform resources
terraform-destroy:
	@if [ -z "$(ENV)" ]; then \
		ENV=dev; \
	fi
	@echo "$(YELLOW)Destroying Terraform resources for $(ENV) environment...$(NC)"
	@cd infra/terraform/$(ENV) && terraform destroy --auto-approve

# =============================================================================
# Quick Workflows
# =============================================================================

# Deploy to development
deploy-dev:
	@echo "$(GREEN)Deploying to development...$(NC)"
	@make docker-build
	@make k8s-deploy ENV=development
	@echo "$(GREEN)Development deployment completed!$(NC)"

# Deploy to staging
deploy-staging:
	@echo "$(GREEN)Deploying to staging...$(NC)"
	@make docker-build
	@make docker-push
	@make k8s-deploy ENV=staging
	@echo "$(GREEN)Staging deployment completed!$(NC)"

# Deploy to production
deploy-prod:
	@echo "$(GREEN)Deploying to production...$(NC)"
	@make docker-build
	@make docker-push
	@make k8s-deploy ENV=production
	@echo "$(GREEN)Production deployment completed!$(NC)"

# CI build pipeline
ci-build:
	@echo "$(GREEN)Running CI build pipeline...$(NC)"
	@make install
	@make lint
	@make test
	@make build
	@make docker-build
	@echo "$(GREEN)CI build completed!$(NC)"

# CI deploy pipeline
ci-deploy:
	@echo "$(GREEN)Running CI deploy pipeline...$(NC)"
	@make docker-push
	@make k8s-deploy ENV=staging
	@echo "$(GREEN)CI deploy completed!$(NC)"
