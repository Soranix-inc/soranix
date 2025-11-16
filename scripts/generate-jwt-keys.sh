#!/bin/bash

# Script to generate RSA key pair for JWT signing
# Generated keys will be placed in infra/keys/

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔑 Generating RSA Key Pair for JWT Signing${NC}"
echo ""

# Create keys directory if it doesn't exist
KEYS_DIR="$(cd "$(dirname "$0")/.." && pwd)/infra/keys"
mkdir -p "$KEYS_DIR"

# File paths
PRIVATE_KEY="$KEYS_DIR/private.key"
PUBLIC_KEY="$KEYS_DIR/public.key"

# Check if keys already exist
if [ -f "$PRIVATE_KEY" ] && [ -f "$PUBLIC_KEY" ]; then
    echo -e "${YELLOW}⚠️  Keys already exist!${NC}"
    echo "   Private key: $PRIVATE_KEY"
    echo "   Public key:  $PUBLIC_KEY"
    echo ""
    read -p "Do you want to overwrite them? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}Keeping existing keys. Exiting.${NC}"
        exit 0
    fi
    echo ""
fi

# Generate private key (4096-bit RSA)
echo -e "${BLUE}📝 Generating private key (4096-bit RSA)...${NC}"
openssl genrsa -out "$PRIVATE_KEY" 4096 2>/dev/null

# Generate public key from private key
echo -e "${BLUE}📝 Generating public key from private key...${NC}"
openssl rsa -in "$PRIVATE_KEY" -pubout -out "$PUBLIC_KEY" 2>/dev/null

# Set secure permissions
chmod 600 "$PRIVATE_KEY"
chmod 644 "$PUBLIC_KEY"

echo ""
echo -e "${GREEN}✅ RSA key pair generated successfully!${NC}"
echo ""
echo -e "${BLUE}📁 Key locations:${NC}"
echo "   Private key: $PRIVATE_KEY"
echo "   Public key:  $PUBLIC_KEY"
echo ""

# Generate base64 encoded versions for environment variables
echo -e "${BLUE}📋 Base64 encoded keys (for environment variables):${NC}"
echo ""
echo -e "${YELLOW}JWT_PRIVATE_KEY=${NC}"
base64 < "$PRIVATE_KEY" | tr -d '\n'
echo ""
echo ""
echo -e "${YELLOW}JWT_PUBLIC_KEY=${NC}"
base64 < "$PUBLIC_KEY" | tr -d '\n'
echo ""
echo ""

echo -e "${GREEN}✅ Done!${NC}"
echo ""
echo -e "${BLUE}📝 Next steps:${NC}"
echo "   1. Copy the public key to all services that need to verify JWTs"
echo "   2. Keep the private key ONLY in the auth service"
echo "   3. Add keys to your .env files or use the base64 versions above"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Never commit private.key to git!${NC}"









