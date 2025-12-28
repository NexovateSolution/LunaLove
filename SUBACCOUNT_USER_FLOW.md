# Subaccount & Earnings - User Flow & UI Design 💰

## User Journey Overview

### 1. Discovery
**Where users learn about earning from gifts**

#### Option A: First Gift Received (Recommended)
When a user receives their first gift:
```
┌─────────────────────────────────────┐
│  🎁 You received a gift!            │
│                                     │
│  Rose from John                     │
│  Worth: 50 ETB                      │
│                                     │
│  💡 Did you know?                   │
│  You can earn real money from gifts!│
│                                     │
│  Set up your bank account to start  │
│  earning 70% of gift values.        │
│                                     │
│  [Set Up Now]  [Maybe Later]        │
└─────────────────────────────────────┘
```

#### Option B: Gift Store
Show earning potential in gift store:
```
┌─────────────────────────────────────┐
│  🌹 Rose - 50 coins                 │
│  Worth: 50 ETB                      │
│                                     │
│  💰 Receivers earn: 35 ETB (70%)    │
│                                     │
│  [Send Gift]                        │
└─────────────────────────────────────┘
```

### 2. Subaccount Setup Location

#### **Primary Location: Settings → Earnings**

**Navigation Path:**
```
Profile/Settings → Earnings → Set Up Bank Account
```

**Settings Menu Structure:**
```
Settings
├── Profile
├── Preferences
├── Subscription
├── 💰 Earnings ← NEW
│   ├── Bank Account
│   ├── Transaction History
│   └── Withdrawal Settings
└── Privacy & Security
```

#### **Secondary Location: Wallet/Coins Page**

Add "Earnings" tab next to "Coins":
```
┌─────────────────────────────────────┐
│  [Coins]  [Earnings] ← NEW          │
│                                     │
│  Your Gift Earnings                 │
│  Total Earned: 350 ETB              │
│  Available: 350 ETB                 │
│                                     │
│  [Set Up Bank Account]              │
└─────────────────────────────────────┘
```

### 3. Bank Account Setup Flow

#### Step 1: Introduction Screen
```
┌─────────────────────────────────────┐
│  💰 Start Earning from Gifts        │
│                                     │
│  When people send you gifts, you    │
│  earn 70% of their value in real    │
│  money!                             │
│                                     │
│  Example:                           │
│  • Someone sends you a 100 ETB gift │
│  • You earn 70 ETB                  │
│  • Money goes to your bank account  │
│                                     │
│  [Continue]                         │
└─────────────────────────────────────┘
```

#### Step 2: Bank Selection
```
┌─────────────────────────────────────┐
│  Select Your Bank                   │
│                                     │
│  🔍 Search banks...                 │
│                                     │
│  📋 Popular Banks:                  │
│  ○ Commercial Bank of Ethiopia      │
│  ○ Awash Bank                       │
│  ○ Bank of Abyssinia                │
│  ○ Dashen Bank                      │
│  ○ More...                          │
│                                     │
│  [Continue]                         │
└─────────────────────────────────────┘
```

#### Step 3: Account Details
```
┌─────────────────────────────────────┐
│  Enter Account Details              │
│                                     │
│  Bank: Commercial Bank of Ethiopia  │
│                                     │
│  Account Number                     │
│  ┌─────────────────────────────┐   │
│  │ 1234567890                  │   │
│  └─────────────────────────────┘   │
│                                     │
│  Account Holder Name                │
│  ┌─────────────────────────────┐   │
│  │ John Doe                    │   │
│  └─────────────────────────────┘   │
│                                     │
│  ⚠️ Make sure the name matches      │
│     your bank account exactly       │
│                                     │
│  [Create Account]                   │
└─────────────────────────────────────┘
```

#### Step 4: Confirmation
```
┌─────────────────────────────────────┐
│  ✅ Bank Account Connected!         │
│                                     │
│  Your earnings will be sent to:     │
│                                     │
│  Commercial Bank of Ethiopia        │
│  Account: ******7890                │
│  Name: John Doe                     │
│                                     │
│  You're all set to start earning!   │
│                                     │
│  [Done]                             │
└─────────────────────────────────────┘
```

### 4. Earnings Dashboard

**Main Earnings Page:**
```
┌─────────────────────────────────────┐
│  💰 Your Earnings                   │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  Total Earned                 │ │
│  │  1,250.00 ETB                 │ │
│  │                               │ │
│  │  Available Balance            │ │
│  │  750.00 ETB                   │ │
│  └───────────────────────────────┘ │
│                                     │
│  Bank Account                       │
│  Commercial Bank - ******7890       │
│  [Change Account]                   │
│                                     │
│  Recent Earnings                    │
│  ┌───────────────────────────────┐ │
│  │ 🌹 Rose from Sarah            │ │
│  │ +35.00 ETB    2 hours ago     │ │
│  ├───────────────────────────────┤ │
│  │ 💎 Diamond from Mike          │ │
│  │ +70.00 ETB    1 day ago       │ │
│  ├───────────────────────────────┤ │
│  │ 👑 Crown from Lisa            │ │
│  │ +140.00 ETB   3 days ago      │ │
│  └───────────────────────────────┘ │
│                                     │
│  [View All Transactions]            │
└─────────────────────────────────────┘
```

### 5. Gift Sending (Updated)

**When sending a gift to someone with a subaccount:**
```
┌─────────────────────────────────────┐
│  Send Gift to Sarah                 │
│                                     │
│  🌹 Rose                            │
│  Cost: 50 coins (50 ETB)            │
│                                     │
│  💰 Sarah will earn: 35 ETB         │
│  (70% goes to her bank account)     │
│                                     │
│  Message (optional)                 │
│  ┌─────────────────────────────┐   │
│  │ You're amazing!             │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Send Gift]                        │
└─────────────────────────────────────┘
```

## UI Components Needed

### 1. **EarningsDashboard.jsx**
Main earnings overview page
- Total earnings display
- Available balance
- Bank account info
- Recent transactions list
- Setup prompt if no subaccount

### 2. **BankAccountSetup.jsx**
Multi-step form for setting up bank account
- Bank selection dropdown
- Account number input
- Account name input
- Validation and submission

### 3. **EarningsHistory.jsx**
Detailed transaction history
- List of all gifts received
- Earnings per gift
- Date and sender info
- Filter and search

### 4. **BankAccountCard.jsx**
Display current bank account info
- Bank name and logo
- Masked account number
- Edit/change option

## Navigation Integration

### Option 1: Add to Bottom Navigation (Recommended)
```
┌─────────────────────────────────────┐
│                                     │
│         [Content Area]              │
│                                     │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  🏠    💬    💰    ❤️    👤         │
│ Home  Chat Coins Matches Profile    │
└─────────────────────────────────────┘
```

Change "Coins" to show both coins and earnings:
- Tap once: Show coins/purchase
- Swipe left: Show earnings

### Option 2: Add to Profile Menu
```
Profile
├── Edit Profile
├── Photos
├── 💰 Earnings ← NEW
├── Settings
└── Logout
```

### Option 3: Add to Settings
```
Settings
├── Account
├── Preferences
├── 💰 Earnings & Bank Account ← NEW
├── Subscription
└── Privacy
```

## Notifications & Prompts

### First Gift Received
```
🎁 You received a gift!

Rose from John (50 ETB)

💡 Set up your bank account to earn 70% 
   of gift values in real money!

[Set Up Now]  [Later]
```

### Milestone Earnings
```
🎉 You've earned 100 ETB from gifts!

Set up your bank account to receive 
your earnings automatically.

[Set Up Bank Account]
```

### Pending Earnings Alert
```
💰 You have 250 ETB in pending earnings!

Connect your bank account to start 
receiving your gift earnings.

[Connect Now]
```

## Security & Trust Elements

### Trust Badges
```
✅ Secure Payment Processing
✅ Bank-Level Encryption
✅ Chapa Verified Partner
```

### Privacy Assurance
```
🔒 Your bank details are encrypted and 
   never shared with other users.
```

### Support
```
❓ Need Help?
   • How do earnings work?
   • Which banks are supported?
   • When will I receive my money?
   
[Contact Support]
```

## Implementation Priority

### Phase 1: Core Features (Do First)
1. ✅ Backend API (Already done!)
2. 🔄 Earnings Dashboard page
3. 🔄 Bank Account Setup flow
4. 🔄 Add "Earnings" to navigation

### Phase 2: Enhanced Features
5. Transaction history with filters
6. Earnings notifications
7. Withdrawal tracking
8. Analytics (earnings over time)

### Phase 3: Polish
9. Onboarding tutorial
10. Help/FAQ section
11. Bank account verification
12. Multiple account support

## Recommended Implementation

**Start with Settings → Earnings section:**

1. Add "Earnings" option to Settings menu
2. Create EarningsDashboard component
3. Create BankAccountSetup component
4. Show prompt when user receives first gift
5. Add earnings info to gift sending flow

This approach:
- ✅ Doesn't clutter main navigation
- ✅ Easy to discover via settings
- ✅ Natural place for financial features
- ✅ Can add notifications to drive awareness

---

**Would you like me to create the frontend components for the Earnings Dashboard and Bank Account Setup?** 🚀
