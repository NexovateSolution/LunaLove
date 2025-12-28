# Chapa Dashboard Configuration - Quick Reference

## 🔑 Your Test Credentials
```
Test Secret Key: CHASECK_TEST-spQ8SnMm4vELUt9p3vlo7osuLdqQyKGM
Test Public Key: CHAPUBK_TEST-cZcnSoYdUAGwfWQs9oC5ebnmRus0ObnX
Encryption Key:  YUA4Pj8RvX1KPeoGkkS6Ux32
```

## 📍 URLs to Configure in Chapa Dashboard

### For Local Development (Testing)

#### 1. Webhook URL
**Location**: Dashboard > Settings > Webhooks

**For local testing, you MUST use ngrok or similar:**
```bash
# Start ngrok first:
ngrok http 8000

# Then use the HTTPS URL it gives you:
https://abc123.ngrok.io/api/chapa/webhook/
```

⚠️ **Important**: 
- Chapa cannot reach `localhost` or `127.0.0.1`
- You MUST use a public URL (ngrok, localtunnel, etc.)
- Update this URL every time you restart ngrok

#### 2. Callback URL
**Location**: Dashboard > Settings > Account Settings > Callback URL
```
http://localhost:5173/#/coins/receipt
```

#### 3. Return URL
**Location**: Dashboard > Settings > Account Settings > Return URL
```
http://localhost:5173/#/coins/receipt
```

---

### For Production (When Deploying)

#### 1. Webhook URL
```
https://api.yourdomain.com/api/chapa/webhook/
```

#### 2. Callback URL
```
https://yourdomain.com/#/coins/receipt
```

#### 3. Return URL
```
https://yourdomain.com/#/coins/receipt
```

---

## 🧪 Test Cards (Chapa Test Mode)

### Successful Payment
```
Card Number: 5555555555554444
CVV: 123
Expiry: Any future date (e.g., 12/25)
```

### Failed Payment
```
Card Number: 4000000000000002
CVV: 123
Expiry: Any future date
```

---

## 🚀 Step-by-Step Setup

### Step 1: Install ngrok
```bash
# Download from: https://ngrok.com/download
# Or install via chocolatey:
choco install ngrok

# Or via npm:
npm install -g ngrok
```

### Step 2: Start Your Backend
```bash
cd backend
python manage.py runserver
# Backend should be running on http://localhost:8000
```

### Step 3: Start ngrok
```bash
ngrok http 8000
# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
```

### Step 4: Configure Chapa Dashboard
1. Go to https://dashboard.chapa.co
2. Login with your new account
3. Go to **Settings > Webhooks**
4. Click **"Add Webhook"**
5. Paste: `https://abc123.ngrok.io/api/chapa/webhook/`
6. Save

7. Go to **Settings > Account Settings**
8. Find **Callback URL** field
9. Enter: `http://localhost:5173/#/coins/receipt`
10. Find **Return URL** field
11. Enter: `http://localhost:5173/#/coins/receipt`
12. Save

### Step 5: Start Your Frontend
```bash
cd web
npm run dev
# Frontend should be running on http://localhost:5173
```

### Step 6: Test!
1. Open http://localhost:5173
2. Login to your app
3. Go to "Gifts & Coins"
4. Click "Buy Now"
5. You'll be redirected to Chapa checkout
6. Use test card: `5555555555554444`
7. Complete payment
8. You'll be redirected back with coins added!

---

## 🔍 Troubleshooting

### Webhook Not Received?
1. Check ngrok is still running
2. Check webhook URL in dashboard matches ngrok URL
3. Check backend logs for webhook requests
4. Test webhook manually:
   ```bash
   curl -X POST https://abc123.ngrok.io/api/chapa/webhook/ \
     -H "Content-Type: application/json" \
     -d '{"tx_ref":"test-123","status":"success"}'
   ```

### Payment Succeeds But No Coins?
1. Check backend logs for webhook processing
2. Check database:
   ```bash
   python manage.py shell
   from api.models import CoinPurchase
   CoinPurchase.objects.all().order_by('-created_at').first()
   ```
3. Verify webhook URL is accessible

### 401 Error from Chapa?
1. Check `.env` file has correct `CHAPA_SECRET_KEY`
2. Restart backend after changing `.env`
3. Verify key matches dashboard

---

## 📊 Monitoring Webhooks

### View ngrok Requests
Open in browser: http://localhost:4040
- Shows all HTTP requests to your ngrok tunnel
- Useful for debugging webhook calls

### Backend Logs
Watch for:
```
Webhook received for tx_ref: coin-1-abc123, status: success
Coin purchase completed: coin-1-abc123, user: testuser, coins: 100
```

---

## ✅ Quick Checklist

Before testing, verify:
- [ ] Backend running on port 8000
- [ ] Frontend running on port 5173  
- [ ] ngrok running and showing HTTPS URL
- [ ] Webhook URL in Chapa dashboard = ngrok URL + `/api/chapa/webhook/`
- [ ] Callback URL in Chapa dashboard = `http://localhost:5173/#/coins/receipt`
- [ ] Return URL in Chapa dashboard = `http://localhost:5173/#/coins/receipt`
- [ ] `.env` file has correct Chapa keys
- [ ] Backend restarted after `.env` changes

---

## 🎯 Expected Behavior

1. **Click "Buy Now"** → Redirects to Chapa checkout
2. **Enter test card** → Payment processes
3. **Chapa sends webhook** → Backend receives notification
4. **Backend verifies** → Calls Chapa API to confirm
5. **Backend credits coins** → Updates user wallet
6. **User redirected** → Shows receipt with new balance

---

**Need Help?** Check `CHAPA_INTEGRATION_GUIDE.md` for detailed documentation!
