import { WbSunny, Nightlight } from "@mui/icons-material";
import { IconButton, useColorScheme as joyColorScheme } from "@mui/joy";
import { useColorScheme as materialColorScheme } from "@mui/material";

export default function ThemeToggle({ ...props }) {
  const { mode, setMode } = joyColorScheme();
  const { mode: materialMode, setMode: setMaterialMode } = materialColorScheme();
  return (
    <IconButton
      id="toggle-mode"
      size="sm"
      color="primary"
      sx={{ p: 0.5 }}
      onClick={() => {
        setMode(mode === 'light' ? 'dark' : 'light');
        setMaterialMode(materialMode === 'light' ? 'dark' : 'light');
      }}
      {...props}
    >
      {mode === 'light' ? <WbSunny fontSize="small" /> : <Nightlight fontSize="small" />}
    </IconButton>
  );
}
