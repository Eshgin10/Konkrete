import { GoogleGenAI } from "@google/genai";
import { User, Topic, Session, ChatMessage } from "../types";
import { TOPIC_ICONS } from "../constants";

// Initialize AI Client
// Note: process.env.API_KEY is expected to be available in the build environment.
let ai: GoogleGenAI | null = null;

const getAiClient = (): GoogleGenAI | null => {
  if (!process.env.API_KEY) return null;
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return ai;
};

const MODEL_NAME = 'gemini-2.5-flash';

const SYSTEM_INSTRUCTION = `
You are Coach K, a casual, punchy, and highly motivating productivity coach. 
You are NOT a robot; you are a partner in the user's success.
Keep responses short (under 50 words usually), direct, and conversational (like a text message).
Use emojis sparingly but effectively.
Focus on the data provided (recent sessions, streaks, topic distribution).
If the user is currently working on something (Current Activity), encourage them specifically on that task.
Celebrate wins, but call out slacking gently.
`;

interface CoachContext {
  user: User;
  topics: Topic[];
  recentSessions: Session[];
  streak: number;
  totalFocusTime: number;
  currentActivity?: {
    topicName: string;
    durationSeconds: number;
  } | null;
}

export const generateCoachResponse = async (
  history: ChatMessage[],
  newMessage: string,
  context: CoachContext
): Promise<string> => {
  const client = getAiClient();
  if (!client) {
    return "I'm offline right now (API Key missing). Let's track some goals manually!";
  }

  try {
    let currentActivityString = "Not currently tracking any topic.";
    if (context.currentActivity) {
        const mins = Math.floor(context.currentActivity.durationSeconds / 60);
        currentActivityString = `Currently tracking: "${context.currentActivity.topicName}" for ${mins} minutes.`;
    }

    const contextString = `
    User Context:
    Name: ${context.user.displayName}
    Current Streak: ${context.streak} days
    Total Focus Time: ${Math.round(context.totalFocusTime / 60)} hours
    Current Status: ${currentActivityString}
    Topics: ${context.topics.map(t => `${t.name} (${Math.round(t.totalMinutes)}m)`).join(', ')}
    Last 3 Sessions: ${context.recentSessions.slice(0, 3).map(s => `${s.topicName} for ${Math.round(s.durationSeconds / 60)}m`).join(', ')}
    `;

    // Format history for the API, excluding the new message which is sent in contents
    // The API expects 'user' and 'model' roles.
    const chatHistory = history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
    }));

    const chat = client.chats.create({
      model: MODEL_NAME,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION + contextString,
      },
      history: chatHistory,
    });

    const response = await chat.sendMessage({ message: newMessage });
    return response.text || "I'm focusing right now, ask me again in a second.";

  } catch (error) {
    console.error("Gemini API Error:", error);
    return "My connection is a bit fuzzy. Let's try that again later.";
  }
};

export const predictTopicIcon = async (topicName: string): Promise<string | null> => {
  const client = getAiClient();
  if (!client) return null;

  try {
    const prompt = `
      Task: Select the best icon for the productivity topic "${topicName}".
      Available Icons: ${TOPIC_ICONS.join(', ')}.
      
      Instructions:
      - Return ONLY the exact icon name from the list.
      - If the topic relates to coding/tech, use 'code'.
      - If reading/learning, use 'book'.
      - If exercise/health, use 'dumbbell'.
      - If creative, use 'pen-tool' or 'music'.
      - If work/business, use 'briefcase'.
      - If energy/focus, use 'zap'.
      - If break/chill, use 'coffee'.
      - Default to 'zap' if unsure.
    `;

    const response = await client.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    const text = response.text?.trim().toLowerCase();
    
    // Validate that the returned text is actually one of our supported icons
    if (text && TOPIC_ICONS.includes(text)) {
      return text;
    }
    return null;
  } catch (error) {
    console.error("Error predicting icon:", error);
    return null;
  }
};