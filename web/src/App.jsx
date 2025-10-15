import React, { useState, useEffect } from "react";
import SplashScreen from "./components/SplashScreen";
import Onboarding from "./components/Onboarding";
import Signup from "./components/Signup";
import Login from './components/Login';
import ProfileSetup from "./components/ProfileSetup";
import HomeSwiping from "./components/HomeSwiping";
import Chat from "./components/Chat";
import GiftStore from "./components/GiftStore";
import NavigationBar from "./components/NavigationBar";
import Profile from "./components/Profile";
import Matches from "./components/Matches";
import EnhancedMatches from "./components/EnhancedMatches";
// import EnhancedChat from "./components/EnhancedChat";
// import NotificationSystem from "./components/NotificationSystem";
import Settings from "./components/Settings";
import Upgrade from "./components/Upgrade";
import PurchasePage from './components/PurchasePage';
import PurchaseSuccess from './components/PurchaseSuccess';
import BuyCoinsPage from './components/BuyCoinsPage';
import useDarkMode from "./hooks/useDarkMode";
import { FiLoader } from 'react-icons/fi';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Chatbot from './components/Chatbot';
import api, { sendGift, getMatches } from "./api.js"; 

export default function App() {
  const [step, setStep] = useState(0); 
  const [showGift, setShowGift] = useState(false);
  const [nav, setNav] = useState("home");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [isDark, setIsDark] = useDarkMode();
  const [isLoading, setIsLoading] = useState(true);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  // Gift animation overlay state
  const [giftEffects, setGiftEffects] = useState([]);
  const [giftSoundsEnabled, setGiftSoundsEnabled] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);

  const [matches, setMatches] = useState([]);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

  const handleAuthentication = (user, token, isNewSignup = false) => {
    if (user && token) {
      localStorage.setItem('token', token);
      setCurrentUser(user);
      setAuthToken(token);
      setShowLogin(false); 
      
      // Only redirect to profile setup for new signups with incomplete profiles
      if (isNewSignup && user.profile_completeness_score < 100) {
        setStep(3);
      } else {
        setStep(4);
      }
    }
  };

  // Demo matches for testing gift animations without backend data
  const getDemoMatches = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return [
      {
        id: 'mock1',
        isMock: true,
        name: 'Mia',
        age: 24,
        avatar: '/avatar.png',
        lastMessage: 'Send me something romantic ✨',
        unread: false,
        messages: [
          { fromMe: false, text: 'Send me something romantic ✨', time: timeStr },
        ],
      },
      {
        id: 'mock2',
        isMock: true,
        name: 'Liam',
        age: 27,
        avatar: '/avatar.png',
        lastMessage: 'Surprise me with a gift!',
        unread: true,
        messages: [
          { fromMe: false, text: 'Surprise me with a gift!', time: timeStr },
        ],
      },
      {
        id: 'mock3',
        isMock: true,
        name: 'Ava',
        age: 23,
        avatar: '/avatar.png',
        lastMessage: 'I love roses 💐',
        unread: false,
        messages: [
          { fromMe: false, text: 'I love roses 💐', time: timeStr },
        ],
      },
    ];
  };

  useEffect(() => {
    const initializeApp = async () => {
      const token = localStorage.getItem('token');
      const path = window.location.pathname;
      const hash = window.location.hash || '';

      // Persist any tx_ref-like parameter found in the URL as an additional fallback
      try {
        const sp = new URLSearchParams(window.location.search || '');
        const directRef = sp.get('tx_ref') || sp.get('trx_ref') || sp.get('reference') || sp.get('transaction_id') || sp.get('transactionId');
        if (directRef) {
          localStorage.setItem('last_tx_ref', directRef);
        } else if (hash) {
          const hashBody = hash.replace(/^#\/?/, '');
          const queryPart = hashBody.includes('?') ? hashBody.split('?')[1] : hashBody;
          if (queryPart && queryPart.includes('=')) {
            const hp = new URLSearchParams(queryPart);
            const refFromHash = hp.get('tx_ref') || hp.get('trx_ref') || hp.get('reference') || hp.get('transaction_id') || hp.get('transactionId');
            if (refFromHash) {
              localStorage.setItem('last_tx_ref', refFromHash);
            }
          }
        }
      } catch (_) {}

      try {
        if (token) {
          const response = await api.get('/user/me/');
          const user = response.data;
          
          setCurrentUser(user);
          setAuthToken(token);
          // Determine whether we should show purchase success
          const sp = new URLSearchParams(window.location.search || '');
          const directRef = sp.get('tx_ref') || sp.get('trx_ref') || sp.get('reference') || sp.get('transaction_id') || sp.get('transactionId');
          const hashBody = hash.replace(/^#\/?/, '');
          const queryPart = hashBody.includes('?') ? hashBody.split('?')[1] : hashBody;
          const hp = new URLSearchParams(queryPart || '');
          const refFromHash = hp.get('tx_ref') || hp.get('trx_ref') || hp.get('reference') || hp.get('transaction_id') || hp.get('transactionId');
          const statusParam = (sp.get('status') || hp.get('status') || '').toLowerCase();
          const shouldGoPurchaseSuccess = path.startsWith('/purchase-success') || hash.includes('purchase-success') || !!directRef || !!refFromHash || statusParam === 'success' || statusParam === 'successful';

          if (shouldGoPurchaseSuccess) {
            setNav('purchase-success');
            setStep(4);
          } else {
            // For existing users (those with tokens), always go to main app
            // Profile setup should only be triggered by new signups
            setStep(4);
          }
        } else {
          const hasOnboarded = localStorage.getItem('hasOnboarded');
          setStep(hasOnboarded ? 2 : 1);
        }
      } catch (error) {
        localStorage.removeItem('token');
        setAuthToken(null);
        setCurrentUser(null);
        setStep(2);
      } finally {
        setIsLoading(false);
      }
    };

    const splashTimeout = setTimeout(() => {
      initializeApp();
    }, 1500);

    return () => clearTimeout(splashTimeout);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setAuthToken(null);
    setStep(2);
    setNav('home');
  };

  const handleProfileSave = (updatedUserData) => {
    setCurrentUser(prevUser => ({
      ...prevUser,
      ...updatedUserData,
      // Ensure nested objects like user_photos are also updated if they exist in the payload
      user_photos: updatedUserData.user_photos || prevUser.user_photos,
    }));
  };

  React.useEffect(() => {
    if (selectedMatch) {
      const updated = matches.find(m => m.id === selectedMatch.id);
      if (updated) setSelectedMatch(updated);
    }
  }, [matches]);

  // Helper to compute age from ISO date string
  const computeAge = (isoDate) => {
    try {
      if (!isoDate) return null;
      const dob = new Date(isoDate);
      if (isNaN(dob.getTime())) return null;
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
      return age;
    } catch (_) { return null; }
  };

  // Fetch real matches from backend when authenticated and viewing Matches
  useEffect(() => {
    const loadMatches = async () => {
      if (!authToken) return;
      try {
        const items = await getMatches();
        const normalized = (items || []).map(m => {
          const u = m.other_user || {};
          const photos = Array.isArray(u.user_photos) ? u.user_photos : [];
          const avatar = photos.length > 0 ? (photos[0].photo || "/avatar.png") : "/avatar.png";
          return {
            id: m.id, // match id
            name: u.first_name || u.username || 'User',
            age: computeAge(u.date_of_birth),
            avatar,
            lastMessage: '',
            unread: false,
            messages: [],
            recipient_user_id: u.id, // used for gifting
          };
        });
        if (!normalized.length) {
          setMatches(getDemoMatches());
        } else {
          setMatches(normalized);
        }
      } catch (e) {
        console.error('Failed to load matches:', e);
        // On error, show demo matches for testing
        setMatches(getDemoMatches());
      }
    };

    // Load when we enter step 4 and either landing on matches, or when nav switches to matches
    if (step === 4 && nav === 'matches') {
      loadMatches();
    }
  }, [step, nav, authToken]);

  const handleProfileSetupFinish = async (profileData, preferenceData) => {
    setIsLoading(true);
    let profileOk = false;
    let prefsOk = false;
    try {
      try {
        await api.patch('/user/me/', profileData);
        profileOk = true;
      } catch (e) {
        profileOk = false;
        console.error('Failed to save profile:', e);
        const detail = e?.response?.data || e?.message || 'Failed to save profile.';
        window.alert(`Profile save failed: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
      }

      try {
        await api.patch('/user/preferences/', preferenceData);
        prefsOk = true;
      } catch (e) {
        prefsOk = false;
        console.error('Failed to save preferences:', e);
        const detail = e?.response?.data || e?.message || 'Failed to save preferences.';
        window.alert(`Preferences save failed: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
      }

      // Refresh user and navigate based on completeness
      try {
        const updatedUserResponse = await api.get('/user/me/');
        const usr = updatedUserResponse.data;
        setCurrentUser(usr);
        // Verify that fields we attempted to set were actually persisted
        const normalize = (v) => (v === undefined || v === null || v === '' ? null : v);
        const expected = {
          bio: normalize(profileData.bio),
          date_of_birth: normalize(profileData.date_of_birth),
          gender: normalize(profileData.gender),
          religion: normalize(profileData.religion),
          relationship_intent: normalize(profileData.relationship_intent),
          drinks_alcohol: normalize(profileData.drinks_alcohol),
          smokes: normalize(profileData.smokes),
          country: normalize(profileData.country),
          city: normalize(profileData.city),
        };
        const actual = {
          bio: normalize(usr.bio),
          date_of_birth: normalize(usr.date_of_birth),
          gender: normalize(usr.gender),
          religion: normalize(usr.religion),
          relationship_intent: normalize(usr.relationship_intent),
          drinks_alcohol: normalize(usr.drinks_alcohol),
          smokes: normalize(usr.smokes),
          country: normalize(usr.country),
          city: normalize(usr.city),
        };
        const mismatches = Object.keys(expected)
          .filter((k) => expected[k] !== null) // only check fields the user tried to set
          .filter((k) => expected[k] !== actual[k]);

        const savedOk = mismatches.length === 0;

        if (profileOk && prefsOk && savedOk) {
          setStep(4);
        } else {
          const msg = !savedOk
            ? `Some fields were not saved: ${mismatches.join(', ')}. Please try again.`
            : 'Profile not fully saved. Please try again.';
          console.warn('Profile save verification failed', { expected, actual, mismatches });
          window.alert(msg);
        }
      } catch (e) {
        console.error('Failed to refresh user after saving profile:', e);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReadyForAuth = () => {
    localStorage.setItem('hasOnboarded', 'true');
    setStep(2);
  };

  const handleSendMessage = async (text) => {
    if (!selectedMatch) return;

    const newMessage = { fromMe: true, text: text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };

    const updatedMatches = matches.map(m => m.id === selectedMatch.id ? { ...m, messages: [...(m.messages || []), newMessage] } : m);
    setMatches(updatedMatches);

    try {
      await api.post(`/matches/${selectedMatch.id}/send-message/`, { content: text });
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleSendGift = async (gift) => {
    try {
      // For demo matches, always run locally and never call the backend
      if (selectedMatch?.isMock) {
        const icon = gift.icon || '🎁';
        const anim = gift.animation || 'grow_fade';
        const name = gift.name || 'Gift';
        const giftMessage = `You sent a ${icon} ${name}! (${gift.coins} coins)`;
        handleSendMessage(giftMessage);
        enqueueGiftEffect({ icon, name, type: anim, durationMs: 3000 });
        setShowGift(false);
        return;
      }

      // Attempt to find a real recipient user id from the selected match
      // For our Like-based matches, get the other user (not the current user)
      let recipientId = null;
      
      if (selectedMatch?.liker && selectedMatch?.liked && currentUser) {
        // Determine which user is the recipient (the other user)
        recipientId = selectedMatch.liker.id === currentUser.id 
          ? selectedMatch.liked.id 
          : selectedMatch.liker.id;
      } else {
        // Fallback to other possible field names
        const candidateIds = [
          selectedMatch?.recipient_user_id,
          selectedMatch?.user_id,
          selectedMatch?.userId,
          selectedMatch?.recipient_id,
          selectedMatch?.recipientId,
          selectedMatch?.partner?.id,
        ].filter(Boolean);
        recipientId = candidateIds.length > 0 ? candidateIds[0] : null;
      }
      if (!recipientId) {
        window.alert("Cannot determine recipient. Please open a real match (from backend) to send gifts.");
        return;
      }

      // Call backend to send the gift and get animation metadata
      const res = await sendGift(recipientId, gift.id);
      const icon = res?.gift_icon || gift.icon || "🎁";
      const anim = res?.gift_animation_type || gift.animation || "grow_fade";
      const name = res?.gift_name || gift.name;

      // Append a friendly confirmation message locally in the chat
      const giftMessage = `You sent a ${icon} ${name}! (${gift.coins} coins)`;
      handleSendMessage(giftMessage);

      // Enqueue visual effect in overlay (2.5s to 4s)
      enqueueGiftEffect({
        icon,
        name,
        type: anim,
        durationMs: 3000,
      });

      // Close the gift modal
      setShowGift(false);
    } catch (err) {
      console.error("Failed to send gift:", err);
      const detail = err?.response?.data?.detail || "Failed to send gift. Please check your coin balance and try again.";
      window.alert(detail);
    }
  };

  const enqueueGiftEffect = ({ icon = "🎁", name = "Gift", type = "grow_fade", durationMs = 3000 }) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    setGiftEffects((prev) => [...prev, { id, icon, name, type, durationMs }]);
    if (giftSoundsEnabled) {
      playGiftSound(type);
    }
    // Safety cleanup
    setTimeout(() => {
      setGiftEffects((prev) => prev.filter((e) => e.id !== id));
    }, durationMs + 200);
  };

  const handleEffectDone = (id) => {
    setGiftEffects((prev) => prev.filter((e) => e.id !== id));
  };

  const playGiftSound = (type) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      // Map simple tones per type
      const map = {
        envelope_fly: 523.25, // C5
        rose_bloom: 392.00,   // G4
        chocolate_hearts: 329.63, // E4
        teddy_wave: 261.63,   // C4
        music_notes: 659.25,  // E5
        wine_clink: 880.00,   // A5
        roses_rain: 493.88,   // B4
        photo_frame: 349.23,  // F4
        kiss_blow: 784.00,    // G5
        perfume_spray: 587.33,// D5
        ring_sparkle: 987.77, // B5
        plane_hearts: 440.00, // A4
        car_hearts: 277.18,   // C#4
        home_glow: 415.30,    // G#4
        grow_fade: 523.25,
      };
      const freq = map[type] || 523.25;
      o.frequency.value = freq;
      o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      o.start();
      o.stop(ctx.currentTime + 0.3);
      setTimeout(() => ctx.close(), 400);
    } catch (_) {}
  };

  const renderContent = () => {
    if (step === 0 || isLoading) {
      return <SplashScreen />;
    }
    
    // Debug: Add console log to see what step we're in
    console.log('Current step:', step, 'Nav:', nav, 'Auth token:', !!authToken, 'Current user:', !!currentUser);

    const signupPage = (
      <div className="min-h-screen flex flex-col">
        <div className="flex-grow">
          <Signup onLogin={() => setShowLogin(true)} onContinue={(user, token) => handleAuthentication(user, token, true)} />
        </div>
      </div>
    );

    switch (step) {
      case 1:
        return <Onboarding onFinish={handleReadyForAuth} />;
      case 2:
        return signupPage;
      case 3:
        if (!authToken) {
          return <div className="flex items-center justify-center h-full"><FiLoader className="animate-spin text-4xl text-primary" /></div>;
        }
        return <ProfileSetup currentUser={currentUser} authToken={authToken} onFinish={handleProfileSetupFinish} />;
      case 4:
        return (
          <div className="flex flex-col">
            <div className="flex-1 min-h-0">
              {nav === "home" && <HomeSwiping onMatch={() => setStep(5)} onGift={() => setShowGift(true)} onChatToggle={setIsChatOpen} />}
              {nav === "matches" && <EnhancedMatches onChat={match => { setSelectedMatch(match); setStep(5); }} onNavigate={setNav} />}
              {nav === "purchase" && <PurchasePage currentUser={currentUser} onNavigate={setNav} />}
              {nav === "buy-coins" && <BuyCoinsPage onBack={() => setNav('purchase')} />}
              {nav === "purchase-success" && <PurchaseSuccess onNavigate={setNav} onUserRefresh={(u) => setCurrentUser(u)} />}
              {nav === "profile" && <Profile user={currentUser} onSave={handleProfileSave} />}
              {nav === "settings" && (
                <Settings
                  onLogout={handleLogout}
                  onUpgrade={() => setShowUpgrade(true)}
                  isDark={isDark}
                  onToggleDark={() => setIsDark(d => !d)}
                  giftSoundsEnabled={giftSoundsEnabled}
                  onToggleGiftSounds={() => setGiftSoundsEnabled(v => !v)}
                  onRerunSetup={() => setStep(3)}
                />
              )}
            </div>
            {/* Spacer to ensure content clears the fixed NavigationBar */}
            {!isChatOpen && <div className="h-28 md:h-32" aria-hidden="true" />}
            {!isChatOpen && <NavigationBar current={nav} onNavigate={setNav} />}
          </div>
        );
      case 5:
        return (
          <div className="flex flex-col h-full">
            <Chat
              match={selectedMatch}
              onBack={() => setStep(4)}
              onGift={() => setShowGift(true)}
              onSendMessage={handleSendMessage}
              effects={giftEffects}
              onEffectDone={handleEffectDone}
            />
          </div>
        );
      default:
        console.log('Unknown step, showing signup page');
        return signupPage;
    }
  };

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <div className={`bg-white dark:bg-gray-900 transition-colors duration-300 flex flex-col min-h-screen`}>
        {showLogin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg max-w-md w-full max-h-full overflow-y-auto">
              <Login onSignup={() => setShowLogin(false)} onContinue={(user, token) => handleAuthentication(user, token, false)} />
              <button onClick={() => setShowLogin(false)} className="mt-4 w-full text-center text-gray-500 dark:text-gray-400 hover:underline">Close</button>
            </div>
          </div>
        )}
        <main className={`flex-grow min-h-0 ${step >= 4 ? 'overflow-visible pb-40' : 'overflow-y-auto'}`}>{renderContent()}</main>
        {showGift && <GiftStore onClose={() => setShowGift(false)} onSend={handleSendGift} />}
        {showUpgrade && <Upgrade onClose={() => setShowUpgrade(false)} />}
        
        {/* Real-time notifications */}
        {/* {authToken && (
          <NotificationSystem 
            authToken={authToken}
            onMatchNotification={(match) => {
              // Handle match notification - could show confetti or navigate
              console.log('New match:', match);
            }}
            onMessageNotification={(data) => {
              // Handle message notification - could update unread count
              console.log('New message:', data);
            }}
          />
        )} */}
        
        {authToken && (
          <>
            <button onClick={() => setIsChatbotOpen(true)} className="fixed bottom-5 right-5 bg-fuchsia-600 text-white p-4 rounded-full shadow-lg hover:bg-fuchsia-700 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 z-40">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            </button>
            {isChatbotOpen && <Chatbot authToken={authToken} onClose={() => setIsChatbotOpen(false)} />}
          </>
        )}
      </div>
    </GoogleOAuthProvider>
  );
}