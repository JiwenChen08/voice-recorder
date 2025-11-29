import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  TextField,
  Slider,
  IconButton,
  Typography,
  Autocomplete,
} from "@mui/material";
import { VolumeUp, PlayArrow, Stop, Pause, Clear } from "@mui/icons-material";

const TextToSpeech: React.FC = () => {
  const [text, setText] = useState("What's the difference between your work and your wife");
  const [volume, setVolume] = useState(0.4);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      const blackList = ["Albert", "Fred", "Trinoids", "Whisper"];
      const filteredVoices = allVoices.filter(
        (v) => !blackList.some((name) => v.name.includes(name))
      );
      setVoices(filteredVoices);
      const defaultVoice =
        filteredVoices.find((v) => v.name.includes("Google US English 4")) ||
        filteredVoices[0];
      setSelectedVoice(defaultVoice || null);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const handleSpeak = () => {
    if (!text || !selectedVoice) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.voice = selectedVoice;
    utter.volume = volume;
    utter.onstart = () => { setSpeaking(true); setPaused(false); };
    utter.onend = () => { setSpeaking(false); setPaused(false); };
    utteranceRef.current = utter;
    window.speechSynthesis.speak(utter);
  };

  const handlePause = () => { if (!speaking) return; window.speechSynthesis.pause(); setPaused(true); };
  const handleResume = () => { if (!paused) return; window.speechSynthesis.resume(); setPaused(false); };
  const handleStop = () => { window.speechSynthesis.cancel(); setSpeaking(false); setPaused(false); };
  const handleClear = () => { setText(""); };

  return (
    <Box display="flex" flexDirection="column" gap={2} mt={2}>
      <Typography variant="subtitle1">Text-to-Speech</Typography>

      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
        {speaking ? (paused ? (
          <IconButton size="small" color="primary" onClick={handleResume}><PlayArrow fontSize="small" /></IconButton>
        ) : (
          <IconButton size="small" color="primary" onClick={handlePause}><Pause fontSize="small" /></IconButton>
        )) : (
          <IconButton size="small" color="primary" onClick={handleSpeak}><PlayArrow fontSize="small" /></IconButton>
        )}

        <IconButton size="small" onClick={handleStop}><Stop fontSize="small" sx={{ color: "red" }} /></IconButton>

        <Box display="flex" alignItems="center" gap={1}>
          <VolumeUp fontSize="small" />
          <Slider min={0} max={1} step={0.01} value={volume} onChange={(_, v) => setVolume(v as number)} sx={{ width: 100 }} size="small" />
        </Box>

        <Autocomplete
          value={selectedVoice}
          onChange={(_, newValue) => setSelectedVoice(newValue)}
          options={voices}
          getOptionLabel={(option) => `${option.name} (${option.lang})`}
          renderInput={(params) => (<TextField {...params} size="small" label="Select voice" />)}
          sx={{ width: 260 }}
        />
      </Box>

      <Box position="relative" className="text-wrapper">
        <TextField
          label="Enter text"
          multiline
          minRows={3}
          maxRows={10}
          value={text}
          onChange={(e) => setText(e.target.value)}
          variant="outlined"
          fullWidth
          InputProps={{ style: { fontSize: "1rem", overflowY: "auto" } }}
        />

        <IconButton
          size="small"
          onClick={handleClear}
          className="clear-btn"
          sx={{
            position: "absolute",
            top: 6,
            right: 6,
            zIndex: 2,
            opacity: 0,
            transition: "opacity 0.2s",
            background: "rgba(255,255,255,0.8)",
            "&:hover": { background: "rgba(255,255,255,1)" }
          }}
        >
          <Clear fontSize="small" />
        </IconButton>
      </Box>

      <style>{` .text-wrapper:hover .clear-btn { opacity: 1; } `}</style>
    </Box>
  );
};

export default TextToSpeech;