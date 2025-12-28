# Chapa Payment Integration Removal Plan

## Overview
This document outlines all Chapa-related code that will be removed to prepare for fresh payment integration.

## Backend Changes

### 1. Models (api/models.py)
- ✅ **DONE**: Remove `ChapaSubAccount` model entirely
- ✅ **DONE**: Clean `CoinPurchase` model:
  - Remove: `chapa_tx_ref`, `chapa_ref_id`, `chapa_checkout_url`
  - Replace with: `transaction_ref`, `payment_method`

### 2. Views (api/views.py) - TO BE REMOVED
- `PurchaseCoinsView` (lines 1492-1590) - Remove Chapa payment initialization
- `CoinPurchaseStatusView` (lines 1592-1675) - Simplify to basic status check
- `CreateSubAccountView` (lines 1816-1879) - Remove entirely
- `ChapaWebhookView` (lines 1882-1968) - Remove entirely
- `SendGiftView` - Remove Chapa split payment logic (lines 1770-1793)

### 3. URLs (api/urls.py) - TO BE REMOVED
- Remove `ChapaWebhookView` import (line 19, 47)
- Remove `/chapa/webhook/` endpoint (line 107)
- Remove `/subaccount/create/` endpoint (line 106)
- Remove `CreateSubAccountView` import (line 46)

### 4. Serializers (api/serializers.py) - TO BE CLEANED
- Remove `ChapaSubAccountSerializer`
- Update `CoinPurchaseSerializer` to match new model fields

### 5. Settings (shebalove_project/settings.py)
- Remove `CHAPA_SECRET_KEY` configuration

### 6. Environment (.env)
- Remove `CHAPA_SECRET_KEY` variable

### 7. Database Migration
Create migration to:
- Drop `ChapaSubAccount` table
- Remove Chapa fields from `CoinPurchase`
- Add new generic fields to `CoinPurchase`

## Frontend Changes

### 1. Components to DELETE
- `web/src/components/DemoChapaCheckout.jsx`
- `web/src/components/RealChapaCheckout.jsx`
- `web/src/components/DemoPaymentSuccess.jsx`
- `web/src/components/TestReceipt.jsx`

### 2. Components to CLEAN
- `web/src/App.jsx` - Remove demo checkout routing
- `web/src/components/UnifiedPurchasePage.jsx` - Remove demo flow logic
- `web/src/components/CoinPurchaseReceipt.jsx` - Remove Chapa-specific receipt logic
- `web/src/components/PurchaseHistory.jsx` - Remove Chapa references
- `web/src/api.js` - Simplify coin purchase API calls

### 3. Remove from App.jsx
- Demo checkout imports and routing
- Test receipt imports and routing
- All Chapa-related navigation logic

## What Will Remain

### Backend
- ✅ `CoinPackage` model (coin packages/pricing)
- ✅ `UserWallet` model (user coin balances)
- ✅ `CoinPurchase` model (simplified, payment-agnostic)
- ✅ `GiftType` model (gift types)
- ✅ `GiftTransaction` model (gift sending records)
- ✅ Basic coin package listing API
- ✅ Wallet balance API
- ✅ Gift sending/receiving logic

### Frontend
- ✅ Coin package display UI
- ✅ Wallet display
- ✅ Gift store and sending UI
- ✅ Basic purchase history display

## Next Steps After Removal
1. Integrate new Chapa account
2. Implement fresh payment initialization
3. Add webhook handling
4. Test complete payment flow
5. Deploy to production

## Notes
- All existing gift transactions and wallet balances will be preserved
- Coin packages and pricing remain unchanged
- Only payment processing code is being removed
