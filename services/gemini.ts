import { GoogleGenAI, Type } from "@google/genai";
import { Student, AttendanceResult } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

// Helper to strip data:image/jpeg;base64, prefix
const stripBase64Header = (dataUrl: string) => {
  return dataUrl.split(',')[1];
};

const getMimeType = (dataUrl: string) => {
  return dataUrl.substring(dataUrl.indexOf(':') + 1, dataUrl.indexOf(';'));
}

export const analyzeAttendance = async (
  students: Student[],
  classroomImageBase64: string
): Promise<AttendanceResult> => {
  const ai = getClient();
  const model = "gemini-2.5-flash"; // Fast and good with images

  // Prepare parts: Reference images first, then the classroom image
  const parts: any[] = [];

  // Add all student reference images
  // To avoid token overload, we give concise instructions.
  // Note: Sending too many high-res images might hit limits. In a prod app, we'd use embeddings or smaller thumbnails.
  students.forEach((student) => {
    parts.push({
      text: `Reference Photo for Student Name: "${student.name}" (ID: ${student.id})`
    });
    parts.push({
      inlineData: {
        mimeType: getMimeType(student.photoData),
        data: stripBase64Header(student.photoData)
      }
    });
  });

  // Add the target classroom image
  parts.push({ text: "--- END OF REFERENCE PHOTOS ---" });
  parts.push({ text: "TARGET IMAGE TO ANALYZE:" });
  parts.push({
    inlineData: {
      mimeType: getMimeType(classroomImageBase64),
      data: stripBase64Header(classroomImageBase64)
    }
  });

  const prompt = `
    You are an AI Attendance Officer. 
    1. I have provided reference photos for ${students.length} students above.
    2. The last image provided is the 'Target Image' (Classroom or CCTV capture).
    3. Compare the faces in the Target Image against the Reference Photos.
    4. Identify which enrolled students are present in the Target Image.
    5. Return the result in JSON format with lists of names.
    
    If a face in the target image closely matches a reference photo, mark them as present.
    If a student from the reference list is not found, mark them as absent.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: [
        {
          role: 'user',
          parts: [...parts, { text: prompt }]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            presentNames: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of names of students found in the target image"
            },
            absentNames: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of names of students NOT found in the target image"
            },
            confidence: {
              type: Type.STRING,
              description: "High, Medium, or Low confidence in the overall analysis"
            },
            reasoning: {
              type: Type.STRING,
              description: "Brief explanation of the finding (e.g., 'Found 3 matching faces, lighting was clear')"
            }
          },
          required: ["presentNames", "absentNames"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AttendanceResult;
    } else {
      throw new Error("No response from AI");
    }
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};