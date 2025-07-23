

export enum AppStep {
  SETUP = 'SETUP',
  // HTML Track
  GENERATING_INITIAL_HTML = 'GENERATING_INITIAL_HTML',
  INITIAL_HTML_READY = 'INITIAL_HTML_READY',
  GENERATING_ENHANCED_HTML = 'GENERATING_ENHANCED_HTML',
  ENHANCED_HTML_READY = 'ENHANCED_HTML_READY',
  GENERATING_PPT_TEXT = 'GENERATING_PPT_TEXT', // From HTML
  PPT_TEXT_READY = 'PPT_TEXT_READY',
  // Marp Track
  GENERATING_INITIAL_MARP = 'GENERATING_INITIAL_MARP',
  INITIAL_MARP_READY = 'INITIAL_MARP_READY',
  GENERATING_ENHANCED_MARP = 'GENERATING_ENHANCED_MARP',
  ENHANCED_MARP_READY = 'ENHANCED_MARP_READY',
  // Common Refinement Input Step (used by both HTML and Marp tracks)
  AWAITING_USER_IMAGE_ENHANCEMENT_INPUT = 'AWAITING_USER_IMAGE_ENHANCEMENT_INPUT',
  // Agent Track
  AGENT_RUNNING = 'AGENT_RUNNING',
  AGENT_COMPLETED = 'AGENT_COMPLETED',
}

export type AvailableModel =
  | 'gemini-2.5-pro'
  | 'gemini-2.5-flash'
  | 'gemini-2.5-flash-lite-preview-06-17'
  | 'gemini-2.5-flash-preview-04-17';

export interface Annotation {
  id: string; // A unique identifier, e.g., created with UUID or crypto.randomUUID()
  type: 'text' | 'arrow' | 'circle' | 'rectangle';
  // Positioning and Sizing (as percentages of the image dimensions, e.g., 0.5 is 50%)
  x: number;
  y: number;
  width: number; // For text boxes and shapes
  height: number; // For text boxes and shapes
  rotation: number; // Rotation in degrees
  // Specific properties
  text?: string; // For type: 'text'
  // Common styling properties
  color: string;
  strokeWidth: number;
  fontSize: number; // For type: 'text'
}

export interface AISuggestedImage {
  slide_reference: string; 
  description: string;
}

export interface UserProvidedImage {
  type: 'ai_suggested' | 'user_defined_existing_slide' | 'user_defined_new_slide';
  url: string;
  description: string; 
  suggestion_reference?: string; 
  original_ai_description?: string; 
  slide_number?: number;
  placement?: 'background' | 'inline'; // Relevant for HTML
  after_slide_number?: number; 
  letAiDecidePlacement?: boolean; 
  annotations?: Annotation[]; // Add this optional property
  animationSequence?: string[]; // Add this optional property (array of annotation IDs in order of appearance)
}

export interface AISuggestedVideo {
  slide_reference: string; 
  description: string; 
  media_type: 'video' | 'gif'; 
}

export interface UserProvidedVideo {
  type: 'ai_suggested_video' | 'user_defined_video_existing_slide' | 'user_defined_video_new_slide';
  url: string; 
  description: string; 
  media_type: 'video' | 'gif' | 'youtube_embed' | 'scrollable_video_direct_url'; 
  suggestion_reference?: string; 
  original_ai_description?: string;
  slide_number?: number;
  placement?: 'inline'; // Relevant for HTML
  after_slide_number?: number;
  startTime?: number; 
  endTime?: number;   
  letAiDecidePlacement?: boolean; 
  // Fields for scrollable_video_direct_url
  frameExtractionMethod?: 'quick' | 'fps' | 'fixed_count' | 'all';
  extractionFps?: number;
  extractionFixedCount?: number;
}

export type ChartJsChartType = 'bar' | 'line' | 'pie' | 'doughnut' | 'radar' | 'polarArea' | 'scatter' | 'bubble';

export interface AISuggestedChart {
  slide_reference: string;
  chart_type: ChartJsChartType;
  description: string; // e.g., "A bar chart showing quarterly sales figures."
  data_description_or_ai_query: string; // e.g., "Data: Q1 $100, Q2 $150. Labels: Q1, Q2", or "Generate data from slide 3 for growth"
  title?: string;
}

export interface UserProvidedChart {
  type: 'ai_suggested_chart' | 'user_defined_chart_existing_slide' | 'user_defined_chart_new_slide';
  chart_type: ChartJsChartType;
  data_input: string; // User-provided data (CSV-like, natural language for AI) or AI-parsed data for re-generation.
  description: string; // User's description for the chart, or AI's suggestion
  original_ai_description?: string; // If based on AI suggestion
  suggestion_reference?: string; // If based on AI suggestion
  slide_number?: number;
  after_slide_number?: number;
  letAiDecidePlacement?: boolean;
  title?: string;
}

export interface AISuggestedTable {
  slide_reference: string;
  description: string; // e.g., "A table comparing product features."
  data_description_or_ai_query: string; // e.g., "Headers: F, B, C. Data: 3 rows for P A, B, C", or "Summarize pros/cons into table."
  num_rows?: number;
  num_cols?: number;
  title?: string;
}

export interface UserProvidedTable {
  type: 'ai_suggested_table' | 'user_defined_table_existing_slide' | 'user_defined_table_new_slide';
  data_input: string; // User-provided data (CSV-like, Markdown, natural language)
  description: string; // User's description for table's purpose
  original_ai_description?: string;
  suggestion_reference?: string;
  slide_number?: number;
  after_slide_number?: number;
  letAiDecidePlacement?: boolean;
  title?: string;
}

export interface HierarchyNode {
  name: string;
  children?: HierarchyNode[];
}


// For HTML Generation
export interface InitialAIResponse { 
  html_content: string; 
  chosen_theme: string; 
  image_suggestions: AISuggestedImage[];
  video_suggestions: AISuggestedVideo[];
  chart_suggestions: AISuggestedChart[]; // New
  table_suggestions: AISuggestedTable[]; // New
  enhancement_queries: string; 
  search_results?: SearchResultItem[]; 
}

export interface EnhancedAIResponse { 
  enhanced_html_content: string; 
  ai_confirmation_or_further_queries: string;
  search_results?: SearchResultItem[];
  mind_map_data?: HierarchyNode | null;
}

// For Marp Generation
export interface InitialMarpAIResponse {
  marp_code_content: string;
  chosen_theme: string; 
  image_suggestions: AISuggestedImage[]; 
  video_suggestions: AISuggestedVideo[]; 
  chart_suggestions: AISuggestedChart[]; // New
  table_suggestions: AISuggestedTable[]; // New
  enhancement_queries: string; 
  search_results?: SearchResultItem[];
}

export interface EnhancedMarpAIResponse {
  enhanced_marp_code_content: string;
  ai_confirmation_or_further_queries: string;
  search_results?: SearchResultItem[]; 
}


export interface SearchResultItem {
  uri: string;
  title: string;
}

export interface InteractiveSlideRecord {
  spec: string;
  htmlContent: string; 
}


export interface ImageConfigItem { 
  id: string;
  url: string;
  description: string;
  width?: number;
  height?: number;
}

export interface ImageInputData { 
  [id: string]: string; 
}

export interface NewImageInputData { 
  url:string;
  description: string;
}

export interface ImageUpdatePayload { 
  placeholderReplacements: ImageInputData;
  newOrDifferentImages: NewImageInputData[];
}

// For Lyra Music Generation
export interface WeightedPrompt {
  text: string;
  weight: number;
}

// For Agentic Workflow
export interface MediaRequest {
  id: string; // A unique ID for this request
  type: 'image'; // Can be extended to 'video', 'gif'
  description: string; // Prompt for AI or description for user
  assignee: 'ai' | 'user'; // Who should fulfill this request
  slide_reference: string;
}

export interface AgentAnalysisResponse {
  critique: string;
  enhancement_plan: string[];
  media_requests: MediaRequest[];
  chart_suggestions?: AISuggestedChart[];
  table_suggestions?: AISuggestedTable[];
  is_perfect: boolean;
  confidence_score: number; // 0.0 to 1.0
  request_mind_map_slide?: boolean;
}