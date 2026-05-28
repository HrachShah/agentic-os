# deploy-check

Pre-deployment checklist. Verifies your code is production-ready before you ship.

## What it checks
- [ ] All tests pass
- [ ] No TODO/FIXME/HACK left in changed files
- [ ] No console.log / print debug statements
- [ ] No hardcoded secrets or API keys
- [ ] Dependencies are pinned / lockfile present
- [ ] Environment variables documented
- [ ] Error handling at system boundaries
- [ ] CORS / security headers configured
- [ ] Database migrations ready
- [ ] Rollback plan exists

## Usage
```
/deploy-check
```

Returns: READY / NEEDS WORK with specific blockers listed.
