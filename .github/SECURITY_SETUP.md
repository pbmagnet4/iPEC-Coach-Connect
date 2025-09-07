# Security Setup Instructions for iPEC Coach Connect

## GitHub Security Features Setup

This document provides instructions for setting up GitHub Advanced Security features to resolve "Resource not accessible by integration" errors in security scanning workflows.

### Required Repository Settings

#### 1. Enable GitHub Advanced Security
1. Go to repository Settings → Security & analysis
2. Enable the following features:
   - **Dependency graph**: ✅ Enable
   - **Dependabot alerts**: ✅ Enable
   - **Dependabot security updates**: ✅ Enable
   - **Code scanning**: ✅ Enable
   - **Secret scanning**: ✅ Enable

#### 2. Configure Branch Protection Rules
1. Go to Settings → Branches
2. Add branch protection rule for `main` branch:
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Include these status checks:
     - `Security Scanning / Dependency Security Scan`
     - `Security Scanning / Code Security Analysis`
     - `Security Scanning / Secret Detection`
     - `Security Scanning / Security Policy Validation`

#### 3. Repository Permissions
Ensure the following permissions are set:
- **Actions**: Read and write permissions
- **Contents**: Read permissions
- **Metadata**: Read permissions
- **Pull requests**: Write permissions
- **Security events**: Write permissions
- **Statuses**: Write permissions

### Secrets Configuration

#### Required Repository Secrets
Add these secrets in Settings → Secrets and variables → Actions:

```bash
# Optional: Semgrep App Token (for enhanced scanning)
SEMGREP_APP_TOKEN=your_semgrep_token_here

# Optional: GitHub Token with enhanced permissions (if default GITHUB_TOKEN insufficient)
SECURITY_TOKEN=your_personal_access_token_with_security_permissions
```

#### Personal Access Token (if needed)
If using a custom token, it should have these scopes:
- `repo` (Full control of private repositories)
- `security_events` (Read and write security events)
- `read:org` (Read organization membership)

### Troubleshooting Common Issues

#### "Resource not accessible by integration"
**Cause**: Insufficient permissions or disabled GitHub Advanced Security features
**Solution**:
1. Verify GitHub Advanced Security is enabled (step 1 above)
2. Check repository permissions (step 3 above)
3. Ensure workflow has correct permissions block
4. For private repositories, verify GitHub Advanced Security license

#### "security-events: write permission missing"
**Cause**: Missing permissions in workflow or repository settings
**Solution**:
1. Verify workflow has `security-events: write` permission
2. Check repository Actions permissions allow writing
3. Ensure branch protection rules don't block security uploads

#### TruffleHog "BASE and HEAD commits are the same"
**Cause**: Incorrect base/head reference configuration
**Solution**:
1. Updated workflow now handles different trigger contexts automatically
2. Uses dynamic base/head references based on event type
3. Falls back to full repository scan when commit range unavailable

#### Missing SARIF files
**Cause**: Security tools failing before SARIF generation
**Solution**:
1. Added conditional uploads that check file existence
2. Continue-on-error for non-critical security tools
3. Proper error handling and artifact uploads

### Validation Commands

Run these commands to validate your setup:

```bash
# Test workflow syntax
cd ".github/workflows"
for file in *.yml; do
  echo "Validating $file..."
  cat "$file" | docker run --rm -i mikefarah/yq eval '.' > /dev/null
done

# Check required files exist
required_files=("SECURITY.md" ".github/workflows/security-scan.yml" ".gitignore" ".github/dependabot.yml")
for file in "${required_files[@]}"; do
  if [[ -f "$file" ]]; then
    echo "✅ $file exists"
  else
    echo "❌ $file missing"
  fi
done

# Validate security policy content
if grep -q "Reporting" SECURITY.md && grep -q "Security" SECURITY.md; then
  echo "✅ SECURITY.md has required sections"
else
  echo "❌ SECURITY.md missing required sections"
fi
```

### Manual Testing

Test the security workflow manually:

```bash
# Trigger workflow manually (if workflow_dispatch is enabled)
gh workflow run security-scan.yml

# Check workflow status
gh run list --workflow=security-scan.yml

# View specific run details
gh run view [RUN_ID]
```

### Support and Resources

- [GitHub Advanced Security Documentation](https://docs.github.com/en/code-security)
- [CodeQL Documentation](https://codeql.github.com/docs/)
- [Semgrep Documentation](https://semgrep.dev/docs/)
- [TruffleHog Documentation](https://github.com/trufflesecurity/trufflehog)

---

**Last Updated**: $(date +%Y-%m-%d)
**Maintained By**: Security Team