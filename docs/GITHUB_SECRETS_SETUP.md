# GitHub Secrets Setup Guide

## 🔐 Setting up API Keys for GitHub Actions CI/CD

This guide shows how to configure GitHub repository secrets for the ChatLaLiLuLeLo CI/CD pipeline.

### Required Secrets

The following secrets need to be added to your GitHub repository:

| Secret Name | Description | Required | Example Format |
|-------------|-------------|----------|----------------|
| `OPENAI_API_KEY` | OpenAI API key for GPT models | ✅ Yes | `sk-proj-...` |
| `TAVILY_API_KEY` | Tavily API key for web search | 🔄 Optional | `tvly-...` |

### 🚀 Setup Steps

#### 1. Access Repository Settings
1. Go to your GitHub repository
2. Click **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**

#### 2. Add OpenAI API Key (Required)
1. Click **New repository secret**
2. **Name**: `OPENAI_API_KEY`
3. **Secret**: Your OpenAI API key (starts with `sk-proj-`)
4. Click **Add secret**

#### 3. Add Tavily API Key (Optional)
1. Click **New repository secret**
2. **Name**: `TAVILY_API_KEY` 
3. **Secret**: Your Tavily API key (starts with `tvly-`)
4. Click **Add secret**

### 🔑 Getting API Keys

#### OpenAI API Key (Required)
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in to your OpenAI account
3. Click **"+ Create new secret key"**
4. Copy the key (starts with `sk-proj-`)
5. **Important**: Save it immediately - you won't see it again!

#### Tavily API Key (Optional)
1. Visit [Tavily](https://tavily.com/)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Copy the key (starts with `tvly-`)

### 🔍 Verification

After setting up secrets, the GitHub Actions CI pipeline will:

✅ **Pass**: When both local `.dev.vars` OR GitHub secrets are properly configured  
❌ **Fail**: When neither local file nor GitHub secrets contain valid API keys

### 🏠 Local Development Setup

For local development, create a `.dev.vars` file:

```bash
# In the project root
cp apps/edge/.dev.vars.example apps/edge/.dev.vars
```

Then edit `apps/edge/.dev.vars` with your actual API keys:

```bash
OPENAI_API_KEY=sk-proj-your-actual-openai-key-here
TAVILY_API_KEY=tvly-your-actual-tavily-key-here
```

### 🛡️ Security Best Practices

- ✅ **Never commit** `.dev.vars` to git (it's in `.gitignore`)
- ✅ **Use GitHub Secrets** for CI/CD pipelines
- ✅ **Rotate keys regularly** for security
- ✅ **Use minimal permissions** for API keys
- ❌ **Never share** API keys in chat, email, or screenshots

### 🔧 Environment Variable Priority

The backend automatically detects and uses API keys in this order:

1. **Local Development**: `.dev.vars` file (for `wrangler dev`)
2. **GitHub Actions**: Environment variables from GitHub Secrets
3. **Production**: Cloudflare environment variables (when deployed)

### ⚡ Quick Test

After setup, you can verify GitHub Actions are working by:

1. Push a commit to the `main` branch
2. Check **Actions** tab in your repository
3. Look for successful CI runs with ✅ status
4. Check logs for "OpenAI API key configured" message

### 🐛 Troubleshooting

**CI still failing?**
- Verify secret names match exactly: `OPENAI_API_KEY` and `TAVILY_API_KEY`
- Check that OpenAI key starts with `sk-proj-`
- Ensure you have sufficient OpenAI credits/quota
- Try recreating the secrets if needed

**Local development issues?**
- Make sure `.dev.vars` exists in `apps/edge/` directory
- Check that file contains valid API keys without extra spaces
- Verify file is not committed to git (should be grayed out in IDE)

---

**Status**: Production Ready 🚀  
**Last Updated**: January 2025  
**Support**: Check repository issues for help
