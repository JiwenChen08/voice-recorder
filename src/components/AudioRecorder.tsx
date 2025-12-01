/* eslint-disable */
import React, { useState, useEffect, useRef } from "react";
import { Box, IconButton, Checkbox, Autocomplete, TextField, Slider, Typography } from "@mui/material";
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

  // 输入设备
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined);

  // 耳返
  const [earReturn, setEarReturn] = useState(false);
  const [earVolume, setEarVolume] = useState(0.5);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // 初始化设备列表
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((list) => {
      const audioInputs = list.filter((d) => d.kind === "audioinput");
      setDevices(audioInputs);
      if (!selectedDeviceId && audioInputs.length > 0) {
        setSelectedDeviceId(audioInputs[0].deviceId);
      }
    });
  }, []);

  // 语音识别
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
  }, [enableCC, language]);

  // 耳返
  useEffect(() => {
    const toggleEarReturn = async () => {
      if (earReturn) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
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
        micStreamRef.current?.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
      }
    };
    toggleEarReturn();
  }, [earReturn, selectedDeviceId]);

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = earVolume;
    }
  }, [earVolume]);

  // 录音
  const toggleRecording = async () => {
    if (recording) {
      mediaRecorder?.stop();
      setRecording(false);
    } else {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined },
      });
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

  const clearCC = () => {
    setRecognizedText("");

    if (speechRecognition) {
      speechRecognition.stop();
      setSpeechRecognition(null);
    }

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
    }
  };

  // 语言列表
  const languages = [
    { code: "en-US", label: "English (US)" },
    { code: "en-GB", label: "English (UK)" },
    { code: "de-DE", label: "German" },
    { code: "zh-CN", label: "Chinese" },
    { code: "fr-FR", label: "French" },
    { code: "es-ES", label: "Spanish" },
    { code: "ja-JP", label: "Japanese" },
    { code: "ko-KR", label: "Korean" },
    { code: "ru-RU", label: "Russian" },
  ];

  return (
    <Box display="flex" flexDirection="column" gap={1}>
      <Typography variant="subtitle1">Recorder</Typography>

      {/* 第一行：录音按钮 + CC + 耳返 */}
      <Box display="flex" alignItems="center" gap={1}>
        {/* 录音按钮 */}
        <IconButton
          onClick={toggleRecording}
          color="primary"
          sx={{ position: "relative" }}
        >
          <Mic />
          {recording && (
            <Box
              sx={{
                position: "absolute",
                top: 4,
                right: 4,
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: "red",
                animation: "pulse 1.5s infinite",
              }}
            />
          )}
        </IconButton>

        {/* CC */}
        <Box display="flex" alignItems="center" gap={0.5}>
          <Checkbox checked={enableCC} onChange={(e) => setEnableCC(e.target.checked)} />
          <Box>CC</Box>
        </Box>

        {/* 耳返 */}
        <Checkbox checked={earReturn} onChange={(e) => setEarReturn(e.target.checked)} />
        <Hearing />
        {earReturn && (
          <Box width={120}>
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

      {/* 第二行：语言选择 + 麦克风设备选择 */}
      <Box display="flex" alignItems="center" gap={1}>
        <Autocomplete
          sx={{ width: 180 }}
          size="small"
          options={languages}
          value={languages.find((l) => l.code === language) || null}
          getOptionLabel={(o) => o.label}
          onChange={(_, v) => v && setLanguage(v.code)}
          renderInput={(params) => <TextField {...params} label="Language" />}
        />

        <Autocomplete
          sx={{ width: 240 }}
          size="small"
          options={devices}
          getOptionLabel={(d) => d.label || "Unknown Device"}
          value={devices.find((d) => d.deviceId === selectedDeviceId) || null}
          onChange={(_, v) => v && setSelectedDeviceId(v.deviceId)}
          renderInput={(params) => <TextField {...params} label="Mic Device" />}
        />
      </Box>

      {/* CC 识别框 */}
      <Box position="relative">
        <TextField
          multiline
          fullWidth
          minRows={8}
          value={recognizedText}
          InputProps={{ readOnly: true, style: { background: "#f5f5f5" } }}
        />
        <IconButton
          onClick={clearCC}
          size="small"
          sx={{ position: "absolute", right: 4, top: 4, opacity: 0, transition: "opacity .2s" }}
          className="clear-btn"
        >
          <Close fontSize="small" />
        </IconButton>
      </Box>

      {/* 样式 */}
      <style>
        {`
        .cc-wrapper:hover .clear-btn { opacity: 1; }
        @keyframes pulse { 
          0% { opacity: 0.3; } 
          50% { opacity: 1; } 
          100% { opacity: 0.3; } 
        }
      `}
      </style>
    </Box>
  );
};

export default AudioRecorder;