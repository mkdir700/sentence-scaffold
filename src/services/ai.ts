import { GoogleGenAI, Type, Schema } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    sentence: { type: Type.STRING },
    sentence_type: {
      type: Type.OBJECT,
      properties: {
        category: {
          type: Type.STRING,
          description: "e.g., simple, compound, complex",
        },
        summary: {
          type: Type.STRING,
          description: "Brief summary of the sentence structure",
        },
      },
      required: ["category", "summary"],
    },
    main_clause: {
      type: Type.OBJECT,
      properties: {
        subject: { type: Type.STRING },
        verb: { type: Type.STRING },
        complement: {
          type: Type.STRING,
          description: "Object, predicative, or complement. Can be empty.",
        },
      },
      required: ["subject", "verb"],
    },
    core_skeleton: {
      type: Type.STRING,
      description: "The minimal understandable skeleton of the sentence",
    },
    components: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING },
          role: { type: Type.STRING },
          modifies: {
            type: Type.STRING,
            description: "What this component modifies or explains",
          },
          explains: { type: Type.STRING },
        },
        required: ["text", "role"],
      },
    },
    structure_tree: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING },
          children: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
              },
            },
          },
        },
        required: ["label"],
      },
    },
    meaning: {
      type: Type.OBJECT,
      properties: {
        literal_cn: {
          type: Type.STRING,
          description: "Literal translation sticking to the structure",
        },
        natural_cn: {
          type: Type.STRING,
          description: "Natural Chinese translation",
        },
      },
      required: ["literal_cn", "natural_cn"],
    },
    key_points: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          point: { type: Type.STRING },
        },
        required: ["point"],
      },
    },
    chunks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          expression: { type: Type.STRING },
          meaning: { type: Type.STRING },
          examples: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ["expression", "meaning", "examples"],
      },
    },
    review_summary: {
      type: Type.OBJECT,
      properties: {
        look_first: { type: Type.STRING },
        easy_to_misread: { type: Type.STRING },
        how_to_parse_next_time: { type: Type.STRING },
      },
      required: ["look_first", "easy_to_misread", "how_to_parse_next_time"],
    },
    quiz: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          reference_answer: { type: Type.STRING },
        },
        required: ["question", "reference_answer"],
      },
    },
  },
  required: [
    "sentence",
    "sentence_type",
    "main_clause",
    "core_skeleton",
    "components",
    "structure_tree",
    "meaning",
    "key_points",
    "chunks",
    "review_summary",
    "quiz",
  ],
};

export async function analyzeSentence(sentence: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Analyze the following English sentence according to the required structure. 
    Focus on breaking down the sentence structure, identifying the main clause, modifiers, and providing a clear explanation for Chinese learners.
    
    Sentence: "${sentence}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: analysisSchema,
      systemInstruction:
        "You are an expert English teacher helping students understand complex sentence structures. Always prioritize structure over simple translation. Identify the main skeleton first, then explain what each modifier attaches to. Provide literal translations that map to the structure, followed by natural translations.",
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Failed to generate analysis");
  }

  return JSON.parse(text);
}
