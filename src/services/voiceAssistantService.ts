/**
 * Multi-Language Civic AI Conversational Engine
 * Specifically designed for zero-literacy and voice-first citizens.
 * Supports Pure Tamil, Malayalam, Telugu, Kannada, Hindi, and English.
 * NO mixed-language slop: each language produces 100% native replies.
 */

import {
  speakSingleVoice,
  stopSingleVoice,
  isSingleVoiceSpeaking,
  speechSynthesisManager,
} from './speechSynthesisSingleton';

export type SupportedCivicLang = 'ta' | 'ml' | 'te' | 'kn' | 'hi' | 'en';

export interface CivicClassification {
  category: string;
  subcategory: string;
  criticality: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  recommendedDepartment: string;
  detectedLandmark: string;
}

export interface DialogueState {
  step: 'greeting' | 'ask_problem' | 'confirm_submission' | 'submitted';
  problemText: string;
  category: string;
  subcategory: string;
  extractedLandmark: string;
  criticality: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  recommendedDepartment: string;
  lastAiReply: string;
  activeLang: SupportedCivicLang;
}

export interface VoiceAssistantAnalysis {
  isGreeting: boolean;
  userSpokenText: string;
  category: string;
  subcategory: string;
  problemSummary: string;
  extractedLandmark: string;
  criticality: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  recommendedDepartment: string;
  aiVoiceReply: string;
  isReadyToSubmit?: boolean;
}

// Native Language Lexicon for Pure Output
export const CIVIC_LANG_METADATA: Record<
  SupportedCivicLang,
  {
    name: string;
    nativeName: string;
    locale: string;
    greeting: string;
    langSwitchReply: string;
    askProblemPrompt: string;
    submitConfirmKeywords: string[];
    deptWater: string;
    deptPower: string;
    deptRoads: string;
    deptSanitation: string;
    deptHealth: string;
    categoryWater: string;
    categoryPower: string;
    categoryRoads: string;
    categorySanitation: string;
    categoryHealth: string;
    formatProblemAck: (landmark: string, subcategory: string) => string;
    formatSubmissionSuccess: () => string;
  }
> = {
  ta: {
    name: 'Tamil',
    nativeName: 'தமிழ்',
    locale: 'ta-IN',
    greeting:
      'வணக்கம்! நான் உங்கள் மக்கள் சேவை ஏஐ நண்பன். உங்களுக்கு என்ன பிரச்சனை? எந்த இடத்துல நடக்குதுன்னு சொல்லுங்க, நான் கேட்டுக்கிறேன்.',
    langSwitchReply:
      'வணக்கம்! நான் தமிழில் பேசுகிறேன். உங்கள் பகுதியில் உள்ள பிரச்சனையை கூறுங்கள், நான் கேட்டுக்கொள்கிறேன்.',
    askProblemPrompt:
      'உங்கள் பகுதியில் உள்ள சாலை, குடிநீர், சாக்கடை அல்லது மின்சார பிரச்சனையை சொல்லுங்கள்.',
    submitConfirmKeywords: [
      'சரி',
      'சரிங்க',
      'ஆமாம்',
      'ஆமா',
      'அனுப்பு',
      'அனுப்பிடு',
      'பதிவு செய்',
      'சப்மிட்',
      'ஓகே',
      'yes',
      'submit',
      'send',
    ],
    deptWater: 'குடிநீர் வழங்கல் மற்றும் கழிவுநீரகற்று வாரியம்',
    deptPower: 'தமிழ்நாடு மின்சார வாரியம் (TNEB)',
    deptRoads: 'நெடுஞ்சாலை மற்றும் மாநகராட்சி பொறியியல் துறை',
    deptSanitation: 'மாநகராட்சி துப்புரவு மற்றும் சுகாதாரப் பிரிவு',
    deptHealth: 'பொது சுகாதாரத்துறை மற்றும் அவசர மருத்துவ பிரிவு',
    categoryWater: 'குடிநீர் மற்றும் கழிவுநீர் மேலாண்மை',
    categoryPower: 'மின்சாரம் மற்றும் தெருவிளக்குகள்',
    categoryRoads: 'சாலை மற்றும் உள்கட்டமைப்பு',
    categorySanitation: 'திடக்கழிவு மற்றும் சுகாதாரம்',
    categoryHealth: 'அவசர மருத்துவம் மற்றும் சுகாதாரம்',
    formatProblemAck: (landmark, subcategory) =>
      `புரிந்ததுங்க! ${landmark ? landmark + ' பகுதியில் ' : ''}${subcategory} ஏற்பட்டுள்ளது என குறித்துக்கொண்டேன். இதை அரசு அதிகாரிகளுக்கு அதிகாரப்பூர்வ புகாராக அனுப்பவா? 'சரி அனுப்பு' என்று சொல்லுங்க!`,
    formatSubmissionSuccess: () =>
      'அருமை! உங்கள் புகார் வெற்றிகரமாக பதிவு செய்யப்பட்டு, அரசு போர்ட்டலுக்கு அனுப்பப்பட்டுவிட்டது. அதிகாரிகள் உடனே நடவடிக்கை எடுப்பார்கள். நன்றி!',
  },

  ml: {
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    locale: 'ml-IN',
    greeting:
      'നമസ്കാരം! ഞാൻ നിങ്ങളുടെ ജനസേവന AI സഹായിയാണ്. നിങ്ങളുടെ പ്രദേശത്ത് എന്താണ് പ്രശ്നം? എവിടെയാണ് ഇത് സംഭവിക്കുന്നത് എന്ന് പറയൂ, ഞാൻ കേൾക്കാം.',
    langSwitchReply:
      'നമസ്കാരം! ഞാൻ മലയാളത്തിൽ സംസാരിക്കുന്നു. നിങ്ങളുടെ പ്രദേശത്തെ പ്രശ്നം പറയൂ, ഞാൻ കേൾക്കാം.',
    askProblemPrompt:
      'റോഡ്, കുടിവെള്ളം, ഡ്രെയിനേജ് അല്ലെങ്കിൽ വൈദ്യുതി പ്രശ്നം പറയൂ.',
    submitConfirmKeywords: [
      'ശരി',
      'അതെ',
      'അയക്കൂ',
      'സബ്മിറ്റ്',
      'ഓക്കെ',
      'രേഖപ്പെടുത്തൂ',
      'yes',
      'submit',
      'ok',
    ],
    deptWater: 'കേരള വാട്ടർ അതോറിറ്റി (KWA)',
    deptPower: 'വൈദ്യുതി ബോർഡ് (KSEB)',
    deptRoads: 'പൊതുമരാമത്ത് വകുപ്പ് (PWD) & നഗരസഭ',
    deptSanitation: 'ശുചിത്വ മിഷൻ & ആരോഗ്യ വിഭാഗം',
    deptHealth: 'ആരോഗ്യ വകുപ്പ്',
    categoryWater: 'കുടിവെള്ളവും ഡ്രെയിനേജും',
    categoryPower: 'വൈദ്യുതിയും വഴിവിളക്കുകളും',
    categoryRoads: 'റോഡുകളും അടിസ്ഥാന സൗകര്യങ്ങളും',
    categorySanitation: 'മാലിന്യ സംസ്കരണവും ശുചിത്വവും',
    categoryHealth: 'ആരോഗ്യവും അടിയന്തര സേവനങ്ങളും',
    formatProblemAck: (landmark, subcategory) =>
      `മനസ്സിലായി! ${landmark ? landmark + ' പ്രദേശത്ത് ' : ''}${subcategory} ഉണ്ടെന്ന് രേഖപ്പെടുത്തി. ഇത് സർക്കാർ ഉദ്യോഗസ്ഥർക്ക് ഔദ്യോഗിക പരാതിയായി അയക്കട്ടെയോ? 'ശരി അയക്കൂ' എന്ന് പറയൂ!`,
    formatSubmissionSuccess: () =>
      'വളരെ നന്ദി! നിങ്ങളുടെ പരാതി വിജയകരമായി രജിസ്റ്റർ ചെയ്ത് സർക്കാർ പോർട്ടലിലേക്ക് അയച്ചു. ഉദ്യോഗസ്ഥർ ഉടൻ നടപടി സ്വീകരിക്കും!',
  },

  te: {
    name: 'Telugu',
    nativeName: 'తెలుగు',
    locale: 'te-IN',
    greeting:
      'నమస్కారం! నేను మీ ప్రజా సేవా AI సహాయకుడిని. మీ ప్రాంతంలో సమస్య ఏమిటి? ఎక్కడ జరుగుతుందో చెప్పండి, నేను వింటున్నాను.',
    langSwitchReply:
      'నమస్కారం! నేను తెలుగులో మాట్లాడుతున్నాను. మీ సమస్య చెప్పండి.',
    askProblemPrompt:
      'రోడ్డు, తాగునీరు, డ్రైనేజీ లేదా విద్యుత్ సమస్య చెప్పండి.',
    submitConfirmKeywords: [
      'సరే',
      'అవును',
      'పంపండి',
      'సబ్మిట్',
      'ఓకే',
      'yes',
      'submit',
      'send',
    ],
    deptWater: 'తాగునీరు మరియు మురుగునీటి పారుదల శాఖ',
    deptPower: 'విద్యుత్ శాఖ (APCPDCL / TSSPDCL)',
    deptRoads: 'రోడ్లు మరియు భవనాల శాఖ (R&B)',
    deptSanitation: 'పారిశుద్ధ్య మరియు ప్రజారోగ్య విభాగం',
    deptHealth: 'ప్రజారోగ్య విభాగం',
    categoryWater: 'తాగునీరు మరియు డ్రైనేజీ',
    categoryPower: 'విద్యుత్ మరియు వీధి దీపాలు',
    categoryRoads: 'రోడ్లు మరియు మౌలిక సదుపాయాలు',
    categorySanitation: 'పారిశుద్ధ్యం మరియు వ్యర్థాల నిర్వహణ',
    categoryHealth: 'వైద్యం మరియు అత్యవసర సేవలు',
    formatProblemAck: (landmark, subcategory) =>
      `అర్థమైంది! ${landmark ? landmark + ' ప్రాంతంలో ' : ''}${subcategory} నమోదైంది. దీన్ని ప్రభుత్వ అధికారులకు అధికారిక ఫిర్యాదుగా పంపమంటారా? 'సరే పంపండి' అని చెప్పండి!`,
    formatSubmissionSuccess: () =>
      'ధన్యవాదాలు! మీ ఫిర్యాదు విజయవంతంగా నమోదై ప్రభుత్వ పోర్టల్‌కు పంపబడింది. అధికారులు వెంటనే చర్యలు తీసుకుంటారు!',
  },

  kn: {
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    locale: 'kn-IN',
    greeting:
      'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಜನಸೇವಾ AI ಸಹಾಯಕ. ನಿಮ್ಮ ಪ್ರದೇಶದಲ್ಲಿ ಏನು ಸಮಸ್ಯೆ ಇದೆ? ಎಲ್ಲಿ ನಡೆಯುತ್ತಿದೆ ಎಂದು ಹೇಳಿ, ನಾನು ಕೇಳಿಸಿಕೊಳ್ಳುತ್ತೇನೆ.',
    langSwitchReply:
      'ನಮಸ್ಕಾರ! ನಾನು ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡುತ್ತಿದ್ದೇನೆ. ನಿಮ್ಮ ಪ್ರದೇಶದ ಸಮಸ್ಯೆಯನ್ನು ತಿಳಿಸಿ.',
    askProblemPrompt:
      'ರಸ್ತೆ, ಕುಡಿಯುವ ನೀರು, ಚರಂಡಿ ಅಥವಾ ವಿದ್ಯುತ್ ಸಮಸ್ಯೆ ತಿಳಿಸಿ.',
    submitConfirmKeywords: [
      'ಸರಿ',
      'ಹೌದು',
      'ಕಳುಹಿಸಿ',
      'ಸಬ್ಮಿಟ್',
      'ಓಕೆ',
      'yes',
      'submit',
    ],
    deptWater: 'ಜಲಮಂಡಳಿ ಮತ್ತು ಒಳಚರಂಡಿ ಮಂಡಳಿ',
    deptPower: 'ಬೆಸ್ಕಾಂ / ವಿದ್ಯುತ್ ನಿಗಮ (BESCOM)',
    deptRoads: 'ಲೋಕೋಪಯೋಗಿ ಮತ್ತು ಪಾಲಿಕೆ ಎಂಜಿನಿಯರಿಂಗ್ ವಿಭಾಗ',
    deptSanitation: 'ಘನತ್ಯಾಜ್ಯ ನಿರ್ವಹಣೆ ಮತ್ತು ನೈರ್ಮಲ್ಯ ವಿಭಾಗ',
    deptHealth: 'ಸಾರ್ವಜನಿಕ ಆರೋಗ್ಯ ವಿಭಾಗ',
    categoryWater: 'ಕುಡಿಯುವ ನೀರು ಮತ್ತು ಒಳಚರಂಡಿ',
    categoryPower: 'ವಿದ್ಯುತ್ ಮತ್ತು ಬೀದಿದೀಪಗಳು',
    categoryRoads: 'ರಸ್ತೆ ಮತ್ತು ಮೂಲಸೌಕರ್ಯ',
    categorySanitation: 'ನೈರ್ಮಲ್ಯ ಮತ್ತು ತ್ಯಾಜ್ಯ ವಿಲೇವಾರಿ',
    categoryHealth: 'ಆರೋಗ್ಯ ಮತ್ತು ತುರ್ತು ಸೇವೆಗಳು',
    formatProblemAck: (landmark, subcategory) =>
      `ಅರ್ಥವಾಯಿತು! ${landmark ? landmark + ' ಪ್ರದೇಶದಲ್ಲಿ ' : ''}${subcategory} ದಾಖಲಾಗಿದೆ. ಇದನ್ನು ಸರ್ಕಾರಿ ಅಧಿಕಾರಿಗಳಿಗೆ ಅಧಿಕೃತ ದೂರಿನ ರೂಪದಲ್ಲಿ ಕಳುಹಿಸಬೇಕೆ? 'ಸರಿ ಕಳುಹಿಸಿ' ಎಂದು ಹೇಳಿ!`,
    formatSubmissionSuccess: () =>
      'ಧನ್ಯವಾದಗಳು! ನಿಮ್ಮ ದೂರನ್ನು ಯಶಸ್ವಿಯಾಗಿ ನೋಂದಾಯಿಸಿ ಸರ್ಕಾರಿ ಪೋರ್ಟಲ್‌ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ. ಅಧಿಕಾರಿಗಳು ಶೀಘ್ರದಲ್ಲೇ ಕ್ರಮ ಕೈಗೊಳ್ಳಲಿದ್ದಾರೆ!',
  },

  hi: {
    name: 'Hindi',
    nativeName: 'हिन्दी',
    locale: 'hi-IN',
    greeting:
      'नमस्ते! मैं आपका जन सेवा एआई साथी हूँ। आपके इलाके में क्या समस्या है और कहाँ हो रही है, कृपया बताएं।',
    langSwitchReply:
      'नमस्ते! मैं हिंदी में बात कर रहा हूँ। कृपया अपनी समस्या बताएं।',
    askProblemPrompt:
      'सड़क, पेयजल, नाली या बिजली की समस्या बताएं।',
    submitConfirmKeywords: [
      'हाँ',
      'हा',
      'ठीक है',
      'भेजें',
      'भेजो',
      'सबमिट',
      'ओके',
      'yes',
      'submit',
    ],
    deptWater: 'जल बोर्ड एवं सीवरेज विभाग',
    deptPower: 'विद्युत वितरण निगम',
    deptRoads: 'लोक निर्माण विभाग (PWD) एवं नगर निगम',
    deptSanitation: 'नगर निगम स्वच्छता एवं सफाई विभाग',
    deptHealth: 'स्वास्थ्य विभाग',
    categoryWater: 'पेयजल एवं जल निकासी',
    categoryPower: 'विद्युत एवं स्ट्रीट लाइट',
    categoryRoads: 'सड़क एवं बुनियादी ढांचा',
    categorySanitation: 'सफाई एवं कचरा प्रबंधन',
    categoryHealth: 'स्वास्थ्य एवं आपातकालीन सेवाएं',
    formatProblemAck: (landmark, subcategory) =>
      `समझ गया! ${landmark ? landmark + ' क्षेत्र में ' : ''}${subcategory} की समस्या दर्ज कर ली गई है। क्या इसे सरकारी अधिकारियों को तुरंत भेजा जाए? 'हाँ, भेजें' कहें!`,
    formatSubmissionSuccess: () =>
      'बहुत-बहुत धन्यवाद! आपकी शिकायत सफलतापूर्वक सरकारी पोर्टल पर भेज दी गई है। अधिकारी तुरंत कार्रवाई करेंगे!',
  },

  en: {
    name: 'English',
    nativeName: 'English',
    locale: 'en-US',
    greeting:
      'Hello! I am your friendly civic AI assistant. Please describe the problem in your area and where it is located.',
    langSwitchReply:
      'Hello! Speaking in English. Please tell me about the issue in your locality.',
    askProblemPrompt:
      'Please speak about road, water, drainage, or electricity problems.',
    submitConfirmKeywords: [
      'yes',
      'submit',
      'send',
      'okay',
      'ok',
      'confirm',
      'done',
    ],
    deptWater: 'Water Supply and Sewerage Board',
    deptPower: 'Electricity Board & Street Lighting',
    deptRoads: 'Highways & Municipal Works Department',
    deptSanitation: 'Sanitation and Solid Waste Management',
    deptHealth: 'Public Health and Emergency Services',
    categoryWater: 'Water Supply and Drainage',
    categoryPower: 'Electricity and Streetlights',
    categoryRoads: 'Roads and Infrastructure',
    categorySanitation: 'Sanitation and Waste Management',
    categoryHealth: 'Healthcare and Emergency',
    formatProblemAck: (landmark, subcategory) =>
      `Understood! I have noted ${subcategory}${landmark ? ' at ' + landmark : ''}. Should I submit this directly to the Government Portal? Please say 'Yes' or 'Submit'!`,
    formatSubmissionSuccess: () =>
      'Thank you! Your civic report has been submitted to the Government Portal. Authorities have been alerted!',
  },
};

// Detect Language from citizen speech text or Tanglish/script
export function detectLanguageFromSpeech(text: string): SupportedCivicLang | null {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  // 1. Unicode Script Checks (100% accurate when native script is captured)
  if (/[\u0B80-\u0BFF]/.test(trimmed)) return 'ta'; // Tamil script
  if (/[\u0D00-\u0D7F]/.test(trimmed)) return 'ml'; // Malayalam script
  if (/[\u0C00-\u0C7F]/.test(trimmed)) return 'te'; // Telugu script
  if (/[\u0C80-\u0CFF]/.test(trimmed)) return 'kn'; // Kannada script
  if (/[\u0900-\u097F]/.test(trimmed)) return 'hi'; // Hindi / Devanagari

  // 2. Explicit Language Requests / Inquiries (e.g. "tamil la pesala", "speak in tamil", "malayalam parayumo")
  if (
    lower.includes('tamil') ||
    lower.includes('tamizh') ||
    lower.includes('pesala') ||
    lower.includes('pesanum') ||
    lower.includes('pesunga') ||
    lower.includes('thanni') ||
    lower.includes('salai') ||
    lower.includes('kuppai') ||
    lower.includes('iruttu') ||
    lower.includes('solren') ||
    lower.includes('enna') ||
    lower.includes('kudukkala')
  ) {
    return 'ta';
  }

  if (
    lower.includes('malayalam') ||
    lower.includes('parayu') ||
    lower.includes('vellam') ||
    lower.includes('prashnam')
  ) {
    return 'ml';
  }

  if (
    lower.includes('telugu') ||
    lower.includes('matladu') ||
    lower.includes('neellu') ||
    lower.includes('cheppandi')
  ) {
    return 'te';
  }

  if (
    lower.includes('kannada') ||
    lower.includes('matadi') ||
    lower.includes('neeru') ||
    lower.includes('hegli')
  ) {
    return 'kn';
  }

  if (
    lower.includes('hindi') ||
    lower.includes('boliye') ||
    lower.includes('kahiye') ||
    lower.includes('sadak') ||
    lower.includes('pani')
  ) {
    return 'hi';
  }

  return null;
}

// Check if user is saying "Tamil la pesala", "Speak in English", etc.
export function isLanguageSwitchCommand(text: string): { isSwitch: boolean; targetLang: SupportedCivicLang } {
  const lower = text.toLowerCase();

  if (
    lower.includes('tamil') ||
    lower.includes('tamizh') ||
    lower.includes('தமிழ்') ||
    lower.includes('pesala') ||
    lower.includes('pesanum')
  ) {
    return { isSwitch: true, targetLang: 'ta' };
  }
  if (lower.includes('malayalam') || lower.includes('മലയാളം') || lower.includes('parayumo')) {
    return { isSwitch: true, targetLang: 'ml' };
  }
  if (lower.includes('telugu') || lower.includes('తెలుగు') || lower.includes('matladu')) {
    return { isSwitch: true, targetLang: 'te' };
  }
  if (lower.includes('kannada') || lower.includes('ಕನ್ನಡ') || lower.includes('matadi')) {
    return { isSwitch: true, targetLang: 'kn' };
  }
  if (lower.includes('hindi') || lower.includes('हिन्दी') || lower.includes('boliye')) {
    return { isSwitch: true, targetLang: 'hi' };
  }
  if (lower.includes('english') || lower.includes('speak english')) {
    return { isSwitch: true, targetLang: 'en' };
  }

  return { isSwitch: false, targetLang: 'ta' };
}

// Check if speech is a greeting
export function isGreetingOnly(text: string): boolean {
  const clean = text.trim().toLowerCase();
  const greetings = [
    'ஹலோ',
    'ஹலோவ்',
    'வணக்கம்',
    'வணக்கங்க',
    'வணக்கமுங்க',
    'ஹாய்',
    'hello',
    'hi',
    'hey',
    'namaste',
    'ola',
    'bonjour',
    'நమస్కారం',
    'నమస్తే',
    'നമസ്കാരം',
    'ನಮಸ್ಕಾರ',
    'नमस्ते',
    'உதவி',
    'help',
  ];
  return (
    greetings.includes(clean) ||
    (clean.length < 15 &&
      (clean.includes('ஹலோ') ||
        clean.includes('வணக்கம்') ||
        clean.includes('hello') ||
        clean.includes('hi') ||
        clean.includes('namaste')))
  );
}

// Check if user is saying submit or confirm
export function isSubmitCommand(text: string, lang: SupportedCivicLang = 'ta'): boolean {
  const clean = text.trim().toLowerCase();
  const langMeta = CIVIC_LANG_METADATA[lang] || CIVIC_LANG_METADATA.ta;
  return langMeta.submitConfirmKeywords.some((w) => clean.includes(w));
}

// Extract location & landmarks from citizen voice text
export function extractLandmarkFromSpeech(text: string): string {
  const lower = text.toLowerCase();

  // 1. Direct "Set Exact Location / This Place" vocal triggers
  const setLocationPhrases = [
    'இந்த இடம்',
    'இந்த இடத்துல',
    'இந்த இடத்தில்',
    'இங்கே',
    'இங்க',
    'இப்ப இருக்கிற இடம்',
    'செட் லொகேஷன்',
    'எக்ஸாக்ட் லொகேஷன்',
    'set location',
    'exact location',
    'this place',
    'here',
    'current location',
    'my location',
  ];
  for (const phrase of setLocationPhrases) {
    if (lower.includes(phrase)) {
      return 'CURRENT_GPS_LOCATION';
    }
  }

  // 2. High-precision known landmarks and hubs (e.g. Rathinam, Gandhipuram)
  const knownPlaces = [
    'ரத்தினம் காலேஜ்',
    'ரத்தினம்',
    'rathinam college',
    'rathinam',
    'ஈச்சனாரி',
    'eachanari',
    'காந்திபுரம்',
    'gandhipuram',
    'அண்ணா நகர்',
    'anna nagar',
    'கோயம்புத்தூர்',
    'கோவை',
    'coimbatore',
    'சென்னை',
    'chennai',
    'மதுரை',
    'madurai',
    'திருச்சி',
    'trichy',
    'சேலம்',
    'salem',
    'திருநெல்வேலி',
    'tirunelveli',
  ];
  for (const place of knownPlaces) {
    if (lower.includes(place)) {
      return place;
    }
  }

  const locationMarkers = [
    'அருகில்',
    'பக்கத்தில்',
    'பக்கத்துல',
    'தெருவில்',
    'தெருவுல',
    'சாலையில்',
    'ரோட்டுல',
    'நகர்',
    'காலனி',
    'கிராமம்',
    'கோவில்',
    'பள்ளி',
    'மருத்துவமனை',
    'பஸ் ஸ்டாண்ட்',
    'பேருந்து நிறுத்தம்',
    'ரயில்வே',
    'பாலம்',
    'സമീപം',
    'അടുത്ത്',
    'റോഡ്',
    'പ്രദേശം',
    'దగ్గర',
    'సమీపంలో',
    'రహదారి',
    'ಬಳಿ',
    'ಹತ್ತಿರ',
    'ರಸ್ತೆ',
    'के पास',
    'के समीप',
    'सड़क',
    'main road',
    'street',
    'nagar',
    'hospital',
    'near',
    'bus stand',
    'colony',
  ];

  for (const marker of locationMarkers) {
    if (lower.includes(marker)) {
      const idx = lower.indexOf(marker);
      const start = Math.max(0, idx - 25);
      const end = Math.min(text.length, idx + marker.length + 25);
      return text.slice(start, end).trim();
    }
  }

  // Fallback: check if comma separated or first phrase
  const parts = text.split(/[,.]/);
  if (parts.length > 1 && parts[1].trim().length > 3) {
    return parts[1].trim();
  }

  return '';
}

// Categorize civic problem in the target language (no mixed strings!)
export function categorizeCivicProblem(
  text: string,
  lang: SupportedCivicLang = 'ta'
): {
  category: string;
  subcategory: string;
  criticality: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  recommendedDepartment: string;
} {
  const lower = text.toLowerCase();
  const meta = CIVIC_LANG_METADATA[lang] || CIVIC_LANG_METADATA.ta;

  // Water & Drainage
  if (
    lower.includes('தண்ணி') ||
    lower.includes('குடிநீர்') ||
    lower.includes('குழாய்') ||
    lower.includes('கழிவுநீர்') ||
    lower.includes('சாக்கடை') ||
    lower.includes('மழைநீர்') ||
    lower.includes('വെള്ളം') ||
    lower.includes('ഡ്രെയിനേജ്') ||
    lower.includes('నీళ్లు') ||
    lower.includes('డ్రైనేజీ') ||
    lower.includes('ನೀರು') ||
    lower.includes('ಚರಂಡಿ') ||
    lower.includes('पानी') ||
    lower.includes('नाली') ||
    lower.includes('water') ||
    lower.includes('pipe') ||
    lower.includes('drainage') ||
    lower.includes('sewage')
  ) {
    const isSewage =
      lower.includes('கழிவுநீர்') ||
      lower.includes('சாக்கடை') ||
      lower.includes('ഡ്രെയിനേജ്') ||
      lower.includes('డ్రైనేజీ') ||
      lower.includes('नाली') ||
      lower.includes('drainage') ||
      lower.includes('sewage');

    let subcat = '';
    if (lang === 'ta') subcat = isSewage ? 'சாக்கடை மற்றும் கழிவுநீர் தேக்கம்' : 'குடிநீர் விநியோகக் குழாய் பழுது';
    else if (lang === 'ml') subcat = isSewage ? 'ഓവുചാൽ മലിനജല തടസ്സം' : 'കുടിവെള്ള പൈപ്പ് തകരാർ';
    else if (lang === 'te') subcat = isSewage ? 'మురుగునీటి నిల్వ మరియు దుర్గంధం' : 'తాగునీటి పైపులైన్ లీకేజ్';
    else if (lang === 'kn') subcat = isSewage ? 'ಒಳಚರಂಡಿ ನೀರು ನಿಲುಗಡೆ' : 'ಕುಡಿಯುವ ನೀರಿನ ಪೈಪ್ ಸೋರಿಕೆ';
    else if (lang === 'hi') subcat = isSewage ? 'सीवर और गंदे पानी का भराव' : 'पेयजल पाइपलाइन रिसाव';
    else subcat = isSewage ? 'Sewage and Drainage Overflow' : 'Drinking Water Pipeline Breakage';

    return {
      category: meta.categoryWater,
      subcategory: subcat,
      criticality: 'CRITICAL',
      recommendedDepartment: meta.deptWater,
    };
  }

  // Electricity & Streetlights
  if (
    lower.includes('கரண்ட்') ||
    lower.includes('மின்சாரம்') ||
    lower.includes('மின் கம்பி') ||
    lower.includes('விளக்கு') ||
    lower.includes('போஸ்ட்') ||
    lower.includes('இருட்டு') ||
    lower.includes('കറണ്ട്') ||
    lower.includes('വൈദ്യുതി') ||
    lower.includes('വിളക്ക്') ||
    lower.includes('కరెంట్') ||
    lower.includes('లైట్') ||
    lower.includes('ಕರೆಂಟ್') ||
    lower.includes('ದೀಪ') ||
    lower.includes('बिजली') ||
    lower.includes('तार') ||
    lower.includes('लाइट') ||
    lower.includes('power') ||
    lower.includes('electric') ||
    lower.includes('wire') ||
    lower.includes('light')
  ) {
    const isWire =
      lower.includes('மின் கம்பி') ||
      lower.includes('കമ്പി') ||
      lower.includes('వైర్') ||
      lower.includes('ತಂತಿ') ||
      lower.includes('तार') ||
      lower.includes('wire');

    let subcat = '';
    if (lang === 'ta') subcat = isWire ? 'ஆபத்தான மின்கம்பி அறுந்து கிடத்தல்' : 'தெருவிளக்கு எரியவில்லை - இருள்';
    else if (lang === 'ml') subcat = isWire ? 'അപകടകരമായ വൈദ്യുതി ലൈൻ പൊട്ടിവീഴൽ' : 'വഴിവിളക്ക് തെളിയുന്നില്ല';
    else if (lang === 'te') subcat = isWire ? 'ప్రమాదకరమైన విద్యుత్ తీగ తెగిపడటం' : 'వీధి దీపాలు వెలగడం లేదు';
    else if (lang === 'kn') subcat = isWire ? 'ಅಪಾಯಕಾರಿ ವಿದ್ಯುತ್ ತಂತಿ ಕಡಿತ' : 'ಬೀದಿದೀಪ ಕೆಟ್ಟಿರುವುದು';
    else if (lang === 'hi') subcat = isWire ? 'खतरनाक बिजली का तार टूटना' : 'स्ट्रीट लाइट बंद होना';
    else subcat = isWire ? 'Dangerous Fallen Live Power Line' : 'Streetlights Not Working';

    return {
      category: meta.categoryPower,
      subcategory: subcat,
      criticality: 'CRITICAL',
      recommendedDepartment: meta.deptPower,
    };
  }

  // Waste & Sanitation
  if (
    lower.includes('குப்பை') ||
    lower.includes('துர்நாற்றம்') ||
    lower.includes('நாற்றம்') ||
    lower.includes('கழிவு') ||
    lower.includes('മാലിന്യം') ||
    lower.includes('ചെളി') ||
    lower.includes('చెత్త') ||
    lower.includes('కసవు') ||
    lower.includes('ಕಸ') ||
    lower.includes('ಕೊಳಚೆ') ||
    lower.includes('कचरा') ||
    lower.includes('गंदगी') ||
    lower.includes('garbage') ||
    lower.includes('waste') ||
    lower.includes('trash')
  ) {
    let subcat = '';
    if (lang === 'ta') subcat = 'குப்பை கழிவுகள் தேக்கம் மற்றும் துர்நாற்றம்';
    else if (lang === 'ml') subcat = 'മാലിന്യങ്ങൾ കുന്നുകൂടലും ദുർഗന്ധവും';
    else if (lang === 'te') subcat = 'చెత్త పేరుకుపోవడం మరియు దుర్గంధం';
    else if (lang === 'kn') subcat = 'ಕಸ ಸಂಗ್ರಹಣೆ ಕೊರತೆ ಮತ್ತು ದುರ್ನಾತ';
    else if (lang === 'hi') subcat = 'कचरे का ढेर और दुर्गंध';
    else subcat = 'Accumulated Garbage and Foul Odor';

    return {
      category: meta.categorySanitation,
      subcategory: subcat,
      criticality: 'HIGH',
      recommendedDepartment: meta.deptSanitation,
    };
  }

  // Health & Emergency
  if (
    lower.includes('மருத்துவமனை') ||
    lower.includes('ஆம்புலன்ஸ்') ||
    lower.includes('அவசரம்') ||
    lower.includes('ஆஸ்பத்திரி') ||
    lower.includes('ആശുപത്രി') ||
    lower.includes('ആംബുലൻസ്') ||
    lower.includes('ఆసుపత్రి') ||
    lower.includes('ಆಸ್ಪತ್ರೆ') ||
    lower.includes('अस्पताल') ||
    lower.includes('एम्बुलेंस') ||
    lower.includes('hospital') ||
    lower.includes('ambulance') ||
    lower.includes('emergency')
  ) {
    let subcat = '';
    if (lang === 'ta') subcat = 'அவசர மருத்துவ வழித்தட பாதுகாப்பு';
    else if (lang === 'ml') subcat = 'ആശുപത്രി ആംബുലൻസ് തടസ്സം';
    else if (lang === 'te') subcat = 'అత్యవసర ఆసుపత్రి మార్గంలో అడ్డంకి';
    else if (lang === 'kn') subcat = 'ಆಸ್ಪತ್ರೆ ತುರ್ತು ಮಾರ್ಗ ಅಡಚಣೆ';
    else if (lang === 'hi') subcat = 'अस्पताल व एम्बुलेंस मार्ग में रुकावट';
    else subcat = 'Hospital and Emergency Corridor Blockage';

    return {
      category: meta.categoryHealth,
      subcategory: subcat,
      criticality: 'CRITICAL',
      recommendedDepartment: meta.deptHealth,
    };
  }

  // Default: Road & Infrastructure
  const isPothole =
    lower.includes('பள்ளம்') ||
    lower.includes('குழி') ||
    lower.includes('തകർന്നു') ||
    lower.includes('గుంతలు') ||
    lower.includes('ಗುಂಡಿ') ||
    lower.includes('गड्ढा') ||
    lower.includes('pothole') ||
    lower.includes('broken');

  let subcat = '';
  if (lang === 'ta') subcat = isPothole ? 'சாலை பள்ளம் மற்றும் சேதம்' : 'பொது உள்கட்டமைப்பு சேதம்';
  else if (lang === 'ml') subcat = isPothole ? 'റോഡിലെ വലിയ കുഴികളും തകർച്ചയും' : 'പൊതു അടിസ്ഥാന സൗകರ್ಯ തകരാർ';
  else if (lang === 'te') subcat = isPothole ? 'రోడ్డు గుంతలు మరియు రాకపోకల సమస్య' : 'ప్రజా మౌలిಕ సదుపಾಯాల లోపం';
  else if (lang === 'kn') subcat = isPothole ? 'ರಸ್ತೆ ಗುಂಡಿಗಳು ಮತ್ತು ಹಾನಿ' : 'ಸಾರ್ವಜನಿಕ ಮೂಲಸೌಕರ್ಯ ದುರಸ್ತಿ';
  else if (lang === 'hi') subcat = isPothole ? 'सड़क पर गहरे गड्ढे और टूट-फूट' : 'सार्वजनिक अवसंरचना क्षति';
  else subcat = isPothole ? 'Damaged Road and Dangerous Potholes' : 'Public Infrastructure Damage';

  return {
    category: meta.categoryRoads,
    subcategory: subcat,
    criticality: lower.includes('பெரிய') || lower.includes('மோசம்') || lower.includes('ஆபத்து') || lower.includes('danger') ? 'CRITICAL' : 'HIGH',
    recommendedDepartment: meta.deptRoads,
  };
}

export const INITIAL_DIALOGUE_STATE: DialogueState = {
  step: 'greeting',
  problemText: '',
  category: CIVIC_LANG_METADATA.en.categoryRoads,
  subcategory: 'Pothole and Road Damage',
  extractedLandmark: '',
  criticality: 'HIGH',
  recommendedDepartment: CIVIC_LANG_METADATA.en.deptRoads,
  lastAiReply: CIVIC_LANG_METADATA.en.greeting,
  activeLang: 'en',
};

// Conversational Turn Manager: Friendly AI Companion
export function processConversationalTurn(
  userSpeech: string,
  state: DialogueState,
  preferredLang: SupportedCivicLang = 'en',
  fallbackDistrict: string = 'Chennai'
): {
  nextState: DialogueState;
  aiSpeechReply: string;
  shouldSubmitNow: boolean;
  detectedLang: SupportedCivicLang;
} {
  const text = userSpeech.trim();

  // 1. Detect if the user spoke or requested a specific language
  const detectedLangFromSpeech = detectLanguageFromSpeech(text);
  const langSwitch = isLanguageSwitchCommand(text);

  let activeLang = state.activeLang || preferredLang || 'en';
  if (langSwitch.isSwitch) {
    activeLang = langSwitch.targetLang;
  } else if (detectedLangFromSpeech) {
    activeLang = detectedLangFromSpeech;
  }

  const meta = CIVIC_LANG_METADATA[activeLang] || CIVIC_LANG_METADATA.en;

  // 2. If user specifically said "Tamil la pesala", acknowledge and switch language immediately!
  if (langSwitch.isSwitch && text.length < 35) {
    const reply = meta.langSwitchReply;
    return {
      nextState: {
        ...state,
        activeLang,
        step: 'ask_problem',
        lastAiReply: reply,
      },
      aiSpeechReply: reply,
      shouldSubmitNow: false,
      detectedLang: activeLang,
    };
  }

  // 3. If user confirmed submission ("சரி", "அனுப்பு", "yes", etc.)
  if (state.step === 'confirm_submission' && isSubmitCommand(text, activeLang)) {
    const confirmationText = meta.formatSubmissionSuccess();
    return {
      nextState: {
        ...state,
        activeLang,
        step: 'submitted',
        lastAiReply: confirmationText,
      },
      aiSpeechReply: confirmationText,
      shouldSubmitNow: true,
      detectedLang: activeLang,
    };
  }

  // 4. If citizen only greeted ("ஹலோ", "வணக்கம்", "hello")
  if (isGreetingOnly(text)) {
    const greetingReply = meta.greeting;
    return {
      nextState: {
        ...state,
        activeLang,
        step: 'ask_problem',
        lastAiReply: greetingReply,
      },
      aiSpeechReply: greetingReply,
      shouldSubmitNow: false,
      detectedLang: activeLang,
    };
  }

  // 5. Citizen described their problem!
  const classification = categorizeCivicProblem(text, activeLang);
  const foundLandmark = extractLandmarkFromSpeech(text);
  const finalLandmark = foundLandmark || state.extractedLandmark || fallbackDistrict;

  // Pure Native Response
  const aiReply = meta.formatProblemAck(finalLandmark, classification.subcategory);

  const nextState: DialogueState = {
    step: 'confirm_submission',
    problemText: text,
    category: classification.category,
    subcategory: classification.subcategory,
    extractedLandmark: finalLandmark,
    criticality: classification.criticality,
    recommendedDepartment: classification.recommendedDepartment,
    lastAiReply: aiReply,
    activeLang,
  };

  return {
    nextState,
    aiSpeechReply: aiReply,
    shouldSubmitNow: false,
    detectedLang: activeLang,
  };
}

// Single Turn Processor for standard form
export function processCitizenVoice(
  spokenText: string,
  preferredLang: string = 'en'
): VoiceAssistantAnalysis {
  const text = spokenText.trim();

  // Auto-detect language
  const detected = detectLanguageFromSpeech(text);
  const activeLang: SupportedCivicLang =
    (detected as SupportedCivicLang) ||
    ((preferredLang as SupportedCivicLang) in CIVIC_LANG_METADATA
      ? (preferredLang as SupportedCivicLang)
      : 'en');

  const meta = CIVIC_LANG_METADATA[activeLang] || CIVIC_LANG_METADATA.en;

  if (isGreetingOnly(text)) {
    return {
      isGreeting: true,
      userSpokenText: text,
      category: meta.categoryRoads,
      subcategory: 'Awaiting Problem Details',
      problemSummary: meta.askProblemPrompt,
      extractedLandmark: '',
      criticality: 'MEDIUM',
      recommendedDepartment: meta.deptRoads,
      aiVoiceReply: meta.greeting,
      isReadyToSubmit: false,
    };
  }

  const classification = categorizeCivicProblem(text, activeLang);
  const extractedLandmark = extractLandmarkFromSpeech(text);
  const aiVoiceReply = meta.formatProblemAck(extractedLandmark, classification.subcategory);

  return {
    isGreeting: false,
    userSpokenText: text,
    category: classification.category,
    subcategory: classification.subcategory,
    problemSummary: text.length > 75 ? text.slice(0, 75) + '...' : text,
    extractedLandmark: extractedLandmark || 'சம்பவம் நடந்த இடம்',
    criticality: classification.criticality,
    recommendedDepartment: classification.recommendedDepartment,
    aiVoiceReply,
    isReadyToSubmit: true,
  };
}

export function stopAIAssistantVoice(): void {
  stopSingleVoice();
}

/**
 * Unified Speech Player using SpeechSynthesisSingleton
 * Guarantees strictly SINGLE-VOICE output across all components.
 */
export async function speakAIAssistantVoice(
  text: string,
  langCode: string = 'en',
  onStart?: () => void,
  onEnd?: () => void
): Promise<void> {
  return speakSingleVoice(text, langCode, onStart, onEnd);
}

/**
 * Fetch fluent, contextual conversational turn from Gemini AI in natural Tamil
 */
export async function fetchGeminiConversationalTurn(
  userSpeech: string,
  state: DialogueState,
  district: string = 'Chennai',
  stateName: string = 'Tamil Nadu'
): Promise<{
  aiVoiceReply: string;
  category: string;
  subcategory: string;
  criticality: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  recommendedDepartment: string;
  extractedLandmark: string;
  isReadyToSubmit: boolean;
  isGreeting: boolean;
  source: string;
} | null> {
  try {
    const res = await fetch('/api/voice/assistant-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userSpeech,
        activeLang: state.activeLang || 'en',
        district,
        state: stateName,
        step: state.step,
        previousProblemText: state.problemText,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (!data.fallback && data.aiVoiceReply) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Gemini conversational turn API notice:', err);
  }
  return null;
}

