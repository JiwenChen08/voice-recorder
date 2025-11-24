// types.ts
export type Recording = {
  id: number;
  blob?: Blob;
  url: string;
  timestamp: string;
  recognizedText?: string;
};