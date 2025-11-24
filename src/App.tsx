import React, { useState } from "react";
import { Box, ThemeProvider, createTheme, Typography } from "@mui/material";
import AudioRecorder from "./components/AudioRecorder";
import RecordingsHistory from "./components/RecordingsHistory";
import TextToSpeech from "./components/TextToSpeech"; // 引入新组件
import { Recording } from "./types";

const theme = createTheme({
  palette: {
    primary: { main: "#1976d2" },
    secondary: { main: "#d32f2f" },
  },
});

const App: React.FC = () => {
  const [recordings, setRecordings] = useState<Recording[]>([]);

  const handleSaveRecording = (rec: Recording, recognizedText?: string) => {
    setRecordings((prev) => [{ ...rec, recognizedText }, ...prev]);
  };

  const handleDeleteRecording = (id: number) => {
    setRecordings((prev) => prev.filter((r) => r.id !== id));
  };

  const handleClearAll = () => {
    setRecordings([]);
  };

  return (
    <ThemeProvider theme={theme}>
      <Box display="flex" gap={2} padding={2}>
        {/* 左侧录音 + 朗读模块 */}
        <Box flex={1} display="flex" flexDirection="column" gap={2}>
          <AudioRecorder onSave={handleSaveRecording} />
          <TextToSpeech /> {/* 新增朗读组件 */}
        </Box>

        {/* 右侧历史记录模块 */}
        <Box flex={1} display="flex" flexDirection="column" gap={1}>
          <RecordingsHistory
            recordings={recordings}
            onDelete={handleDeleteRecording}
            onClearAll={handleClearAll}
          />
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default App;