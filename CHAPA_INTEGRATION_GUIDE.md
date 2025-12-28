# Chapa Payment Integration - Complete Setup Guide

## ✅ What We've Implemented

### Backend Changes
1. **Environment Variables** (`.env`)
   - Added Chapa test credentials
   - Secret Key, Public Key, Encryption Key

2. **Settings** (`settings.py`)
   - Configured Chapa keys
   - Set up FRONTEND_URL

3. **Payment Initialization** (`PurchaseCoinsView`)
   - Creates CoinPurchase record
   - Calls Chapa API to initialize payment
   - Returns checkout URL to frontend

4. **Webhook Handler** (`ChapaWebhookView`)
   - Receives payment notifications from Chapa
   - **Automatically verifies** transaction with Chapa API
   - Credits user wallet on successful payment
   - Updates purchase status

5. **Status Endpoint** (`CoinPurchaseStatusView`)
   - Returns purchase details for receipt page

## 📋 Chapa Dashboard Configuration

### 1. Webhook URL
In your Chapa dashboard, set the webhook URL to:
```
http://your-backend-domain/api/chapa/webhook/
```

**For local testing:**
- You'll need to use a tunneling service like **ngrok** or **localtunnel**
- Example with ngrok:
  ```bash
  ngrok http 8000
  ```
- Then use the ngrok URL: `https://abc123.ngrok.io/api/chapa/webhook/`

### 2. Account Settings - Callback URL
Set this in Chapa Dashboard > Settings > Account Settings:
```
http://localhost:5173/#/coins/receipt
```

**For production:**
```
https://your-frontend-domain.com/#/coins/receipt
```

### 3. Account Settings - Return URL
Set this in Chapa Dashboard > Settings > Account Settings:
```
http://localhost:5173/#/coins/receipt
```

**For production:**
```
https://your-frontend-domain.com/#/coins/receipt
```

## 🔄 Payment Flow

### User Journey:
1. **User clicks "Buy Now"** on a coin package
2. **Frontend calls** `/api/coins/purchase/` with `package_id`
3. **Backend creates** `CoinPurchase` record with status='pending'
4. **Backend calls Chapa API** to initialize payment
5. **Chapa returns** checkout URL
6. **Frontend redirects** user to Chapa checkout page
7. **User completes payment** on Chapa's page
8. **Chapa sends webhook** to `/api/chapa/webhook/`
9. **Backend automatically verifies** transaction with Chapa API
10. **Backend credits coins** to user wallet
11. **Backend updates** purchase status to 'completed'
12. **User is redirected** back to receipt page

### Automatic Verification:
- When webhook receives `status: 'success'`
- Backend makes GET request to: `https://api.chapa.co/v1/transaction/verify/{tx_ref}`
- Only credits wallet if verification confirms success
- Prevents fraudulent webhook calls

## 🧪 Testing the Integration

### Step 1: Start Backend
```bash
cd backend
python manage.py runserver
```

### Step 2: Start Frontend
```bash
cd web
npm run dev
```

### Step 3: Set up ngrok (for webhook testing)
```bash
ngrok http 8000
```
Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

### Step 4: Configure Chapa Dashboard
1. Go to https://dashboard.chapa.co
2. Navigate to **Settings > Webhooks**
3. Add webhook URL: `https://abc123.ngrok.io/api/chapa/webhook/`
4. Navigate to **Settings > Account Settings**
5. Set Callback URL: `http://localhost:5173/#/coins/receipt`
6. Set Return URL: `http://localhost:5173/#/coins/receipt`

### Step 5: Test Purchase
1. Login to your app
2. Go to "Gifts & Coins" page
3. Click "Buy Now" on any package
4. You'll be redirected to Chapa test checkout
5. Use Chapa test cards:
   - **Success**: Card number `5555555555554444`
   - **Failed**: Card number `4000000000000002`
6. Complete payment
7. You'll be redirected back to receipt page
8. Check your wallet - coins should be added!

## 📊 Monitoring

### Backend Logs
Watch for these log messages:
```
Webhook received for tx_ref: coin-1-abc123, status: success
Coin purchase completed: coin-1-abc123, user: testuser, coins: 100
```

### Check Database
```bash
cd backend
python manage.py shell
```
```python
from api.models import CoinPurchase, UserWallet

# Check recent purchases
CoinPurchase.objects.all().order_by('-created_at')[:5]

# Check user wallet
wallet = UserWallet.objects.get(user__username='your_username')
print(f"Coins: {wallet.coins}")
```

## 🚀 Moving to Production

### 1. Update Environment Variables
```bash
# In backend/.env
CHAPA_SECRET_KEY=CHASECK-your_live_secret_key
CHAPA_PUBLIC_KEY=CHAPUBK-your_live_public_key
FRONTEND_URL=https://your-domain.com
```

### 2. Update Chapa Dashboard
- Switch to **Live Mode**
- Update webhook URL to production backend
- Update callback/return URLs to production frontend

### 3. Deploy Backend
- Ensure webhook endpoint is publicly accessible
- Use HTTPS (required by Chapa)
- Configure proper logging

### 4. Deploy Frontend
- Update API base URL in frontend
- Ensure return URL matches deployed domain

## 🎁 Split Payments for Gifts (Coming Next)

The current integration handles **coin purchases**. For **gift sending with split payments** (where the receiver gets a percentage), we'll implement:

1. **Subaccount Creation** - Create Chapa subaccounts for users
2. **Split Payment** - When sending gifts, split payment between platform and receiver
3. **Withdrawal System** - Allow users to withdraw their earnings

This will be implemented after coin purchases are working smoothly.

## 🔐 Security Notes

1. **Webhook Verification**: Always verify transactions with Chapa API (✅ implemented)
2. **HTTPS Only**: Chapa requires HTTPS for webhooks in production
3. **Secret Key**: Never expose secret key in frontend
4. **Token Auth**: All API calls require authentication token

## 📞 Support

### Chapa Support
- Email: support@chapa.co
- Dashboard: https://dashboard.chapa.co
- Docs: https://developer.chapa.co

### Common Issues

**Issue**: Webhook not received
- **Solution**: Check ngrok is running, webhook URL is correct in dashboard

**Issue**: Payment succeeds but coins not added
- **Solution**: Check backend logs, verify webhook endpoint is accessible

**Issue**: 401 Unauthorized from Chapa
- **Solution**: Verify CHAPA_SECRET_KEY is correct in .env

**Issue**: Verification fails
- **Solution**: Check tx_ref matches between initialization and webhook

## ✅ Checklist

- [ ] Backend running on port 8000
- [ ] Frontend running on port 5173
- [ ] ngrok tunnel active (for testing)
- [ ] Webhook URL configured in Chapa dashboard
- [ ] Callback URL configured in Chapa dashboard
- [ ] Return URL configured in Chapa dashboard
- [ ] Test purchase completed successfully
- [ ] Coins added to wallet
- [ ] Receipt page displays correctly

---

**Status**: Ready for Testing! 🎉
**Next**: Test complete flow, then implement split payments for gifts
