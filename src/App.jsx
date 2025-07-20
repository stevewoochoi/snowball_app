import React, { useState, useEffect } from "react";
import Login from "./Login";
import MainPage from "./MapWithSpots";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const uid = localStorage.getItem("snowball_uid");
    const nick = localStorage.getItem("snowball_nickname");
    if (uid && nick) setUser({id: uid, nickname: nick});
  }, []);

  if (!user) {
    return <Login onLogin={setUser} />;
  }
  return <MainPage user={user} />;
}

export default App;