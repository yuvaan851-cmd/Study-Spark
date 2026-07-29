import React, { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import Auth from "./components/Auth";
import StudyBuddyApp from "./StudyBuddy";

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ background: "#14181F", color: "#F1EEE6", minHeight: "100vh" }} className="flex items-center justify-center">
        <span style={{ fontFamily: "system-ui, sans-serif" }}>Loading…</span>
      </div>
    );
  }

  if (!session) return <Auth />;

  return <StudyBuddyApp session={session} />;
}
