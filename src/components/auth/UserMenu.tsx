import { useState, useEffect } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { Avatar, Button, Group, Menu, Text } from "@mantine/core";
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
  return stored ? (JSON.parse(stored) as GoogleUser) : null;
}

export function UserMenu() {
  const [user, setUser] = useState<GoogleUser | null>(readStoredUser);

  // Sync OpenFeature context whenever auth state changes
  useEffect(() => {
    if (user) {
      setUserContext(user.email);
    } else {
      clearUserContext();
    }
  }, [user]);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const userInfo = await fetch(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } },
      ).then((r) => r.json() as Promise<GoogleUser>);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(userInfo));
      setUser(userInfo);
    },
  });

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

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
    <Menu shadow="md" width={220}>
      <Menu.Target>
        <Button variant="subtle" size="sm" px="xs">
          <Group gap="xs">
            <Avatar src={user.picture} size="sm" radius="xl" />
            <Text size="sm" maw={160} truncate="end">
              {user.email}
            </Text>
          </Group>
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>{user.name}</Menu.Label>
        <Menu.Item leftSection={<LogOut size={16} />} onClick={logout}>
          Kirjaudu ulos
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
