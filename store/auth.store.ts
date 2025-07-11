import { create } from 'zustand';
import {User} from "@/type";
import {isLoading} from "expo-font";
import {tryCatchExample} from "@sentry/react-native/dist/js/playground/examples";
import {getCurrentUser} from "@/lib/appwrite";

type AuthState = {
    isAuthenticated: boolean;
    user: User | null;
    isLoading: boolean;

    setIsAuthenticated: (value: boolean) => void;
    setUser: (user: User | null) => void;
    setIsLoading: (loading: boolean) => void;

    fetchAuthenticatedUser: () => Promise<void>;
}

const useAuthStore = create<AuthState>((set) => ({
   isAuthenticated: false,
   user: null,
    isLoading: true,

    setIsAuthenticated: (value) => set({isAuthenticated: value}),
    setUser: (user) => set({user}),
    setIsLoading: (value) => set({isLoading: value}),

    fetchAuthenticatedUser: async () => {
       set({isLoading: true});

       try{
            const user = await getCurrentUser();

            if(user) set({isAuthenticated: true, user: user as User})
            else set({isAuthenticated: false, user: null});
       }catch(e){
           console.log("fetchAuthenticatedUser error", e);
           set({isAuthenticated: false, user: null});
       }finally {
           set({isLoading: false});
       }
    }
}))

export default useAuthStore;