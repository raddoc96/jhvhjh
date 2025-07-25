import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { AvailableModel, InitialAIResponse, EnhancedAIResponse, InitialMarpAIResponse, EnhancedMarpAIResponse, UserProvidedImage, AISuggestedImage, SearchResultItem, UserProvidedVideo, AISuggestedVideo, UserProvidedChart, AISuggestedChart, UserProvidedTable, AISuggestedTable, HierarchyNode, MediaRequest } from '../types';

const MODEL_CONFIG = {
  // temperature: 1, // This can be adjusted
  // topP: 0.95,     // This can be adjusted
  // topK: 64,       // This can be adjusted
  // maxOutputTokens: 8192, // This can be adjusted
  // responseMimeType: 'application/json',
};

const SAFETY_SETTINGS = {
  [HarmCategory.HARM_CATEGORY_HARASSMENT]: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  [HarmCategory.HARM_CATEGORY_HATE_SPEECH]: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  [HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT]: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  [HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT]: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
};

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private onModelSwitch: (newModel: AvailableModel, oldModel: AvailableModel, reason: string) => void;


  constructor(apiKey: string, onModelSwitchCallback: (newModel: AvailableModel, oldModel: AvailableModel, reason: string) => void) {
    if (!apiKey) {
      throw new Error("API key is required to initialize GeminiService.");
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.onModelSwitch = onModelSwitchCallback;
  }

  private getModel(modelName: AvailableModel) {
    return this.genAI.getGenerativeModel({
      model: modelName,
      safetySettings: SAFETY_SETTINGS,
      generationConfig: MODEL_CONFIG,
    });
  }

  async verifyApiKey(): Promise<void> {
    try {
      // Use a lightweight model for a quick and cheap verification call.
      const model = this.getModel('gemini-2.5-flash-lite-preview-06-17');
      // Perform a simple, low-token request to ensure the key is valid.
      await model.countTokens("ping");
    } catch (error: any) {
      console.error("API Key verification failed:", error);
      // Re-throw a more specific error to be caught by the UI.
      throw new Error("API Key is invalid or has insufficient permissions.");
    }
  }

  async generateInitialPresentation(
    data: string,
    slides: number | 'optimum',
    modelName: AvailableModel,
    useSearch: boolean
  ): Promise<InitialAIResponse> {
    const model = this.getModel(modelName);
    const prompt = `
      You are an expert presentation creator. Based on the following data, generate a complete HTML presentation using reveal.js.
      The user wants a presentation with ${slides} slides.
      The data is:
      ${data}
      ${useSearch ? 'You can use Google Search to find more information.' : ''}
      The output should be a JSON object with the following properties:
      - "html_content": A string containing the full HTML for the presentation.
      - "chosen_theme": A string representing the chosen reveal.js theme.
      - "image_suggestions": An array of objects, each with "slide_reference" and "description".
      - "video_suggestions": An array of objects, each with "slide_reference", "description", and "media_type".
      - "chart_suggestions": An array of objects, each with "slide_reference", "chart_type", "data_description_or_ai_query", "description", and "title".
      - "table_suggestions": An array of objects, each with "slide_reference", "data_description_or_ai_query", "description", and "title".
      - "enhancement_queries": A string with questions for the user on how to improve the presentation.
      - "search_results": An array of objects with "uri" and "title" if search was used.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text());
  }

  async enhancePresentation(
    baseHtml: string,
    images: UserProvidedImage[],
    videos: UserProvidedVideo[],
    charts: UserProvidedChart[],
    tables: UserProvidedTable[],
    enhancementRequests: string,
    modelName: AvailableModel,
    additionalContent: string | null,
    fixLayout: boolean,
    fixAnimations: boolean,
    layoutFixSlideNumbers: string,
    animationFixSlideNumbers: string,
    addMindMap: boolean
  ): Promise<EnhancedAIResponse> {
    const model = this.getModel(modelName);
    const prompt = `
      You are an expert presentation editor. Enhance the following reveal.js HTML presentation based on the user's requests.
      Base HTML:
      ${baseHtml}
      User Images:
      ${JSON.stringify(images)}
      User Videos:
      ${JSON.stringify(videos)}
      User Charts:
      ${JSON.stringify(charts)}
      User Tables:
      ${JSON.stringify(tables)}
      Enhancement Requests:
      ${enhancementRequests}
      Additional Content:
      ${additionalContent || 'None'}
      Fix Layout Issues: ${fixLayout}
      Fix Animation Issues: ${fixAnimations}
      Layout Fix Slide Numbers: ${layoutFixSlideNumbers}
      Animation Fix Slide Numbers: ${animationFixSlideNumbers}
      Add Mind Map Slide: ${addMindMap}
      The output should be a JSON object with the following properties:
      - "enhanced_html_content": The updated HTML content.
      - "ai_confirmation_or_further_queries": A string confirming changes or asking for more details.
      - "search_results": An array of objects with "uri" and "title" if search was used.
      - "mind_map_data": A JSON object for the mind map if requested.
    `;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text());
  }

  async generatePptxTextContent(html: string, modelName: AvailableModel): Promise<string> {
    const model = this.getModel(modelName);
    const prompt = `
      Extract the text content from the following reveal.js HTML presentation.
      Format the output as a plain text file, with each slide's content clearly separated.
      HTML:
      ${html}
    `;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  async generateInitialMarp(
    data: string,
    slides: number | 'optimum',
    modelName: AvailableModel,
    useSearch: boolean
  ): Promise<InitialMarpAIResponse> {
    // ... (implementation similar to generateInitialPresentation but for Marp)
    return {} as InitialMarpAIResponse;
  }

  async enhanceMarpCode(
    baseMarp: string,
    images: UserProvidedImage[],
    videos: UserProvidedVideo[],
    charts: UserProvidedChart[],
    tables: UserProvidedTable[],
    enhancementRequests: string,
    modelName: AvailableModel,
    additionalContent: string | null
  ): Promise<EnhancedMarpAIResponse> {
    // ... (implementation similar to enhancePresentation but for Marp)
    return {} as EnhancedMarpAIResponse;
  }

  async generateMarpFromHtml(
    html: string,
    modelName: AvailableModel,
    images: UserProvidedImage[],
    videos: UserProvidedVideo[],
    charts: UserProvidedChart[],
    tables: UserProvidedTable[]
  ): Promise<InitialMarpAIResponse> {
    // ... (implementation to convert HTML to Marp)
    return {} as InitialMarpAIResponse;
  }

  async generateHtmlFromMarp(
    marp: string,
    modelName: AvailableModel,
    images: UserProvidedImage[],
    videos: UserProvidedVideo[],
    charts: UserProvidedChart[],
    tables: UserProvidedTable[]
  ): Promise<InitialAIResponse> {
    // ... (implementation to convert Marp to HTML)
    return {} as InitialAIResponse;
  }

  async researchTopic(
    topic: string,
    modelName: AvailableModel
  ): Promise<{ text: string; searchResults?: SearchResultItem[] }> {
    // ... (implementation for topic research)
    return { text: "" };
  }

  async generateInteractiveSpec(
    htmlHistory: string[],
    previousSpecs: string[],
    modelName: AvailableModel
  ): Promise<{ spec_file_content: string }> {
    // ... (implementation for generating interactive spec)
    return { spec_file_content: "" };
  }

  async generateInteractiveSlideFromSpec(
    spec: string,
    currentHtml: string,
    modelName: AvailableModel
  ): Promise<{ final_presentation_html_with_interactive_slide_inserted: string; interactive_slide_section_only: string }> {
    // ... (implementation for generating interactive slide)
    return { final_presentation_html_with_interactive_slide_inserted: "", interactive_slide_section_only: "" };
  }

  async critiqueHtml(
    html: string,
    modelName: AvailableModel
  ): Promise<string> {
    // ... (implementation for critiquing HTML)
    return "";
  }

  async explainErrorSimply(
    context: any,
    error: string,
    modelName: AvailableModel
  ): Promise<string> {
    // ... (implementation for explaining errors)
    return "";
  }
}
