# Microsoft Entra ID app registration

Administration Microsoft sign-in uses one single-tenant app registration in the flycatchtech.com tenant. The audience is `AzureADMyOrg`. The backend requests the `openid email profile` scopes and still checks that the identity token email is `@flycatchtech.com`.

Create the app with the Azure CLI while signed in to that tenant:

```bash
az ad app create \
  --display-name "Flycatch Website Administration" \
  --sign-in-audience AzureADMyOrg \
  --web-redirect-uris \
    "http://localhost:8080/api/v1/admin/auth/microsoft/callback" \
    "https://flycatch-website-dev.k3s.flycatchtech.in/api/v1/admin/auth/microsoft/callback" \
    "https://www.flycatchtech.com/api/v1/admin/auth/microsoft/callback"
```

Note the `appId`. Create a client secret and store it outside git as `AZURE_AD_CLIENT_SECRET`:

```bash
az ad app credential reset --id <appId> --display-name "website-admin" --years 1
```

Set these values per environment. Each environment uses its own redirect URI from the list above.

| Variable | Where | Example |
| --- | --- | --- |
| `AZURE_AD_TENANT_ID` | ConfigMap / Compose env | Directory (tenant) ID |
| `AZURE_AD_CLIENT_ID` | ConfigMap / Compose env | Application (client) ID |
| `AZURE_AD_CLIENT_SECRET` | Secret / Compose env | Value from credential reset. Do not commit it. |
| `AZURE_AD_REDIRECT_URI` | ConfigMap / Compose env | One of the three redirect URIs |
| `ALLOWED_EMAIL_DOMAIN` | ConfigMap / Compose env | `flycatchtech.com` |

When the Azure values are unset, the sign-in screen hides "Sign in with Microsoft" and password sign-in keeps working.

Rotate the secret before it expires:

```bash
az ad app credential reset --id <appId> --display-name "website-admin" --years 1
```

Put the new secret in the environment secret store and restart the backend. Remove the previous credential from the app registration after the new one is in use.
