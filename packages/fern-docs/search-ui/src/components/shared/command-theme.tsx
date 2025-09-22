import { type ComponentProps } from "react";

import { Laptop, Moon, Sun } from "lucide-react";

import * as Command from "../cmdk";

export const CommandGroupTheme = ({
  setTheme,
  ref,
  ...props
}: ComponentProps<typeof Command.Group> & {
  setTheme?: (theme: "light" | "dark" | "system") => void;
}): JSX.Element | false => {
  if (setTheme == null) {
    return false;
  }

  return (
    <Command.Group heading="Theme" ref={ref} {...props}>
      <Command.Item
        value="change theme to light"
        onSelect={() => setTheme("light")}
        keywords={["light mode", "light theme"]}
      >
        <Sun />
        Change theme to light
      </Command.Item>
      <Command.Item
        value="change theme to dark"
        onSelect={() => setTheme("dark")}
        keywords={["dark mode", "dark theme"]}
      >
        <Moon />
        Change theme to dark
      </Command.Item>
      <Command.Item
        value="change theme to system"
        onSelect={() => setTheme("system")}
        keywords={["system mode", "system theme"]}
      >
        <Laptop />
        Change theme to system
      </Command.Item>
    </Command.Group>
  );
};
