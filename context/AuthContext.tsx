import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
// import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

type AuthContextType = {
    session: Session | null;
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    loading: true,
    signInWithGoogle: async () => { },
    signOut: async () => { },
});

// Configure Google Signin
// try {
//     GoogleSignin.configure({
//         // Retrieve from your Google Cloud Console (OAuth 2.0 Client ID for Web application)
//         webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
//         // Usually for mobile, Supabase handles redirection or we pass idToken
//         scopes: ['email', 'profile'],
//     });
// } catch (e) {
//     console.warn("Google Sign-In configuration failed (likely running in Expo Go without native module):", e);
// }

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch existing session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        alert("Google Sign-In requires a Development Build (native code). Please use Email/Password for now in Expo Go.");
        /*
        try {
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();
            
            if (userInfo.data?.idToken) {
                const { data, error } = await supabase.auth.signInWithIdToken({
                    provider: 'google',
                    token: userInfo.data.idToken,
                });
                
                if (error) {
                    throw error;
                }
            } else {
                throw new Error('No ID token present!');
            }
        } catch (error: any) {
             if (error.message?.includes("RNGoogleSignin")) {
                alert("Google Sign-In requires a Development Build. Please use Email/Password in Expo Go.");
                return;
            }

            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                // user cancelled the login flow
            } else if (error.code === statusCodes.IN_PROGRESS) {
                // operation (e.g. sign in) is in progress already
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                // play services not available or outdated
            } else {
                // some other error happened
                console.error(error);
                alert("Google Sign-In Error: " + (error.message || "Unknown error"));
            }
        }
        */
    };

    const signOut = async () => {
        /*
        try {
            await GoogleSignin.signOut(); // If signed in with Google
        } catch (e) {
             // Ignore if not signed in with google or module missing
        }
        */
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider
            value={{
                session,
                user: session?.user ?? null,
                loading,
                signInWithGoogle,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
