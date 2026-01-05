# Security Documentation

## 🔒 Security Overview

This application has two distinct security models:

| Feature | Security Model |
|---------|----------------|
| ROI Calculator | Client-side only, no sensitive data |
| Domain Scanner | Protected by password, uses service keys for backend |

---

## 🏗️ Architecture Security

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                              │
│  - Quiz/Calculator data stays local                             │
│  - Scanner data sent to edge functions                          │
└─────────────────────────────────────┬────────────────────────────┘
                                      │ HTTPS only
                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LOVABLE CLOUD EDGE FUNCTIONS                  │
│  - scan-domain: reads/writes to external DB                     │
│  - generate-insights: calls OpenAI API                          │
│  - send-pdf-email: calls Resend API                            │
│                                                                  │
│  Secrets (encrypted at rest):                                   │
│  - SCANNER_SUPABASE_URL                                         │
│  - SCANNER_SUPABASE_SERVICE_KEY                                 │
│  - BROWSERLESS_API_KEY                                          │
│  - OPENAI_API_KEY                                               │
│  - RESEND_API_KEY                                               │
└─────────────────────────────────────┬────────────────────────────┘
                                      │ Service Key Auth
                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                  EXTERNAL SCANNER DATABASE                       │
│  - Separate from main Lovable project                           │
│  - Service key required for writes                              │
│  - Anon key allows reads (for real-time subscriptions)          │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Secrets Management

### Edge Function Secrets

All secrets are stored in Lovable Cloud's encrypted secret store.

| Secret | Used By | Risk Level | Rotation Frequency |
|--------|---------|------------|-------------------|
| `SCANNER_SUPABASE_URL` | scan-domain | Low | On database change |
| `SCANNER_SUPABASE_SERVICE_KEY` | scan-domain | **High** | 90 days recommended |
| `BROWSERLESS_API_KEY` | scan-domain | Medium | As needed |
| `OPENAI_API_KEY` | generate-insights | Medium | As needed |
| `RESEND_API_KEY` | send-pdf-email | Medium | As needed |

### Service Key Security

The `SCANNER_SUPABASE_SERVICE_KEY` bypasses RLS. **Never expose it to the frontend.**

```typescript
// ✅ CORRECT - Only in edge functions
const supabase = createClient(
  Deno.env.get('SCANNER_SUPABASE_URL')!,
  Deno.env.get('SCANNER_SUPABASE_SERVICE_KEY')!
);

// ❌ NEVER - Don't use service key in frontend
import.meta.env.VITE_SERVICE_KEY // WRONG!
```

### Frontend Environment Variables

Only public keys should use the `VITE_` prefix:

| Variable | Type | Safe to Expose? |
|----------|------|-----------------|
| `VITE_SUPABASE_URL` | Public | ✅ Yes |
| `VITE_SUPABASE_ANON_KEY` | Public | ✅ Yes (RLS enforced) |
| `VITE_MEETING_BOOKING_URL` | Public | ✅ Yes |

---

## 🛡️ Authentication & Authorization

### Scanner Access Control

The scanner uses a simple password-based authentication stored in the hook:

```typescript
// src/hooks/useScannerAuth.ts
// Current: Hardcoded password check
// Recommendation: Migrate to Supabase Auth for production
```

**Improvement Recommendations:**
1. Use Supabase Auth for proper user management
2. Implement role-based access control
3. Add audit logging for scans

### Database Access Control

**External Scanner Database RLS:**

```sql
-- domain_scans: Allow authenticated reads
CREATE POLICY "Allow read access" ON domain_scans
  FOR SELECT USING (true);

-- domain_results: Allow authenticated reads  
CREATE POLICY "Allow read access" ON domain_results
  FOR SELECT USING (true);

-- Writes only via service key (bypasses RLS)
```

---

## 🔍 Security Checklist

### Pre-Deployment

- [ ] All secrets are set in Lovable Cloud (not in code)
- [ ] No service keys exposed to frontend
- [ ] HTTPS enforced in production
- [ ] Scanner password is not default/weak
- [ ] RLS policies configured on external database

### Post-Deployment

- [ ] Verify HTTPS certificate is valid
- [ ] Test scanner access control works
- [ ] Check no secrets in browser console/network tab
- [ ] Verify edge function logs don't leak sensitive data

### Regular Maintenance

- [ ] Rotate service keys every 90 days
- [ ] Review edge function logs for anomalies
- [ ] Update dependencies for security patches
- [ ] Audit scanner access patterns

---

## 🚨 Incident Response

### If Service Key is Exposed

1. **Immediately** rotate the key in Supabase dashboard
2. Update `SCANNER_SUPABASE_SERVICE_KEY` in Lovable Cloud
3. Review database for unauthorized changes
4. Check edge function logs for suspicious activity

### If API Keys are Exposed

1. Revoke the exposed key in the service dashboard (Browserless, OpenAI, Resend)
2. Generate new key
3. Update secret in Lovable Cloud
4. Review usage for unexpected charges

---

## 📋 CORS Configuration

All edge functions include CORS headers:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',  // Consider restricting in production
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

**Production Recommendation:** Replace `*` with specific allowed origins:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://your-production-domain.com',
  // ...
};
```

---

## 🎯 Risk Assessment

| Component | Risk Level | Mitigation |
|-----------|------------|------------|
| ROI Calculator | **Low** | Client-side only, no sensitive data |
| Scanner Frontend | **Low** | Password protected, no secrets |
| Edge Functions | **Medium** | Secrets encrypted, logging enabled |
| External Database | **Medium** | RLS policies, service key protected |
| Third-Party APIs | **Low** | Rate limiting, key rotation |

### Overall Risk: **LOW-MEDIUM**

The application handles no PII or payment data. Main risks are:
1. Unauthorized scanner access (mitigated by password)
2. API key exposure (mitigated by Lovable Cloud secrets)
3. Service key exposure (mitigated by edge function isolation)

---

## 📞 Security Contacts

For security concerns or vulnerability reports:
- Review this documentation first
- Check Lovable Cloud logs
- Contact AdFixus security team

---

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 3.0 | 2026-01-05 | Added dual-database architecture, service key documentation |
| 2.0 | 2024-XX-XX | Removed Supabase from calculator, simplified security model |
| 1.0 | Initial | Original security documentation |
