# Soranix

Soranix is an AI-powered operating system for finance.

## Project Structure

This is a monorepo containing:

- **apps/**: Frontend applications (Next.js, React)
- **packages/**: Shared packages and UI components
- **services/**: Backend services
- **infra/**: Infrastructure configurations (Kubernetes, Nginx)
- **tooling/**: Development tools and configurations

## Development Setup

### Prerequisites

- Node.js (v18 or higher)
- npm (v11.4.1)
- Docker (for local development)

### Installation

```bash
npm install
```

### Development Commands

```bash
# Start all applications
npm run dev

# Start only apps
npm run start:apps

# Start only services
npm run start:services

# Build all packages
npm run build

# Lint all packages
npm run lint

# Format code
npm run format
```

## Commit Guidelines

This project uses [Conventional Commits](https://www.conventionalcommits.org/) with strict validation through commitlint and husky.

### Commit Message Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **build**: Changes that affect the build system or external dependencies
- **ci**: Changes to CI configuration files and scripts
- **chore**: Other changes that don't modify src or test files
- **revert**: Reverts a previous commit
- **init**: Initializes a project or repo
- **infra**: Changes related to infrastructure

### Scopes

- **admin**: Admin-related changes
- **client**: Client application changes
- **auth**: Authentication-related changes
- **global**: Global changes affecting multiple areas
- **ai**: AI-related features
- **banking**: Banking functionality
- **payments**: Payment processing
- **flows**: Workflow changes
- **notifications**: Notification system
- **portfolio**: Portfolio management
- **web**: Web application changes

### Rules

- **Subject case**: Must be sentence-case (first letter capitalized)
- **Subject length**: Minimum 10 characters
- **Header length**: Maximum 72 characters
- **Body line length**: Maximum 100 characters
- **Scope**: Required and must be one of the predefined scopes
- **No trailing period**: Subject should not end with a period

### Examples

✅ Valid commits:

```
feat(client): Add user authentication system
fix(auth): Resolve login token expiration issue
docs(global): Update API documentation
refactor(payments): Simplify payment processing logic
```

❌ Invalid commits:

```
feat: add auth (missing scope)
feat(client): add auth (lowercase subject)
feat(client): Add auth. (trailing period)
feat(unknown): Add auth (invalid scope)
```

### Making Commits

#### Option 1: Interactive Commit (Recommended)

Use the interactive commitizen prompt:

```bash
npm run commit
# or
npx cz
```

This will guide you through creating a properly formatted commit message.

#### Option 2: Manual Commit

Write your commit message manually following the format above:

```bash
git commit -m "feat(client): Add new user dashboard"
```

### Pre-commit Hooks

The following checks run automatically before each commit:

1. **Lint-staged**: Runs ESLint and Prettier on staged files
2. **Commitlint**: Validates commit message format

### Troubleshooting

If your commit is rejected:

1. Check the error message for specific issues
2. Ensure your commit follows the conventional format
3. Use `npm run commit` for guided commit creation
4. Verify that all staged files pass linting

## Docker Development

### Local Development

```bash
# Start all services
docker-compose -f docker-compose.local.yaml up

# Start specific services
docker-compose -f docker-compose.local.yaml up auth client
```

### Production

```bash
# Build and start production services
docker-compose up --build
```

## Kubernetes Deployment

The project includes Kubernetes configurations in the `infra/k8s/` directory.

### Development

```bash
kubectl apply -k infra/k8s/overlays/development
```

### Production

```bash
kubectl apply -k infra/k8s/overlays/production
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Follow the commit guidelines
5. Submit a pull request

## License

ISC
