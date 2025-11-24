import React from "react";
import { Box, IconButton, Typography, Button } from "@mui/material";
import { Delete, GetApp } from "@mui/icons-material";
import { Recording } from "../types";

interface Props {
  recordings: Recording[];
  onDelete: (id: number) => void;
  onClearAll?: () => void;
}

const RecordingsHistory: React.FC<Props> = ({ recordings, onDelete, onClearAll }) => {
  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <Typography variant="subtitle1">History</Typography>
      {/* 清空所有按钮 */}
      {recordings.length > 0 && (
        <Button variant="outlined" color="secondary" onClick={onClearAll}>
          Clear All
        </Button>
      )}

      {recordings.map((rec) => (
        <Box
          key={rec.id}
          display="flex"
          alignItems="center"
          gap={1}
          borderBottom="1px solid #ccc"
          paddingBottom={1}
        >
          {/* 时间戳显示 */}
          <Typography variant="body2" sx={{ minWidth: 180 }}>
            {rec.timestamp}
          </Typography>

          {/* 播放条 */}
          <audio controls src={rec.url} style={{ flexGrow: 1 }} />

          {/* 下载按钮 */}
          <IconButton
            size="small"
            component="a"
            href={rec.url}
            download={`${rec.timestamp}.mp3`}
          >
            <GetApp fontSize="small" />
          </IconButton>

          {/* 删除按钮 */}
          <IconButton size="small" onClick={() => onDelete(rec.id)}>
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      ))}

      {/* 没有记录时提示 */}
      {recordings.length === 0 && (
        <Typography variant="body2" color="textSecondary">
          No recordings yet
        </Typography>
      )}
    </Box>
  );
};

export default RecordingsHistory;