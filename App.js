import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, doc, onSnapshot, setDoc, getDoc, deleteDoc, enableIndexedDbPersistence, getDocs } from 'firebase/firestore';


// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyDo0Nk4XmlSMI92X4bcEXB8tc2Yrmogpbc",
  authDomain: "turf-booking-e55f3.firebaseapp.com",
  projectId: "turf-booking-e55f3",
  storageBucket: "turf-booking-e55f3.appspot.com",
  messagingSenderId: "421268735649",
  appId: "1:421268735649:web:7ff9581dcf66a1000d52e0",
  measurementId: "G-0HP42C21C1"
};

// --- Firebase Initialization ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Enable Firestore Offline Persistence ---
try {
    enableIndexedDbPersistence(db);
} catch (err) {
    if (err.code === 'failed-precondition') {
        console.warn('Firestore persistence failed: Multiple tabs open.');
    } else if (err.code === 'unimplemented') {
        console.warn('Firestore persistence failed: Browser does not support persistence.');
    }
}

// --- Landing Page Component (from your HTML/CSS) ---
function LandingPage({ onLoginClick }) {
    const [selectedSport, setSelectedSport] = useState("");
    const [selectedArea, setSelectedArea] = useState("");
    const [selectedPrice, setSelectedPrice] = useState("");
    const [recommendedTurfs, setRecommendedTurfs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleRecommend = async () => {
        if (!selectedSport || !selectedArea || !selectedPrice) {
            alert("Please select a value from all three dropdowns.");
            return;
        }
        setIsLoading(true);
        setSearched(true);
        setRecommendedTurfs([]); // Clear previous results

        try {
            // Fetch all turfs from the database. This avoids complex queries that require custom indexes.
            const turfsCollectionRef = collection(db, "turfs");
            const querySnapshot = await getDocs(turfsCollectionRef);
            const allTurfs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Now, filter the results on the client-side based on user selection.
            const [minPrice, maxPrice] = selectedPrice.split('-').map(Number);

            const filteredTurfs = allTurfs.filter(turf => {
                const sportMatch = turf.sport === selectedSport;
                const areaMatch = turf.location === selectedArea;
                
                let priceMatch = false;
                if (!isNaN(minPrice) && !isNaN(maxPrice)) {
                    priceMatch = turf.pricing >= minPrice && turf.pricing <= maxPrice;
                }

                return sportMatch && areaMatch && priceMatch;
            });

            setRecommendedTurfs(filteredTurfs);
        } catch (error) {
            console.error("Error fetching recommendations:", error);
            if (error.code === 'permission-denied') {
                 alert("Permission denied. Please ensure you have updated the Firestore security rules in your Firebase project as per the instructions in the code.");
            } else {
                alert("An error occurred while fetching turfs. Please check the console for details.");
            }
        }
        setIsLoading(false);
    };

    return (
        <>
            <style>{`
                /* ... (styles remain the same) ... */
                @import url('https://fonts.googleapis.com/css2?family=Almendra:ital,wght@0,400;0,700;1,400;1,700&display=swap');
                @import url('https://fonts.googleapis.com/css2?family=Lobster&display=swap');
                @import url('https://fonts.googleapis.com/css2?family=Tangerine:wght@400;700&display=swap');
                
                body, html { background-color: black; color: white; }
                .landing-nav { display: flex; justify-content: space-between; align-items: center; padding: 20px 40px; background-color: black; }
                .landing-brand { font-size: 30px; font-weight: bold; color: #00ffcc; font-family: "Lobster", sans-serif; }
                .landing-nav-right { display: flex; align-items: center; gap: 20px; }
                .landing-login-btn { background-color: transparent; border: 2px solid #00ffcc; color: #00ffcc; padding: 4px 12px; border-radius: 5px; cursor: pointer; transition: all 0.3s ease; font-family: "Tangerine", cursive; font-size: 25px; }
                .landing-login-btn:hover { background-color: #00ffcc; color: black; font-size: 30px; }
                .landing-main { display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 4rem 1rem; text-align: center; margin-top: 5vh; }
                .landing-text p { color: aliceblue; font-size: 35px; font-weight: bold; font-family: "Almendra", serif; font-style: italic; }
                .landing-text p:hover { text-decoration: underline; text-decoration-color: #00ffcc; text-underline-offset: 5px; transition: all 0.1s ease; }
                .landing-dropdown-group { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; margin-top: 2rem; gap: 20px; }
                .landing-select { color: aliceblue; background-color: black; border: 1px solid white; padding: 10px; font-size: 15px; font-family: 'Times New Roman', Times, serif; width: 200px; border-radius: 8px; cursor: pointer; transition: border 0.4s ease, box-shadow 0.4s ease; }
                .landing-select:hover { border: 3px solid #00ffcc; box-shadow: 0 0 10px #00ffcc, 0 0 20px #00ffcc; }
                .recommend-btn { background-color: #00ffcc; color: black; border: none; padding: 12px 24px; font-size: 18px; font-weight: bold; border-radius: 8px; cursor: pointer; margin-top: 2rem; transition: transform 0.2s ease; }
                .recommend-btn:hover { transform: scale(1.05); }
                .recommendations-section { margin-top: 3rem; width: 100%; max-width: 1200px; }
                .recommendations-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; color: black; }
                .turf-card { background-color: white; padding: 1.5rem; border-radius: 8px; text-align: left; }
                .turf-card h3 { font-size: 1.25rem; font-weight: bold; }
            `}</style>
            <nav className="landing-nav">
                <div className="landing-brand">Turfoholics</div>
                <div className="landing-nav-right">
                    <button className="landing-login-btn" onClick={onLoginClick}>Login</button>
                </div>
            </nav>
            <div className="landing-main">
                <div className="landing-text">
                    <p>Turf.Train.Triumph</p>
                </div>
                <div className="landing-dropdown-group">
                    <select className="landing-select" value={selectedPrice} onChange={e => setSelectedPrice(e.target.value)}>
                        <option value="" disabled>Select Price Range</option>
                        <option value="0-500">Under ₹500</option>
                        <option value="0-1000">Under ₹1000</option>
                        <option value="0-1500">Under ₹1500</option>
                        <option value="1500-99999">₹1500+</option>
                    </select>
                    <select className="landing-select" value={selectedSport} onChange={e => setSelectedSport(e.target.value)}>
                        <option value="" disabled>Select Sport</option>
                        <option value="Football">Football</option>
                        <option value="Cricket">Cricket</option>
                        <option value="Pickleball">Pickleball</option>
                        <option value="Badminton">Badminton</option>
                    </select>
                    <select className="landing-select" value={selectedArea} onChange={e => setSelectedArea(e.target.value)}>
                        <option value="" disabled>Select Area</option>
                        <option value="Mumbai">Mumbai</option>
                        <option value="Thane">Thane</option>
                        <option value="Navi Mumbai">Navi Mumbai</option>
                        <option value="Pune">Pune</option>
                        <option value="Nagpur">Nagpur</option>
                    </select>
                </div>
                <button className="recommend-btn" onClick={handleRecommend} disabled={isLoading}>
                    {isLoading ? 'Searching...' : 'Recommend'}
                </button>

                {searched && (
                    <div className="recommendations-section">
                        {isLoading ? (
                            <p>Finding the best turfs for you...</p>
                        ) : recommendedTurfs.length > 0 ? (
                            <div className="recommendations-grid">
                                {recommendedTurfs.map(turf => (
                                    <div key={turf.id} className="turf-card">
                                        <h3>{turf.name}</h3>
                                        <p className="text-gray-600">{turf.location}</p>
                                        <p className="font-bold text-gray-800">₹{turf.pricing} / hour</p>
                                        <p className="text-blue-600 font-semibold">Sport: {turf.sport}</p>
                                        <button onClick={onLoginClick} className="mt-4 w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600">Login to Book</button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p>No turfs found matching your criteria. Try different options!</p>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

// --- Main App Component ---
export default function App() {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthModalOpen, setAuthModalOpen] = useState(false);

    useEffect(() => {
        let userRoleListener = null;
        const authStateListener = onAuthStateChanged(auth, (currentUser) => {
            if (userRoleListener) userRoleListener();

            if (currentUser) {
                setUser(currentUser);
                setAuthModalOpen(false); // Close modal on successful login
                const userDocRef = doc(db, "users", currentUser.uid);
                userRoleListener = onSnapshot(userDocRef, (docSnap) => {
                    if (docSnap.exists()) setUserRole(docSnap.data().role);
                    else setUserRole(null);
                    setLoading(false);
                }, (error) => {
                    console.error("Error listening to user role:", error);
                    setUserRole(null);
                    setLoading(false);
                });
            } else {
                setUser(null);
                setUserRole(null);
                setLoading(false);
            }
        });
        return () => {
            authStateListener();
            if (userRoleListener) userRoleListener();
        };
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
        setUser(null);
        setUserRole(null);
    };

    if (loading) {
        return <div className="flex items-center justify-center h-screen bg-black text-white"><div className="text-xl font-semibold">Loading...</div></div>;
    }

    // Main App Logic: Show dashboard if logged in, otherwise show landing page
    if (user && userRole) {
        return userRole === 'admin' ? <AdminDashboard user={user} onLogout={handleLogout} /> : <PlayerDashboard user={user} onLogout={handleLogout} />;
    }

    return (
        <div className="bg-black min-h-screen">
            <LandingPage onLoginClick={() => setAuthModalOpen(true)} />
            {isAuthModalOpen && (
                <AuthModal onClose={() => setAuthModalOpen(false)}>
                    <AuthScreen setUserRole={setUserRole} />
                </AuthModal>
            )}
        </div>
    );
}

// --- Auth Modal Component ---
function AuthModal({ children, onClose }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="relative bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-black">
                <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl font-bold">&times;</button>
                {children}
            </div>
        </div>
    );
}

// --- Authentication Screen (inside modal) ---
function AuthScreen({ setUserRole }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('player');
    const [error, setError] = useState('');

    const handleAuthAction = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                await setDoc(doc(db, "users", user.uid), { email: user.email, role: role });
                setUserRole(role);
            }
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">{isLogin ? 'Login' : 'Sign Up'}</h2>
            {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</p>}
            <form onSubmit={handleAuthAction}>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">Email</label>
                    <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
                </div>
                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">Password</label>
                    <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" required />
                </div>
                {!isLogin && (
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Register as:</label>
                        <select value={role} onChange={(e) => setRole(e.target.value)} className="shadow border rounded w-full py-2 px-3 text-gray-700">
                            <option value="player">Player</option>
                            <option value="admin">Turf Owner (Admin)</option>
                        </select>
                    </div>
                )}
                <div className="flex items-center justify-between">
                    <button type="submit" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">{isLogin ? 'Login' : 'Sign Up'}</button>
                    <button type="button" onClick={() => setIsLogin(!isLogin)} className="inline-block align-baseline font-bold text-sm text-green-500 hover:text-green-800">{isLogin ? 'Need an account? Sign Up' : 'Have an account? Login'}</button>
                </div>
            </form>
        </div>
    );
}


// --- App Navigation for Dashboards ---
function AppNav({ user, userRole, onLogout }) {
    return (
        <nav className="bg-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" viewBox="0 0 20 20" fill="currentColor"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM4 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 10zM7 6a.75.75 0 01.75-.75h4.5a.75.75 0 010 1.5h-4.5A.75.75 0 017 6zm-2 8a.75.75 0 01.75-.75h8.5a.75.75 0 010 1.5H5.75a.75.75 0 01-.75-.75z" /></svg>
                        <span className="font-bold text-2xl ml-2 text-gray-800">Turfoholics</span>
                    </div>
                    {user && (
                        <div className="flex items-center">
                            <span className="text-gray-600 mr-4">Welcome, {user.email} ({userRole})</span>
                            <button onClick={onLogout} className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600">Logout</button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}

// --- Admin Dashboard ---
function AdminDashboard({ user, onLogout }) {
    const [turfs, setTurfs] = useState([]);
    const [view, setView] = useState('turfs');
    const [selectedTurf, setSelectedTurf] = useState(null);

    useEffect(() => {
        const q = query(collection(db, "turfs"), where("ownerId", "==", user.uid));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const turfsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTurfs(turfsData);
        });
        return () => unsubscribe();
    }, [user.uid]);

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-black">
            <AppNav user={user} userRole="admin" onLogout={onLogout} />
            <main className="p-4 sm:p-6 lg:p-8">
                 <div className="flex space-x-4 mb-6 border-b pb-2">
                    <button onClick={() => setView('turfs')} className={`px-4 py-2 rounded-md ${view === 'turfs' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>My Turfs</button>
                    <button onClick={() => setView('add_turf')} className={`px-4 py-2 rounded-md ${view === 'add_turf' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>Add New Turf</button>
                    <button onClick={() => setView('calendar')} disabled={!turfs.length} className={`px-4 py-2 rounded-md ${view === 'calendar' ? 'bg-green-600 text-white' : 'bg-gray-200'} disabled:bg-gray-400`}>Booking Calendar</button>
                </div>
                {view === 'turfs' && <TurfList turfs={turfs} onSelectTurf={(turf) => { setSelectedTurf(turf); setView('calendar'); }} />}
                {view === 'add_turf' && <TurfForm onSubmit={() => setView('turfs')} onCancel={() => setView('turfs')} user={user} />}
                {view === 'calendar' && (
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Booking Calendar</h2>
                        <select value={selectedTurf?.id || ''} onChange={(e) => setSelectedTurf(turfs.find(t => t.id === e.target.value))} className="shadow border rounded w-full md:w-1/3 py-2 px-3 text-gray-700 mb-4">
                            <option value="" disabled>-- Select a Turf --</option>
                            {turfs.map(turf => <option key={turf.id} value={turf.id}>{turf.name}</option>)}
                        </select>
                        {selectedTurf ? <BookingCalendar turf={selectedTurf} isAdmin={true} /> : <p>Please select a turf to view its calendar.</p>}
                    </div>
                )}
            </main>
        </div>
    );
}

function TurfList({ turfs, onSelectTurf }) {
    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">My Turfs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {turfs.map(turf => (
                    <div key={turf.id} className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold mb-2">{turf.name}</h3>
                        <p className="text-gray-600 mb-2">{turf.location}</p>
                        <p className="text-gray-800 font-bold mb-2">₹{turf.pricing} / hour</p>
                        <p className="text-gray-600 font-medium text-blue-600 mb-2">Sport: {turf.sport}</p>
                        <p className="text-gray-600">Hours: {turf.availableHours.start}:00 - {turf.availableHours.end}:00</p>
                        <button onClick={() => onSelectTurf(turf)} className="mt-4 w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600">View Calendar</button>
                    </div>
                ))}
                {turfs.length === 0 && <p>You haven't added any turfs yet.</p>}
            </div>
        </div>
    );
}

function TurfForm({ onSubmit, onCancel, user }) {
    const [name, setName] = useState('');
    const [location, setLocation] = useState('Mumbai');
    const [pricing, setPricing] = useState('');
    const [sport, setSport] = useState('Football');
    const [startHour, setStartHour] = useState(9);
    const [endHour, setEndHour] = useState(21);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, "turfs"), {
                name, 
                location, 
                pricing: Number(pricing),
                sport,
                availableHours: { start: Number(startHour), end: Number(endHour) },
                ownerId: user.uid,
            });
            onSubmit();
        } catch (error) {
            console.error("Error adding turf:", error);
            alert("Failed to add turf. Please check your Firestore security rules and try again.");
        }
    };

    return (
        <div className="max-w-lg mx-auto bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6">Add a New Turf</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-4"><label className="block text-gray-700">Turf Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded" required /></div>
                <div className="mb-4">
                    <label className="block text-gray-700">Area</label>
                    <select value={location} onChange={e => setLocation(e.target.value)} className="w-full p-2 border rounded">
                        <option value="Mumbai">Mumbai</option>
                        <option value="Thane">Thane</option>
                        <option value="Navi Mumbai">Navi Mumbai</option>
                        <option value="Pune">Pune</option>
                        <option value="Nagpur">Nagpur</option>
                    </select>
                </div>
                <div className="mb-4"><label className="block text-gray-700">Pricing (per hour)</label><input type="number" value={pricing} onChange={e => setPricing(e.target.value)} className="w-full p-2 border rounded" required /></div>
                <div className="mb-4">
                    <label className="block text-gray-700">Sport</label>
                    <select value={sport} onChange={e => setSport(e.target.value)} className="w-full p-2 border rounded">
                        <option value="Football">Football</option>
                        <option value="Cricket">Cricket</option>
                        <option value="Pickleball">Pickleball</option>
                        <option value="Badminton">Badminton</option>
                    </select>
                </div>
                <div className="mb-4 grid grid-cols-2 gap-4"><div><label className="block text-gray-700">Opening Hour</label><input type="number" min="0" max="23" value={startHour} onChange={e => setStartHour(e.target.value)} className="w-full p-2 border rounded" required /></div><div><label className="block text-gray-700">Closing Hour</label><input type="number" min="1" max="24" value={endHour} onChange={e => setEndHour(e.target.value)} className="w-full p-2 border rounded" required /></div></div>
                <div className="flex justify-end space-x-4">
                    <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-300 rounded-md">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded-md">Add Turf</button>
                </div>
            </form>
        </div>
    );
}

// --- Player Dashboard ---
function PlayerDashboard({ user, onLogout }) {
    const [turfs, setTurfs] = useState([]);
    const [view, setView] = useState('turfs');
    const [selectedTurf, setSelectedTurf] = useState(null);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "turfs"), (querySnapshot) => {
            const turfsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTurfs(turfsData);
            if (!selectedTurf && turfsData.length > 0) setSelectedTurf(turfsData[0]);
        });
        return () => unsubscribe();
    }, [selectedTurf]);

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-black">
            <AppNav user={user} userRole="player" onLogout={onLogout} />
            <main className="p-4 sm:p-6 lg:p-8">
                <div className="flex space-x-4 mb-6 border-b pb-2">
                    <button onClick={() => setView('turfs')} className={`px-4 py-2 rounded-md ${view === 'turfs' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>Available Turfs</button>
                    <button onClick={() => setView('bookings')} className={`px-4 py-2 rounded-md ${view === 'bookings' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>My Bookings</button>
                    <button onClick={() => setView('calendar')} disabled={!turfs.length} className={`px-4 py-2 rounded-md ${view === 'calendar' ? 'bg-green-600 text-white' : 'bg-gray-200'} disabled:bg-gray-400`}>Book a Slot</button>
                </div>
                {view === 'turfs' && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{turfs.map(turf => (<div key={turf.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl"><h3 className="text-xl font-semibold mb-2">{turf.name}</h3><p className="text-gray-600 mb-2">{turf.location}</p><p className="text-gray-800 font-bold mb-2">₹{turf.pricing} / hour</p><p className="text-gray-600 font-medium text-blue-600 mb-2">Sport: {turf.sport}</p><p className="text-gray-600">Hours: {turf.availableHours.start}:00 - {turf.availableHours.end}:00</p><button onClick={() => { setSelectedTurf(turf); setView('calendar'); }} className="mt-4 w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600">Book Now</button></div>))}</div>}
                {view === 'bookings' && <MyBookings user={user} />}
                {view === 'calendar' && (
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Book a Time Slot</h2>
                        <select value={selectedTurf?.id || ''} onChange={(e) => setSelectedTurf(turfs.find(t => t.id === e.target.value))} className="shadow border rounded w-full md:w-1/3 py-2 px-3 text-gray-700 mb-4">
                            {turfs.map(turf => <option key={turf.id} value={turf.id}>{turf.name}</option>)}
                        </select>
                        {selectedTurf ? <BookingCalendar turf={selectedTurf} user={user} isAdmin={false} /> : <p>Loading turfs...</p>}
                    </div>
                )}
            </main>
        </div>
    );
}

// --- My Bookings (for Player) ---
function MyBookings({ user }) {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "bookings"), where("userId", "==", user.uid));
        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
            const bookingsData = await Promise.all(querySnapshot.docs.map(async (docSnap) => {
                const booking = { id: docSnap.id, ...docSnap.data() };
                const turfDoc = await getDoc(doc(db, "turfs", booking.turfId));
                booking.turfName = turfDoc.exists() ? turfDoc.data().name : 'Unknown Turf';
                return booking;
            }));
            bookingsData.sort((a,b) => a.startTime.toMillis() - b.startTime.toMillis());
            setBookings(bookingsData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user.uid]);
    
    const handleCancelBooking = async (bookingId) => {
        // Using a simple confirm dialog for now. A custom modal would be better for UX.
        if (window.confirm("Are you sure you want to cancel this booking?")) {
            await deleteDoc(doc(db, "bookings", bookingId));
        }
    }

    if (loading) return <p>Loading your bookings...</p>;

    const upcomingBookings = bookings.filter(b => b.startTime.toDate() > new Date());
    const pastBookings = bookings.filter(b => b.startTime.toDate() <= new Date());

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold mb-4">Upcoming Bookings</h2>
                {upcomingBookings.length > 0 ? (<div className="bg-white p-4 rounded-lg shadow-md space-y-4">{upcomingBookings.map(b => <div key={b.id} className="flex justify-between items-center p-4 border rounded-lg"><div><p className="font-semibold text-lg">{b.turfName}</p><p className="text-gray-600">{b.startTime.toDate().toLocaleString()}</p></div><button onClick={() => handleCancelBooking(b.id)} className="px-3 py-1 bg-red-500 text-white rounded-md">Cancel</button></div>)}</div>) : <p>You have no upcoming bookings.</p>}
            </div>
            <div>
                <h2 className="text-2xl font-bold mb-4">Past Bookings</h2>
                {pastBookings.length > 0 ? (<div className="bg-white p-4 rounded-lg shadow-md space-y-4">{pastBookings.map(b => <div key={b.id} className="p-4 border rounded-lg bg-gray-50 opacity-70"><p className="font-semibold text-lg">{b.turfName}</p><p className="text-gray-600">{b.startTime.toDate().toLocaleString()}</p></div>)}</div>) : <p>You have no past bookings.</p>}
            </div>
        </div>
    );
}

// --- Booking Calendar (Shared Component) ---
function BookingCalendar({ turf, user, isAdmin }) {
    const [date, setDate] = useState(new Date());
    const [bookings, setBookings] = useState([]);

    useEffect(() => {
        if (!turf) return;

        // Query only by turfId to avoid needing a composite index.
        const q = query(collection(db, "bookings"), where("turfId", "==", turf.id));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const allBookingsForTurf = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Perform date filtering on the client side.
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            const dailyBookings = allBookingsForTurf.filter(booking => {
                const bookingTime = booking.startTime.toDate();
                return bookingTime >= startOfDay && bookingTime <= endOfDay;
            });

            setBookings(dailyBookings);
        }, (error) => {
            console.error("Error fetching bookings:", error);
        });
        
        return () => unsubscribe();
    }, [date, turf]);

    const handleBooking = async (slot) => {
        const message = isAdmin ? `Block slot for maintenance? ${slot.toLocaleString()}` : `Confirm booking for ${turf.name} at ${slot.toLocaleString()}?`;
        if (window.confirm(message)) {
            await addDoc(collection(db, "bookings"), {
                turfId: turf.id,
                userId: isAdmin ? 'admin_blocked' : user.uid,
                startTime: slot,
                status: isAdmin ? 'blocked' : 'confirmed',
            });
            if (!isAdmin) alert('Booking successful!');
        }
    };
    
    const handleUnblock = async (bookingId) => {
        if (window.confirm("Are you sure you want to unblock this slot?")) {
            await deleteDoc(doc(db, "bookings", bookingId));
        }
    }

    const renderTimeSlots = () => {
        const slots = [];
        const { start, end } = turf.availableHours;

        for (let hour = start; hour < end; hour++) {
            const slotTime = new Date(date); slotTime.setHours(hour, 0, 0, 0);
            const booking = bookings.find(b => b.startTime.toDate().getHours() === hour);
            const isPast = slotTime < new Date();

            let slotClass = 'p-4 rounded-lg text-center transition-colors';
            let action = null;
            let text = `${hour}:00 - ${hour + 1}:00`;

            if (isPast) {
                slotClass += ' bg-gray-200 text-gray-400 cursor-not-allowed';
            } else if (booking) {
                if (booking.status === 'blocked') {
                    slotClass += ' bg-yellow-400 text-yellow-900';
                    text += ' (Maintenance)';
                    if (isAdmin) {
                        slotClass += ' cursor-pointer hover:bg-yellow-500';
                        action = () => handleUnblock(booking.id);
                    } else {
                        slotClass += ' cursor-not-allowed';
                    }
                } else {
                    slotClass += ' bg-red-400 text-red-900 cursor-not-allowed';
                    text += ' (Booked)';
                }
            } else {
                slotClass += ' bg-green-200 hover:bg-green-400 cursor-pointer';
                action = () => handleBooking(slotTime);
            }

            slots.push(<div key={hour} onClick={action} className={slotClass}>{text}</div>);
        }
        return slots;
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => setDate(d => new Date(d.setDate(d.getDate() - 1)))} className="px-4 py-2 bg-gray-300 rounded-md">&lt; Prev</button>
                <h3 className="text-xl font-semibold">{date.toDateString()}</h3>
                <button onClick={() => setDate(d => new Date(d.setDate(d.getDate() + 1)))} className="px-4 py-2 bg-gray-300 rounded-md">Next &gt;</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">{renderTimeSlots()}</div>
        </div>
    );
}
