/* eslint-disable */
import React, { useState, useEffect, useRef } from "react";
import { Box, IconButton, Checkbox, Select, MenuItem, TextField, Slider,Typography } from "@mui/material";
import { Mic, Stop, Close, Hearing } from "@mui/icons-material";
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

type SpeechRecognitionType = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: any) => void) | null;
  start: () => void;
  stop: () => void;
};

interface Recording {
  id: number;
  blob?: Blob;
  url: string;
  timestamp: string;
  recognizedText?: string;
}

interface Props {
  onSave?: (rec: Recording, recognizedText?: string) => void;
}

const AudioRecorder: React.FC<Props> = ({ onSave }) => {
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState<SpeechRecognitionType | null>(null);
  const [recognizedText, setRecognizedText] = useState("");
  const [enableCC, setEnableCC] = useState(false);
  const [language, setLanguage] = useState("en-US");

  // 耳返
  const [earReturn, setEarReturn] = useState(false);
  const [earVolume, setEarVolume] = useState(0.5); // 默认 0.5
  const audioCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // 启动/停止语音识别
  useEffect(() => {
    if (enableCC) {
      const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!Rec) return;

      const rec: SpeechRecognitionType = new Rec();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = language;

      rec.onresult = (event: any) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + " ";
        }
        setRecognizedText(transcript);
      };

      rec.start();
      setSpeechRecognition(rec);

      return () => {
        rec.stop();
        setSpeechRecognition(null);
      };
    } else {
      speechRecognition?.stop();
      setSpeechRecognition(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableCC, language]);

  // 开/关耳返
  useEffect(() => {
    const toggleEarReturn = async () => {
      if (earReturn) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
            },
          });
          micStreamRef.current = stream;
          const audioCtx = new AudioContext();
          const source = audioCtx.createMediaStreamSource(stream);
          const gainNode = audioCtx.createGain();
          gainNode.gain.value = earVolume;
          source.connect(gainNode).connect(audioCtx.destination);
          audioCtxRef.current = audioCtx;
          gainNodeRef.current = gainNode;
        } catch (err) {
          console.error("Ear return error:", err);
        }
      } else {
        audioCtxRef.current?.close();
        audioCtxRef.current = null;
        gainNodeRef.current = null;
        micStreamRef.current?.getTracks().forEach(track => track.stop());
        micStreamRef.current = null;
      }
    };
    toggleEarReturn();
  }, [earReturn]);

  // 调整耳返音量
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = earVolume;
    }
  }, [earVolume]);

  // 切换录音
  const toggleRecording = async () => {
    if (recording) {
      mediaRecorder?.stop();
      setRecording(false);
    } else {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/mp3" });
        const url = URL.createObjectURL(blob);
        const timestamp = new Date().toISOString().replace(/[-:.]/g, "") + "Z";
        onSave?.({ id: Date.now(), blob, url, timestamp }, recognizedText);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
    }
  };

  const clearCC = () => setRecognizedText("");

  return (
    <Box display="flex" flexDirection="column" gap={1}>
      <Typography variant="subtitle1">Recorder</Typography>
      {/* 控制按钮 */}
      <Box display="flex" alignItems="center" gap={1}>
        <Box
          width={16}
          height={16}
          borderRadius="50%"
          sx={{
            backgroundColor: recording ? "red" : "gray",
            animation: recording ? "pulse 1.5s infinite" : "none",
          }}
        />

        <IconButton onClick={toggleRecording} color={recording ? "secondary" : "primary"}>
          {recording ? <Stop /> : <Mic />}
        </IconButton>

        <Checkbox checked={enableCC} onChange={(e) => setEnableCC(e.target.checked)} />
        <Box>CC</Box>

        <Select value={language} onChange={(e) => setLanguage(e.target.value)} size="small">
          <MenuItem value="en-US">English (US)</MenuItem>
          <MenuItem value="en-GB">English (UK)</MenuItem>
          <MenuItem value="de-DE">German</MenuItem>
          <MenuItem value="zh-CN">Chinese</MenuItem>
        </Select>

        <Checkbox checked={earReturn} onChange={(e) => setEarReturn(e.target.checked)} />
        <Hearing />
        {earReturn && (
          <Box width={120} display="flex" alignItems="center">
            <Slider
              min={0}
              max={2}
              step={0.01}
              value={earVolume}
              onChange={(_, v) => setEarVolume(v as number)}
              size="small"
            />
          </Box>
        )}
      </Box>

      {/* 识别框 */}
      <Box position="relative" width="100%">
        <TextField
          variant="outlined"
          multiline
          fullWidth
          minRows={8}
          value={recognizedText}
          InputProps={{
            readOnly: true,
            style: { fontSize: "1rem"},
          }}
        />
        <IconButton
          onClick={clearCC}
          size="small"
          sx={{ position: "absolute", right: 4, top: 4 }}
        >
          <Close fontSize="small" />
        </IconButton>
      </Box>

      <style>{`
        @keyframes pulse {
          0% { opacity: 0.3; }
          50% { opacity: 1; }
          100% { opacity: 0.3; }
        }
      `}</style>
    </Box>
  );
};

export default AudioRecorder;