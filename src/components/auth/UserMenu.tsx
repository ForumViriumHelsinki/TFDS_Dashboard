import { useState, useEffect } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { Avatar, ActionIcon, Button, Menu } from "@mantine/core";
import { LogIn, LogOut } from "lucide-react";
import { setUserContext, clearUserContext } from "../../openfeature";

interface GoogleUser {
  email: string;
  name: string;
  picture: string;
}

const SESSION_KEY = "tfds_google_user";

function readStoredUser(): GoogleUser | null {
  const stored = sessionStorage.getItem(SESSION_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as GoogleUser;
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

/**
 * Renders nothing when Google OAuth is not configured.
 * Avoids calling useGoogleLogin outside a GoogleOAuthProvider context.
 */
export function UserMenu() {
  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) return null;
  return <UserMenuInner />;
}

function UserMenuInner() {
  const [user, setUser] = useState<GoogleUser | null>(readStoredUser);

  // Sync OpenFeature context whenever auth state changes
  useEffect(() => {
    if (user) {
      setUserContext(user.email);
    } else {
      clearUserContext();
    }
  }, [user]);

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const response = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
            },
          },
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch user info: ${response.statusText}`);
        }
        const data = await response.json();
        const userInfo: GoogleUser = {
          email: data.email ?? "",
          name: data.name ?? "",
          picture: data.picture ?? "",
        };
        if (!userInfo.email) {
          throw new Error("Google userinfo response missing email");
        }
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(userInfo));
        setUser(userInfo);
      } catch (error) {
        console.error("Error during Google sign-in:", error);
        logout();
      }
    },
    onError: (error) => {
      console.error("Google OAuth error:", error);
    },
  });

  if (!user) {
    return (
      <Button
        variant="subtle"
        size="sm"
        leftSection={<LogIn size={16} />}
        onClick={() => login()}
      >
        Kirjaudu sisään
      </Button>
    );
  }

  return (
    <Menu shadow="md" width={220} position="bottom-end" zIndex={1000}>
      <Menu.Target>
        <ActionIcon variant="subtle" size="lg" radius="xl">
          <Avatar src={user.picture} size="sm" radius="xl" />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>{user.name}</Menu.Label>
        <Menu.Label c="dimmed">{user.email}</Menu.Label>
        <Menu.Divider />
        <Menu.Item leftSection={<LogOut size={16} />} onClick={logout}>
          Kirjaudu ulos
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
