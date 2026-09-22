# Day-to-Day Operations

## Monitoring

### Health Check

```bash
curl https://reviewghost.com/api/health
```

Expected response:
```json
{ "ok": true, "status": "healthy", "timestamp": "...", "version": "0.1.0" }
```

### Key Metrics to Track

1. **UNKNOWN rate** — Percentage of analyses returning UNKNOWN
   - Target: <30%
   - If rising: Check for site changes, WAF updates, or scraper issues

2. **AVOID rate** — Percentage of analyses returning AVOID
   - Monitor for sudden spikes (may indicate false positives)

3. **Average confidence** — Mean confidence score across all analyses
   - Target: >50%
   - If dropping: Investigate data quality issues

4. **Error rate** — Percentage of API requests returning errors
   - Target: <1%
   - Alert if >5%

## Incident Response

### UNKNOWN Rate Spike

1. Check if a major review site changed its HTML structure
2. Verify scraper tiers are still effective
3. Test against known-good URLs
4. If systemic: Deploy parser update

### False Positive Report

1. Review the signals that triggered the high score
2. Check if signal thresholds need adjustment
3. Verify category detection is correct
4. Update signal weights or thresholds if needed

### Site Block Increase

1. Identify which sites are blocking
2. Check if User-Agent rotation is still effective
3. Test alternate strategies
4. Document blocked sites in limitations

## Maintenance Tasks

### Weekly

- Review UNKNOWN rate trends
- Check error logs for new failure patterns
- Verify health endpoint responds

### Monthly

- Review signal detection accuracy
- Update category keywords for new product types
- Check for new review site patterns
- Update documentation

### Quarterly

- Full test suite review
- Security audit (SSRF, sanitization)
- Performance review (response times)
- Dependency updates

## Deployment

```bash
npm run build
npm run test
# If both pass, deploy to Vercel
vercel --prod
```

## Rollback

If a deployment causes issues:
1. Revert to previous git commit
2. Redeploy
3. Monitor UNKNOWN rate for 1 hour
