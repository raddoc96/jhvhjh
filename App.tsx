
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { AppStep, InitialAIResponse, EnhancedAIResponse, UserProvidedImage, AISuggestedImage, SearchResultItem, AvailableModel, InteractiveSlideRecord, UserProvidedVideo, AISuggestedVideo, InitialMarpAIResponse, EnhancedMarpAIResponse, WeightedPrompt, UserProvidedChart, UserProvidedTable, AISuggestedChart, AISuggestedTable, HierarchyNode, MediaRequest } from './types'; // Added chart/table types
import { GeminiService } from './services/GeminiService';
import { ApiKeyService } from './services/ApiKeyService';
import { ApiKeyModal } from './components/ApiKeyModal';
import { AgentService } from './services/agentService';
import { LyraService, LyraConnectionStatus, LyraPlaybackStatus } from './services/lyraService';
import FileUpload from './components/FileUpload';
import NumberInput from './components/NumberInput';
import PresentationPreview from './components/PresentationPreview';
import ImageInputForm from './components/ImageInputForm';
import LoadingSpinner from './components/LoadingSpinner';
import Button from './components/Button';
import Header from './components/Header';
import StepIndicator from './components/StepIndicator';
import ModelSelector from './components/ModelSelector';
import AudioInputControl from './components/AudioInputControl';
import InstructionsSection from './components/InstructionsSection';
import CollapsibleSection from './components/CollapsibleSection';
import MusicControls from './components/MusicControls';
import AgentView from './components/AgentView';
import { ChevronDownIcon, ChevronUpIcon, ClipboardDocumentIcon, DocumentArrowDownIcon, SparklesIcon, ArrowPathIcon, PlayIcon, CogIcon, DocumentTextIcon, LightBulbIcon, MagnifyingGlassIcon, EyeIcon, CheckIcon, InformationCircleIcon, GlobeAltIcon, PaletteIcon, ArchiveBoxIcon, MicrophoneIcon, TrashIcon, CheckCircleIcon as PageTitleCheckIcon, WandMagicSparklesIcon, XMarkIcon, FilmIcon, PhotoIcon, PlusCircleIcon, CodeBracketSquareIcon, ArrowRightLeftIcon, ArrowsPointingOutIcon, ChartBarIcon, TableCellsIcon, CpuChipIcon, HeartIcon, CoffeeIcon, TwitterIcon, YouTubeIcon, TelegramIcon, WhatsAppIcon } from './components/Icons';
import { validThemes, generateFullRevealHtmlPage } from './utils/htmlGenerator';

const PRO_MODEL_FOR_INTERACTIVE: AvailableModel = 'gemini-2.5-pro';

export const App: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<'html' | 'marp'>('html');
  const [uploadedFilesData, setUploadedFilesData] = useState<Array<{ name: string; content: string }>>([]);
  const [pastedText, setPastedText] = useState<string>('');
  const [topicQuery, setTopicQuery] = useState<string>('');
  const [userPresentationDescription, setUserPresentationDescription] = useState<string>('');
  const [includeFileData, setIncludeFileData] = useState<boolean>(false);
  const [includePastedText, setIncludePastedText] = useState<boolean>(false);
  const [includeTopicQuery, setIncludeTopicQuery] = useState<boolean>(false);
  const [includeUserPresentationDescription, setIncludeUserPresentationDescription] = useState<boolean>(false);
  const [useSearchForTopic, setUseSearchForTopic] = useState<boolean>(true);
  const [additionalUploadedFilesData, setAdditionalUploadedFilesData] = useState<Array<{ name: string; content: string }>>([]);
  const [additionalPastedText, setAdditionalPastedText] = useState<string>('');
  const [additionalTopicQuery, setAdditionalTopicQuery] = useState<string>('');
  const [includeAdditionalFileData, setIncludeAdditionalFileData] = useState<boolean>(false);
  const [includeAdditionalPastedText, setIncludeAdditionalPastedText] = useState<boolean>(false);
  const [includeAdditionalTopicQuery, setIncludeAdditionalTopicQuery] = useState<boolean>(false);
  const [useSearchForAdditionalTopic, setUseSearchForAdditionalTopic] = useState<boolean>(true);
  const [minSlides, setMinSlides] = useState<number>(5);
  const [letAiDecideSlides, setLetAiDecideSlides] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.SETUP);
  const [initialAIResponse, setInitialAIResponse] = useState<InitialAIResponse | null>(null);
  const [enhancedAIResponse, setEnhancedAIResponse] = useState<EnhancedAIResponse | null>(null);
  const [allHtmlVersions, setAllHtmlVersions] = useState<string[]>([]);
  const [pptxTextContent, setPptxTextContent] = useState<string | null>(null);
  const [initialMarpResponse, setInitialMarpResponse] = useState<InitialMarpAIResponse | null>(null);
  const [enhancedMarpResponse, setEnhancedMarpResponse] = useState<EnhancedMarpAIResponse | null>(null);
  const [allMarpVersions, setAllMarpVersions] = useState<string[]>([]);
  const [userImageInputs, setUserImageInputs] = useState<UserProvidedImage[]>([]);
  const [userVideoInputs, setUserVideoInputs] = useState<UserProvidedVideo[]>([]);
  const [userChartInputs, setUserChartInputs] = useState<UserProvidedChart[]>([]); // New
  const [userTableInputs, setUserTableInputs] = useState<UserProvidedTable[]>([]); // New
  const [userEnhancementRequests, setUserEnhancementRequests] = useState<string>('');
  const [includeAiImageSuggestions, setIncludeAiImageSuggestions] = useState<boolean>(true);
  const [includeAiVideoSuggestions, setIncludeAiVideoSuggestions] = useState<boolean>(true);
  const [includeAiChartSuggestions, setIncludeAiChartSuggestions] = useState<boolean>(true);
  const [includeAiTableSuggestions, setIncludeAiTableSuggestions] = useState<boolean>(true);
  const [fixLayoutIssues, setFixLayoutIssues] = useState<boolean>(false);
  const [prioritizeAnimationFixes, setPrioritizeAnimationFixes] = useState<boolean>(false);
  const [layoutFixSlideNumbers, setLayoutFixSlideNumbers] = useState<string>(''); // New
  const [animationFixSlideNumbers, setAnimationFixSlideNumbers] = useState<string>(''); // New
  const [addMindMapSlide, setAddMindMapSlide] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [errorExplanation, setErrorExplanation] = useState<string | null>(null);
  const [isExplainingError, setIsExplainingError] = useState<boolean>(false);
  const [showInlinePreview, setShowInlinePreview] = useState<boolean>(false);
  const [isPresentationModalOpen, setIsPresentationModalOpen] = useState<boolean>(false);
  const [showMarpCodePreview, setShowMarpCodePreview] = useState<boolean>(true);
  const [showAiSuggestions, setShowAiSuggestions] = useState<boolean>(true);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(true);
  const [showPptxText, setShowPptxText] = useState<boolean>(true);
  const [displayTheme, setDisplayTheme] = useState<string>(validThemes[0]);
  const defaultModel: AvailableModel = 'gemini-2.5-flash-lite-preview-06-17';
  const [selectedModel, setSelectedModel] = useState<AvailableModel>(defaultModel);
  const [isCritiquing, setIsCritiquing] = useState<boolean>(false); // New state for AI Critic
  const availableModels: AvailableModel[] = [
    'gemini-2.5-flash-lite-preview-06-17',
    'gemini-2.5-flash',
    'gemini-2.5-pro',
  ];
  const modelDisplayNames: Record<AvailableModel, string> = {
    'gemini-2.5-pro': 'Gemini 2.5 Pro',
    'gemini-2.5-flash': 'Gemini 2.5 Flash',
    'gemini-2.5-flash-lite-preview-06-17': 'Gemini 2.5 Flash Lite',
    'gemini-2.5-flash-preview-04-17': 'Gemini 2.5 Flash (04-17)',
  };
  const [useFullHistoryForRefinement, setUseFullHistoryForRefinement] = useState<boolean>(false);
  const [editableInteractiveSpec, setEditableInteractiveSpec] = useState<string | null>(null);
  const [previousInteractiveSlides, setPreviousInteractiveSlides] = useState<InteractiveSlideRecord[]>([]);
  const [currentAiGeneratedSpecDraft, setCurrentAiGeneratedSpecDraft] = useState<string | null>(null);
  const [interactiveSlideModalState, setInteractiveSlideModalState] = useState<'hidden' | 'generating_spec' | 'editing_spec' | 'generating_html'>('hidden');
  const [hasIntegratedInteractiveSlide, setHasIntegratedInteractiveSlide] = useState<boolean>(false);
  const [phase1LoadingMessage, setPhase1LoadingMessage] = useState<string | null>(null);
  const [microphonePermissionStatus, setMicrophonePermissionStatus] = useState<'idle' | 'pending' | 'granted' | 'denied' | 'unavailable'>('idle');
  const [modelFallbackNotification, setModelFallbackNotification] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(true);
  const [isApiKeyLoading, setIsApiKeyLoading] = useState<boolean>(false);

  // --- Agent State ---
  const [agentLog, setAgentLog] = useState<string[]>([]);
  const [finalAgentHtml, setFinalAgentHtml] = useState<string | null>(null);
  const [finalAgentTheme, setFinalAgentTheme] = useState<string>(validThemes[0]);
  const [agentUserImages, setAgentUserImages] = useState<UserProvidedImage[]>([]);
  const [agentRefinementInstructions, setAgentRefinementInstructions] = useState<string>('');
  const [isAgentRefining, setIsAgentRefining] = useState<boolean>(false);
  const [agentWorkerModel, setAgentWorkerModel] = useState<AvailableModel>('gemini-2.5-flash');
  const [isAgentPausedForUserTasks, setIsAgentPausedForUserTasks] = useState<boolean>(false);
  const [tasksForUser, setTasksForUser] = useState<MediaRequest[]>([]);
  const [agentTaskUrls, setAgentTaskUrls] = useState<Record<string, string>>({});
  const [allowAgentToRequestUserTasks, setAllowAgentToRequestUserTasks] = useState<boolean>(true);
  const userTaskCompletionResolver = useRef<((value: Record<string, string>) => void) | null>(null);


  // --- Lyra Music State ---
  const [lyraServiceInstance, setLyraServiceInstance] = useState<LyraService | null>(null);
  const [lyraConnectionStatus, setLyraConnectionStatus] = useState<LyraConnectionStatus>('disconnected');
  const [lyraPlaybackStatus, setLyraPlaybackStatus] = useState<LyraPlaybackStatus>('stopped');
  const [lyraErrorMessage, setLyraErrorMessage] = useState<string | undefined>(undefined);
  const [lyraCurrentPromptsText, setLyraCurrentPromptsText] = useState<string>("");
  const [isLyraServiceAvailable, setIsLyraServiceAvailable] = useState<boolean>(false);
  const currentSlideTextRef = useRef<string>("");

  const handleModelSwitchNotification = (newModel: AvailableModel, oldModel: AvailableModel, reasonSuffix: string) => {
    const oldModelName = modelDisplayNames[oldModel] || oldModel;
    const newModelName = modelDisplayNames[newModel] || newModel;
    setModelFallbackNotification(`Switched from ${oldModelName} to ${newModelName}. ${reasonSuffix}`);
    setSelectedModel(newModel);
  };

  const geminiService = useMemo(() => {
    if (!apiKey) return null;
    try {
      return new GeminiService(apiKey, handleModelSwitchNotification);
    } catch (e) {
      console.error("Failed to instantiate GeminiService:", e);
      const errorMessage = `Critical: Failed to initialize AI Service. ${e instanceof Error ? e.message : String(e)}. Please ensure API_KEY is correctly set.`;
      setError(prevError => prevError ? `${prevError}\n${errorMessage}` : errorMessage);
      return null;
    }
  }, [apiKey]);

  useEffect(() => {
    const storedApiKey = ApiKeyService.getApiKey();
    if (storedApiKey) {
      setApiKey(storedApiKey);
      setIsApiKeyModalOpen(false);
    }
  }, []);

  const handleApiKeySubmit = async (newApiKey: string) => {
    setIsApiKeyLoading(true);
    try {
      const tempService = new GeminiService(newApiKey, handleModelSwitchNotification);
      await tempService.verifyApiKey();
      ApiKeyService.setApiKey(newApiKey);
      setApiKey(newApiKey);
      setIsApiKeyModalOpen(false);
    } catch (e) {
      setError('Invalid API Key. Please check your key and try again.');
    } finally {
      setIsApiKeyLoading(false);
    }
  };

    const replaceImagePlaceholdersWithData = (htmlContent: string | null, images: UserProvidedImage[]): string => {
    if (!htmlContent) return '';
    let finalHtml = htmlContent;
    images.forEach((img, index) => {
        if (img.url && img.url.startsWith('data:image')) {
            const placeholder = `ai_image_ref:${index}`;
            const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const srcAttrRegex = new RegExp(`src=(['"])${escapedPlaceholder}\\1`, 'g');
            finalHtml = finalHtml.replace(srcAttrRegex, `src=$1${img.url}$1`);
            const dataBgAttrRegex = new RegExp(`data-background-image=(['"])${escapedPlaceholder}\\1`, 'g');
            finalHtml = finalHtml.replace(dataBgAttrRegex, `data-background-image=$1${img.url}$1`);
            const styleUrlRegex = new RegExp(`url\\((['"]?)${escapedPlaceholder}\\1\\)`, 'g');
            finalHtml = finalHtml.replace(styleUrlRegex, `url($1${img.url}$1)`);
        }
    });
    return finalHtml;
  };

  const extractFirstSlideText = (htmlContent: string): string => {
    if (typeof DOMParser === 'undefined') return ''; // Avoid SSR errors if ever used
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const firstSection = doc.querySelector('.slides section');
        if (firstSection) {
            const clone = firstSection.cloneNode(true) as HTMLElement;
            clone.querySelectorAll('aside.notes, script, style').forEach(el => el.remove());
            let text = clone.textContent?.replace(/\s+/g, ' ').trim() || '';
            if (text.length > 1500) text = text.substring(0, 1500) + "...";
            return text;
        }
    } catch (e) {
        console.error("Failed to parse and extract first slide text:", e);
    }
    return '';
  };

  // Initialize Lyra Service
  useEffect(() => {
    if (geminiService) {
        const lyraService = new LyraService(
            geminiService,
            (status, message) => { setLyraConnectionStatus(status); if (message) setLyraErrorMessage(message); else if (status !== 'error') setLyraErrorMessage(undefined); },
            (status, message) => setLyraPlaybackStatus(status),
            (reason, text) => { alert(`Lyra prompt "${text}" filtered due to: ${reason}`);}
        );
        setLyraServiceInstance(lyraService);
        setIsLyraServiceAvailable(true);
    } else {
        setIsLyraServiceAvailable(false);
    }
    return () => {
        lyraServiceInstance?.reset();
    }
  }, [geminiService]);


  // Handle messages from PresentationPreview iframe (for Lyra slide changes)
  useEffect(() => {
    const handleIframeMessage = async (event: MessageEvent) => {
      if (event.data && event.data.type === 'revealjsSlideChanged') {
        const { text: slideText } = event.data;
        currentSlideTextRef.current = slideText || "";

        if (lyraServiceInstance && lyraConnectionStatus === 'setup_complete' && lyraServiceInstance.isPlaying) {
          if (currentSlideTextRef.current) {
            await lyraServiceInstance.updateMusicForSlide(currentSlideTextRef.current);
            setLyraCurrentPromptsText(lyraServiceInstance.currentPrompts.map(p => p.text).join(', ') || "Default theme");
          }
        }
      }
    };
    window.addEventListener('message', handleIframeMessage);
    return () => {
      window.removeEventListener('message', handleIframeMessage);
    };
  }, [lyraServiceInstance, lyraConnectionStatus]);


  const getActiveSearchResults = (): SearchResultItem[] | undefined => {
    if (currentMode === 'html') {
      if (currentStep === AppStep.ENHANCED_HTML_READY || currentStep === AppStep.PPT_TEXT_READY) {
        if (enhancedAIResponse?.search_results && enhancedAIResponse.search_results.length > 0) return enhancedAIResponse.search_results;
      }
      if (initialAIResponse?.search_results && initialAIResponse.search_results.length > 0) return initialAIResponse.search_results;
    } else if (currentMode === 'marp') {
      if (currentStep === AppStep.ENHANCED_MARP_READY) {
         if (enhancedMarpResponse?.search_results && enhancedMarpResponse.search_results.length > 0) return enhancedMarpResponse.search_results;
      }
      if (initialMarpResponse?.search_results && initialMarpResponse.search_results.length > 0) return initialMarpResponse.search_results;
    }
    return undefined;
  }

  const handleAddFiles = (newFiles: Array<{ name: string; content: string }>) => {
    setUploadedFilesData(prevFiles => {
      const updatedFiles = [...prevFiles];
      newFiles.forEach(newFile => {
        const existingFileIndex = updatedFiles.findIndex(f => f.name === newFile.name);
        if (existingFileIndex !== -1) {
          updatedFiles[existingFileIndex] = newFile;
        } else {
          updatedFiles.push(newFile);
        }
      });
      return updatedFiles;
    });
    if (newFiles.length > 0 && !includeFileData) {
        setIncludeFileData(true);
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setUploadedFilesData(prevFiles => {
        const remainingFiles = prevFiles.filter((_, index) => index !== indexToRemove);
        if (remainingFiles.length === 0) {
            setIncludeFileData(false);
        }
        return remainingFiles;
    });
  };

  const handleClearAllFiles = () => {
    setUploadedFilesData([]);
    setIncludeFileData(false);
    const fileInput = document.getElementById('file-upload-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleAddAdditionalFiles = (newFiles: Array<{ name: string; content: string }>) => {
    setAdditionalUploadedFilesData(prevFiles => {
      const updatedFiles = [...prevFiles];
      newFiles.forEach(newFile => {
        const existingFileIndex = updatedFiles.findIndex(f => f.name === newFile.name);
        if (existingFileIndex !== -1) {
          updatedFiles[existingFileIndex] = newFile;
        } else {
          updatedFiles.push(newFile);
        }
      });
      return updatedFiles;
    });
    if (newFiles.length > 0 && !includeAdditionalFileData) {
        setIncludeAdditionalFileData(true);
    }
  };

  const handleRemoveAdditionalFile = (indexToRemove: number) => {
    setAdditionalUploadedFilesData(prevFiles => {
        const remainingFiles = prevFiles.filter((_, index) => index !== indexToRemove);
        if (remainingFiles.length === 0) {
            setIncludeAdditionalFileData(false);
        }
        return remainingFiles;
    });
  };

  const handleClearAllAdditionalFiles = () => {
    setAdditionalUploadedFilesData([]);
    setIncludeAdditionalFileData(false);
    const fileInput = document.getElementById('additional-file-upload-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleGenerateInitial = async () => {
    setModelFallbackNotification(null);
    if (currentMode === 'html') {
      await handleGenerateInitialHtml();
    } else {
      await handleGenerateInitialMarp();
    }
  };


  const handleGenerateInitialHtml = async () => {
    if (!geminiService) { setError("AI Service is not available."); return; }
    setError(null); setErrorExplanation(null); setPhase1LoadingMessage(null);
    setCurrentAiGeneratedSpecDraft(null); setEditableInteractiveSpec(null); setPreviousInteractiveSlides([]);

    if (!letAiDecideSlides && (isNaN(minSlides) || minSlides <= 0)) {
       setError("Please specify a valid positive number for minimum slides, or let the AI decide."); return;
    }

    const inputParts: string[] = []; let isAnyContentInputSelected = false;
    let topicBlockForMainGen: string | null = null;
    let searchResultsFromPhase1: SearchResultItem[] | undefined = undefined;

    const needsPhasedApproach = includeTopicQuery && topicQuery.trim() && useSearchForTopic &&
                                ((includeFileData && uploadedFilesData.length > 0) || (includePastedText && pastedText.trim()));

    setIsLoading(true);
    setInitialAIResponse(null); setEnhancedAIResponse(null); setPptxTextContent(null);
    setAllHtmlVersions([]); setCurrentStep(AppStep.GENERATING_INITIAL_HTML); setHasIntegratedInteractiveSlide(false);

    if (needsPhasedApproach) {
      setPhase1LoadingMessage(`Researching topic "${topicQuery.trim()}" with ${modelDisplayNames[selectedModel] || selectedModel}...`);
      try {
        const researchResponse = await geminiService.researchTopic(topicQuery.trim(), selectedModel);
        topicBlockForMainGen = `--- START OF AI-RESEARCHED TOPIC SUMMARY ---\n${researchResponse.text}\n--- END OF AI-RESEARCHED TOPIC SUMMARY ---`;
        searchResultsFromPhase1 = researchResponse.searchResults; isAnyContentInputSelected = true;
      } catch (e: any) {
        console.error("Error in topic research phase (HTML):", e);
        setError(`Error during topic research: ${e.message || 'Unknown error'}`);
        setIsLoading(false); setPhase1LoadingMessage(null); setCurrentStep(AppStep.SETUP); return;
      }
      setPhase1LoadingMessage(null);
    } else if (includeTopicQuery && topicQuery.trim()) {
      topicBlockForMainGen = `--- START OF USER-SPECIFIED TOPIC (Search ${useSearchForTopic ? 'ENABLED' : 'DISABLED'}) ---\n${topicQuery.trim()}\n--- END OF USER-SPECIFIED TOPIC ---`;
      isAnyContentInputSelected = true;
    }

    if (includeFileData && uploadedFilesData.length > 0) {
      uploadedFilesData.forEach(file => inputParts.push(`--- START OF UPLOADED FILE CONTENT (${file.name}) ---\n${file.content}\n--- END OF UPLOADED FILE CONTENT ---`));
      isAnyContentInputSelected = true;
    }
    if (includePastedText && pastedText.trim()) {
      inputParts.push(`--- START OF PASTED TEXT ---\n${pastedText.trim()}\n--- END OF PASTED TEXT ---`);
      isAnyContentInputSelected = true;
    }
    if (topicBlockForMainGen) inputParts.push(topicBlockForMainGen);

    if (includeUserPresentationDescription && userPresentationDescription.trim()) {
      inputParts.push(`--- START OF USER PRESENTATION DESCRIPTION ---\n${userPresentationDescription.trim()}\n--- END OF USER PRESENTATION DESCRIPTION ---`);
    }

    if (!isAnyContentInputSelected) {
      setError("Please select at least one content input source (file, text, or topic) and provide content for it.");
      setIsLoading(false); setCurrentStep(AppStep.SETUP); return;
    }

    const dataToProcess = inputParts.join("\n\n").trim();
    const finalUseSearchForAIServiceCall = needsPhasedApproach ? false : (includeTopicQuery && topicQuery.trim() && useSearchForTopic);
    const slidesParam = letAiDecideSlides ? "optimum" : minSlides;

    try {
      const response = await geminiService.generateInitialPresentation(dataToProcess, slidesParam, selectedModel, finalUseSearchForAIServiceCall);
      const finalInitialResponse: InitialAIResponse = { ...response, search_results: needsPhasedApproach ? searchResultsFromPhase1 : (response.search_results || []) };
      setInitialAIResponse(finalInitialResponse);
      setAllHtmlVersions([finalInitialResponse.html_content]);
      setDisplayTheme(validThemes.includes(finalInitialResponse.chosen_theme) ? finalInitialResponse.chosen_theme : validThemes[0]);
      setUserImageInputs(finalInitialResponse.image_suggestions.map(s => ({ type: 'ai_suggested', suggestion_reference: s.slide_reference, url: '', description: s.description, original_ai_description: s.description })));
      setUserVideoInputs(finalInitialResponse.video_suggestions.map(v => ({ type: 'ai_suggested_video', suggestion_reference: v.slide_reference, url: '', description: v.description, original_ai_description: v.description, media_type: v.media_type, placement: 'inline' })));
      setUserChartInputs(finalInitialResponse.chart_suggestions.map(c => ({ type: 'ai_suggested_chart', suggestion_reference: c.slide_reference, chart_type: c.chart_type, data_input: c.data_description_or_ai_query, description: c.description, original_ai_description: c.data_description_or_ai_query, title: c.title, letAiDecidePlacement: true })));
      setUserTableInputs(finalInitialResponse.table_suggestions.map(t => ({ type: 'ai_suggested_table', suggestion_reference: t.slide_reference, data_input: t.data_description_or_ai_query, description: t.description, original_ai_description: t.data_description_or_ai_query, title: t.title, letAiDecidePlacement: true })));
      setCurrentStep(AppStep.INITIAL_HTML_READY);
       if (lyraServiceInstance) {
         const firstSlideText = extractFirstSlideText(finalInitialResponse.html_content);
         if (firstSlideText) {
            currentSlideTextRef.current = firstSlideText;
            // Pre-warm the music prompt for the first slide.
            lyraServiceInstance.updateMusicForSlide(firstSlideText)
              .then(() => setLyraCurrentPromptsText(lyraServiceInstance.currentPrompts.map(p => p.text).join(', ') || "Default theme"));
         }
       }
    } catch (e: any) {
      console.error("Error in handleGenerateInitialHtml (main generation):", e);
      setError(`Error generating initial HTML: ${e.message || 'Unknown error'}`); setCurrentStep(AppStep.SETUP);
    }
    setIsLoading(false);
  };

   const handlePauseForUserTasks = (tasks: MediaRequest[]): Promise<Record<string, string>> => {
    return new Promise((resolve) => {
      setTasksForUser(tasks);
      setIsAgentPausedForUserTasks(true);
      const initialUrls: Record<string, string> = {};
      tasks.forEach(task => { initialUrls[task.id] = ''; });
      setAgentTaskUrls(initialUrls);
      userTaskCompletionResolver.current = resolve;
    });
  };

  const handleSubmitUserTasks = () => {
    if (userTaskCompletionResolver.current) {
      userTaskCompletionResolver.current(agentTaskUrls);
      userTaskCompletionResolver.current = null;
    }
    setIsAgentPausedForUserTasks(false);
    setTasksForUser([]);
  };

  const handleCreateAgent = async () => {
    if (!geminiService) { setError("AI Agent cannot start: AI Service is not available."); return; }
    setError(null);
    setAgentLog([]);
    setFinalAgentHtml(null);
    setAgentUserImages([]);
    setAgentRefinementInstructions('');
    setIsAgentRefining(false);

    const inputParts: string[] = [];
    let isAnyContentInputSelected = false;

    if (includeFileData && uploadedFilesData.length > 0) {
        uploadedFilesData.forEach(file => inputParts.push(`--- START OF UPLOADED FILE CONTENT (${file.name}) ---\n${file.content}\n--- END OF UPLOADED FILE CONTENT ---`));
        isAnyContentInputSelected = true;
    }
    if (includePastedText && pastedText.trim()) {
        inputParts.push(`--- START OF PASTED TEXT ---\n${pastedText.trim()}\n--- END OF PASTED TEXT ---`);
        isAnyContentInputSelected = true;
    }
    if (includeTopicQuery && topicQuery.trim()) {
        inputParts.push(`--- START OF USER-SPECIFIED TOPIC (Search ${useSearchForTopic ? 'ENABLED' : 'DISABLED'}) ---\n${topicQuery.trim()}\n--- END OF USER-SPECIFIED TOPIC ---`);
        isAnyContentInputSelected = true;
    }
    if (includeUserPresentationDescription && userPresentationDescription.trim()) {
        inputParts.push(`--- START OF USER PRESENTATION DESCRIPTION ---\n${userPresentationDescription.trim()}\n--- END OF USER PRESENTATION DESCRIPTION ---`);
    }

    if (!isAnyContentInputSelected) {
        setError("Please select at least one content input source (file, text, or topic) and provide content for it to start the AI Agent.");
        return;
    }
    
    setCurrentStep(AppStep.AGENT_RUNNING);

    const agentService = new AgentService(geminiService, (logMessage: string) => {
        setAgentLog(prev => [...prev, logMessage]);
    }, handlePauseForUserTasks, agentWorkerModel);

    const slidesParam: number | "optimum" = letAiDecideSlides ? "optimum" : minSlides;
    const initialAgentData = {
        userData: inputParts.join("\n\n").trim(),
        slidesParam: slidesParam,
        enableSearch: !!(useSearchForTopic && includeTopicQuery && topicQuery.trim()),
        allowUserTasks: allowAgentToRequestUserTasks,
    };

    try {
        const result = await agentService.run(initialAgentData);
        setFinalAgentHtml(result.finalHtml);
        setFinalAgentTheme(result.theme);
        setDisplayTheme(result.theme);
        setAgentUserImages(result.userImages);
        setCurrentStep(AppStep.AGENT_COMPLETED);
    } catch (e: any) {
        console.error("AI Agent failed:", e);
        setError(`AI Agent failed: ${e.message || 'Unknown error'}`);
        setAgentLog(prev => [...prev, `AGENT ERROR: ${e.message || 'Unknown error'}`]);
        setCurrentStep(AppStep.AGENT_COMPLETED);
    }
};

const handleRefineAgent = async () => {
    if (!geminiService || !finalAgentHtml) {
        setError("Cannot refine: No existing agent presentation found to refine.");
        return;
    }

    setAgentLog(prev => [...prev, `\n--- REFINEMENT REQUESTED ---\n${agentRefinementInstructions || '(Self-improvement requested by user.)'}`]);
    setCurrentStep(AppStep.AGENT_RUNNING);
    setIsAgentRefining(true);

    const agentService = new AgentService(geminiService, (logMessage: string) => {
        setAgentLog(prev => [...prev, logMessage]);
    }, handlePauseForUserTasks, agentWorkerModel);

    const existingState = {
        html: finalAgentHtml,
        theme: finalAgentTheme,
        images: agentUserImages,
        refinementInstructions: agentRefinementInstructions,
    };

    try {
        const result = await agentService.run({} as any, existingState); // Pass empty initialData, it won't be used
        setFinalAgentHtml(result.finalHtml);
        setFinalAgentTheme(result.theme);
        setDisplayTheme(result.theme);
        setAgentUserImages(result.userImages);
        setAgentRefinementInstructions(''); // Clear instructions for next round
        setCurrentStep(AppStep.AGENT_COMPLETED);
    } catch (e: any) {
        console.error("AI Agent refinement failed:", e);
        setError(`AI Agent refinement failed: ${e.message || 'Unknown error'}`);
        setAgentLog(prev => [...prev, `AGENT REFINEMENT ERROR: ${e.message || 'Unknown error'}`]);
        setCurrentStep(AppStep.AGENT_COMPLETED);
    } finally {
        setIsAgentRefining(false);
    }
};

const handleRefineWithAgentFromManual = async () => {
    const latestHtml = allHtmlVersions.length > 0 ? allHtmlVersions[allHtmlVersions.length - 1] : null;
    if (!geminiService || !latestHtml) {
        setError("Cannot refine with Agent: No manually enhanced HTML found to refine.");
        return;
    }

    // Reset agent-specific state and start logging
    setAgentLog([`\n--- AGENT ENGAGED FROM MANUAL ENHANCEMENT ---\nRefinement Instructions:\n${agentRefinementInstructions || '(Self-improvement requested by user.)'}`]);
    setCurrentStep(AppStep.AGENT_RUNNING);
    setIsAgentRefining(true); // Re-use the refining spinner/state
    setFinalAgentHtml(null); // Clear previous final agent html if any

    const agentService = new AgentService(geminiService, (logMessage: string) => {
        setAgentLog(prev => [...prev, logMessage]);
    }, handlePauseForUserTasks, agentWorkerModel);

    // Prepare the state from the manual flow to pass to the agent
    const existingState = {
        html: latestHtml,
        theme: displayTheme,
        images: userImageInputs, // Use the images from the manual flow
        refinementInstructions: agentRefinementInstructions,
    };

    try {
        const result = await agentService.run({} as any, existingState); // Pass empty initialData, it won't be used
        // Update agent-specific final state
        setFinalAgentHtml(result.finalHtml);
        setFinalAgentTheme(result.theme);
        setAgentUserImages(result.userImages);
        
        // Also update the main display theme so it's consistent if the user goes back to manual
        setDisplayTheme(result.theme);
        
        // Clear instructions for next round
        setAgentRefinementInstructions(''); 
        setCurrentStep(AppStep.AGENT_COMPLETED);
    } catch (e: any) {
        console.error("AI Agent refinement (from manual) failed:", e);
        setError(`AI Agent refinement failed: ${e.message || 'Unknown error'}`);
        setAgentLog(prev => [...prev, `AGENT REFINEMENT ERROR: ${e.message || 'Unknown error'}`]);
        setCurrentStep(AppStep.AGENT_COMPLETED); // Go to completed state even on error to show logs
    } finally {
        setIsAgentRefining(false);
    }
};

const handleContinueWithManualEnhancement = () => {
    if (!finalAgentHtml) {
        setError("No agent-generated HTML available to enhance manually.");
        return;
    }

    // Sanitize the HTML from the agent to replace base64 images with placeholders
    // This is critical to avoid exceeding token limits in the next enhancement step.
    let sanitizedHtml = finalAgentHtml;
    agentUserImages.forEach((img, index) => {
        if (img.url && img.url.startsWith('data:image')) {
            const placeholder = `ai_image_ref:${index}`;
            // Use split/join for robust replacement of the very long base64 string
            sanitizedHtml = sanitizedHtml.split(`src='${img.url}'`).join(`src='${placeholder}'`);
            sanitizedHtml = sanitizedHtml.split(`data-background-image='${img.url}'`).join(`data-background-image='${placeholder}'`);
            sanitizedHtml = sanitizedHtml.split(`url('${img.url}')`).join(`url('${placeholder}')`);
        }
    });

    // Create a synthetic InitialAIResponse to mimic the state after initial generation
    setInitialAIResponse({
        html_content: sanitizedHtml, // Use the sanitized HTML
        chosen_theme: finalAgentTheme,
        image_suggestions: agentUserImages.filter(img => img.type === 'ai_suggested').map(img => ({
            slide_reference: img.suggestion_reference || 'From Agent',
            description: img.original_ai_description || img.description,
        })),
        video_suggestions: [], // Agent doesn't create these yet
        chart_suggestions: [], // Agent doesn't create these yet
        table_suggestions: [], // Agent doesn't create these yet
        enhancement_queries: "Continuing from AI Agent's generation. What further enhancements would you like?",
        search_results: [], // No search results from agent in this context
    });

    setAllHtmlVersions([sanitizedHtml]); // Store the sanitized HTML in history
    setDisplayTheme(finalAgentTheme);
    setUserImageInputs(agentUserImages); // The image state still holds the full base64 data

    // Clear refinement inputs for the new step
    clearAdditionalInputs();
    setUserEnhancementRequests('');
    setFixLayoutIssues(false);
    setLayoutFixSlideNumbers('');
    setPrioritizeAnimationFixes(false);
    setAnimationFixSlideNumbers('');
    setAddMindMapSlide(false);

    // Transition to the manual enhancement step
    setCurrentStep(AppStep.AWAITING_USER_IMAGE_ENHANCEMENT_INPUT);
};


  const handleGenerateInitialMarp = async () => {
    if (!geminiService) { setError("AI Service is not available."); return; }
    setError(null); setErrorExplanation(null); setPhase1LoadingMessage(null);

    if (!letAiDecideSlides && (isNaN(minSlides) || minSlides <= 0)) {
       setError("Please specify a valid positive number for minimum slides, or let the AI decide."); return;
    }

    const inputParts: string[] = []; let isAnyContentInputSelected = false;
    let topicBlockForMainGen: string | null = null;
    let searchResultsFromPhase1: SearchResultItem[] | undefined = undefined;

    const needsPhasedApproach = includeTopicQuery && topicQuery.trim() && useSearchForTopic &&
                                ((includeFileData && uploadedFilesData.length > 0) || (includePastedText && pastedText.trim()));

    setIsLoading(true);
    setInitialMarpResponse(null); setEnhancedMarpResponse(null);
    setAllMarpVersions([]); setCurrentStep(AppStep.GENERATING_INITIAL_MARP);

    if (needsPhasedApproach) {
      setPhase1LoadingMessage(`Researching topic "${topicQuery.trim()}" with ${modelDisplayNames[selectedModel] || selectedModel}...`);
      try {
        const researchResponse = await geminiService.researchTopic(topicQuery.trim(), selectedModel);
        topicBlockForMainGen = `--- START OF AI-RESEARCHED TOPIC SUMMARY ---\n${researchResponse.text}\n--- END OF AI-RESEARCHED TOPIC SUMMARY ---`;
        searchResultsFromPhase1 = researchResponse.searchResults; isAnyContentInputSelected = true;
      } catch (e: any) {
        console.error("Error in topic research phase (Marp):", e);
        setError(`Error during topic research: ${e.message || 'Unknown error'}`);
        setIsLoading(false); setPhase1LoadingMessage(null); setCurrentStep(AppStep.SETUP); return;
      }
      setPhase1LoadingMessage(null);
    } else if (includeTopicQuery && topicQuery.trim()) {
      topicBlockForMainGen = `--- START OF USER-SPECIFIED TOPIC (Search ${useSearchForTopic ? 'ENABLED' : 'DISABLED'}) ---\n${topicQuery.trim()}\n--- END OF USER-SPECIFIED TOPIC ---`;
      isAnyContentInputSelected = true;
    }

    if (includeFileData && uploadedFilesData.length > 0) {
      uploadedFilesData.forEach(file => inputParts.push(`--- START OF UPLOADED FILE CONTENT (${file.name}) ---\n${file.content}\n--- END OF UPLOADED FILE CONTENT ---`));
      isAnyContentInputSelected = true;
    }
    if (includePastedText && pastedText.trim()) {
      inputParts.push(`--- START OF PASTED TEXT ---\n${pastedText.trim()}\n--- END OF PASTED TEXT ---`);
      isAnyContentInputSelected = true;
    }
    if (topicBlockForMainGen) inputParts.push(topicBlockForMainGen);

    if (includeUserPresentationDescription && userPresentationDescription.trim()) {
      inputParts.push(`--- START OF USER PRESENTATION DESCRIPTION ---\n${userPresentationDescription.trim()}\n--- END OF USER PRESENTATION DESCRIPTION ---`);
    }

    if (!isAnyContentInputSelected) {
      setError("Please select at least one content input source (file, text, or topic) and provide content for it.");
      setIsLoading(false); setCurrentStep(AppStep.SETUP); return;
    }

    const dataToProcess = inputParts.join("\n\n").trim();
    const finalUseSearchForAIServiceCall = needsPhasedApproach ? false : (includeTopicQuery && topicQuery.trim() && useSearchForTopic);
    const slidesParam = letAiDecideSlides ? "optimum" : minSlides;

    try {
      const response = await geminiService.generateInitialMarp(dataToProcess, slidesParam, selectedModel, finalUseSearchForAIServiceCall);
      const finalInitialMarpResponse: InitialMarpAIResponse = { ...response, search_results: needsPhasedApproach ? searchResultsFromPhase1 : (response.search_results || []) };
      setInitialMarpResponse(finalInitialMarpResponse);
      setAllMarpVersions([finalInitialMarpResponse.marp_code_content]);
      setUserImageInputs(finalInitialMarpResponse.image_suggestions.map(s => ({ type: 'ai_suggested', suggestion_reference: s.slide_reference, url: '', description: s.description, original_ai_description: s.description })));
      setUserVideoInputs(finalInitialMarpResponse.video_suggestions.map(v => ({ type: 'ai_suggested_video', suggestion_reference: v.slide_reference, url: '', description: v.description, original_ai_description: v.description, media_type: v.media_type, placement: 'inline' })));
      setUserChartInputs(finalInitialMarpResponse.chart_suggestions.map(c => ({ type: 'ai_suggested_chart', suggestion_reference: c.slide_reference, chart_type: c.chart_type, data_input: c.data_description_or_ai_query, description: c.description, original_ai_description: c.data_description_or_ai_query, title: c.title, letAiDecidePlacement: true })));
      setUserTableInputs(finalInitialMarpResponse.table_suggestions.map(t => ({ type: 'ai_suggested_table', suggestion_reference: t.slide_reference, data_input: t.data_description_or_ai_query, description: t.description, original_ai_description: t.data_description_or_ai_query, title: t.title, letAiDecidePlacement: true })));
      setCurrentStep(AppStep.INITIAL_MARP_READY);
    } catch (e: any) {
      console.error("Error in handleGenerateInitialMarp:", e);
      setError(`Error generating initial Marp code: ${e.message || 'Unknown error'}`); setCurrentStep(AppStep.SETUP);
    }
    setIsLoading(false);
  };


  const handleProceedToRefinementStep = () => {
    setAdditionalUploadedFilesData([]); setAdditionalPastedText(''); setAdditionalTopicQuery('');
    setIncludeAdditionalFileData(false); setIncludeAdditionalPastedText(false); setIncludeAdditionalTopicQuery(false);
    setUseSearchForAdditionalTopic(true);
    setCurrentStep(AppStep.AWAITING_USER_IMAGE_ENHANCEMENT_INPUT);
  };

  const handleInitiateInteractiveSpecGeneration = async () => {
    if (currentMode !== 'html' || !geminiService || allHtmlVersions.length === 0) {
      setError("Interactive elements are only for HTML mode and require base content.");
      setInteractiveSlideModalState('hidden'); return;
    }
    setError(null); setErrorExplanation(null); setModelFallbackNotification(null);
    setInteractiveSlideModalState('generating_spec');
    const previousSpecs = previousInteractiveSlides.map(record => record.spec);
    try {
      const specResponse = await geminiService.generateInteractiveSpec(allHtmlVersions, previousSpecs, PRO_MODEL_FOR_INTERACTIVE);
      if (specResponse && specResponse.spec_file_content) {
        setCurrentAiGeneratedSpecDraft(specResponse.spec_file_content); setEditableInteractiveSpec(specResponse.spec_file_content);
        setInteractiveSlideModalState('editing_spec');
      } else { throw new Error("AI did not return a valid specification."); }
    } catch (e: any) {
      console.error("Error generating interactive spec:", e);
      setError(`Error generating interactive element idea: ${e.message || 'Unknown error'}`);
      setInteractiveSlideModalState('hidden');
    }
  };

  const handleUserConfirmInteractiveSpecAndGenerateHtml = async () => {
    if (currentMode !== 'html' || !geminiService || !editableInteractiveSpec || allHtmlVersions.length === 0) {
      setError("Missing requirements for interactive HTML generation."); return;
    }
    setError(null); setErrorExplanation(null); setInteractiveSlideModalState('generating_html');
    const currentFullPresentationHtml = allHtmlVersions[allHtmlVersions.length - 1];
    try {
      const slideResponse = await geminiService.generateInteractiveSlideFromSpec(editableInteractiveSpec, currentFullPresentationHtml, PRO_MODEL_FOR_INTERACTIVE);
      if (slideResponse && slideResponse.final_presentation_html_with_interactive_slide_inserted && slideResponse.interactive_slide_section_only) {
        setAllHtmlVersions(prev => { const newHistory = [...prev]; newHistory[newHistory.length -1] = slideResponse.final_presentation_html_with_interactive_slide_inserted; return newHistory; });
        setPreviousInteractiveSlides(prev => [...prev, { spec: editableInteractiveSpec, htmlContent: slideResponse.interactive_slide_section_only }]);
        setHasIntegratedInteractiveSlide(true);
        setSelectedModel(PRO_MODEL_FOR_INTERACTIVE);
        setInteractiveSlideModalState('hidden'); setCurrentAiGeneratedSpecDraft(null); setEditableInteractiveSpec(null);
      } else { throw new Error("AI did not return valid HTML for interactive element."); }
    } catch (e: any) {
      console.error("Error generating/including interactive slide:", e);
      setError(`Error creating interactive element: ${e.message || 'Unknown error'}`);
      setInteractiveSlideModalState('editing_spec');
    }
  };

  const handleCancelInteractiveSlide = () => {
    setInteractiveSlideModalState('hidden'); setCurrentAiGeneratedSpecDraft(null);
    setEditableInteractiveSpec(null); setError(null);
  };

  const handleRefineFurther = () => {
    const hasBaseContent = currentMode === 'html' ? allHtmlVersions.length > 0 : allMarpVersions.length > 0;
    if (!hasBaseContent) {
      setError(`Cannot refine further without a ${currentMode.toUpperCase()} presentation to start from.`);
      setCurrentStep(AppStep.SETUP); return;
    }
    setUserEnhancementRequests('');
    if (currentMode === 'html') setPptxTextContent(null);

    setAdditionalUploadedFilesData([]); setAdditionalPastedText(''); setAdditionalTopicQuery('');
    setIncludeAdditionalFileData(false); setIncludeAdditionalPastedText(false); setIncludeAdditionalTopicQuery(false);
    setUseSearchForAdditionalTopic(true);

    setCurrentStep(AppStep.AWAITING_USER_IMAGE_ENHANCEMENT_INPUT);
  };

  const handleGenerateEnhanced = async () => {
    setModelFallbackNotification(null);
    if (currentMode === 'html') {
      await handleGenerateEnhancedHtml();
    } else {
      await handleGenerateEnhancedMarp();
    }
  };


  const handleGenerateEnhancedHtml = async () => {
    if (!geminiService) { setError("AI Service is not available."); return; }
    setError(null); setErrorExplanation(null); setPhase1LoadingMessage(null);

    let baseHtmlInputForAIService: string;
    const currentLatestHtml = allHtmlVersions.length > 0 ? allHtmlVersions[allHtmlVersions.length - 1] : null;

    if (!currentLatestHtml) {
        setError("Error: No base HTML found to enhance."); setCurrentStep(AppStep.SETUP); return;
    }
    baseHtmlInputForAIService = useFullHistoryForRefinement && allHtmlVersions.length > 0 ?
        allHtmlVersions.map((html, index) => `<!-- START HTML VERSION ${index + 1} -->\n${html}\n<!-- END HTML VERSION ${index + 1} -->`).join("\n\n<!-- ========== SEPARATOR BETWEEN HTML VERSIONS ========== -->\n\n")
        : currentLatestHtml;

    setIsLoading(true); setCurrentStep(AppStep.GENERATING_ENHANCED_HTML);
    const modelForEnhancement = hasIntegratedInteractiveSlide ? PRO_MODEL_FOR_INTERACTIVE : selectedModel;

    const additionalInputParts: string[] = []; let additionalTopicBlock: string | null = null;
    let searchResultsFromAdditionalTopicResearch: SearchResultItem[] | undefined = undefined;

    if (includeAdditionalTopicQuery && additionalTopicQuery.trim() && useSearchForAdditionalTopic) {
      setPhase1LoadingMessage(`Researching additional topic "${additionalTopicQuery.trim()}" with ${modelDisplayNames[modelForEnhancement] || modelForEnhancement}...`);
      try {
        const researchResponse = await geminiService.researchTopic(additionalTopicQuery.trim(), modelForEnhancement);
        additionalTopicBlock = `--- START OF AI-RESEARCHED ADDITIONAL TOPIC SUMMARY ---\n${researchResponse.text}\n--- END OF AI-RESEARCHED ADDITIONAL TOPIC SUMMARY ---`;
        searchResultsFromAdditionalTopicResearch = researchResponse.searchResults;
      } catch (e: any) { setIsLoading(false); setPhase1LoadingMessage(null); setCurrentStep(AppStep.AWAITING_USER_IMAGE_ENHANCEMENT_INPUT); return; }
      setPhase1LoadingMessage(null);
    } else if (includeAdditionalTopicQuery && additionalTopicQuery.trim()) {
      additionalTopicBlock = `--- START OF USER-SPECIFIED ADDITIONAL TOPIC (Search DISABLED) ---\n${additionalTopicQuery.trim()}\n--- END OF USER-SPECIFIED ADDITIONAL TOPIC ---`;
    }
    if (includeAdditionalFileData && additionalUploadedFilesData.length > 0) additionalUploadedFilesData.forEach(file => additionalInputParts.push(`--- START OF ADDITIONAL UPLOADED FILE CONTENT (${file.name}) ---\n${file.content}\n--- END ---`));
    if (includeAdditionalPastedText && additionalPastedText.trim()) additionalInputParts.push(`--- START OF ADDITIONAL PASTED TEXT ---\n${additionalPastedText.trim()}\n--- END ---`);
    if (additionalTopicBlock) additionalInputParts.push(additionalTopicBlock);
    const additionalContentBlock = additionalInputParts.length > 0 ? additionalInputParts.join("\n\n").trim() : null;

    const imagesToEnhance = includeAiImageSuggestions
      ? userImageInputs
      : userImageInputs.filter(img => img.type !== 'ai_suggested');

    const videosToEnhance = includeAiVideoSuggestions
      ? userVideoInputs
      : userVideoInputs.filter(vid => vid.type !== 'ai_suggested_video');

    const chartsToEnhance = includeAiChartSuggestions
      ? userChartInputs
      : userChartInputs.filter(chart => chart.type !== 'ai_suggested_chart');
      
    const tablesToEnhance = includeAiTableSuggestions
      ? userTableInputs
      : userTableInputs.filter(table => table.type !== 'ai_suggested_table');

    try {
      const response = await geminiService.enhancePresentation(
        baseHtmlInputForAIService,
        imagesToEnhance,
        videosToEnhance,
        chartsToEnhance,
        tablesToEnhance,
        userEnhancementRequests,
        modelForEnhancement,
        additionalContentBlock,
        fixLayoutIssues,
        prioritizeAnimationFixes,
        layoutFixSlideNumbers, // New
        animationFixSlideNumbers, // New
        addMindMapSlide
      );
      
      let enhancedHtmlWithPlaceholders = response.enhanced_html_content;
      
      if (response.mind_map_data && currentMode === 'html') {
          console.log("Mind map data received, generating placeholder slide.");
          const mindMapDataString = JSON.stringify(response.mind_map_data)
            .replace(/'/g, "&apos;")
            .replace(/"/g, "&quot;");
        
          const mindMapSlideHtml = `
            <section data-transition='zoom'>
              <h2>Mind Map Summary</h2>
              <div class='mind-map-placeholder' data-mindmap-data='${mindMapDataString}' style='width: 100%; height: 80vh; min-height: 500px; cursor: grab; active:cursor: grabbing;'>
                Loading Mind Map...
              </div>
            </section>
          `;
          
          const slidesEndIndex = enhancedHtmlWithPlaceholders.lastIndexOf("</div></div>");
          if (slidesEndIndex !== -1) {
            enhancedHtmlWithPlaceholders = 
              enhancedHtmlWithPlaceholders.slice(0, slidesEndIndex) + 
              mindMapSlideHtml + 
              enhancedHtmlWithPlaceholders.slice(slidesEndIndex);
          } else {
             enhancedHtmlWithPlaceholders += mindMapSlideHtml;
          }
        }

      const combinedSearchResults = [...(searchResultsFromAdditionalTopicResearch || []), ...(response.search_results || [])].filter((v, i, a) => a.findIndex(t => t.uri === v.uri) === i);

      setEnhancedAIResponse({ ...response, enhanced_html_content: enhancedHtmlWithPlaceholders, search_results: combinedSearchResults });
      setAllHtmlVersions(prev => [...prev.slice(0, -1), enhancedHtmlWithPlaceholders]);

      setPptxTextContent(null); setCurrentStep(AppStep.ENHANCED_HTML_READY);
      if (lyraServiceInstance && lyraConnectionStatus === 'setup_complete' && currentSlideTextRef.current) {
        await lyraServiceInstance.updateMusicForSlide(currentSlideTextRef.current);
        setLyraCurrentPromptsText(lyraServiceInstance.currentPrompts.map(p => p.text).join(', ') || "Default theme");
      }
    } catch (e: any) { setError(`Error enhancing HTML: ${e.message || 'Unknown error'}`); setCurrentStep(AppStep.AWAITING_USER_IMAGE_ENHANCEMENT_INPUT); }
    setIsLoading(false);
  };

  const handleGenerateEnhancedMarp = async () => {
    if (!geminiService) { setError("AI Service is not available."); return; }
    setError(null); setErrorExplanation(null); setPhase1LoadingMessage(null);

    const currentLatestMarp = allMarpVersions.length > 0 ? allMarpVersions[allMarpVersions.length - 1] : null;
    if (!currentLatestMarp) {
        setError("Error: No base Marp code found to enhance."); setCurrentStep(AppStep.SETUP); return;
    }
    const baseMarpInputForAIService = currentLatestMarp;

    setIsLoading(true); setCurrentStep(AppStep.GENERATING_ENHANCED_MARP);

    const additionalInputParts: string[] = []; let additionalTopicBlock: string | null = null;
    let searchResultsFromAdditionalTopicResearch: SearchResultItem[] | undefined = undefined;

    if (includeAdditionalTopicQuery && additionalTopicQuery.trim() && useSearchForAdditionalTopic) {
      setPhase1LoadingMessage(`Researching additional topic "${additionalTopicQuery.trim()}" for Marp with ${modelDisplayNames[selectedModel] || selectedModel}...`);
      try {
        const researchResponse = await geminiService.researchTopic(additionalTopicQuery.trim(), selectedModel);
        additionalTopicBlock = `--- START OF AI-RESEARCHED ADDITIONAL TOPIC SUMMARY ---\n${researchResponse.text}\n--- END ---`;
        searchResultsFromAdditionalTopicResearch = researchResponse.searchResults;
      } catch (e: any) { setIsLoading(false); setPhase1LoadingMessage(null); setCurrentStep(AppStep.AWAITING_USER_IMAGE_ENHANCEMENT_INPUT); return; }
      setPhase1LoadingMessage(null);
    } else if (includeAdditionalTopicQuery && additionalTopicQuery.trim()) {
      additionalTopicBlock = `--- START OF USER-SPECIFIED ADDITIONAL TOPIC (Search DISABLED) ---\n${additionalTopicQuery.trim()}\n--- END ---`;
    }
    if (includeAdditionalFileData && additionalUploadedFilesData.length > 0) additionalUploadedFilesData.forEach(file => additionalInputParts.push(`--- START OF ADDITIONAL UPLOADED FILE CONTENT (${file.name}) ---\n${file.content}\n--- END ---`));
    if (includeAdditionalPastedText && additionalPastedText.trim()) additionalInputParts.push(`--- START OF ADDITIONAL PASTED TEXT ---\n${additionalPastedText.trim()}\n--- END ---`);
    if (additionalTopicBlock) additionalInputParts.push(additionalTopicBlock);
    const additionalContentBlock = additionalInputParts.length > 0 ? additionalInputParts.join("\n\n").trim() : null;

    const imagesToEnhance = includeAiImageSuggestions
      ? userImageInputs
      : userImageInputs.filter(img => img.type !== 'ai_suggested');
      
    const videosToEnhance = includeAiVideoSuggestions
      ? userVideoInputs
      : userVideoInputs.filter(vid => vid.type !== 'ai_suggested_video');

    const chartsToEnhance = includeAiChartSuggestions
      ? userChartInputs
      : userChartInputs.filter(chart => chart.type !== 'ai_suggested_chart');
      
    const tablesToEnhance = includeAiTableSuggestions
      ? userTableInputs
      : userTableInputs.filter(table => table.type !== 'ai_suggested_table');

    try {
      const response = await geminiService.enhanceMarpCode(baseMarpInputForAIService, imagesToEnhance, videosToEnhance, chartsToEnhance, tablesToEnhance, userEnhancementRequests, selectedModel, additionalContentBlock);
      const combinedSearchResults = [...(searchResultsFromAdditionalTopicResearch || []), ...(response.search_results || [])].filter((v, i, a) => a.findIndex(t => t.uri === v.uri) === i);
      setEnhancedMarpResponse({ ...response, search_results: combinedSearchResults.length > 0 ? combinedSearchResults : undefined });
      setAllMarpVersions(prev => [...prev.slice(0, -1), response.enhanced_marp_code_content]);
      setCurrentStep(AppStep.ENHANCED_MARP_READY);
    } catch (e: any) { setError(`Error enhancing Marp: ${e.message || 'Unknown error'}`); setCurrentStep(AppStep.AWAITING_USER_IMAGE_ENHANCEMENT_INPUT); }
    setIsLoading(false);
  };

  const handleGeneratePptxTextContent = async () => {
    if (currentMode !== 'html' || !geminiService) { setError("AI Service is not available or not in HTML mode."); return; }
    setError(null); setErrorExplanation(null); setModelFallbackNotification(null);
    const finalCoreHtmlWithPlaceholders = allHtmlVersions.length > 0 ? allHtmlVersions[allHtmlVersions.length - 1] : null;
    if (!finalCoreHtmlWithPlaceholders) { setError("No HTML to convert for PPT text."); return; }
    setIsLoading(true); setCurrentStep(AppStep.GENERATING_PPT_TEXT);
    const modelForPptText = hasIntegratedInteractiveSlide ? PRO_MODEL_FOR_INTERACTIVE : selectedModel;
    try {
      const finalHtmlForPpt = replaceImagePlaceholdersWithData(finalCoreHtmlWithPlaceholders, userImageInputs);
      const textContent = await geminiService.generatePptxTextContent(finalHtmlForPpt, modelForPptText);
      setPptxTextContent(textContent); setCurrentStep(AppStep.PPT_TEXT_READY);
    } catch (e: any) { setError(`Error generating PPT text: ${e.message || 'Unknown error'}`); setCurrentStep(AppStep.ENHANCED_HTML_READY); }
    setIsLoading(false);
  };

  const handleGenerateMarpFromHtml = async () => {
    if (!geminiService) { setError("AI Service unavailable."); return; }
    const baseHtml = allHtmlVersions.length > 0 ? allHtmlVersions[allHtmlVersions.length - 1] : null;
    if (!baseHtml) { setError("No HTML content available to convert to Marp."); return; }

    setIsLoading(true); setError(null); setModelFallbackNotification(null);
    try {
      const marpResponse = await geminiService.generateMarpFromHtml(baseHtml, selectedModel, userImageInputs, userVideoInputs, userChartInputs, userTableInputs);
      setInitialMarpResponse(marpResponse);
      setAllMarpVersions([marpResponse.marp_code_content]);
      setCurrentMode('marp');
      setCurrentStep(AppStep.INITIAL_MARP_READY);
      setUserImageInputs(marpResponse.image_suggestions.map(s => ({ type: 'ai_suggested', suggestion_reference: s.slide_reference, url: '', description: s.description, original_ai_description: s.description })));
      setUserVideoInputs(marpResponse.video_suggestions.map(v => ({ type: 'ai_suggested_video', suggestion_reference: v.slide_reference, url: '', description: v.description, original_ai_description: v.description, media_type: v.media_type, placement: 'inline' })));
      setUserChartInputs(marpResponse.chart_suggestions.map(c => ({ type: 'ai_suggested_chart', suggestion_reference: c.slide_reference, chart_type: c.chart_type, data_input: c.data_description_or_ai_query, description: c.description, original_ai_description: c.data_description_or_ai_query, title: c.title, letAiDecidePlacement: true })));
      setUserTableInputs(marpResponse.table_suggestions.map(t => ({ type: 'ai_suggested_table', suggestion_reference: t.slide_reference, data_input: t.data_description_or_ai_query, description: t.description, original_ai_description: t.data_description_or_ai_query, title: t.title, letAiDecidePlacement: true })));

    } catch (e: any) {
      setError(`Error converting HTML to Marp: ${e.message || 'Unknown error'}`);
    }
    setIsLoading(false);
  };

  const handleGenerateHtmlFromMarp = async () => {
    if (!geminiService) { setError("AI Service unavailable."); return; }
    const baseMarp = allMarpVersions.length > 0 ? allMarpVersions[allMarpVersions.length - 1] : null;
    if (!baseMarp) { setError("No Marp code available to convert to HTML."); return; }

    setIsLoading(true); setError(null); setModelFallbackNotification(null);
    try {
      const htmlResponse = await geminiService.generateHtmlFromMarp(baseMarp, selectedModel, userImageInputs, userVideoInputs, userChartInputs, userTableInputs);
      setInitialAIResponse(htmlResponse);
      setAllHtmlVersions([htmlResponse.html_content]);
      setDisplayTheme(validThemes.includes(htmlResponse.chosen_theme) ? htmlResponse.chosen_theme : validThemes[0]);
      setCurrentMode('html');
      setCurrentStep(AppStep.INITIAL_HTML_READY);
      setUserImageInputs(htmlResponse.image_suggestions.map(s => ({ type: 'ai_suggested', suggestion_reference: s.slide_reference, url: '', description: s.description, original_ai_description: s.description })));
      setUserVideoInputs(htmlResponse.video_suggestions.map(v => ({ type: 'ai_suggested_video', suggestion_reference: v.slide_reference, url: '', description: v.description, original_ai_description: v.description, media_type: v.media_type, placement: 'inline' })));
      setUserChartInputs(htmlResponse.chart_suggestions.map(c => ({ type: 'ai_suggested_chart', suggestion_reference: c.slide_reference, chart_type: c.chart_type, data_input: c.data_description_or_ai_query, description: c.description, original_ai_description: c.data_description_or_ai_query, title: c.title, letAiDecidePlacement: true })));
      setUserTableInputs(htmlResponse.table_suggestions.map(t => ({ type: 'ai_suggested_table', suggestion_reference: t.slide_reference, data_input: t.data_description_or_ai_query, description: t.description, original_ai_description: t.data_description_or_ai_query, title: t.title, letAiDecidePlacement: true })));
        if (lyraServiceInstance) {
         const firstSlideText = extractFirstSlideText(htmlResponse.html_content);
         if (firstSlideText) {
            currentSlideTextRef.current = firstSlideText;
            lyraServiceInstance.updateMusicForSlide(firstSlideText)
              .then(() => setLyraCurrentPromptsText(lyraServiceInstance.currentPrompts.map(p => p.text).join(', ') || "Default theme"));
         }
       }
    } catch (e: any) {
      setError(`Error converting Marp to HTML: ${e.message || 'Unknown error'}`);
    }
    setIsLoading(false);
  };


  const downloadPresentationWithCurrentSettings = (coreHtmlWithPlaceholders: string | null, filename: string) => {
    if (!coreHtmlWithPlaceholders || !displayTheme ) { setError(`Cannot download: HTML content or theme missing.`); return; }
    const coreHtmlWithBase64 = replaceImagePlaceholdersWithData(coreHtmlWithPlaceholders, userImageInputs);
    downloadPresentationHtml(coreHtmlWithBase64, displayTheme, filename);
  };


  const downloadPresentationHtml = (coreHtmlContent: string, theme: string, filename: string) => {
    const fullHtml = generateFullRevealHtmlPage(coreHtmlContent, theme);
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const downloadTextFile = (text: string | null, filename: string) => {
    if (!text) { setError(`No text content to download.`); return; }
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };


  const copyToClipboard = (text: string | null) => {
    if (!text) return;
    navigator.clipboard.writeText(text)
      .then(() => alert("Content copied to clipboard!"))
      .catch(err => { console.error("Failed to copy content: ", err); setError("Failed to copy content."); });
  };

  const clearAdditionalInputs = () => {
    setAdditionalUploadedFilesData([]); setAdditionalPastedText(''); setAdditionalTopicQuery('');
    setIncludeAdditionalFileData(false); setIncludeAdditionalPastedText(false); setIncludeAdditionalTopicQuery(false);
    setUseSearchForAdditionalTopic(true);
    const additionalFileInput = document.getElementById('additional-file-upload-input') as HTMLInputElement;
    if (additionalFileInput) additionalFileInput.value = '';
  }

  const restartProcess = () => {
    setCurrentMode('html');
    setUploadedFilesData([]); setPastedText(''); setTopicQuery(''); setUserPresentationDescription('');
    setIncludeFileData(false); setIncludePastedText(false); setIncludeTopicQuery(false); setIncludeUserPresentationDescription(false);
    setUseSearchForTopic(true); clearAdditionalInputs();
    setMinSlides(5); setLetAiDecideSlides(false); setCurrentStep(AppStep.SETUP);
    setInitialAIResponse(null); setEnhancedAIResponse(null); setPptxTextContent(null);
    setAllHtmlVersions([]); setHasIntegratedInteractiveSlide(false);
    setInitialMarpResponse(null); setEnhancedMarpResponse(null); setAllMarpVersions([]);
    setError(null); setErrorExplanation(null); setIsExplainingError(false); setPhase1LoadingMessage(null);
    setModelFallbackNotification(null);
    if (!geminiService) setError("Critical: Failed to initialize AI Service. Check API_KEY & refresh.");
    setUserImageInputs([]); setUserVideoInputs([]); setUserChartInputs([]); setUserTableInputs([]); // New resets
    setUserEnhancementRequests('');
    setIncludeAiImageSuggestions(true);
    setIncludeAiVideoSuggestions(true);
    setIncludeAiChartSuggestions(true);
    setIncludeAiTableSuggestions(true);
    setFixLayoutIssues(false); setLayoutFixSlideNumbers(''); // New
    setPrioritizeAnimationFixes(false); setAnimationFixSlideNumbers(''); // New
    setAddMindMapSlide(false);
    setShowInlinePreview(false); setIsPresentationModalOpen(false); setShowMarpCodePreview(true); setShowAiSuggestions(true);
    setShowSearchResults(true); setShowPptxText(true);
    setDisplayTheme(validThemes[0]); setSelectedModel(defaultModel);
    setUseFullHistoryForRefinement(false);
    setEditableInteractiveSpec(null); setPreviousInteractiveSlides([]);
    setCurrentAiGeneratedSpecDraft(null); setInteractiveSlideModalState('hidden');
    const fileInput = document.getElementById('file-upload-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    setMicrophonePermissionStatus('idle');
    setAgentLog([]); setFinalAgentHtml(null); setFinalAgentTheme(validThemes[0]);
    setAgentUserImages([]); setAgentRefinementInstructions(''); setIsAgentRefining(false);
    setAgentWorkerModel('gemini-2.5-flash');
    setAllowAgentToRequestUserTasks(true);

    // Agent task state reset
    setIsAgentPausedForUserTasks(false);
    setTasksForUser([]);
    setAgentTaskUrls({});
    if (userTaskCompletionResolver.current) {
        userTaskCompletionResolver.current({}); // Resolve with empty if restarting
        userTaskCompletionResolver.current = null;
    }

    lyraServiceInstance?.reset();
    setLyraConnectionStatus('disconnected');
    setLyraPlaybackStatus('stopped');
    setLyraCurrentPromptsText("");
    currentSlideTextRef.current = "";
  };

  const navigateToStep = useCallback((targetStep: AppStep) => {
    if (isLoading || isExplainingError || interactiveSlideModalState !== 'hidden' || phase1LoadingMessage) return;

    setError(null); setErrorExplanation(null); setIsLoading(false); setPhase1LoadingMessage(null);
    setModelFallbackNotification(null);
    setInteractiveSlideModalState('hidden'); setCurrentAiGeneratedSpecDraft(null); setEditableInteractiveSpec(null);

    const htmlStepOrder = [AppStep.SETUP, AppStep.INITIAL_HTML_READY, AppStep.AWAITING_USER_IMAGE_ENHANCEMENT_INPUT, AppStep.ENHANCED_HTML_READY, AppStep.PPT_TEXT_READY];
    const marpStepOrder = [AppStep.SETUP, AppStep.INITIAL_MARP_READY, AppStep.AWAITING_USER_IMAGE_ENHANCEMENT_INPUT, AppStep.ENHANCED_MARP_READY];
    const stepOrder = currentMode === 'html' ? htmlStepOrder : marpStepOrder;

    const targetStepIndex = stepOrder.indexOf(targetStep);

    if (currentMode === 'html') {
        if (targetStepIndex < htmlStepOrder.indexOf(AppStep.PPT_TEXT_READY)) setPptxTextContent(null);
        if (targetStepIndex < htmlStepOrder.indexOf(AppStep.ENHANCED_HTML_READY)) {
            setEnhancedAIResponse(null);
            if (initialAIResponse) setAllHtmlVersions([initialAIResponse.html_content]); else setAllHtmlVersions([]);
        }
        if (targetStepIndex < htmlStepOrder.indexOf(AppStep.AWAITING_USER_IMAGE_ENHANCEMENT_INPUT)) {
             if (initialAIResponse && targetStep === AppStep.INITIAL_HTML_READY) {
                setUserImageInputs(initialAIResponse.image_suggestions.map(s => ({ type: 'ai_suggested', suggestion_reference: s.slide_reference, url: '', description: s.description, original_ai_description: s.description })));
                setUserVideoInputs(initialAIResponse.video_suggestions.map(v => ({ type: 'ai_suggested_video', suggestion_reference: v.slide_reference, url: '', description: v.description, original_ai_description: v.description, media_type: v.media_type, placement: 'inline' })));
                setUserChartInputs(initialAIResponse.chart_suggestions.map(c => ({ type: 'ai_suggested_chart', suggestion_reference: c.slide_reference, chart_type: c.chart_type, data_input: c.data_description_or_ai_query, description: c.description, original_ai_description: c.data_description_or_ai_query, title: c.title, letAiDecidePlacement: true })));
                setUserTableInputs(initialAIResponse.table_suggestions.map(t => ({ type: 'ai_suggested_table', suggestion_reference: t.slide_reference, data_input: t.data_description_or_ai_query, description: t.description, original_ai_description: t.data_description_or_ai_query, title: t.title, letAiDecidePlacement: true })));
             } else {
                setUserImageInputs([]); setUserVideoInputs([]); setUserChartInputs([]); setUserTableInputs([]); // New resets
             }
             setUserEnhancementRequests(''); clearAdditionalInputs();
             // Reset specific fix options when navigating before refinement input step
             setFixLayoutIssues(false); setLayoutFixSlideNumbers(''); 
             setPrioritizeAnimationFixes(false); setAnimationFixSlideNumbers('');
             setAddMindMapSlide(false);
        }
        if (targetStepIndex < htmlStepOrder.indexOf(AppStep.INITIAL_HTML_READY)) {
            setInitialAIResponse(null); setAllHtmlVersions([]);
            setPreviousInteractiveSlides([]); setHasIntegratedInteractiveSlide(false);
             if (selectedModel !== defaultModel) setSelectedModel(defaultModel);
        }
    } else { // Marp Mode
        if (targetStepIndex < marpStepOrder.indexOf(AppStep.ENHANCED_MARP_READY)) {
            setEnhancedMarpResponse(null);
            if (initialMarpResponse) setAllMarpVersions([initialMarpResponse.marp_code_content]); else setAllMarpVersions([]);
        }
         if (targetStepIndex < marpStepOrder.indexOf(AppStep.AWAITING_USER_IMAGE_ENHANCEMENT_INPUT)) {
            if (initialMarpResponse && targetStep === AppStep.INITIAL_MARP_READY) {
                setUserImageInputs(initialMarpResponse.image_suggestions.map(s => ({ type: 'ai_suggested', suggestion_reference: s.slide_reference, url: '', description: s.description, original_ai_description: s.description })));
                setUserVideoInputs(initialMarpResponse.video_suggestions.map(v => ({ type: 'ai_suggested_video', suggestion_reference: v.slide_reference, url: '', description: v.description, original_ai_description: v.description, media_type: v.media_type, placement: 'inline' })));
                setUserChartInputs(initialMarpResponse.chart_suggestions.map(c => ({ type: 'ai_suggested_chart', suggestion_reference: c.slide_reference, chart_type: c.chart_type, data_input: c.data_description_or_ai_query, description: c.description, original_ai_description: c.data_description_or_ai_query, title: c.title, letAiDecidePlacement: true })));
                setUserTableInputs(initialMarpResponse.table_suggestions.map(t => ({ type: 'ai_suggested_table', suggestion_reference: t.slide_reference, data_input: t.data_description_or_ai_query, description: t.description, original_ai_description: t.data_description_or_ai_query, title: t.title, letAiDecidePlacement: true })));
            } else {
                setUserImageInputs([]); setUserVideoInputs([]); setUserChartInputs([]); setUserTableInputs([]); // New resets
            }
            setUserEnhancementRequests(''); clearAdditionalInputs();
             // Reset specific fix options when navigating before refinement input step
             setFixLayoutIssues(false); setLayoutFixSlideNumbers(''); 
             setPrioritizeAnimationFixes(false); setAnimationFixSlideNumbers('');
             setAddMindMapSlide(false);
        }
        if (targetStepIndex < marpStepOrder.indexOf(AppStep.INITIAL_MARP_READY)) {
            setInitialMarpResponse(null); setAllMarpVersions([]);
             if (selectedModel !== defaultModel) setSelectedModel(defaultModel);
        }
    }

    if (targetStep === AppStep.AWAITING_USER_IMAGE_ENHANCEMENT_INPUT) {
        clearAdditionalInputs();
    }

    if (targetStep === AppStep.SETUP) {
        setShowInlinePreview(false); setIsPresentationModalOpen(false); setShowMarpCodePreview(false);
        if (!hasIntegratedInteractiveSlide && selectedModel !== defaultModel) {
            setSelectedModel(defaultModel);
        }
        setFixLayoutIssues(false); setLayoutFixSlideNumbers('');
        setPrioritizeAnimationFixes(false); setAnimationFixSlideNumbers('');
        setAddMindMapSlide(false);
    } else if (targetStep === AppStep.INITIAL_HTML_READY || targetStep === AppStep.ENHANCED_HTML_READY || targetStep === AppStep.PPT_TEXT_READY) {
        setShowMarpCodePreview(false);
    } else if (targetStep === AppStep.INITIAL_MARP_READY || targetStep === AppStep.ENHANCED_MARP_READY) {
        setShowInlinePreview(false); setIsPresentationModalOpen(false); setShowMarpCodePreview(true);
    } else if (targetStep === AppStep.AWAITING_USER_IMAGE_ENHANCEMENT_INPUT) {
        setShowMarpCodePreview(currentMode === 'marp' && allMarpVersions.length > 0);
    }

    setCurrentStep(targetStep);

  }, [isLoading, isExplainingError, initialAIResponse, initialMarpResponse, interactiveSlideModalState, defaultModel, hasIntegratedInteractiveSlide, selectedModel, phase1LoadingMessage, currentMode, allHtmlVersions, allMarpVersions]);

  const handleAiCritique = async () => {
    if (!geminiService || allHtmlVersions.length === 0) {
      setError("Cannot critique: No base HTML or AI service available.");
      return;
    }

    setIsCritiquing(true);
    setError(null);
    
    try {
      const currentHtml = allHtmlVersions[allHtmlVersions.length - 1];
      
      // Sanitize HTML to remove base64 images for token efficiency
      let sanitizedHtml = currentHtml;
      userImageInputs.forEach((img, index) => {
        if (img.url && img.url.startsWith('data:image')) {
          const placeholder = `ai_image_ref:${index}`;
          // Use split/join for robust replacement of the very long base64 string
          sanitizedHtml = sanitizedHtml.split(`src='${img.url}'`).join(`src='${placeholder}'`);
          sanitizedHtml = sanitizedHtml.split(`data-background-image='${img.url}'`).join(`data-background-image='${placeholder}'`);
          sanitizedHtml = sanitizedHtml.split(`url('${img.url}')`).join(`url('${placeholder}')`);
        }
      });

      const modelForCritique = hasIntegratedInteractiveSlide ? PRO_MODEL_FOR_INTERACTIVE : selectedModel;
      
      const critique = await geminiService.critiqueHtml(sanitizedHtml, modelForCritique);
      
      setUserEnhancementRequests(prev => {
        const separator = prev.trim() ? '\n\n--- AI Critic Suggestions ---\n' : '--- AI Critic Suggestions ---\n';
        return prev + separator + critique;
      });

    } catch (e: any) {
      setError(`AI Critique failed: ${e.message || 'Unknown error'}`);
    } finally {
      setIsCritiquing(false);
    }
  };

  const handleExplainError = async () => {
    if (!geminiService || !error) return;
    setIsExplainingError(true); setErrorExplanation(null);
    const contextSummary = {
        currentAppMode: currentMode,
        currentAppStep: currentStep,
        interactiveSlideModalState: interactiveSlideModalState,
        hasIntegratedInteractiveSlide: hasIntegratedInteractiveSlide,
        selectedAIModel: selectedModel,
        uploadedFileNames: uploadedFilesData.map(f => f.name).join(', ') || 'None',
        pastedTextLength: pastedText.length, topicQueryProvided: !!topicQuery.trim(),
        userPresentationDescriptionProvided: !!userPresentationDescription.trim(),
        userPresentationDescriptionLength: userPresentationDescription.length,
        additionalUploadedFileNames: additionalUploadedFilesData.map(f => f.name).join(', ') || 'None',
        additionalPastedTextLength: additionalPastedText.length, additionalTopicQueryProvided: !!additionalTopicQuery.trim(),
        initialHTMLResponseExists: !!initialAIResponse, enhancedHTMLResponseExists: !!enhancedAIResponse,
        initialMarpResponseExists: !!initialMarpResponse, enhancedMarpResponseExists: !!enhancedMarpResponse,
        htmlVersionsCount: allHtmlVersions.length, marpVersionsCount: allMarpVersions.length,
        lastHtmlContentSnippet: allHtmlVersions.length > 0 ? allHtmlVersions[allHtmlVersions.length - 1].substring(0, 200) + '...' : 'None',
        lastMarpContentSnippet: allMarpVersions.length > 0 ? allMarpVersions[allMarpVersions.length - 1].substring(0, 200) + '...' : 'None',
        userEnhancementRequestLength: userEnhancementRequests.length,
        fixLayoutIssuesFlag: fixLayoutIssues, layoutFixSlideNumbers: layoutFixSlideNumbers, // New
        prioritizeAnimationFixesFlag: prioritizeAnimationFixes, animationFixSlideNumbers: animationFixSlideNumbers, // New
        numberOfUserImages: userImageInputs.length, numberOfUserVideos: userVideoInputs.length,
        numberOfUserCharts: userChartInputs.length, numberOfUserTables: userTableInputs.length, // New
        currentAiGeneratedSpecDraftExists: !!currentAiGeneratedSpecDraft, editableInteractiveSpecExists: !!editableInteractiveSpec,
        previousInteractiveSlidesCount: previousInteractiveSlides.length,
        lyraStatus: { connection: lyraConnectionStatus, playback: lyraPlaybackStatus, error: lyraErrorMessage }
    };
    try {
        const explanation = await geminiService.explainErrorSimply(contextSummary, error, defaultModel);
        setErrorExplanation(explanation);
    } catch (e: any) { setErrorExplanation("Sorry, AI explanation failed."); }
    finally { setIsExplainingError(false); }
  };


  const renderThemeSelector = () => (
    <CollapsibleSection title="Customize Appearance (HTML)" Icon={PaletteIcon} defaultOpen={true}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="theme-select" className="block text-sm font-medium text-slate-300 mb-1">HTML Theme:</label>
          <select id="theme-select" value={displayTheme} onChange={(e) => setDisplayTheme(e.target.value)}
            className="form-select w-full rounded-lg text-white border border-[#314d68] bg-[#101a23] focus:border-[#0c7ff2] focus:ring focus:ring-[#0c7ff2]/50 h-12 px-4 placeholder:text-[#90adcb] text-sm"
            aria-label="Select Presentation Theme">
            {validThemes.map(theme => <option key={theme} value={theme}>{theme.charAt(0).toUpperCase() + theme.slice(1)}</option>)}
          </select>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-400">Selected theme for HTML preview/download: <span className="font-semibold text-slate-200">{displayTheme}</span>.</p>
    </CollapsibleSection>
  );

  const renderModelSelectorForStep = (stepId: string, customLabel?: string) => {
    const isModelLocked = currentMode === 'html' && hasIntegratedInteractiveSlide;
    const currentModelForSelector = isModelLocked ? PRO_MODEL_FOR_INTERACTIVE : selectedModel;
    const modelsToList = isModelLocked ? [PRO_MODEL_FOR_INTERACTIVE] : availableModels;

    return (
        <ModelSelector
            selectedModel={currentModelForSelector}
            onModelChange={(newModel) => {
                 setSelectedModel(newModel);
                 setModelFallbackNotification(null);
            }}
            availableModels={modelsToList}
            modelDisplayNames={modelDisplayNames}
            id={`model-select-${stepId}`}
            label={customLabel || "Select AI Model for this Step:"}
            className="bg-[#182634] rounded-xl border border-[#223649] p-6 mb-8"
            labelClassName="text-lg font-semibold text-slate-200 mb-3"
            selectClassName="form-select w-full rounded-lg text-white border border-[#314d68] bg-[#101a23] focus:border-[#0c7ff2] focus:ring focus:ring-[#0c7ff2]/50 h-12 px-4 placeholder:text-[#90adcb] text-sm"
            descriptionClassName="mt-2 text-sm text-slate-400"
            isDisabled={isModelLocked}
            lockedReason={isModelLocked ? `Model set to ${modelDisplayNames[PRO_MODEL_FOR_INTERACTIVE] || PRO_MODEL_FOR_INTERACTIVE} for interactive HTML slide compatibility.` : undefined}
        />
    );
  };

  const PageTitle: React.FC<{ title: string; subtitle?: string; icon?: React.ElementType }> = ({ title, subtitle, icon: Icon }) => (
    <div className="flex flex-col items-center text-center gap-3 py-4 mb-6">
        {Icon && <Icon className="text-5xl text-green-500" />}
        <h1 className="tracking-tight text-3xl font-bold leading-tight">{title}</h1>
        {subtitle && <p className="text-base text-slate-400">{subtitle}</p>}
    </div>
  );

  const renderMarpContent = () => {
    const marpCode = (currentStep === AppStep.INITIAL_MARP_READY && initialMarpResponse?.marp_code_content) ||
                     (currentStep === AppStep.ENHANCED_MARP_READY && enhancedMarpResponse?.enhanced_marp_code_content) ||
                     null;
    const marpTheme = (currentStep === AppStep.INITIAL_MARP_READY && initialMarpResponse?.chosen_theme) ||
                      (currentStep === AppStep.ENHANCED_MARP_READY && initialMarpResponse?.chosen_theme) ||
                      "default";
    const marpQueries = (currentStep === AppStep.INITIAL_MARP_READY && initialMarpResponse?.enhancement_queries) ||
                        (currentStep === AppStep.ENHANCED_MARP_READY && enhancedMarpResponse?.ai_confirmation_or_further_queries) ||
                        "";
    const marpImageSuggestions = (currentStep === AppStep.INITIAL_MARP_READY ? initialMarpResponse?.image_suggestions : enhancedMarpResponse ? initialMarpResponse?.image_suggestions : []) || [];
    const marpVideoSuggestions = (currentStep === AppStep.INITIAL_MARP_READY ? initialMarpResponse?.video_suggestions : enhancedMarpResponse ? initialMarpResponse?.video_suggestions : []) || [];
    const marpChartSuggestions = (currentStep === AppStep.INITIAL_MARP_READY ? initialMarpResponse?.chart_suggestions : []) || []; // Simplified for Marp for now
    const marpTableSuggestions = (currentStep === AppStep.INITIAL_MARP_READY ? initialMarpResponse?.table_suggestions : []) || []; // Simplified for Marp


    if (!marpCode) return <p className="text-red-400">Error: Marp code content missing for this step.</p>;
    const currentModelDisplayName = modelDisplayNames[selectedModel] || selectedModel;

    return (
        <div className="space-y-8 w-full">
            <PageTitle title={currentStep === AppStep.INITIAL_MARP_READY ? "Initial Marp Code Generated!" : "Enhanced Marp Code Generated!"}
                       subtitle={`AI (model: ${currentModelDisplayName}) created Marp code. Suggested Marp theme: '${marpTheme}'.`}
                       icon={PageTitleCheckIcon} />

            <CollapsibleSection title="Generated Marp Code" Icon={CodeBracketSquareIcon} isOpen={showMarpCodePreview} setIsOpen={setShowMarpCodePreview} defaultOpen={true}>
                <div className="relative">
                    <textarea readOnly value={marpCode}
                              className="w-full h-96 p-4 rounded-lg bg-[#0D1117] border border-[#30363D] text-slate-200 font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-[#0c7ff2]"
                              aria-label="Generated Marp Code"/>
                </div>
                <div className="mt-4 flex flex-col sm:flex-row gap-3">
                    <Button onClick={() => copyToClipboard(marpCode)} Icon={ClipboardDocumentIcon} className="flex-1">Copy Marp Code</Button>
                    <Button onClick={() => downloadTextFile(marpCode, 'presentation.md')} variant="secondary" Icon={DocumentArrowDownIcon} className="flex-1">Download .md</Button>
                </div>
                <p className="mt-3 text-xs text-slate-400">Paste this code into a Marp editor (like VS Code with Marp CLI/extension) to view/export your presentation.</p>
                <p className="mt-1 text-xs text-yellow-300 flex items-center"><InformationCircleIcon className="w-3 h-3 mr-1"/> If you used AI-generated images, their URLs in Marp will be placeholders (e.g., `ai_image_ref:0`). You need to download the image, host it publicly, and replace the placeholder with the real URL in your Marp code.</p>
            </CollapsibleSection>

            <div className="flex flex-col sm:flex-row gap-3">
                 <Button onClick={handleRefineFurther} Icon={SparklesIcon} size="lg" className="flex-1 bg-green-600 hover:bg-green-500 focus:ring-green-500">Next: Add Media & Refine Marp</Button>
                 <Button onClick={handleGenerateHtmlFromMarp} Icon={ArrowRightLeftIcon} variant="secondary" className="flex-1">Convert this Marp to Web HTML</Button>
            </div>

            {getActiveSearchResults() && getActiveSearchResults()!.length > 0 && (
              <CollapsibleSection title="Google Search Sources Used" Icon={MagnifyingGlassIcon} isOpen={showSearchResults} setIsOpen={setShowSearchResults} >
                <ul className="list-disc list-inside space-y-1 text-sm text-slate-300">
                  {getActiveSearchResults()!.map(result => ( <li key={result.uri}><a href={result.uri} target="_blank" rel="noopener noreferrer" className="text-[#0c7ff2] hover:underline">{result.title || result.uri}</a></li> ))}
                </ul>
              </CollapsibleSection>
            )}

            <CollapsibleSection title="AI Suggestions & Next Steps (Marp)" Icon={LightBulbIcon} isOpen={showAiSuggestions} setIsOpen={setShowAiSuggestions} >
                <div className="bg-[#101a23]/50 p-4 rounded-md space-y-3 border border-[#314d68]/50">
                    {marpImageSuggestions.length > 0 && ( <div> <h3 className="font-semibold text-slate-200 mb-1 flex items-center"><PhotoIcon className="w-4 h-4 mr-2 text-sky-400"/>AI Suggested Image Placements (Conceptual):</h3> <ul className="list-disc list-inside text-slate-300 text-sm space-y-1 pl-5"> {marpImageSuggestions.map((s, i) => <li key={`m-img-${i}`}><strong>{s.slide_reference}:</strong> {s.description}</li>)} </ul> <p className="text-xs text-slate-400 mt-1 pl-5">You'll be able to provide URLs or generate images in the next step. These will be linked in Marp.</p> </div> )}
                    {marpVideoSuggestions.length > 0 && ( <div className="mt-3"> <h3 className="font-semibold text-slate-200 mb-1 flex items-center"><FilmIcon className="w-4 h-4 mr-2 text-purple-400"/>AI Suggested Video/GIF Placements (Conceptual):</h3> <ul className="list-disc list-inside text-slate-300 text-sm space-y-1 pl-5"> {marpVideoSuggestions.map((v, i) => <li key={`m-vid-${i}`}><strong>{v.slide_reference} ({v.media_type}):</strong> {v.description}</li>)} </ul> <p className="text-xs text-slate-400 mt-1 pl-5">You'll be able to provide URLs in the next step. These will be linked in Marp.</p> </div> )}
                    {marpChartSuggestions.length > 0 && ( <div className="mt-3"> <h3 className="font-semibold text-slate-200 mb-1 flex items-center"><ChartBarIcon className="w-4 h-4 mr-2 text-lime-400"/>AI Suggested Charts (Conceptual for Marp):</h3> <ul className="list-disc list-inside text-slate-300 text-sm space-y-1 pl-5"> {marpChartSuggestions.map((c, i) => <li key={`m-chart-${i}`}><strong>{c.slide_reference} ({c.chart_type}):</strong> {c.description}. Data Idea: {c.data_description_or_ai_query}</li>)} </ul> <p className="text-xs text-slate-400 mt-1 pl-5">AI suggests charts. For Marp, you'll describe these in the next step, and AI will generate image placeholders & data notes.</p> </div> )}
                    {marpTableSuggestions.length > 0 && ( <div className="mt-3"> <h3 className="font-semibold text-slate-200 mb-1 flex items-center"><TableCellsIcon className="w-4 h-4 mr-2 text-teal-400"/>AI Suggested Tables (Conceptual for Marp):</h3> <ul className="list-disc list-inside text-slate-300 text-sm space-y-1 pl-5"> {marpTableSuggestions.map((t, i) => <li key={`m-table-${i}`}><strong>{t.slide_reference}:</strong> {t.description}. Content Idea: {t.data_description_or_ai_query}</li>)} </ul> <p className="text-xs text-slate-400 mt-1 pl-5">AI suggests tables. For Marp, you'll describe these in the next step, and AI will generate Markdown table syntax.</p> </div> )}
                    {marpQueries && ( <div className="mt-3"> <h3 className="font-semibold text-slate-200 mb-1">AI Asks (for Marp):</h3> <p className="text-slate-300 text-sm whitespace-pre-wrap">{marpQueries}</p> <p className="text-xs text-slate-400 mt-1">You can describe these preferences in the next step.</p> </div> )}
                </div>
            </CollapsibleSection>
        </div>
    );
  };

  const getLoadingMessage = (): string => {
    switch (currentStep) {
      case AppStep.GENERATING_INITIAL_HTML: return "Generating initial HTML presentation...";
      case AppStep.GENERATING_ENHANCED_HTML: return "Enhancing HTML presentation with your inputs...";
      case AppStep.GENERATING_PPT_TEXT: return "Generating plain text for PowerPoint...";
      case AppStep.GENERATING_INITIAL_MARP: return "Generating initial Marp markdown...";
      case AppStep.GENERATING_ENHANCED_MARP: return "Enhancing Marp markdown with your inputs...";
      case AppStep.AGENT_RUNNING: return "AI Agent is working...";
      default: return "Loading...";
    }
  };

  const renderContent = () => {
    if (isApiKeyModalOpen) {
      return <ApiKeyModal onApiKeySubmit={handleApiKeySubmit} isLoading={isApiKeyLoading} />;
    }

    if (phase1LoadingMessage) { return <LoadingSpinner message={phase1LoadingMessage} />; }
    if (isLoading && interactiveSlideModalState === 'hidden') { return <LoadingSpinner message={getLoadingMessage()} />; }

    const isGenerateButtonDisabled = ( !letAiDecideSlides && (isNaN(minSlides) || minSlides <= 0) ) ||
                                     !( (includeFileData && uploadedFilesData.length > 0) ||
                                        (includePastedText && pastedText.trim()) ||
                                        (includeTopicQuery && topicQuery.trim()) ) || !geminiService;

    const showMusicControls = currentMode === 'html' &&
                             (currentStep === AppStep.INITIAL_HTML_READY ||
                              currentStep === AppStep.AWAITING_USER_IMAGE_ENHANCEMENT_INPUT ||
                              currentStep === AppStep.ENHANCED_HTML_READY ||
                              currentStep === AppStep.PPT_TEXT_READY
                             ) && allHtmlVersions.length > 0;

    const currentModelDisplayName = modelDisplayNames[selectedModel] || selectedModel;
    
    const handleLyraPlay = async () => {
        if (!lyraServiceInstance) return;

        let textForMusic = currentSlideTextRef.current;

        // If ref is empty (e.g., preview not rendered), extract from first slide HTML
        if (!textForMusic && allHtmlVersions.length > 0) {
            textForMusic = extractFirstSlideText(allHtmlVersions[0]);
            currentSlideTextRef.current = textForMusic; // Update ref for future use
        }

        // If we have text, update the music prompts before playing
        if (textForMusic) {
            // No need to await, let it update in the background while music starts buffering
            lyraServiceInstance.updateMusicForSlide(textForMusic)
                .then(() => {
                    setLyraCurrentPromptsText(lyraServiceInstance.currentPrompts.map(p => p.text).join(', ') || "Default theme");
                });
        }
        
        lyraServiceInstance.play();
    };

    return (
      <div className="space-y-8 w-full">
         {showMusicControls && lyraServiceInstance && (
            <MusicControls
                lyraConnectionStatus={lyraConnectionStatus}
                lyraPlaybackStatus={lyraPlaybackStatus}
                currentPromptsText={lyraCurrentPromptsText}
                onConnect={() => lyraServiceInstance.connect()}
                onDisconnect={() => lyraServiceInstance.reset()}
                onPlay={handleLyraPlay}
                onPause={() => lyraServiceInstance.pause()}
                onStop={() => lyraServiceInstance.stop()}
                isMusicServiceAvailable={isLyraServiceAvailable}
                lyraErrorMessage={lyraErrorMessage}
            />
        )}
      {(() => {
        switch (currentStep) {
          case AppStep.AGENT_RUNNING:
          case AppStep.AGENT_COMPLETED:
            return (
                <AgentView
                    log={agentLog}
                    finalHtml={finalAgentHtml}
                    error={error}
                    onDownload={(html, theme, filename) => downloadPresentationHtml(html, theme, filename)}
                    onRestart={restartProcess}
                    onRefine={handleRefineAgent}
                    isRefining={isAgentRefining}
                    refinementInstructions={agentRefinementInstructions}
                    onRefinementInstructionsChange={setAgentRefinementInstructions}
                    onContinueManually={handleContinueWithManualEnhancement}
                    isPausedForUserTasks={isAgentPausedForUserTasks}
                    tasksForUser={tasksForUser}
                    taskUrls={agentTaskUrls}
                    onTaskUrlChange={(taskId, url) => setAgentTaskUrls(prev => ({ ...prev, [taskId]: url }))}
                    onSubmitUserTasks={handleSubmitUserTasks}
                    
                    // Props for theme selector
                    displayTheme={displayTheme}
                    onDisplayThemeChange={setDisplayTheme}

                    // Props for Worker Model Selector
                    agentWorkerModel={agentWorkerModel}
                    onAgentWorkerModelChange={setAgentWorkerModel}

                    // Props for Music Controls
                    lyraServiceInstance={lyraServiceInstance}
                    lyraConnectionStatus={lyraConnectionStatus}
                    lyraPlaybackStatus={lyraPlaybackStatus}
                    currentPromptsText={lyraCurrentPromptsText}
                    isLyraServiceAvailable={isLyraServiceAvailable}
                    lyraErrorMessage={lyraErrorMessage}
                    currentSlideTextRef={currentSlideTextRef}
                    onSetLyraCurrentPromptsText={setLyraCurrentPromptsText}
                    
                    // Props for Preview
                    showInlinePreview={showInlinePreview}
                    setShowInlinePreview={setShowInlinePreview}
                    setIsPresentationModalOpen={setIsPresentationModalOpen}
                />
            );
          case AppStep.SETUP:
            return (
              <>
                <PageTitle title="Create Your Presentation" subtitle="Provide content, choose output (HTML or Marp), and set parameters." />

                <CollapsibleSection title="Output Format" Icon={CogIcon} defaultOpen={true}>
                  <div className="flex flex-col sm:flex-row gap-3 p-1 bg-[#101a23]/30 rounded-lg">
                    <Button
                        onClick={() => setCurrentMode('html')}
                        variant={currentMode === 'html' ? 'primary' : 'secondary'}
                        className={`flex-1 ${currentMode === 'html' ? 'ring-2 ring-offset-2 ring-offset-[#182634] ring-[#0c7ff2]' : ''}`}
                        aria-pressed={currentMode === 'html'}
                    >
                        Web Presentation (HTML)
                    </Button>
                    <Button
                        onClick={() => setCurrentMode('marp')}
                        variant={currentMode === 'marp' ? 'primary' : 'secondary'}
                        className={`flex-1 ${currentMode === 'marp' ? 'ring-2 ring-offset-2 ring-offset-[#182634] ring-[#0c7ff2]' : ''}`}
                        aria-pressed={currentMode === 'marp'}
                    >
                        Marp Markdown Code
                    </Button>
                  </div>
                  <p className="mt-3 text-xs text-slate-400">HTML gives a web presentation (supports dynamic music). Marp gives Markdown for tools like VS Code.</p>
                </CollapsibleSection>

                {renderModelSelectorForStep("setup", `Select AI Model for Initial ${currentMode === 'html' ? 'HTML' : 'Marp'} Generation:`)}

                <CollapsibleSection title="Slide Configuration" Icon={CogIcon} defaultOpen={true}>
                  <NumberInput label="Minimum Number of Slides:" value={minSlides} onChange={setMinSlides} disabled={letAiDecideSlides} />
                  <div className="mt-3 flex items-center">
                    <input id="let-ai-decide-slides" type="checkbox" checked={letAiDecideSlides} onChange={e => setLetAiDecideSlides(e.target.checked)} className="h-4 w-4 text-[#0c7ff2] bg-[#101a23] border-[#314d68] rounded focus:ring-[#0c7ff2] focus:ring-offset-[#101a23]" aria-describedby="ai-decide-slides-description"/>
                    <label htmlFor="let-ai-decide-slides" className="ml-2 text-sm font-medium text-slate-300">Let AI decide the optimal number of slides</label>
                  </div>
                  <p id="ai-decide-slides-description" className="mt-1 text-xs text-slate-400 pl-6">If checked, AI determines slide count. Else, aims for at least minimum.</p>
                </CollapsibleSection>

                <CollapsibleSection title="Input Sources" Icon={DocumentTextIcon} defaultOpen={true}>
                    <p className="text-sm text-slate-400 mb-4">Provide content using one or more methods below. Check the box next to each input you want to include.</p>
                    <div className="p-4 bg-[#101a23]/50 rounded-lg border border-[#314d68]/50 mb-4">
                        <FileUpload onFilesAdded={handleAddFiles} hasExistingFiles={uploadedFilesData.length > 0} onClearAllFiles={handleClearAllFiles} fileInputId="file-upload-input"/>
                        {uploadedFilesData.length > 0 && ( <div className="mt-4"> <h4 className="text-sm font-medium text-slate-300 mb-2">Selected Files ({uploadedFilesData.length}):</h4> <ul className="space-y-1 max-h-48 overflow-y-auto pr-2"> {uploadedFilesData.map((file, index) => ( <li key={file.name + '-' + index} className="flex justify-between items-center text-sm text-slate-200 bg-[#101a23]/70 p-2 rounded hover:bg-[#314d68]/50"> <span className="truncate" title={file.name}>{file.name}</span> <button onClick={() => handleRemoveFile(index)} className="text-red-400 hover:text-red-300 p-1 ml-2 rounded-full hover:bg-red-500/20" aria-label={`Remove ${file.name}`} title={`Remove ${file.name}`}> <TrashIcon className="w-4 h-4" /> </button> </li> ))} </ul> </div> )}
                        <div className="mt-3 flex items-center"> <input id="include-file-data" type="checkbox" checked={includeFileData} onChange={e => setIncludeFileData(e.target.checked)} disabled={uploadedFilesData.length === 0} className="h-4 w-4 text-[#0c7ff2] bg-[#101a23] border-[#314d68] rounded focus:ring-[#0c7ff2] disabled:opacity-50" /> <label htmlFor="include-file-data" className={`ml-2 text-sm font-medium ${uploadedFilesData.length === 0 ? 'text-slate-500' : 'text-slate-300'}`}>Include uploaded file content</label> </div>
                    </div>
                    <div className="p-4 bg-[#101a23]/50 rounded-lg border border-[#314d68]/50 mb-4">
                        <label htmlFor="pasted-text" className="block text-sm font-medium text-slate-300 mb-1">Paste your content here:</label>
                        <div className="flex items-start space-x-2"> <textarea id="pasted-text" rows={6} className="form-textarea mt-1 block w-full rounded-lg text-white border border-[#314d68] bg-[#101a23] focus:border-[#0c7ff2] focus:ring focus:ring-[#0c7ff2]/50 px-3 py-2 placeholder:text-[#90adcb] text-sm" value={pastedText} onChange={(e) => { setPastedText(e.target.value); if(e.target.value.trim()) setIncludePastedText(true); else setIncludePastedText(false);}} placeholder="Paste your presentation data, script, or notes... or use the mic to dictate." aria-label="Paste your content here" /> <AudioInputControl geminiService={geminiService} onTranscriptionComplete={(text) => setPastedText(prev => prev + (prev ? ' ' : '') + text)} inputTargetDescription="pasted text" className="mt-1" microphonePermissionStatus={microphonePermissionStatus} /> </div>
                        <div className="mt-3 flex items-center"> <input id="include-pasted-text" type="checkbox" checked={includePastedText} onChange={e => setIncludePastedText(e.target.checked)} disabled={!pastedText.trim()} className="h-4 w-4 text-[#0c7ff2] bg-[#101a23] border-[#314d68] rounded focus:ring-[#0c7ff2] disabled:opacity-50" /> <label htmlFor="include-pasted-text" className={`ml-2 text-sm font-medium ${!pastedText.trim() ? 'text-slate-500' : 'text-slate-300'}`}>Include pasted text</label> </div>
                    </div>
                    <div className="p-4 bg-[#101a23]/50 rounded-lg border border-[#314d68]/50 mb-4">
                        <label htmlFor="topic-query" className="block text-sm font-medium text-slate-300 mb-1">Enter a topic for your presentation:</label>
                        <div className="flex items-center space-x-2"> <input id="topic-query" type="text" className="form-input mt-1 block w-full rounded-lg text-white border border-[#314d68] bg-[#101a23] focus:border-[#0c7ff2] focus:ring focus:ring-[#0c7ff2]/50 h-12 px-4 placeholder:text-[#90adcb] text-sm" value={topicQuery} onChange={(e) => { setTopicQuery(e.target.value); if(e.target.value.trim()) setIncludeTopicQuery(true); else setIncludeTopicQuery(false);}} placeholder="e.g., 'The Future of Renewable Energy'" aria-label="Enter a topic for your presentation" /> <AudioInputControl geminiService={geminiService} onTranscriptionComplete={(text) => setTopicQuery(prev => prev + (prev ? ' ' : '') + text)} inputTargetDescription="presentation topic" className="mt-1" microphonePermissionStatus={microphonePermissionStatus} /> </div>
                        <div className="mt-3 flex items-center"> <input id="include-topic-query" type="checkbox" checked={includeTopicQuery} onChange={e => setIncludeTopicQuery(e.target.checked)} disabled={!topicQuery.trim()} className="h-4 w-4 text-[#0c7ff2] bg-[#101a23] border-[#314d68] rounded focus:ring-[#0c7ff2] disabled:opacity-50" /> <label htmlFor="include-topic-query" className={`ml-2 text-sm font-medium ${!topicQuery.trim() ? 'text-slate-500' : 'text-slate-300'}`}>Include topic</label> </div>
                        {includeTopicQuery && topicQuery.trim() && ( <div className="mt-3 pl-6"> <div className="flex items-center"> <input id="use-search-toggle" type="checkbox" checked={useSearchForTopic} onChange={e => setUseSearchForTopic(e.target.checked)} className="h-4 w-4 text-[#0c7ff2] bg-[#101a23] border-[#314d68] rounded focus:ring-[#0c7ff2]" aria-describedby="search-toggle-description"/> <label htmlFor="use-search-toggle" className="ml-2 text-sm font-medium text-slate-300">Use Google Search for this topic</label> </div> <p id="search-toggle-description" className="mt-1 text-xs text-slate-400">If checked, AI uses Google Search. Unchecked, AI uses internal knowledge.</p> </div> )}
                    </div>
                    <div className="p-4 bg-[#101a23]/50 rounded-lg border border-[#314d68]/50">
                        <label htmlFor="user-presentation-description" className="block text-sm font-medium text-slate-300 mb-1">Describe your desired presentation (Optional):</label>
                        <div className="flex items-start space-x-2">
                            <textarea
                                id="user-presentation-description"
                                rows={4}
                                className="form-textarea mt-1 block w-full rounded-lg text-white border border-[#314d68] bg-[#101a23] focus:border-[#0c7ff2] focus:ring focus:ring-[#0c7ff2]/50 px-3 py-2 placeholder:text-[#90adcb] text-sm"
                                value={userPresentationDescription}
                                onChange={(e) => { setUserPresentationDescription(e.target.value); if(e.target.value.trim()) setIncludeUserPresentationDescription(true); else setIncludeUserPresentationDescription(false);}}
                                placeholder="e.g., 'Make it modern and minimalist', 'Focus on visuals for a young audience', 'Include a Q&A slide at the end', 'The tone should be professional and persuasive.'"
                                aria-label="Describe your desired presentation style and instructions"
                            />
                            <AudioInputControl
                                geminiService={geminiService}
                                onTranscriptionComplete={(text) => setUserPresentationDescription(prev => prev + (prev ? ' ' : '') + text)}
                                inputTargetDescription="presentation description and instructions"
                                className="mt-1"
                                microphonePermissionStatus={microphonePermissionStatus}
                            />
                        </div>
                        <div className="mt-3 flex items-center">
                            <input
                                id="include-user-presentation-description"
                                type="checkbox"
                                checked={includeUserPresentationDescription}
                                onChange={e => setIncludeUserPresentationDescription(e.target.checked)}
                                disabled={!userPresentationDescription.trim()}
                                className="h-4 w-4 text-[#0c7ff2] bg-[#101a23] border-[#314d68] rounded focus:ring-[#0c7ff2] disabled:opacity-50"
                            />
                            <label
                                htmlFor="include-user-presentation-description"
                                className={`ml-2 text-sm font-medium ${!userPresentationDescription.trim() ? 'text-slate-500' : 'text-slate-300'}`}
                            >
                                Include this description in generation
                            </label>
                        </div>
                    </div>
                </CollapsibleSection>

                <Button onClick={handleGenerateInitial} disabled={isGenerateButtonDisabled || isLoading } Icon={PlayIcon} size="lg" className="w-full">
                    {`Generate Initial ${currentMode === 'html' ? 'Web Presentation' : 'Marp Code'}`}
                </Button>
                {isGenerateButtonDisabled && !geminiService && <p className="text-xs text-red-400 text-center mt-2">AI Service initialization failed. Check console and API Key.</p>}
                {isGenerateButtonDisabled && !letAiDecideSlides && (isNaN(minSlides) || minSlides <= 0) && <p className="text-xs text-red-400 text-center mt-2">Minimum slides must be a positive number (or let AI decide).</p>}
                {isGenerateButtonDisabled && !((includeFileData && uploadedFilesData.length > 0) || (includePastedText && pastedText.trim()) || (includeTopicQuery && topicQuery.trim())) && <p className="text-xs text-yellow-300 text-center mt-2 flex items-center justify-center"><InformationCircleIcon className="w-4 h-4 mr-1"/> Please select and provide content for at least one input source.</p>}
                
                <div className="my-6 p-4 bg-gradient-to-r from-purple-800/20 via-blue-800/20 to-sky-800/20 rounded-xl border border-blue-700/50 text-center">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-300 mb-2">AI Agent Worker Model:</label>
                    <div className="inline-flex justify-center gap-1 p-1 bg-[#101a23]/30 rounded-lg">
                        <Button
                            onClick={() => setAgentWorkerModel('gemini-2.5-flash-lite-preview-06-17')}
                            variant={agentWorkerModel === 'gemini-2.5-flash-lite-preview-06-17' ? 'primary' : 'secondary'}
                            size="sm"
                            className={`!shadow-none ${agentWorkerModel === 'gemini-2.5-flash-lite-preview-06-17' ? 'ring-2 ring-offset-2 ring-offset-[#182634] ring-[#0c7ff2]' : ''}`}
                            aria-pressed={agentWorkerModel === 'gemini-2.5-flash-lite-preview-06-17'}
                        >
                            Flash Lite (Fastest)
                        </Button>
                        <Button
                            onClick={() => setAgentWorkerModel('gemini-2.5-flash')}
                            variant={agentWorkerModel === 'gemini-2.5-flash' ? 'primary' : 'secondary'}
                            size="sm"
                            className={`!shadow-none ${agentWorkerModel === 'gemini-2.5-flash' ? 'ring-2 ring-offset-2 ring-offset-[#182634] ring-[#0c7ff2]' : ''}`}
                            aria-pressed={agentWorkerModel === 'gemini-2.5-flash'}
                        >
                            Flash (Faster)
                        </Button>
                        <Button
                            onClick={() => setAgentWorkerModel('gemini-2.5-pro')}
                            variant={agentWorkerModel === 'gemini-2.5-pro' ? 'primary' : 'secondary'}
                            size="sm"
                            className={`!shadow-none ${agentWorkerModel === 'gemini-2.5-pro' ? 'ring-2 ring-offset-2 ring-offset-[#182634] ring-[#0c7ff2]' : ''}`}
                            aria-pressed={agentWorkerModel === 'gemini-2.5-pro'}
                        >
                            Pro (Smarter)
                        </Button>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      The Head/Analyzer AI is always Gemini 2.5 Pro. The worker AI handles content generation and can be Flash Lite (fastest), Flash (faster), or Pro (more detailed).
                    </p>
                  </div>
                  <div className="mb-4">
                        <div className="flex items-center justify-center">
                            <input
                                id="allow-agent-user-tasks"
                                type="checkbox"
                                checked={allowAgentToRequestUserTasks}
                                onChange={e => setAllowAgentToRequestUserTasks(e.target.checked)}
                                className="h-4 w-4 text-[#0c7ff2] bg-[#101a23] border-[#314d68] rounded focus:ring-[#0c7ff2] focus:ring-offset-[#101a23]"
                                aria-describedby="allow-agent-user-tasks-description"
                            />
                            <label htmlFor="allow-agent-user-tasks" className="ml-2 text-sm font-medium text-slate-300">
                                Allow agent to ask for media URLs
                            </label>
                        </div>
                        <p id="allow-agent-user-tasks-description" className="mt-2 text-xs text-slate-400">
                            If checked, the agent can pause to ask for specific media (e.g., technical diagrams) it cannot create itself.
                        </p>
                    </div>
                  <Button onClick={handleCreateAgent} Icon={CpuChipIcon} disabled={isGenerateButtonDisabled || isLoading || currentMode !== 'html'} size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 focus:ring-purple-500 text-white shadow-lg">
                      Let AI Agent Build It (HTML)
                  </Button>
                  <p className="mt-3 text-xs text-slate-400">
                      Let a powerful AI agent autonomously create and refine the entire presentation for you. (HTML Output Only)
                  </p>
                </div>
              </>
            );

          case AppStep.INITIAL_HTML_READY:
            if (!initialAIResponse || !displayTheme || allHtmlVersions.length === 0) return <p className="text-red-400">Error: Initial HTML response data, theme or history missing.</p>;
            const initialHtmlContent = allHtmlVersions[0];
            return (
              <>
                <PageTitle title="Initial Web Presentation Generated!" subtitle={`AI (model: ${currentModelDisplayName}) created an initial HTML version. AI Suggested Theme: '${initialAIResponse.chosen_theme}'.`} icon={PageTitleCheckIcon} />
                {renderThemeSelector()}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={() => downloadPresentationWithCurrentSettings(initialHtmlContent, 'initial_presentation.html')} Icon={DocumentArrowDownIcon} className="flex-1">Download Initial HTML</Button>
                  <Button onClick={() => setShowInlinePreview(p => !p)} variant="secondary" Icon={EyeIcon} className="flex-1">{showInlinePreview ? "Hide" : "Show"} Inline Preview</Button>
                  <Button onClick={() => setIsPresentationModalOpen(true)} variant="primary" Icon={ArrowsPointingOutIcon} className="flex-1">Present Fullscreen</Button>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={handleProceedToRefinementStep} Icon={SparklesIcon} size="lg" className="flex-1 bg-green-600 hover:bg-green-500 focus:ring-green-500">Next: Add Media & Enhancements</Button>
                  <Button onClick={handleGenerateMarpFromHtml} Icon={ArrowRightLeftIcon} variant="secondary" className="flex-1">Convert to Marp Code</Button>
                </div>
                {initialHtmlContent && displayTheme && ( <CollapsibleSection title="Preview Initial Presentation (Inline)" Icon={EyeIcon} isOpen={showInlinePreview} setIsOpen={setShowInlinePreview} > <PresentationPreview htmlContent={initialHtmlContent} chosenTheme={displayTheme} /> </CollapsibleSection> )}
                {getActiveSearchResults() && getActiveSearchResults()!.length > 0 && ( <CollapsibleSection title="Google Search Sources Used" Icon={MagnifyingGlassIcon} isOpen={showSearchResults} setIsOpen={setShowSearchResults} > <ul className="list-disc list-inside space-y-1 text-sm text-slate-300"> {getActiveSearchResults()!.map(result => ( <li key={result.uri}><a href={result.uri} target="_blank" rel="noopener noreferrer" className="text-[#0c7ff2] hover:underline">{result.title || result.uri}</a></li> ))} </ul> </CollapsibleSection> )}
                <CollapsibleSection title="AI Suggestions & Next Steps" Icon={LightBulbIcon} isOpen={showAiSuggestions} setIsOpen={setShowAiSuggestions} > <div className="bg-[#101a23]/50 p-4 rounded-md space-y-3 border border-[#314d68]/50"> {initialAIResponse.image_suggestions.length > 0 && ( <div> <h3 className="font-semibold text-slate-200 mb-1 flex items-center"><PhotoIcon className="w-4 h-4 mr-2 text-sky-400"/>AI Suggested Image Placements:</h3> <ul className="list-disc list-inside text-slate-300 text-sm space-y-1 pl-5"> {initialAIResponse.image_suggestions.map((s, i) => <li key={`img-${i}`}><strong>{s.slide_reference}:</strong> {s.description}</li>)} </ul> <p className="text-xs text-slate-400 mt-1 pl-5">You'll be able to provide URLs or generate images in the next step.</p> </div> )} {initialAIResponse.video_suggestions.length > 0 && ( <div className="mt-3"> <h3 className="font-semibold text-slate-200 mb-1 flex items-center"><FilmIcon className="w-4 h-4 mr-2 text-purple-400"/>AI Suggested Video/GIF Placements:</h3> <ul className="list-disc list-inside text-slate-300 text-sm space-y-1 pl-5"> {initialAIResponse.video_suggestions.map((v, i) => <li key={`vid-${i}`}><strong>{v.slide_reference} ({v.media_type}):</strong> {v.description}</li>)} </ul> <p className="text-xs text-slate-400 mt-1 pl-5">You'll be able to provide URLs in the next step.</p> </div> )} {initialAIResponse.chart_suggestions.length > 0 && ( <div className="mt-3"> <h3 className="font-semibold text-slate-200 mb-1 flex items-center"><ChartBarIcon className="w-4 h-4 mr-2 text-lime-400"/>AI Suggested Charts:</h3> <ul className="list-disc list-inside text-slate-300 text-sm space-y-1 pl-5"> {initialAIResponse.chart_suggestions.map((c, i) => <li key={`chart-${i}`}><strong>{c.slide_reference} ({c.chart_type}):</strong> {c.description}. Data: {c.data_description_or_ai_query}</li>)} </ul> <p className="text-xs text-slate-400 mt-1 pl-5">Review these in the next step to provide data/confirm.</p> </div> )} {initialAIResponse.table_suggestions.length > 0 && ( <div className="mt-3"> <h3 className="font-semibold text-slate-200 mb-1 flex items-center"><TableCellsIcon className="w-4 h-4 mr-2 text-teal-400"/>AI Suggested Tables:</h3> <ul className="list-disc list-inside text-slate-300 text-sm space-y-1 pl-5"> {initialAIResponse.table_suggestions.map((t, i) => <li key={`table-${i}`}><strong>{t.slide_reference}:</strong> {t.description}. Content: {t.data_description_or_ai_query}</li>)} </ul> <p className="text-xs text-slate-400 mt-1 pl-5">Review these in the next step to provide data/confirm.</p> </div> )} {initialAIResponse.enhancement_queries && ( <div className="mt-3"> <h3 className="font-semibold text-slate-200 mb-1">AI Asks:</h3> <p className="text-slate-300 text-sm whitespace-pre-wrap">{initialAIResponse.enhancement_queries}</p> <p className="text-xs text-slate-400 mt-1">You can describe these preferences in the next step.</p> </div> )} </div> </CollapsibleSection>
              </>
            );

          case AppStep.INITIAL_MARP_READY:
            return renderMarpContent();

          case AppStep.AWAITING_USER_IMAGE_ENHANCEMENT_INPUT:
            const baseContentAvailable = currentMode === 'html' ? (allHtmlVersions.length > 0 && displayTheme) : (allMarpVersions.length > 0);
            if (!baseContentAvailable) return <p className="text-red-400">Error: Base {currentMode.toUpperCase()} content or theme missing for this step.</p>;
            if (!geminiService) { return <div className="space-y-6 w-full"> <PageTitle title="AI Service Error" subtitle="The AI service could not be initialized. Please check console and API key." /> <Button onClick={restartProcess} Icon={ArrowPathIcon} className="mt-4">Restart Setup</Button> </div>; }

            const currentAiQueries = currentMode === 'html' ?
                ((enhancedAIResponse?.ai_confirmation_or_further_queries && enhancedAIResponse.ai_confirmation_or_further_queries.trim() !== initialAIResponse?.enhancement_queries?.trim()) ? enhancedAIResponse.ai_confirmation_or_further_queries : initialAIResponse?.enhancement_queries)
                : ((enhancedMarpResponse?.ai_confirmation_or_further_queries && enhancedMarpResponse.ai_confirmation_or_further_queries.trim() !== initialMarpResponse?.enhancement_queries?.trim()) ? enhancedMarpResponse.ai_confirmation_or_further_queries : initialMarpResponse?.enhancement_queries);

            const previewTitleForRefinement = currentMode === 'html' ?
                (allHtmlVersions.length > 1 ? "Inline Preview of Current Base HTML" : "Inline Preview of Initial HTML")
                : (allMarpVersions.length > 1 ? "Review Current Base Marp" : "Review Initial Marp");
            const proModelDisplayName = modelDisplayNames[PRO_MODEL_FOR_INTERACTIVE] || PRO_MODEL_FOR_INTERACTIVE;
            const latestHtmlWithPlaceholders = currentMode === 'html' ? (allHtmlVersions.length > 0 ? allHtmlVersions[allHtmlVersions.length - 1] : null) : null;
            const displayHtmlForRefinement = latestHtmlWithPlaceholders ? replaceImagePlaceholdersWithData(latestHtmlWithPlaceholders, userImageInputs) : null;

            return (
              <>
                <PageTitle title={`Add Media, Charts, Tables & Refinements (for ${currentMode.toUpperCase()})`} subtitle={`Provide media, add more content, and describe enhancements. ${currentMode === 'html' ? `Current Theme: '${displayTheme}'.` : ''}`} />
                {renderModelSelectorForStep("enhancement-input", `Select AI Model for ${currentMode.toUpperCase()} Enhancements:`)}
                <CollapsibleSection title="Refinement Context" Icon={ArchiveBoxIcon} defaultOpen={false}> <div className="flex items-center"> <input id="use-full-history-toggle" type="checkbox" checked={useFullHistoryForRefinement} onChange={e => setUseFullHistoryForRefinement(e.target.checked)} className="h-4 w-4 text-[#0c7ff2] bg-[#101a23] border-[#314d68] rounded focus:ring-[#0c7ff2] focus:ring-offset-[#101a23]" aria-describedby="full-history-description"/> <label htmlFor="use-full-history-toggle" className="ml-3 text-sm font-medium text-slate-200 flex items-center">Use Full {currentMode.toUpperCase()} History for this Refinement</label> </div> <p id="full-history-description" className="mt-2 text-xs text-slate-400 pl-7">If checked, AI receives all prior versions for better context. Else, only the last.</p> </CollapsibleSection>
                <CollapsibleSection title="Add More Content (Optional)" Icon={PlusCircleIcon} defaultOpen={false}> <p className="text-sm text-slate-400 mb-4">You can add new content here to be integrated during this enhancement step.</p> <div className="p-4 bg-[#101a23]/50 rounded-lg border border-[#314d68]/50 mb-4"> <FileUpload onFilesAdded={handleAddAdditionalFiles} hasExistingFiles={additionalUploadedFilesData.length > 0} onClearAllFiles={handleClearAllAdditionalFiles} fileInputId="additional-file-upload-input"/> {additionalUploadedFilesData.length > 0 && ( <div className="mt-4"> <h4 className="text-sm font-medium text-slate-300 mb-2">Additional Files Selected ({additionalUploadedFilesData.length}):</h4> <ul className="space-y-1 max-h-48 overflow-y-auto pr-2"> {additionalUploadedFilesData.map((file, index) => ( <li key={`add-${file.name}-${index}`} className="flex justify-between items-center text-sm text-slate-200 bg-[#101a23]/70 p-2 rounded hover:bg-[#314d68]/50"> <span className="truncate" title={file.name}>{file.name}</span> <button onClick={() => handleRemoveAdditionalFile(index)} className="text-red-400 hover:text-red-300 p-1 ml-2 rounded-full hover:bg-red-500/20" aria-label={`Remove additional file ${file.name}`} title={`Remove ${file.name}`}> <TrashIcon className="w-4 h-4" /> </button> </li> ))} </ul> </div> )} <div className="mt-3 flex items-center"> <input id="include-additional-file-data" type="checkbox" checked={includeAdditionalFileData} onChange={e => setIncludeAdditionalFileData(e.target.checked)} disabled={additionalUploadedFilesData.length === 0} className="h-4 w-4 text-[#0c7ff2] bg-[#101a23] border-[#314d68] rounded focus:ring-[#0c7ff2] disabled:opacity-50" /> <label htmlFor="include-additional-file-data" className={`ml-2 text-sm font-medium ${additionalUploadedFilesData.length === 0 ? 'text-slate-500' : 'text-slate-300'}`}>Include additional uploaded file content</label> </div> </div> <div className="p-4 bg-[#101a23]/50 rounded-lg border border-[#314d68]/50 mb-4"> <label htmlFor="additional-pasted-text" className="block text-sm font-medium text-slate-300 mb-1">Paste additional content here:</label> <div className="flex items-start space-x-2"> <textarea id="additional-pasted-text" rows={4} className="form-textarea mt-1 block w-full rounded-lg text-white border border-[#314d68] bg-[#101a23] focus:border-[#0c7ff2] focus:ring focus:ring-[#0c7ff2]/50 px-3 py-2 placeholder:text-[#90adcb] text-sm" value={additionalPastedText} onChange={(e) => { setAdditionalPastedText(e.target.value); if(e.target.value.trim()) setIncludeAdditionalPastedText(true); else setIncludeAdditionalPastedText(false);}} placeholder="Paste new data, script, or notes..." aria-label="Paste additional content here" /> <AudioInputControl geminiService={geminiService} onTranscriptionComplete={(text) => setAdditionalPastedText(prev => prev + (prev ? ' ' : '') + text)} inputTargetDescription="additional pasted text" className="mt-1" microphonePermissionStatus={microphonePermissionStatus} /> </div> <div className="mt-3 flex items-center"> <input id="include-additional-pasted-text" type="checkbox" checked={includeAdditionalPastedText} onChange={e => setIncludeAdditionalPastedText(e.target.checked)} disabled={!additionalPastedText.trim()} className="h-4 w-4 text-[#0c7ff2] bg-[#101a23] border-[#314d68] rounded focus:ring-[#0c7ff2] disabled:opacity-50" /> <label htmlFor="include-additional-pasted-text" className={`ml-2 text-sm font-medium ${!additionalPastedText.trim() ? 'text-slate-500' : 'text-slate-300'}`}>Include additional pasted text</label> </div> </div> <div className="p-4 bg-[#101a23]/50 rounded-lg border border-[#314d68]/50"> <label htmlFor="additional-topic-query" className="block text-sm font-medium text-slate-300 mb-1">Enter an additional topic for research/integration:</label> <div className="flex items-center space-x-2"> <input id="additional-topic-query" type="text" className="form-input mt-1 block w-full rounded-lg text-white border border-[#314d68] bg-[#101a23] focus:border-[#0c7ff2] focus:ring focus:ring-[#0c7ff2]/50 h-12 px-4 placeholder:text-[#90adcb] text-sm" value={additionalTopicQuery} onChange={(e) => { setAdditionalTopicQuery(e.target.value); if(e.target.value.trim()) setIncludeAdditionalTopicQuery(true); else setIncludeAdditionalTopicQuery(false);}} placeholder="e.g., 'Latest Advancements in Quantum Computing'" aria-label="Enter an additional topic" /> <AudioInputControl geminiService={geminiService} onTranscriptionComplete={(text) => setAdditionalTopicQuery(prev => prev + (prev ? ' ' : '') + text)} inputTargetDescription="additional presentation topic" className="mt-1" microphonePermissionStatus={microphonePermissionStatus} /> </div> <div className="mt-3 flex items-center"> <input id="include-additional-topic-query" type="checkbox" checked={includeAdditionalTopicQuery} onChange={e => setIncludeAdditionalTopicQuery(e.target.checked)} disabled={!additionalTopicQuery.trim()} className="h-4 w-4 text-[#0c7ff2] bg-[#101a23] border-[#314d68] rounded focus:ring-[#0c7ff2] disabled:opacity-50" /> <label htmlFor="include-additional-topic-query" className={`ml-2 text-sm font-medium ${!additionalTopicQuery.trim() ? 'text-slate-500' : 'text-slate-300'}`}>Include additional topic</label> </div> {includeAdditionalTopicQuery && additionalTopicQuery.trim() && ( <div className="mt-3 pl-6"> <div className="flex items-center"> <input id="use-search-additional-toggle" type="checkbox" checked={useSearchForAdditionalTopic} onChange={e => setUseSearchForAdditionalTopic(e.target.checked)} className="h-4 w-4 text-[#0c7ff2] bg-[#101a23] border-[#314d68] rounded focus:ring-[#0c7ff2]" aria-describedby="search-additional-toggle-description"/> <label htmlFor="use-search-additional-toggle" className="ml-2 text-sm font-medium text-slate-300">Use Google Search for this additional topic</label> </div> <p id="search-additional-toggle-description" className="mt-1 text-xs text-slate-400">If checked, AI researches. Unchecked, AI uses internal knowledge.</p> </div> )} </div> </CollapsibleSection>

                <ImageInputForm
                    userProvidedImages={userImageInputs}
                    onUserProvidedImagesChange={setUserImageInputs}
                    userProvidedVideos={userVideoInputs}
                    onUserProvidedVideosChange={setUserVideoInputs}
                    userProvidedCharts={userChartInputs}
                    onUserProvidedChartsChange={setUserChartInputs}
                    userProvidedTables={userTableInputs}
                    onUserProvidedTablesChange={setUserTableInputs}
                    additionalEnhancements={userEnhancementRequests}
                    onAdditionalEnhancementsChange={setUserEnhancementRequests}
                    aiEnhancementQueries={currentAiQueries}
                    geminiService={geminiService}
                    microphonePermissionStatus={microphonePermissionStatus}
                    includeAiImageSuggestions={includeAiImageSuggestions}
                    onIncludeAiImageSuggestionsChange={setIncludeAiImageSuggestions}
                    includeAiVideoSuggestions={includeAiVideoSuggestions}
                    onIncludeAiVideoSuggestionsChange={setIncludeAiVideoSuggestions}
                    includeAiChartSuggestions={includeAiChartSuggestions}
                    onIncludeAiChartSuggestionsChange={setIncludeAiChartSuggestions}
                    includeAiTableSuggestions={includeAiTableSuggestions}
                    onIncludeAiTableSuggestionsChange={setIncludeAiTableSuggestions}
                    fixLayoutIssues={fixLayoutIssues}
                    onFixLayoutIssuesChange={setFixLayoutIssues}
                    layoutFixSlideNumbers={layoutFixSlideNumbers} // New
                    onLayoutFixSlideNumbersChange={setLayoutFixSlideNumbers} // New
                    prioritizeAnimationFixes={prioritizeAnimationFixes}
                    onPrioritizeAnimationFixesChange={setPrioritizeAnimationFixes}
                    animationFixSlideNumbers={animationFixSlideNumbers} // New
                    onAnimationFixSlideNumbersChange={setAnimationFixSlideNumbers} // New
                    addMindMapSlide={addMindMapSlide}
                    onAddMindMapSlideChange={setAddMindMapSlide}
                    onAiCritique={handleAiCritique}
                    isCritiquing={isCritiquing}
                />

                {currentMode === 'html' && (
                  <div className="my-6 p-4 bg-[#182634] rounded-xl border border-[#223649]">
                    <Button onClick={handleInitiateInteractiveSpecGeneration} Icon={WandMagicSparklesIcon} variant="secondary" size="md" className="w-full hover:border-purple-500 hover:text-purple-300 focus:ring-purple-500 text-purple-400 border-purple-600" disabled={!geminiService || allHtmlVersions.length === 0 || interactiveSlideModalState !== 'hidden'}>
                        ✨ Add Engaging Interactive Element (Uses ${proModelDisplayName})
                    </Button>
                     <p className="mt-2 text-xs text-slate-400 text-center">Optional: Add a unique, AI-generated interactive slide to your HTML presentation. This uses '${proModelDisplayName}'.</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                    <Button onClick={handleGenerateEnhanced} Icon={CogIcon} disabled={!geminiService || interactiveSlideModalState !== 'hidden'} className="flex-1" size="lg">
                        {`Generate Enhanced ${currentMode === 'html' ? 'Presentation' : 'Marp Code'}`}
                    </Button>
                    {currentMode === 'html' && allHtmlVersions.length > 0 && initialAIResponse && <Button onClick={() => downloadPresentationWithCurrentSettings(allHtmlVersions[0], 'initial_presentation.html')} variant="secondary" Icon={DocumentArrowDownIcon} className="flex-1" disabled={interactiveSlideModalState !== 'hidden'}>Download Initial HTML</Button>}
                    {currentMode === 'marp' && allMarpVersions.length > 0 && initialMarpResponse && <Button onClick={() => downloadTextFile(allMarpVersions[0], 'initial_presentation.md')} variant="secondary" Icon={DocumentArrowDownIcon} className="flex-1" disabled={interactiveSlideModalState !== 'hidden'}>Download Initial Marp</Button>}
                </div>
                {currentMode === 'html' && allHtmlVersions.length > 0 && displayTheme && ( <CollapsibleSection title={previewTitleForRefinement} Icon={EyeIcon} isOpen={showInlinePreview} setIsOpen={setShowInlinePreview} > <PresentationPreview htmlContent={displayHtmlForRefinement} chosenTheme={displayTheme} /> </CollapsibleSection>)}
                {currentMode === 'marp' && allMarpVersions.length > 0 && ( <CollapsibleSection title={previewTitleForRefinement} Icon={CodeBracketSquareIcon} isOpen={showMarpCodePreview} setIsOpen={setShowMarpCodePreview} defaultOpen={true}> <textarea readOnly value={allMarpVersions[allMarpVersions.length -1]} className="w-full h-64 p-3 bg-[#0D1117] border border-[#30363D] text-slate-200 font-mono text-sm resize-y" /> </CollapsibleSection> )}
              </>
            );

          case AppStep.ENHANCED_HTML_READY:
            const finalEnhancedHtmlWithPlaceholders = allHtmlVersions.length > 0 ? allHtmlVersions[allHtmlVersions.length - 1] : null;
            if (!enhancedAIResponse || !finalEnhancedHtmlWithPlaceholders || !displayTheme ) return <p className="text-red-400">Error: HTML Data or theme missing.</p>;
            const finalEnhancedHtmlForDisplay = replaceImagePlaceholdersWithData(finalEnhancedHtmlWithPlaceholders, userImageInputs);
            return (
              <>
                <PageTitle title="Enhanced Web Presentation Complete!" icon={PageTitleCheckIcon} subtitle={enhancedAIResponse.ai_confirmation_or_further_queries || "Your HTML presentation with media and refinements is ready."} />
                {renderModelSelectorForStep("enhanced-ready", "Select AI Model (for next refinement or PPT text):")}
                <p className="text-sm text-slate-400 text-center">Model used for last enhancement: ${currentModelDisplayName}. Full history used: ${useFullHistoryForRefinement ? 'Yes' : 'No'}</p>
                {renderThemeSelector()}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={() => downloadPresentationWithCurrentSettings(finalEnhancedHtmlWithPlaceholders, 'enhanced_presentation.html')} Icon={DocumentArrowDownIcon} className="flex-1" size="lg">Download Enhanced HTML</Button>
                  <Button onClick={() => setIsPresentationModalOpen(true)} variant="primary" Icon={ArrowsPointingOutIcon} className="flex-1" size="lg">Present Fullscreen</Button>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 mt-3">
                  <Button onClick={handleRefineFurther} Icon={CogIcon} variant="secondary" className="flex-1 hover:border-[#0c7ff2] hover:text-[#0c7ff2]" disabled={!geminiService}>Refine HTML Further</Button>
                  <Button onClick={() => setShowInlinePreview(p => !p)} variant="secondary" Icon={EyeIcon} className="flex-1">{showInlinePreview ? "Hide" : "Show"} Inline Preview</Button>
                  <Button onClick={handleGeneratePptxTextContent} variant="secondary" Icon={DocumentTextIcon} className="flex-1">Generate Plain Text for PPT</Button>
                </div>
                 {finalEnhancedHtmlForDisplay && displayTheme && (<CollapsibleSection title="Preview Enhanced Presentation (Inline)" Icon={EyeIcon} isOpen={showInlinePreview} setIsOpen={setShowInlinePreview}><PresentationPreview htmlContent={finalEnhancedHtmlForDisplay} chosenTheme={displayTheme}/></CollapsibleSection>)}
                 {getActiveSearchResults() && getActiveSearchResults()!.length > 0 && ( <CollapsibleSection title="Google Search Sources Used" Icon={MagnifyingGlassIcon} isOpen={showSearchResults} setIsOpen={setShowSearchResults} > <ul className="list-disc list-inside space-y-1 text-sm text-slate-300"> {getActiveSearchResults()!.map(result => ( <li key={result.uri}><a href={result.uri} target="_blank" rel="noopener noreferrer" className="text-[#0c7ff2] hover:underline">{result.title || result.uri}</a></li> ))} </ul> </CollapsibleSection> )}
                 <CollapsibleSection title="Return to AI Agent" Icon={CpuChipIcon} defaultOpen={true} className="mt-6 border-purple-600 bg-purple-900/20">
                    <div className="p-4 space-y-3">
                        <h3 className="text-base font-semibold text-slate-200">Hand back to AI Agent for Autonomous Refinement</h3>
                        <p className="text-xs text-slate-400">Let the agent take this manually enhanced version and try to improve it further on its own.</p>
                        <div className="my-2 text-center sm:text-left">
                          <label className="block text-sm font-medium text-slate-300 mb-2">AI Agent Worker Model:</label>
                          <div className="inline-flex justify-center gap-1 p-1 bg-[#101a23]/30 rounded-lg">
                              <Button
                                  onClick={() => setAgentWorkerModel('gemini-2.5-flash-lite-preview-06-17')}
                                  variant={agentWorkerModel === 'gemini-2.5-flash-lite-preview-06-17' ? 'primary' : 'secondary'}
                                  size="sm"
                                  className={`!shadow-none ${agentWorkerModel === 'gemini-2.5-flash-lite-preview-06-17' ? 'ring-2 ring-offset-2 ring-offset-[#182634] ring-[#0c7ff2]' : ''}`}
                                  aria-pressed={agentWorkerModel === 'gemini-2.5-flash-lite-preview-06-17'}
                              >
                                  Flash Lite (Fastest)
                              </Button>
                              <Button
                                  onClick={() => setAgentWorkerModel('gemini-2.5-flash')}
                                  variant={agentWorkerModel === 'gemini-2.5-flash' ? 'primary' : 'secondary'}
                                  size="sm"
                                  className={`!shadow-none ${agentWorkerModel === 'gemini-2.5-flash' ? 'ring-2 ring-offset-2 ring-offset-[#182634] ring-[#0c7ff2]' : ''}`}
                                  aria-pressed={agentWorkerModel === 'gemini-2.5-flash'}
                              >
                                  Flash (Faster)
                              </Button>
                              <Button
                                  onClick={() => setAgentWorkerModel('gemini-2.5-pro')}
                                  variant={agentWorkerModel === 'gemini-2.5-pro' ? 'primary' : 'secondary'}
                                  size="sm"
                                  className={`!shadow-none ${agentWorkerModel === 'gemini-2.5-pro' ? 'ring-2 ring-offset-2 ring-offset-[#182634] ring-[#0c7ff2]' : ''}`}
                                  aria-pressed={agentWorkerModel === 'gemini-2.5-pro'}
                              >
                                  Pro (Smarter)
                              </Button>
                          </div>
                          <p className="mt-2 text-xs text-slate-400">
                              Select the worker AI for this refinement task.
                          </p>
                        </div>
                        <label htmlFor="manual-to-agent-refine-instructions" className="block text-sm font-medium text-slate-300">Further Instructions for Agent (optional):</label>
                        <textarea
                            id="manual-to-agent-refine-instructions"
                            rows={3}
                            className="form-textarea mt-1 block w-full rounded-lg text-white border border-[#314d68] bg-[#101a23] focus:border-[#0c7ff2] focus:ring focus:ring-[#0c7ff2]/50 px-3 py-2 placeholder:text-[#90adcb] text-sm"
                            value={agentRefinementInstructions}
                            onChange={e => setAgentRefinementInstructions(e.target.value)}
                            placeholder="e.g., 'Focus on improving the visual design of the data-heavy slides.'"
                        />
                        <Button onClick={handleRefineWithAgentFromManual} Icon={CpuChipIcon} size="lg" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 focus:ring-purple-500">
                            Activate AI Agent
                        </Button>
                    </div>
                </CollapsibleSection>
              </>
            );
          
          case AppStep.ENHANCED_MARP_READY:
              return renderMarpContent();

          case AppStep.PPT_TEXT_READY:
            if (!pptxTextContent) return <p className="text-red-400">Error: Plain text content for PPT is missing.</p>;
            return (
              <div className="space-y-8 w-full">
                <PageTitle title="Plain Text Ready for PowerPoint" subtitle="The presentation's text content has been extracted. Copy and paste it into your presentation software." icon={PageTitleCheckIcon} />
                <CollapsibleSection title="Extracted Text Content" Icon={DocumentTextIcon} isOpen={showPptxText} setIsOpen={setShowPptxText} defaultOpen={true}>
                    <textarea readOnly value={pptxTextContent} className="w-full h-96 p-4 rounded-lg bg-[#0D1117] border border-[#30363D] text-slate-200 font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-[#0c7ff2]" aria-label="Extracted text content for PowerPoint"/>
                </CollapsibleSection>
                <div className="flex flex-col sm:flex-row gap-3">
                    <Button onClick={() => copyToClipboard(pptxTextContent)} Icon={ClipboardDocumentIcon} className="flex-1">Copy Text to Clipboard</Button>
                    <Button onClick={() => downloadTextFile(pptxTextContent, 'presentation_text.txt')} variant="secondary" Icon={DocumentArrowDownIcon} className="flex-1">Download as .txt File</Button>
                </div>
              </div>
            );

          default:
            return <p className="text-center text-yellow-300">Unknown application step.</p>;
        }
      })()}
      </div>
    );
  };


  return (
    <div className="bg-[#101a23] min-h-screen font-sans text-slate-100">
      <Header onRestart={restartProcess} />
      <main className="container mx-auto px-4 sm:px-10 py-8">

        {currentStep !== AppStep.AGENT_RUNNING && currentStep !== AppStep.AGENT_COMPLETED && <StepIndicator currentStep={currentStep} currentMode={currentMode} onStepClick={navigateToStep} />}

        {modelFallbackNotification && (
          <div className="bg-yellow-800/30 border border-yellow-700 text-yellow-200 text-sm rounded-lg p-3 mb-6 flex items-center justify-between" role="alert">
            <div className="flex items-center">
              <InformationCircleIcon className="w-5 h-5 mr-2" />
              <span>{modelFallbackNotification}</span>
            </div>
            <button onClick={() => setModelFallbackNotification(null)} className="p-1 rounded-full hover:bg-yellow-700/50" aria-label="Dismiss notification">
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-200 p-4 rounded-lg mb-6 shadow-lg">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-lg text-red-100">An Error Occurred</h3>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{error}</p>
                    </div>
                    <Button onClick={handleExplainError} variant="secondary" size="sm" disabled={isExplainingError} className="ml-4 flex-shrink-0 !border-red-600 !text-red-200 hover:!bg-red-800/50">
                        {isExplainingError ? 'Explaining...' : 'Explain with AI'}
                    </Button>
                </div>
                {errorExplanation && (
                    <div className="mt-3 pt-3 border-t border-red-800">
                        <h4 className="font-semibold text-red-100">AI Explanation:</h4>
                        <p className="text-sm mt-1 text-red-200">{errorExplanation}</p>
                    </div>
                )}
            </div>
        )}
        
        { currentStep === AppStep.SETUP && <InstructionsSection /> }

        {renderContent()}

        {isPresentationModalOpen && currentMode === 'html' && (allHtmlVersions.length > 0 || finalAgentHtml) && (
          <div className="fixed inset-0 z-50 bg-black flex flex-col p-2" role="dialog" aria-modal="true">
            <div className="flex-shrink-0 flex justify-end">
              <Button onClick={() => setIsPresentationModalOpen(false)} variant="danger" size="sm" className="!px-4">Close Fullscreen</Button>
            </div>
            <div className="flex-grow mt-2">
                <PresentationPreview 
                    htmlContent={
                      finalAgentHtml 
                      ? finalAgentHtml 
                      : replaceImagePlaceholdersWithData(allHtmlVersions[allHtmlVersions.length - 1], userImageInputs)
                    } 
                    chosenTheme={displayTheme}
                    isFullscreen={true} 
                />
            </div>
          </div>
        )}
        
        {interactiveSlideModalState !== 'hidden' && (
            <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
                <div className="bg-[#182634] rounded-xl border border-[#223649] w-full max-w-3xl max-h-[90vh] flex flex-col">
                    <header className="p-4 border-b border-[#223649] flex-shrink-0">
                        <h2 className="text-xl font-bold text-slate-100">
                            {interactiveSlideModalState === 'generating_spec' && 'AI is Designing an Interactive Element...'}
                            {interactiveSlideModalState === 'editing_spec' && 'Review & Edit AI-Generated Specification'}
                            {interactiveSlideModalState === 'generating_html' && 'AI is Coding Your Interactive Slide...'}
                        </h2>
                    </header>
                    <main className="p-6 flex-grow overflow-y-auto">
                        {(interactiveSlideModalState === 'generating_spec' || interactiveSlideModalState === 'generating_html') && (
                            <LoadingSpinner message={interactiveSlideModalState === 'generating_spec' ? "Brainstorming creative ideas..." : "Translating spec to code..."} />
                        )}
                        {interactiveSlideModalState === 'editing_spec' && (
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="ai-spec-textarea" className="block text-sm font-medium text-slate-300 mb-2">
                                        You can edit the AI's plan here before it generates the code.
                                    </label>
                                    <textarea
                                        id="ai-spec-textarea"
                                        value={editableInteractiveSpec || ''}
                                        onChange={(e) => setEditableInteractiveSpec(e.target.value)}
                                        rows={15}
                                        className="w-full p-3 bg-[#0D1117] border border-[#30363D] text-slate-200 font-mono text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0c7ff2] resize-y"
                                    />
                                </div>
                                <div>
                                  <h3 className="text-md font-semibold mb-2">Original AI Draft:</h3>
                                  <div className="p-3 bg-[#101a23]/50 border border-[#223649] rounded-lg text-sm text-slate-400 whitespace-pre-wrap">
                                    {currentAiGeneratedSpecDraft}
                                  </div>
                                </div>
                            </div>
                        )}
                    </main>
                    {interactiveSlideModalState === 'editing_spec' && (
                        <footer className="p-4 border-t border-[#223649] flex-shrink-0 flex justify-end gap-3">
                            <Button onClick={handleCancelInteractiveSlide} variant="secondary">Cancel</Button>
                            <Button onClick={handleUserConfirmInteractiveSpecAndGenerateHtml} variant="primary">Confirm & Generate HTML</Button>
                        </footer>
                    )}
                </div>
            </div>
        )}

      </main>
      <footer className="bg-[#101a23] border-t border-[#223649] text-slate-400">
        <div className="max-w-6xl mx-auto px-4 sm:px-10 py-8">
          <div className="text-center mb-8">
            <h3 className="text-xl font-bold text-slate-100 mb-2">Presentation Generator by RADDOC ☯</h3>
            <p className="text-sm">Crafting ideas into stunning presentations with AI.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
              <div>
                  <h4 className="font-semibold text-base text-slate-200 mb-4 tracking-wide">Follow RADDOC</h4>
                  <ul className="space-y-3">
                      <li>
                        <a href="https://x.com/raddoc96" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-slate-400 hover:text-sky-400 transition-colors">
                          <TwitterIcon className="w-5 h-5" /> Twitter
                        </a>
                      </li>
                      <li>
                        <a href="https://youtube.com/@medirobot96" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-slate-400 hover:text-red-500 transition-colors">
                          <YouTubeIcon className="w-5 h-5" /> YouTube
                        </a>
                      </li>
                      <li>
                        <a href="https://t.me/Medicine_Chatgpt" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors">
                          <TelegramIcon className="w-5 h-5" /> Telegram Channel
                        </a>
                      </li>
                  </ul>
              </div>
              <div>
                  <h4 className="font-semibold text-base text-slate-200 mb-4 tracking-wide">Support the Project</h4>
                  <ul className="space-y-3">
                      <li>
                        <a href="upi://pay?pa=ksdhiwakar-2@okaxis&pn=K%20S%20Dhiwakar&tn=Support%20for%20Presentation%20Generator&cu=INR" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-slate-400 hover:text-green-400 transition-colors">
                          <HeartIcon className="w-5 h-5" /> Support (India - UPI)
                        </a>
                      </li>
                      <li>
                        <a href="https://buymeacoffee.com/raddoc1996a" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-slate-400 hover:text-yellow-400 transition-colors">
                          <CoffeeIcon className="w-5 h-5" /> Support (International)
                        </a>
                      </li>
                  </ul>
              </div>
              <div>
                  <h4 className="font-semibold text-base text-slate-200 mb-4 tracking-wide">Contact</h4>
                  <ul className="space-y-3">
                      <li>
                        <a href="https://wa.me/918248073464" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-slate-400 hover:text-emerald-500 transition-colors">
                          <WhatsAppIcon className="w-5 h-5" /> WhatsApp
                        </a>
                      </li>
                      <li>
                        <a href="https://t.me/medico_forever" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors">
                          <TelegramIcon className="w-5 h-5" /> Telegram
                        </a>
                      </li>
                  </ul>
              </div>
          </div>
          <div className="mt-8 pt-6 border-t border-[#223649] text-center text-xs text-slate-500">
            <p>&copy; {new Date().getFullYear()} RADDOC. All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};