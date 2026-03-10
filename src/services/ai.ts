import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResultSchema, type AnalysisResult } from "../types/index.js";

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
          description: "句子类型，用中文，例如：简单句、复合句、复杂句、复合复杂句",
        },
        summary: {
          type: Type.STRING,
          description: "用中文简要描述该句子的结构特点，面向正在学英语的中文读者",
        },
      },
      required: ["category", "summary"],
    },
    main_clause: {
      type: Type.OBJECT,
      properties: {
        subject: {
          type: Type.STRING,
          description: "The subject of the main clause (keep in English)",
        },
        verb: {
          type: Type.STRING,
          description: "The main verb (keep in English)",
        },
        complement: {
          type: Type.STRING,
          description: "宾语、表语或补语，用中文标注。可以为空。",
        },
      },
      required: ["subject", "verb"],
    },
    core_skeleton: {
      type: Type.STRING,
      description: "The minimal understandable skeleton of the sentence (keep in English)",
    },
    components: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text: {
            type: Type.STRING,
            description: "The exact English text span from the sentence (keep in English)",
          },
          role: {
            type: Type.STRING,
            description: "该成分的语法角色，用中文，例如：主语、谓语、状语从句、定语",
          },
          modifies: {
            type: Type.STRING,
            description: "该成分修饰的对象，用中文说明",
          },
          explains: {
            type: Type.STRING,
            description: "对该成分的详细中文解释",
          },
        },
        required: ["text", "role"],
      },
    },
    structure_tree: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          label: {
            type: Type.STRING,
            description: "语法结构标签，可使用通用语法符号（如NP、VP、S），完整标签用中文",
          },
          children: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: {
                  type: Type.STRING,
                  description: "语法结构标签，可使用通用语法符号（如NP、VP、S），完整标签用中文",
                },
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
          description: "逐词对照英文结构的中文直译",
        },
        natural_cn: {
          type: Type.STRING,
          description: "通顺的中文意译",
        },
      },
      required: ["literal_cn", "natural_cn"],
    },
    key_points: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          point: {
            type: Type.STRING,
            description: "一条学习要点或语法提示，用中文写",
          },
        },
        required: ["point"],
      },
    },
    chunks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          expression: {
            type: Type.STRING,
            description: "The English expression or phrase (keep in English)",
          },
          meaning: {
            type: Type.STRING,
            description: "该英文表达的中文含义",
          },
          examples: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "English example sentences using this expression (keep in English)",
          },
        },
        required: ["expression", "meaning", "examples"],
      },
    },
    review_summary: {
      type: Type.OBJECT,
      properties: {
        look_first: {
          type: Type.STRING,
          description: "解读这类句子时第一眼应该找什么，用中文写",
        },
        easy_to_misread: {
          type: Type.STRING,
          description: "这个句子容易被误读的地方，用中文写",
        },
        how_to_parse_next_time: {
          type: Type.STRING,
          description: "下次遇到类似句子的解析策略，用中文写",
        },
      },
      required: ["look_first", "easy_to_misread", "how_to_parse_next_time"],
    },
    practice: {
      type: Type.OBJECT,
      properties: {
        scenario: {
          type: Type.STRING,
          description: "用中文描述一个具体场景，让用户在该场景下练习翻译，场景应与被分析句子的内容和结构直接相关",
        },
        tasks: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              cn: {
                type: Type.STRING,
                description: "需要用户翻译成英文的中文句子",
              },
              hint: {
                type: Type.STRING,
                description: "明确提示用户应使用的词块或结构，例如：请用 despite 或 in spite of",
              },
              reference: {
                type: Type.STRING,
                description: "标准参考译文，用英文写，仅在用户提交后展示 (keep in English)",
              },
            },
            required: ["cn", "hint", "reference"],
          },
        },
      },
      required: ["scenario", "tasks"],
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
    "practice",
  ],
};

export async function analyzeSentence(sentence: string): Promise<AnalysisResult> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Analyze the following English sentence according to the required structure.
    Focus on breaking down the sentence structure, identifying the main clause, modifiers, and providing a clear explanation for Chinese learners.

    Sentence: "${sentence}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: analysisSchema,
      systemInstruction: `You are an expert English teacher helping Chinese learners understand complex English sentence structures.

LANGUAGE RULES — follow strictly:
- Write ALL explanatory content in Simplified Chinese (简体中文): descriptions, summaries, role labels, explanations, tips, questions, answers, meanings.
- Keep ALL English source material in English: the original sentence, quoted words, core skeleton, grammar notation (NP, VP, S), and example sentences in chunks.
- Never mix languages within a single field value.

ANALYSIS APPROACH:
Identify the main skeleton first, then explain what each modifier attaches to in Chinese. Provide a literal Chinese translation that mirrors the English structure, then a natural Chinese translation.

OUTPUT PRACTICE:
Generate a concrete, scenario-based practice section. The scenario should be directly related to the analyzed sentence's content and structures. Each translation task must target a specific chunk or expression from the analysis. Always generate 2-3 translation tasks, even for simple sentences — vary the structure if chunks are limited.`,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Failed to generate analysis");
  }

  return AnalysisResultSchema.parse(JSON.parse(text));
}
