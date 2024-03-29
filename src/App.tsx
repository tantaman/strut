import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignIn,
  SignUp,
} from "@clerk/clerk-react";
import {
  BrowserRouter,
  Route,
  Routes,
  useNavigate,
  Link,
} from "react-router-dom";
import Dashboard from "./Dashboard";
import Editor from "./components/editor/Editor";
// @ts-ignore
import FPSStats from "react-fps-stats";

import "styles/markdown/markdown-reset.css";
import "styles/mobile.css";

import "styles/markdown/colors/hook.css";
import "styles/markdown/structures/structures.css";
import "styles/markdown/fonts/fonts.css";

const clerkPubKey = import.meta.env.VITE_REACT_APP_CLERK_PUBLISHABLE_KEY;

function LandingPage() {
  return (
    <div>
      <h1>Landing</h1>
      <Link to="/sign-up">Sign up</Link> | <Link to="/sign-in">Sign in</Link>
    </div>
  );
}

function ClerkProviderWithRoutes() {
  const navigate = useNavigate();

  return (
    <ClerkProvider publishableKey={clerkPubKey} navigate={(to) => navigate(to)}>
      <FPSStats right={0} left="auto" bottom={0} top="auto" />
      <Routes>
        <Route
          path="/"
          element={
            <>
              <SignedIn>
                <Dashboard />
              </SignedIn>
              <SignedOut>
                <LandingPage />
              </SignedOut>
            </>
          }
        />
        <Route
          path="/sign-in/*"
          element={<SignIn routing="path" path="/sign-in" afterSignInUrl="/" />}
        />
        <Route
          path="/sign-up/*"
          element={<SignUp routing="path" path="/sign-up" afterSignUpUrl="/" />}
        />
        <Route path="/create/:dbid/:deckid" element={<Editor />} />
      </Routes>
    </ClerkProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ClerkProviderWithRoutes />
    </BrowserRouter>
  );
}
