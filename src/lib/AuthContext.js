import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { useState, createContext, useEffect, useContext } from "react";
import { provider, auth } from "./firebase";
import axiosInstance from "./axiosinstance";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true); // ⭐ FIX 1

  const login = (userdata) => {
    setUser(userdata);
    localStorage.setItem("user", JSON.stringify(userdata));
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem("user");
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  };

  const handlegooglesignin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseuser = result.user;

      const payload = {
        email: firebaseuser.email,
        name: firebaseuser.displayName,
        image: firebaseuser.photoURL || "https://github.com/shadcn.png",
      };

      const response = await axiosInstance.post("/user/login", payload);
      login(response.data.result);
    } catch (error) {
      console.error(error);
    }
  };

 useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (firebaseuser) => {
    // Only set user state, DO NOT AUTO-LOGIN
    if (firebaseuser && !user) {
      setUser({
        email: firebaseuser.email,
        name: firebaseuser.displayName,
        image: firebaseuser.photoURL || "https://github.com/shadcn.png",
      });

      localStorage.setItem(
        "user",
        JSON.stringify({
          email: firebaseuser.email,
          name: firebaseuser.displayName,
          image: firebaseuser.photoURL || "https://github.com/shadcn.png",
        })
      );
    }
  });

  return () => unsubscribe();
}, []);


  return (
    <UserContext.Provider
      value={{ user, login, logout, handlegooglesignin, authLoading }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);