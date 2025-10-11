# Dynamic Branch Deployment Guide

## Overview

The ChatLaLiLuLeLo project now supports flexible branch-based GitHub Pages deployment through repository variables and manual workflow dispatch. This allows you to deploy different branches for testing without modifying workflow files.

## Quick Setup

### 1. Configure Repository Variables

Go to your GitHub repository → Settings → Secrets and variables → Actions → Variables tab

Add these repository variables:

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `DEPLOY_BRANCH` | `Dev-Voice.V1` | Branch to deploy by default |
| `DEPLOY_ENVIRONMENT` | `development` | Environment type |
| `WEB_TESTING_ENABLED` | `true` | Enable/disable web testing steps |
| `DEMO_API_URL` | `https://your-api.workers.dev` | API URL for the deployment |

### 2. Switch Deployment Branch

#### Option A: Change Repository Variable
1. Go to repository Settings → Secrets and variables → Actions → Variables
2. Edit `DEPLOY_BRANCH` value to your desired branch (e.g., `develop-v4`, `main`)
3. Next push to any monitored branch will deploy the branch specified in `DEPLOY_BRANCH`

#### Option B: Manual Workflow Dispatch
1. Go to Actions tab → "Deploy Web to GitHub Pages (Dynamic Branch)"
2. Click "Run workflow"
3. Specify:
   - **Branch to deploy**: Override branch (e.g., `develop-v4`)
   - **Environment**: `development`, `staging`, or `production`
4. Click "Run workflow"

## How It Works

### Branch Selection Logic
```yaml
TARGET_BRANCH: ${{ github.event.inputs.target_branch || vars.DEPLOY_BRANCH || github.ref_name }}
```

**Priority Order:**
1. **Manual input** (workflow_dispatch input) - Highest priority
2. **Repository variable** (`DEPLOY_BRANCH`) - Default for automated deployments
3. **Source branch** (`github.ref_name`) - Fallback if no configuration

### Workflow Triggers

The workflow will trigger on:
- **Push events** to: `Dev-Voice.V1`, `develop-v4`, `main`
- **Manual dispatch** with custom parameters

## Usage Examples

### Example 1: Test Voice Features
```
Repository Variables:
- DEPLOY_BRANCH: "Dev-Voice.V1" 
- DEPLOY_ENVIRONMENT: "development"

Result: All pushes deploy the voice development branch
```

### Example 2: Production Deployment
```
Repository Variables:
- DEPLOY_BRANCH: "main"
- DEPLOY_ENVIRONMENT: "production"

Result: All pushes deploy the stable main branch
```

### Example 3: Quick Testing
```
Manual Workflow Dispatch:
- target_branch: "feature/new-ui"
- environment: "staging"

Result: One-time deployment of experimental branch
```

## Deployment Information

### Workflow Output
Every deployment shows clear information:
```
🚀 ChatLaLiLuLeLo Dynamic Branch Deployment
=======================================
Target Branch: Dev-Voice.V1
Environment: development
Web Testing: true
Triggered By: push
Source Branch: Dev-Voice.V1
=======================================
```

### Environment-Specific Configuration

**Development Environment:**
- Full debugging and validation
- Voice system enabled
- Security headers injected
- Comprehensive error reporting

**Staging Environment:**
- Production-like configuration
- Limited debugging
- Performance optimized

**Production Environment:**
- Minimal logging
- Maximum security
- Optimized builds

## Advanced Configuration

### Environment-Specific Variables

You can create environment-specific variables:

| Variable | Development | Staging | Production |
|----------|------------|---------|------------|
| `DEMO_API_URL` | `https://dev-api.workers.dev` | `https://staging-api.workers.dev` | `https://api.workers.dev` |
| `WEB_TESTING_ENABLED` | `true` | `true` | `false` |

### Branch Protection

The workflow supports multiple branches but you can restrict which branches can be deployed:

```yaml
on:
  push:
    branches: [Dev-Voice.V1, develop-v4, main] # Only these branches trigger deployment
```

## Troubleshooting

### Common Issues

#### Workflow not triggering
- **Check**: Is your branch in the `branches` list?
- **Solution**: Add your branch to the workflow trigger

#### Wrong branch deployed
- **Check**: Repository variable `DEPLOY_BRANCH` setting
- **Solution**: Update variable or use manual dispatch

#### Environment configuration missing
- **Check**: Repository variables are set correctly
- **Solution**: Add missing variables in Settings → Variables

#### API connectivity fails
- **Check**: `DEMO_API_URL` points to accessible API
- **Solution**: Verify backend deployment and CORS configuration

### Debug Information

Every deployment generates comprehensive reports:
- **Deployment Report**: Shows what was deployed and validation results
- **Failure Report**: Detailed error information if deployment fails
- **Build Artifacts**: Logs and configuration files for debugging

Access these via Actions → Workflow run → Artifacts section.

## Security Considerations

### Repository Variables vs Secrets

**Use Variables for:**
- Branch names
- API URLs
- Environment settings
- Non-sensitive configuration

**Use Secrets for:**
- API keys (`ELEVENLABS_API_KEY`)
- Authentication tokens
- Private configuration values

### Environment Isolation

Each environment can have different:
- API endpoints
- Security policies  
- Feature flags
- Performance settings

This ensures development changes don't affect production deployments.

## Best Practices

### Development Workflow
1. **Feature Development**: Work on feature branches, use manual dispatch for testing
2. **Integration Testing**: Set `DEPLOY_BRANCH` to development branch
3. **Staging**: Deploy stable features to staging environment
4. **Production**: Only deploy thoroughly tested main branch

### Branch Management
- **Dev-Voice.V1**: Voice system development and testing
- **develop-v4**: Stable development with all features
- **main**: Production-ready releases only

### Testing Strategy
- Use `development` environment for feature testing
- Use `staging` environment for integration testing
- Use `production` environment only for releases

## Summary

The dynamic branch deployment system provides:

✅ **Flexibility**: Deploy any branch without workflow changes
✅ **Safety**: Environment-specific configurations prevent accidents  
✅ **Visibility**: Clear reporting of what's deployed where
✅ **Control**: Manual override for quick testing
✅ **Automation**: Hands-off deployment for stable branches

This system allows you to easily test voice features, new functionality, or bug fixes by simply changing a repository variable or using manual workflow dispatch.
