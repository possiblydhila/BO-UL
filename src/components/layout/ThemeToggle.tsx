import { MoonStar, Sun } from "@untitledui/icons";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { useTheme } from "@/context/theme-context";

export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <ButtonUtility
      tooltip={isDark ? "Switch to light mode" : "Switch to dark mode"}
      icon={isDark ? Sun : MoonStar}
      color="tertiary"
      onClick={toggleTheme}
    />
  );
}
