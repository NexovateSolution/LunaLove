# Split Payment System Implementation 🎁💰

## Overview
Implementing Chapa split payments for gift transactions where:
- **70% goes to the gift receiver** (via their subaccount)
- **30% goes to the platform** (LunaLove)
- Receivers can withdraw their earnings to their bank account

## Implementation Steps

### ✅ Step 1: UserSubaccount Model Created
**File**: `backend/api/models.py` (lines 562-598)

Model to store user's Chapa subaccount information:
- Bank account details (bank_code, account_number, account_name)
- Chapa subaccount_id
- Split configuration (70% to receiver)
- Earnings tracking (total_earnings, total_withdrawn, available_balance)

### 🔄 Step 2: Create Subaccount Endpoint (In Progress)
**Endpoint**: `POST /api/subaccount/create/`

Allows users to register their bank account for receiving gift earnings:
1. User provides bank details
2. Backend validates with Chapa
3. Creates Chapa subaccount (70% split)
4. Stores subaccount_id in database

### 🔄 Step 3: Update SendGiftView (In Progress)
**File**: `backend/api/views.py` - `SendGiftView`

When sending a gift:
1. Check if receiver has a subaccount
2. If yes: Initialize payment with split (receiver gets 70%)
3. If no: Regular gift (no split payment)
4. Deduct coins from sender
5. Update receiver's earnings

### 🔄 Step 4: Withdrawal System (Pending)
**Endpoint**: `POST /api/earnings/withdraw/`

Allow users to withdraw their earnings:
- Check available balance
- Create withdrawal request
- Process via Chapa (automatic to their bank account)
- Update withdrawn amount

## API Endpoints

### 1. Create Subaccount
```http
POST /api/subaccount/create/
Authorization: Token {token}
Content-Type: application/json

{
  "bank_code": "128",
  "account_number": "0123456789",
  "account_name": "John Doe"
}
```

**Response**:
```json
{
  "success": true,
  "subaccount_id": "837b4e5e-57c8-4e39-b2df-66e7886b8bdb",
  "message": "Subaccount created successfully"
}
```

### 2. Get Subaccount Status
```http
GET /api/subaccount/status/
Authorization: Token {token}
```

**Response**:
```json
{
  "has_subaccount": true,
  "bank_name": "Commercial Bank of Ethiopia",
  "account_number": "****6789",
  "total_earnings": "1250.00",
  "total_withdrawn": "500.00",
  "available_balance": "750.00"
}
```

### 3. Send Gift (with split payment)
```http
POST /api/gifts/send/
Authorization: Token {token}
Content-Type: application/json

{
  "receiver_id": "user-uuid",
  "gift_type_id": "gift-uuid",
  "quantity": 1,
  "message": "You're amazing!"
}
```

**Response** (if receiver has subaccount):
```json
{
  "success": true,
  "message": "Gift sent successfully!",
  "split_payment": true,
  "receiver_earnings": "70.00",
  "platform_cut": "30.00"
}
```

### 4. Withdraw Earnings
```http
POST /api/earnings/withdraw/
Authorization: Token {token}
Content-Type: application/json

{
  "amount": "500.00"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Withdrawal processed successfully",
  "amount": "500.00",
  "new_balance": "250.00"
}
```

## Split Payment Flow

### Scenario: User A sends a 100 ETB gift to User B

1. **User A purchases coins**:
   - Pays 100 ETB → Gets 100 coins

2. **User A sends gift** (costs 100 coins = 100 ETB value):
   - Backend checks if User B has subaccount
   - If yes:
     - Platform keeps: 30 ETB (30%)
     - User B receives: 70 ETB (70%) → Added to their earnings
   - If no:
     - Gift sent normally (no money transfer)

3. **User B withdraws earnings**:
   - Has 700 ETB in earnings
   - Requests withdrawal of 500 ETB
   - Money sent to their bank account
   - Remaining balance: 200 ETB

## Chapa Integration Details

### Creating Subaccount
```python
payload = {
    "account_name": "John Doe",
    "bank_code": "128",  # From /api/banks/
    "account_number": "0123456789",
    "split_value": 0.70,  # 70% to receiver
    "split_type": "percentage"
}

response = requests.post(
    'https://api.chapa.co/v1/subaccount',
    json=payload,
    headers={'Authorization': f'Bearer {CHAPA_SECRET_KEY}'}
)

subaccount_id = response.json()['data']['subaccounts[id]']
```

### Sending Gift with Split
```python
payload = {
    "amount": "100",
    "currency": "ETB",
    "email": sender_email,
    "tx_ref": "gift-abc123",
    "callback_url": "https://api.yourdomain.com/api/chapa/gift-webhook/",
    "subaccounts": {
        "id": receiver_subaccount_id  # Receiver gets 70%
    }
}

response = requests.post(
    'https://api.chapa.co/v1/transaction/initialize',
    json=payload,
    headers={'Authorization': f'Bearer {CHAPA_SECRET_KEY}'}
)
```

## Database Schema

### UserSubaccount
```sql
- id (UUID)
- user_id (FK to User)
- bank_code (VARCHAR)
- bank_name (VARCHAR)
- account_number (VARCHAR)
- account_name (VARCHAR)
- subaccount_id (VARCHAR, unique) -- From Chapa
- split_type (VARCHAR) -- 'percentage'
- split_value (DECIMAL) -- 0.70 (70%)
- is_active (BOOLEAN)
- is_verified (BOOLEAN)
- total_earnings_etb (DECIMAL)
- total_withdrawn_etb (DECIMAL)
- created_at (DATETIME)
- updated_at (DATETIME)
```

### GiftTransaction (existing, updated)
```sql
- id (UUID)
- sender_id (FK)
- receiver_id (FK)
- gift_type_id (FK)
- quantity (INT)
- total_coins (INT)
- total_etb_value (DECIMAL)
- platform_cut_percentage (DECIMAL) -- 30.00
- platform_cut_etb (DECIMAL)
- receiver_share_etb (DECIMAL)
- chapa_tx_ref (VARCHAR)
- split_payment_processed (BOOLEAN)
- message (TEXT)
- created_at (DATETIME)
```

## Frontend Integration

### 1. Subaccount Setup Page
Users can register their bank account:
- Select bank from dropdown
- Enter account number
- Enter account holder name
- Submit → Creates Chapa subaccount

### 2. Earnings Dashboard
Show users their gift earnings:
- Total earnings
- Total withdrawn
- Available balance
- Withdrawal button

### 3. Gift Sending (Updated)
When sending gifts:
- Show if receiver can receive money
- Display split breakdown (70% to them, 30% to platform)
- Confirm and send

## Testing Plan

### 1. Create Subaccount
- Register bank account
- Verify Chapa subaccount created
- Check database record

### 2. Send Gift with Split
- User A sends gift to User B (who has subaccount)
- Verify split payment initialized
- Check User B's earnings increased

### 3. Withdraw Earnings
- User B requests withdrawal
- Verify money sent to bank
- Check balance updated

## Security Considerations

1. **Bank Account Validation**:
   - Verify account_name matches bank records
   - Validate account_number format

2. **Withdrawal Limits**:
   - Minimum withdrawal: 100 ETB
   - Maximum daily withdrawal: 5000 ETB
   - KYC verification for large amounts

3. **Fraud Prevention**:
   - Rate limiting on subaccount creation
   - Monitor suspicious withdrawal patterns
   - Require email/SMS confirmation for withdrawals

## Next Steps

1. ✅ Create UserSubaccount model
2. ⏳ Implement CreateSubaccountView
3. ⏳ Update SendGiftView with split payment logic
4. ⏳ Implement WithdrawEarningsView
5. ⏳ Create frontend subaccount setup page
6. ⏳ Create earnings dashboard
7. ⏳ Test complete flow end-to-end

---

**This will enable a complete monetization system where users can earn real money from receiving gifts!** 💰✨
