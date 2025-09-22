"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { useProgrammingLanguage } from "@/state/language";

export function QueryParamProcessor() {
  const searchParams = useSearchParams();
  const [_, setSelectedLanguage] = useProgrammingLanguage();

  useEffect(() => {
    if (searchParams.get("language")) {
      setSelectedLanguage(searchParams.get("language")!);
    }
  }, [searchParams, setSelectedLanguage]);
}
