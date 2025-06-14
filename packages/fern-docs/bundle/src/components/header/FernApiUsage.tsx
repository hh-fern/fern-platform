"use client";

import { useEffect, useState } from "react";

import { FernButton, FernProgress } from "@fern-docs/components";

interface FernApiUsageProps {
  authRedirectUrl?: string;
  refreshIntervalMs?: number;
  usageUnit?: string;
  apiEndpoint?: string;
  apiKey?: string;
  usedKey?: string;
  totalKey?: string;
}

export const FernApiUsage = ({
  authRedirectUrl = "/api/fern-docs/auth/fern-token-demo",
  refreshIntervalMs = 1000 * 10,
  usageUnit = "Credits",
  apiEndpoint = "https://api.elevenlabs.io/v1/user/subscription",
  apiKey = "",
  usedKey = "character_count",
  totalKey = "character_limit",
}: FernApiUsageProps) => {
  const [usage, setUsage] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  async function login() {
    try {
      window.location.href = authRedirectUrl;
    } catch (error) {
      console.error("Error redirecting:", error);
    }
  }

  async function fetchToken() {
    try {
      const response = await fetch("/api/fern-docs/whoami");
      const data = await response.json();
      setToken(data.fern_token);
    } catch (error) {
      console.error("Error fetching token:", error);
      setToken(null);
    }
  }

  useEffect(() => {
    void fetchToken();
  }, []);

  // refresh token every 3 minutes
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (token) {
        void getUsage(apiEndpoint, apiKey).then(setUsage);
      }
    }, refreshIntervalMs);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshIntervalMs]);

  useEffect(() => {
    async function fetchUsage() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const usageData = await getUsage(apiEndpoint, apiKey);
        setUsage(usageData);
      } catch (error) {
        console.error("Error fetching usage:", error);
      } finally {
        setLoading(false);
      }
    }

    void fetchUsage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!token) {
    return (
      <FernButton
        variant="filled"
        intent="primary"
        onClick={() => {
          void login();
        }}
      >
        Login
      </FernButton>
    );
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!usage) {
    return null;
  }

  return (
    <FernProgress
      used={usage[usedKey] ?? 0}
      total={usage[totalKey] ?? 0}
      unit={usageUnit}
    />
  );
};

FernApiUsage.displayName = "FernApiUsage";

async function getUsage(apiEndpoint: string, apiKey: string) {
  const response = await fetch(apiEndpoint, {
    headers: {
      "Xi-Api-Key": apiKey,
    },
  });

  const data = await response.json();

  return data;
}
