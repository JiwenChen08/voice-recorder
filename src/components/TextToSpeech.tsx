import React, { useState, useEffect } from "react";
import { Box, TextField, Slider, Select, MenuItem, IconButton, Typography, Tooltip } from "@mui/material";
import { VolumeUp, PlayArrow } from "@mui/icons-material";

const TextToSpeech: React.FC = () => {
  const [text, setText] = useState("");
  const [volume, setVolume] = useState(0.4);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState("Google US English 6 (Natural)");

  useEffect(() => {
    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      setVoices(allVoices);
      if (!allVoices.find(v => v.name === selectedVoice) && allVoices.length > 0) {
        setSelectedVoice(allVoices[0].name);
      }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, [selectedVoice]);

  const handleSpeak = () => {
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = volume;
    const voice = voices.find(v => v.name === selectedVoice);
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <Box display="flex" flexDirection="column" gap={1} marginTop={2}>
      {/* 控制区标题 */}
      <Typography variant="subtitle1">Text-to-Speech</Typography>

      {/* 控制区 */}
      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
        {/* Speak 按钮 */}
        <IconButton size="small" color="primary" onClick={handleSpeak}>
          <PlayArrow fontSize="small" />
        </IconButton>

        {/* 音量滑条 */}
        <Box display="flex" alignItems="center" gap={0.5}>
          <VolumeUp fontSize="small" />
          <Slider
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(_, v) => setVolume(v as number)}
            size="small"
            sx={{ width: 100 }}
          />
        </Box>

        {/* 语音下拉 */}
        <Select
          value={selectedVoice}
          onChange={(e) => setSelectedVoice(e.target.value)}
          size="small"
          sx={{ width: 180 }}
        >
          {voices.map(v => (
            <MenuItem key={v.name} value={v.name}>
              {v.name} ({v.lang})
            </MenuItem>
          ))}
        </Select>
      </Box>

      {/* 文本框 */}
      <TextField
        label="Enter text"
        multiline
        minRows={3}
        maxRows={10}
        value={text}
        onChange={(e) => setText(e.target.value)}
        variant="outlined"
        fullWidth
        InputProps={{
          style: {
            fontSize: "1rem",
            boxSizing: "border-box",
            overflowY: "auto",
          },
        }}
      />
    </Box>
  );
};

export default TextToSpeech;