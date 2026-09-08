# Oracle Server Deployment & CI/CD Guide: `longwarp-auth`

This guide explains how to deploy `longwarp-auth` to your Oracle Cloud Infrastructure (OCI) server, configure secrets securely, set up Nginx reverse proxy, and enable automated GitHub Actions CI/CD.

---

## 1. Security Architecture & Secret Management

> [!CAUTION]
> **Never commit `.env` or production secrets to Git!**
> The `.gitignore` is pre-configured to strictly exclude all `.env*` files.

Production secrets must reside strictly in either:
1. The server's filesystem: `/var/www/longwarp-auth/.env` (owned by your deployment user with `chmod 600`).
2. GitHub Repository Secrets (for CI/CD pipeline credentials).

---

## 2. Server Setup (Oracle VM)

### A. Install Prerequisites
On your Oracle Linux or Ubuntu VM:

```bash
# Node.js 20 & npm
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx

# Install PM2 process manager globally
sudo npm install -g pm2
```

### B. Setup Application Directory & Environment File
```bash
sudo mkdir -p /var/www/longwarp-auth
sudo chown -R $USER:$USER /var/www/longwarp-auth
cd /var/www/longwarp-auth
```

Create `/var/www/longwarp-auth/.env`:
```env
NODE_ENV=production
HOST=127.0.0.1
PORT=4000

# Canonical PostgreSQL Connection String
# For your PostgreSQL instance:
DATABASE_URL=postgresql://<xx>_user:<zzz>_pass@127.0.0.1:5432/yyytable

# Google OAuth 2.0 Credentials
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://auth.longwarp.com/auth/google/callback

# JWT & Cookie Security
JWT_SECRET=use_a_secure_32_character_random_string
COOKIE_DOMAIN=.longwarp.com
ALLOWED_ORIGINS=https://shabu.longwarp.com,https://toll.longwarp.com,https://trade.longwarp.com
```

Lock down permissions:
```bash
chmod 600 /var/www/longwarp-auth/.env
```

---

## 3. Nginx Reverse Proxy Configuration

Create `/etc/nginx/sites-available/auth.longwarp.com`:

```nginx
server {
    server_name auth.longwarp.com;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;

        # Preserves client IP and host
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support (if needed in the future)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site & obtain SSL certificate:
```bash
sudo ln -s /etc/nginx/sites-available/auth.longwarp.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Install Certbot and obtain Let's Encrypt SSL
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d auth.longwarp.com
```

---

## 4. GitHub Actions CI/CD Setup

In your GitHub repository (`longwarp-auth`), go to **Settings > Secrets and variables > Actions** and add the following repository secrets:

| Secret Name | Description | Example |
| :--- | :--- | :--- |
| `ORACLE_HOST` | Public IP or DNS of your Oracle VM | `129.153.xx.xx` |
| `ORACLE_USER` | SSH Username on the VM | `ubuntu` or `opc` |
| `ORACLE_SSH_KEY` | Private SSH key with access to VM | `-----BEGIN OPENSSH PRIVATE KEY...` |
| `ORACLE_PORT` | SSH Port (default is 22) | `22` |
| `ORACLE_DEPLOY_DIR`| Target deployment path on VM | `/var/www/longwarp-auth` |

### How the CI/CD Pipeline Works:
1. Every commit/PR triggers the **`ci`** job:
   - Validates the Prisma schema
   - Compiles TypeScript into `dist/`
2. Pushing to `main` triggers the **`deploy`** job:
   - Connects securely to your Oracle VM via SSH
   - Pulls the latest code into `/var/www/longwarp-auth`
   - Builds production assets
   - Runs database migrations (`prisma db push` / `prisma migrate deploy`)
   - Reloads PM2 with zero downtime (`pm2 reload ecosystem.config.cjs`)

---

## 5. Verification & Testing

Verify that the service is running properly:

```bash
# Check PM2 status
pm2 status

# Check local health check
curl http://127.0.0.1:4000/health

# Check public health check
curl https://auth.longwarp.com/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "longwarp-auth",
  "timestamp": "2026-09-08T10:35:00.000Z"
}
```
