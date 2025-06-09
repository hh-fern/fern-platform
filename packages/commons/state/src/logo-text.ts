import { atom, useAtomValue } from "jotai";
import { useHydrateAtoms } from "jotai/utils";

const logoTextAtom = atom<string | undefined>(undefined);

export function SetLogoText({ text }: { text: string | undefined }) {
  useHydrateAtoms([[logoTextAtom, text]], { dangerouslyForceHydrate: true });
  return null;
}

export function useLogoText() {
  return useAtomValue(logoTextAtom);
}
