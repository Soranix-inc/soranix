# JWT RSA Keys

This directory contains RSA key pairs used for JWT token signing and verification.

## 🔑 Key Files

- **`private.key`** - RSA private key (4096-bit)

  - Used ONLY by Auth Service to sign JWTs
  - ⚠️ **NEVER commit to git!**
  - Keep this secret!

- **`public.key`** - RSA public key
  - Used by ALL services to verify JWTs
  - Safe to share and commit to git
  - Copy to all services that need to verify tokens

## 🚀 Generating Keys

Run the key generation script from the project root:

```bash
chmod +x scripts/generate-jwt-keys.sh
./scripts/generate-jwt-keys.sh
```

This will:

1. Generate a 4096-bit RSA private key
2. Extract the public key from the private key
3. Save them to this directory
4. Display base64 encoded versions for environment variables

## 📋 Usage

### Option A: File-based (Development)

**Auth Service:**

```env
JWT_PRIVATE_KEY_PATH=./infra/keys/private.key
JWT_PUBLIC_KEY_PATH=./infra/keys/public.key
```

**Other Services (Users, Payments, etc.):**

```env
JWT_PUBLIC_KEY_PATH=./infra/keys/public.key
```

### Option B: Environment Variable (Production)

**Auth Service:**

```env
JWT_PRIVATE_KEY=<base64_encoded_private_key>
JWT_PUBLIC_KEY=<base64_encoded_public_key>
```

**Other Services:**

```env
JWT_PUBLIC_KEY=<base64_encoded_public_key>
```

Get base64 encoded versions:

```bash
# Private key
base64 < infra/keys/private.key | tr -d '\n'

# Public key
base64 < infra/keys/public.key | tr -d '\n'
```

## 🔄 Key Rotation

To rotate keys:

1. Generate new key pair
2. Keep old public key available temporarily
3. Deploy new private key to auth service
4. Update all services with new public key
5. After grace period, remove old public key

## 🔒 Security Best Practices

1. **Private Key:**

   - ✅ Store in secure vault (AWS Secrets Manager, HashiCorp Vault)
   - ✅ Use environment variables in production
   - ✅ Restrict file permissions (chmod 600)
   - ❌ Never commit to git
   - ❌ Never share via insecure channels
   - ❌ Never log or expose in errors

2. **Public Key:**
   - ✅ Safe to commit to git
   - ✅ Can be publicly accessible
   - ✅ Distribute to all services that verify JWTs
   - ✅ Same key used across all services

## 🎯 Key Distribution

```
┌──────────────────────────────────────────┐
│  Auth Service                            │
│  ├── private.key (signs JWTs)           │
│  └── public.key (optional)              │
└──────────────────────────────────────────┘
                    │
                    │ Distributes public key
                    ↓
┌──────────────────────────────────────────┐
│  All Other Services                      │
│  └── public.key (verifies JWTs)         │
│                                          │
│  Examples:                               │
│  ├── Users Service                       │
│  ├── Payments Service                    │
│  ├── Banking Service                     │
│  └── Portfolio Service                   │
└──────────────────────────────────────────┘
```

## ⚠️ Troubleshooting

**Error: "Failed to load private key"**

- Check file exists: `ls -la infra/keys/private.key`
- Check permissions: `chmod 600 infra/keys/private.key`
- Check environment variable is set correctly

**Error: "Failed to verify JWT"**

- Ensure public key matches the private key used for signing
- Check key format (should be PEM format)
- Verify environment variable is correctly base64 encoded

**Error: "Invalid signature"**

- Public key doesn't match the private key
- Regenerate keys and redistribute public key to all services

## 📚 Additional Resources

- [JWT.io](https://jwt.io/) - JWT debugger
- [RSA Key Format](https://en.wikipedia.org/wiki/X.509#Certificate_filename_extensions) - Understanding PEM format
