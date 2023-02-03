import React from "react";
import { useAuth0 } from "@auth0/auth0-react";

export default function LoginDlg({ onNoLogin }: { onNoLogin: () => void }) {
  const { loginWithRedirect /*logout, isAuthenticated */ } = useAuth0();
  return (
    <div>
      <a href="#" onClick={loginWithRedirect}>
        Log In
      </a>
    </div>
  );
}
