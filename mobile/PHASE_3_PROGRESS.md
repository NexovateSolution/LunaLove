# 🏠 Phase 3: Home Screen Rebuild - Complete Web Replication

## 🎯 **Goal: Exact Web App Home Screen**

Rebuilding Home/Discovery screen to match web app exactly:
- Floating action buttons (5 buttons)
- Confetti animation on match
- Profile detail modal
- Match celebration modal
- All exact styling and animations

---

## ✅ **Completed**

### **Dependencies Installed**
- ✅ react-native-confetti-cannon

---

## 📋 **Next: Rebuild Home Screen**

### **Floating Action Buttons (Bottom)**
From web app analysis, the action bar has 5 buttons:

1. **Rewind Button** (Left)
   - Icon: FiRewind (circular arrow)
   - Color: Yellow/Orange (#F59E0B)
   - Size: Medium circular
   - Premium feature
   - Undo last swipe

2. **Dislike Button** (Left-Center)
   - Icon: FiX (X mark)
   - Color: Red (#EF4444)
   - Size: Large circular
   - Swipe left action

3. **Like Button** (Center)
   - Icon: FaHeart (filled heart)
   - Color: Green (#10B981)
   - Size: Large circular (largest)
   - Swipe right action

4. **Super Like Button** (Right-Center)
   - Icon: Star
   - Color: Blue (#3B82F6)
   - Size: Medium circular
   - Premium feature
   - Stands out to recipient

5. **Boost Button** (Right)
   - Icon: Lightning/Flash
   - Color: Purple (#8B5CF6)
   - Size: Medium circular
   - Premium feature
   - 30-min profile boost

**Button Styling:**
- Circular buttons
- Shadow-lg
- White background
- Colored icons
- Hover/press scale effect
- Disabled state for premium (if not subscribed)
- Positioned above bottom nav bar
- Horizontal row, centered

---

## 🎊 **Confetti Animation**

**When to show:**
- Mutual match occurs
- Full screen overlay
- 2-3 seconds duration
- Auto-dismiss

**Library:** react-native-confetti-cannon

---

## 🎉 **Match Celebration Modal**

**When mutual match:**
- Full screen modal
- Semi-transparent overlay
- "It's a Match!" text (large, gradient)
- Both profile photos (circular, side by side)
- "Send Message" button (primary gradient)
- "Keep Swiping" button (secondary)
- Close button (X icon, top-right)
- Confetti in background

---

## 📄 **Profile Detail Modal**

**Full screen modal showing:**
- Photo carousel (swipeable, full screen)
- Close button (X, top-right)
- Name, age, location
- Full bio
- All interests (scrollable)
- Religion, relationship intent
- Drinking/smoking habits
- Height, education, occupation
- Action buttons at bottom
- Share profile option

---

## 🔄 **Implementation Order**

1. Create floating action buttons component
2. Add confetti animation
3. Create match celebration modal
4. Create profile detail modal
5. Integrate into Home screen
6. Test all interactions

---

**Status:** Ready to implement
**Next File:** Create FloatingActionButtons component
