import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';

// Tool definition for Gemini to report hand state
const updateHandStateTool: FunctionDeclaration = {
  name: 'updateHandState',
  description: 'Update the estimated tension and visibility of the user\'s hands.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      tension: {
        type: Type.NUMBER,
        description: '0.0 represents fully open relaxed hands. 1.0 represents tight closed fists. Intermediate values for semi-closed.',
      },
      detected: {
        type: Type.BOOLEAN,
        description: 'True if hands are visible in the frame.',
      },
    },
    required: ['tension', 'detected'],
  },
};

export class GeminiLiveService {
  private ai: GoogleGenAI;
  private sessionPromise: Promise<any> | null = null;
  private onUpdate: (data: { tension: number; detected: boolean }) => void;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private nextStartTime: number = 0;
  private sources: Set<AudioBufferSourceNode> = new Set();

  constructor(apiKey: string, onUpdate: (data: { tension: number; detected: boolean }) => void) {
    this.ai = new GoogleGenAI({ apiKey });
    this.onUpdate = onUpdate;
  }

  async connect(stream: MediaStream) {
    // 1. Setup Audio Input (Microphone)
    this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    const inputSource = this.inputAudioContext.createMediaStreamSource(stream);
    const scriptProcessor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);
    
    // 2. Setup Audio Output (Speaker)
    this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    this.nextStartTime = 0;

    // 3. Connect to Gemini Live
    this.sessionPromise = this.ai.live.connect({
      model: 'gemini-2.0-flash-live-001',
      callbacks: {
        onopen: () => {
          console.log('Gemini Live Session Connected');
          
          // Start streaming audio data when session opens
          scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
            const pcmBlob = createBlob(inputData);
            
            this.sessionPromise?.then((session) => {
              session.sendRealtimeInput({ media: pcmBlob });
            });
          };
          
          inputSource.connect(scriptProcessor);
          scriptProcessor.connect(this.inputAudioContext!.destination);
        },
        onmessage: async (message: LiveServerMessage) => {
          // Debug: Log all incoming messages
          console.log('Gemini message received:', JSON.stringify(message, null, 2));
          
          // Handle Tool Calls (Hand Detection)
          if (message.toolCall) {
            console.log('Tool call received!', message.toolCall);
            for (const fc of message.toolCall.functionCalls) {
              if (fc.name === 'updateHandState') {
                const args = fc.args as any;
                console.log('Hand state update:', args);
                this.onUpdate({
                  tension: args.tension || 0,
                  detected: args.detected || false,
                });
                
                this.sessionPromise?.then((session) => {
                  session.sendToolResponse({
                    functionResponses: {
                      id: fc.id,
                      name: fc.name,
                      response: { result: 'ok' },
                    },
                  });
                });
              }
            }
          }

          // Handle Audio Output (if model speaks)
          const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (base64Audio && this.outputAudioContext) {
            const audioBuffer = await decodeAudioData(
              decode(base64Audio),
              this.outputAudioContext,
              24000,
              1
            );
            this.playAudio(audioBuffer);
          }
        },
        onclose: () => {
          console.log('Gemini Live Session Closed');
          this.cleanupAudio();
        },
        onerror: (err) => {
          console.error('Gemini Live Error:', err);
          this.cleanupAudio();
        },
      },
      config: {
        responseModalities: [Modality.TEXT],
        systemInstruction: `You are a hand gesture detector. For every image you see, you MUST call the updateHandState function immediately. 

If you see hands: set detected=true and estimate tension (0=open palm, 1=closed fist).
If no hands visible: set detected=false and tension=0.

IMPORTANT: Always call the function, never respond with text.`,
        tools: [{ functionDeclarations: [updateHandStateTool] }],
      },
    });
    
    await this.sessionPromise;
  }

  async sendFrame(base64Data: string) {
    if (!this.sessionPromise) return;
    
    try {
      const session = await this.sessionPromise;
      console.log('Sending frame to Gemini, size:', base64Data.length);
      session.sendRealtimeInput({
        media: {
          mimeType: 'image/jpeg',
          data: base64Data,
        },
      });
    } catch (e) {
      console.error("Error sending frame:", e);
    }
  }

  private playAudio(buffer: AudioBuffer) {
    if (!this.outputAudioContext) return;

    this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
    const source = this.outputAudioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.outputAudioContext.destination);
    source.addEventListener('ended', () => this.sources.delete(source));
    source.start(this.nextStartTime);
    this.nextStartTime += buffer.duration;
    this.sources.add(source);
  }

  private cleanupAudio() {
    this.inputAudioContext?.close();
    this.outputAudioContext?.close();
    this.sources.forEach(s => s.stop());
    this.sources.clear();
  }

  async disconnect() {
    this.cleanupAudio();
    this.sessionPromise = null;
  }
}

// --- Audio Helpers ---

function createBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
