// Universal Multilingual Translation and Native Speech Synthesis Service
import {
  speakSingleVoice,
  stopSingleVoice,
  isSingleVoiceSpeaking,
} from './speechSynthesisSingleton';

export interface TranslatedCivicReport {
  targetLanguageCode: string;
  targetLanguageName: string;
  title: string;
  description: string;
  locationText: string;
  category: string;
  criticality: string;
  officialStatus: string;
  aiVoiceScript: string;
  speechLocale: string;
}

// Language metadata with proper Web Speech API locales
export const SPEECH_LOCALES: Record<string, { locale: string; name: string; nativeName: string; flag: string }> = {
  en: { locale: 'en-US', name: 'English (US)', nativeName: 'English (US)', flag: '🌐' },
  'en-gb': { locale: 'en-GB', name: 'British English', nativeName: 'English (UK)', flag: '🇬🇧' },
  ta: { locale: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  hi: { locale: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  ml: { locale: 'ml-IN', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
  te: { locale: 'te-IN', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  kn: { locale: 'kn-IN', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  es: { locale: 'es-ES', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  pt: { locale: 'pt-BR', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  ru: { locale: 'ru-RU', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  zh: { locale: 'zh-CN', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
};

// Multilingual vocabulary bank for civic reports
const TRANSLATION_MAPS: Record<string, Record<string, string>> = {
  ta: {
    'Hospital Access Road Disruption & Flooding': 'மருத்துவமனை அணுகுசாலை சேதம் மற்றும் மழைநீர் தேக்கம்',
    'Major Road Pothole & Waterlogging': 'பிரதான சாலையில் பெரிய பள்ளம் மற்றும் வெள்ளம்',
    'Broken Municipal Water Main Burst': 'முனிசிபல் பிரதான குடிநீர் குழாய் உடைப்பு',
    'Pedestrian Footbridge Structural Crack': 'பாதசாரி மேம்பால கட்டமைப்பு விரிசல்',
    'Unlit Corridor & Broken Electrical Junction': 'எரியாத தெருவிளக்கு மற்றும் திறந்தநிலை மின்சார கம்பி',
    'Solid Waste Accumulation Near School': 'பள்ளி அருகில் கொட்டப்பட்ட குப்பைக் கழிவுகள்',
    'Ration Shop Food Stock Defect / Substandard PDS Grain': 'ரேஷன் கடை உணவு தானிய தரம் குறைபாடு',
    'Government School Ceiling Structural Damage': 'அரசு பள்ளி மேற்கூரை காரை பெயர்ந்து சேதம்',
    'CRITICAL': 'அதிதீவிர முன்னுரிமை',
    'HIGH': 'உயர் முன்னுரிமை',
    'MEDIUM': 'நடுத்தர முன்னுரிமை',
    'LOW': 'வழக்கமான முன்னுரிமை',
    'Transportation & Highways': 'நெடுஞ்சாலை மற்றும் போக்குவரத்துத் துறை',
    'Water Supply & Sewerage Board': 'குடிநீர் மற்றும் கழிவுநீர் வாரியம்',
    'Healthcare & Public Health Authority': 'மருத்துவம் மற்றும் பொது சுகாதாரம்',
    'Food Safety & Civil Supplies / PDS Authority': 'உணவு பாதுகாப்பு மற்றும் ரேஷன் துறை',
    'Public Education & School Infrastructure': 'பள்ளிக் கல்வி மற்றும் உட்கட்டமைப்பு',
    'State Electricity Distribution Board': 'மின்சார வாரியம் மற்றும் மின்விநியோகம்',
    'Municipal Solid Waste & Sanitation': 'மாநகராட்சி துப்புரவு மற்றும் திடக்கழிவு',
    'Public Safety & Disaster Management': 'பொது பாதுகாப்பு மற்றும் பேரிடர் மேலாண்மை',
    'RESOLVED': 'தீர்க்கப்பட்டது',
    'IN_PROGRESS': 'நடவடிக்கையில் உள்ளது',
    'ASSIGNED': 'துறைக்கு ஒதுக்கப்பட்டது',
    'ANALYZED': 'ஆய்வு செய்யப்பட்டது',
    'VERIFIED': 'சரிபார்க்கப்பட்டது',
  },
  hi: {
    'Hospital Access Road Disruption & Flooding': 'अस्पताल पहुंच मार्ग पर जलभराव और भारी गड्ढे',
    'Major Road Pothole & Waterlogging': 'मुख्य सड़क पर गहरे गड्ढे और जलभराव',
    'Broken Municipal Water Main Burst': 'नगर निगम की मुख्य पेयजल पाइपलाइन फटी',
    'Pedestrian Footbridge Structural Crack': 'पैदल यात्री पुल में गंभीर संरचनात्मक दरार',
    'Unlit Corridor & Broken Electrical Junction': 'अंधेरा मार्ग और खुली बिजली के तार',
    'Solid Waste Accumulation Near School': 'स्कूल के पास खुले में कचरे का ढेर',
    'Ration Shop Food Stock Defect / Substandard PDS Grain': 'राशन दुकान में खराब गुणवत्ता वाले अनाज की आपूर्ति',
    'Government School Ceiling Structural Damage': 'सरकारी स्कूल की छत का प्लास्टर गिरने का खतरा',
    'CRITICAL': 'अति गंभीर (क्रिटिकल)',
    'HIGH': 'उच्च प्राथमिकता',
    'MEDIUM': 'मध्यम प्राथमिकता',
    'LOW': 'सामान्य प्राथमिकता',
    'Transportation & Highways': 'सड़क परिवहन एवं राजमार्ग विभाग',
    'Water Supply & Sewerage Board': 'जल आपूर्ति एवं सीवरेज बोर्ड',
    'Healthcare & Public Health Authority': 'स्वास्थ्य एवं चिकित्सा सेवा विभाग',
    'Food Safety & Civil Supplies / PDS Authority': 'खाद्य सुरक्षा एवं नागरिक आपूर्ति विभाग',
    'Public Education & School Infrastructure': 'स्कूली शिक्षा एवं बुनियादी ढांचा विभाग',
    'State Electricity Distribution Board': 'राज्य विद्युत वितरण बोर्ड',
    'Municipal Solid Waste & Sanitation': 'नगर निगम ठोस अपशिष्ट एवं स्वच्छता प्रभाग',
    'Public Safety & Disaster Management': 'सार्वजनिक सुरक्षा एवं आपदा प्रबंधन',
    'RESOLVED': 'समाधान हो चुका',
    'IN_PROGRESS': 'कार्य प्रगति पर है',
    'ASSIGNED': 'विभाग को सौंपा गया',
    'ANALYZED': 'विश्लेषण पूरा',
    'VERIFIED': 'सत्यापित',
  },
  ml: {
    'Hospital Access Road Disruption & Flooding': 'ആശുപത്രിയിലേക്കുള്ള റോഡിൽ വൻ ഗർത്തങ്ങളും വെള്ളക്കെട്ടും',
    'Major Road Pothole & Waterlogging': 'പ്രധാന റോഡിൽ വലിയ കുഴികളും വെള്ളക്കെട്ടും',
    'Broken Municipal Water Main Burst': 'പ്രധാന കുടിവെള്ള പൈപ്പ് പൊട്ടി വെള്ളം പാഴാകുന്നു',
    'Pedestrian Footbridge Structural Crack': 'കാൽനട മേൽപ്പാലത്തിൽ വിള്ളൽ',
    'Unlit Corridor & Broken Electrical Junction': 'തെരുവ് വിളക്കുകൾ കത്തുന്നില്ല, അപകടകരമായ കേബിളുകൾ',
    'Solid Waste Accumulation Near School': 'സ്കൂളിന് സമീപം വൻ മാലിന്യക്കൂമ്പാരം',
    'Ration Shop Food Stock Defect / Substandard PDS Grain': 'റേഷൻ കടയിലെ ഭക്ഷ്യധാന്യങ്ങൾക്ക് ഗുണനിലവാരമില്ലായ്മ',
    'Government School Ceiling Structural Damage': 'സർക്കാർ സ്കൂൾ മേൽക്കൂര തകർന്നു വീഴാൻ സാധ്യത',
    'CRITICAL': 'അതീവ ഗുരുതരം',
    'HIGH': 'ഉയർന്ന മുൻഗണന',
    'MEDIUM': 'ഇടത്തരം മുൻഗണന',
    'LOW': 'സാധാരണ മുൻഗണന',
    'Transportation & Highways': 'പൊതുമരാമത്ത്, റോഡ്സ് വിഭാഗം',
    'Water Supply & Sewerage Board': 'കേരള വാട്ടർ അതോറിറ്റി',
    'Healthcare & Public Health Authority': 'ആരോഗ്യ കുടുംബക്ഷേമ വകുപ്പ്',
    'Food Safety & Civil Supplies / PDS Authority': 'ഭക്ഷ്യ സിവിൽ സപ്ലൈസ് വകുപ്പ്',
    'Public Education & School Infrastructure': 'വിദ്യാഭ്യാസ വകുപ്പ്',
    'State Electricity Distribution Board': 'വൈദ്യുതി ബോർഡ്',
    'Municipal Solid Waste & Sanitation': 'ശുചിത്വ മാലിന്യ നിർമ്മാർജ്ജന വിഭാഗം',
    'Public Safety & Disaster Management': 'പൊതു സുരക്ഷാ വിഭാഗം',
    'RESOLVED': 'പരിഹരിച്ചു',
    'IN_PROGRESS': 'നടപടി പുരോഗമിക്കുന്നു',
    'ASSIGNED': 'ഉദ്യോഗസ്ഥന് കൈമാറി',
    'ANALYZED': 'പരിശോധിച്ചു',
    'VERIFIED': 'സ്ഥിരീകരിച്ചു',
  },
  te: {
    'Hospital Access Road Disruption & Flooding': 'ఆసుపత్రికి వెళ్లే రహదారిలో భారీ గుంతలు, వరద నీరు',
    'Major Road Pothole & Waterlogging': 'ప్రధాన రహదారిపై ప్రమాదకర గుంతలు',
    'Broken Municipal Water Main Burst': 'ప్రధాన మంచినీటి పైపులైన్ పగిలి నీరు వృధా',
    'Pedestrian Footbridge Structural Crack': 'పాదచారుల వంతెన నిర్మాణంలో పగుళ్లు',
    'Unlit Corridor & Broken Electrical Junction': 'వీధి దీపాలు వెలగడం లేదు, విద్యుత్ తీగలు వేలాడుతున్నాయి',
    'Solid Waste Accumulation Near School': 'పాఠశాల సమీపంలో పేరుకుపోయిన చెత్త కుప్పలు',
    'Ration Shop Food Stock Defect / Substandard PDS Grain': 'రేషన్ దుకాణంలో నాణ్యత లేని నిత్యావసరాలు',
    'Government School Ceiling Structural Damage': 'ప్రభుత్వ పాఠశాల పైకప్పు పెచ్చులు ఊడి ప్రమాదం',
    'CRITICAL': 'అత్యంత అత్యవసరం',
    'HIGH': 'అధిక ప్రాధాన్యత',
    'MEDIUM': 'మధ్యస్థ ప్రాధాన్యత',
    'LOW': 'సాధారణ ప్రాధాన్యత',
    'Transportation & Highways': 'రోడ్లు & రవాణా శాఖ',
    'Water Supply & Sewerage Board': 'జలమండలి & మురుగునీటి పారుదల',
    'Healthcare & Public Health Authority': 'వైద్య ఆరోగ్య శాఖ',
    'Food Safety & Civil Supplies / PDS Authority': 'పౌరసరఫరాల శాఖ',
    'Public Education & School Infrastructure': 'పాఠశాల విద్యాశాఖ',
    'State Electricity Distribution Board': 'విద్యుత్ శాఖ',
    'Municipal Solid Waste & Sanitation': 'మున్సిపల్ పారిశుధ్య విభాగం',
    'Public Safety & Disaster Management': 'ప్రజా రక్షణ విభాగం',
    'RESOLVED': 'పరిష్కరించబడింది',
    'IN_PROGRESS': 'పురోగతిలో ఉంది',
    'ASSIGNED': 'కేటాయించబడింది',
    'ANALYZED': 'విశ్లేషించబడింది',
    'VERIFIED': 'ధృవీకరించబడింది',
  },
  es: {
    'Hospital Access Road Disruption & Flooding': 'Inundación y baches críticos en vía de acceso al hospital',
    'Major Road Pothole & Waterlogging': 'Grandes baches y acumulación pluvial en calzada principal',
    'Broken Municipal Water Main Burst': 'Rotura de tubería matriz municipal de agua potable',
    'Pedestrian Footbridge Structural Crack': 'Grieta estructural en pasarela peatonal',
    'Unlit Corridor & Broken Electrical Junction': 'Alumbrado público inoperativo y cableado expuesto',
    'Solid Waste Accumulation Near School': 'Acumulación de residuos sólidos junto a centro educativo',
    'Ration Shop Food Stock Defect / Substandard PDS Grain': 'Defecto de calidad en alimentos de distribución pública',
    'Government School Ceiling Structural Damage': 'Desprendimiento de yeso y riesgo en techumbre escolar',
    'CRITICAL': 'CRÍTICO',
    'HIGH': 'ALTO',
    'MEDIUM': 'MEDIO',
    'LOW': 'BAJO',
    'Transportation & Highways': 'Dirección General de Carreteras e Infraestructura',
    'Water Supply & Sewerage Board': 'Empresa Municipal de Aguas y Saneamiento',
    'Healthcare & Public Health Authority': 'Consejería de Sanidad y Salud Pública',
    'Food Safety & Civil Supplies / PDS Authority': 'Autoridad de Seguridad Alimentaria y Consumo',
    'Public Education & School Infrastructure': 'Consejería de Educación e Infraestructuras Escolares',
    'State Electricity Distribution Board': 'Distribuidora de Electricidad y Alumbrado',
    'Municipal Solid Waste & Sanitation': 'Servicio Municipal de Limpieza y Residuos',
    'Public Safety & Disaster Management': 'Seguridad Ciudadana y Emergencias',
    'RESOLVED': 'RESUELTO',
    'IN_PROGRESS': 'EN CURSO',
    'ASSIGNED': 'ASIGNADO',
    'ANALYZED': 'ANALIZADO',
    'VERIFIED': 'VERIFICADO',
  },
  ru: {
    'Hospital Access Road Disruption & Flooding': 'Разрушение подъездной дороги к больнице и подтопление',
    'Major Road Pothole & Waterlogging': 'Глубокие ямы на дорожном полотне и застой воды',
    'Broken Municipal Water Main Burst': 'Прорыв магистрального водопровода питьевой воды',
    'Pedestrian Footbridge Structural Crack': 'Опасная трещина в несущих конструкциях пешеходного моста',
    'Unlit Corridor & Broken Electrical Junction': 'Отсутствие освещения и оголенный силовой кабель',
    'Solid Waste Accumulation Near School': 'Несанкционированная свалка отходов рядом со школой',
    'Ration Shop Food Stock Defect / Substandard PDS Grain': 'Поставка некачественных продуктов в пункт распределения',
    'Government School Ceiling Structural Damage': 'Осыпание штукатурки и повреждение потолка в школе',
    'CRITICAL': 'КРИТИЧЕСКИЙ',
    'HIGH': 'ВЫСОКИЙ',
    'MEDIUM': 'СРЕДНИЙ',
    'LOW': 'НИЗКИЙ',
    'Transportation & Highways': 'Департамент транспорта и дорожного хозяйства',
    'Water Supply & Sewerage Board': 'Служба водоканала и водоотведения',
    'Healthcare & Public Health Authority': 'Министерство здравоохранения и скорой помощи',
    'Food Safety & Civil Supplies / PDS Authority': 'Служба продовольственной безопасности',
    'Public Education & School Infrastructure': 'Департамент школьного образования',
    'State Electricity Distribution Board': 'Энергетическая распределительная компания',
    'Municipal Solid Waste & Sanitation': 'Служба коммунального хозяйства и утилизации ТБО',
    'Public Safety & Disaster Management': 'Служба общественной безопасности и ГОЧС',
    'RESOLVED': 'РЕШЕНО',
    'IN_PROGRESS': 'В РАБОТЕ',
    'ASSIGNED': 'НАЗНАЧЕНО',
    'ANALYZED': 'ПРОАНАЛИЗИРОВАНО',
    'VERIFIED': 'ПРОВЕРЕНО',
  },
  zh: {
    'Hospital Access Road Disruption & Flooding': '医院主通道严重破损及积水受阻',
    'Major Road Pothole & Waterlogging': '主干道严重坑洼与路面积水',
    'Broken Municipal Water Main Burst': '市政供水主管爆裂',
    'Pedestrian Footbridge Structural Crack': '人行天桥承重结构严重裂缝',
    'Unlit Corridor & Broken Electrical Junction': '公共路灯故障且存在裸露高压电线',
    'Solid Waste Accumulation Near School': '学校周边露天固体垃圾堆积',
    'Ration Shop Food Stock Defect / Substandard PDS Grain': '平价粮油配给点物资质量缺陷',
    'Government School Ceiling Structural Damage': '公立学校教室天花板灰浆剥落受损',
    'CRITICAL': '紧急 / 极高',
    'HIGH': '高优先级',
    'MEDIUM': '中优先级',
    'LOW': '普通优先级',
    'Transportation & Highways': '交通运输局 / 公路建设管理局',
    'Water Supply & Sewerage Board': '水务局与市政排水管网',
    'Healthcare & Public Health Authority': '卫生健康委员会与公立医院管理中心',
    'Food Safety & Civil Supplies / PDS Authority': '粮食与物资储备局',
    'Public Education & School Infrastructure': '教育局与学校基建处',
    'State Electricity Distribution Board': '供电局与市政电力公司',
    'Municipal Solid Waste & Sanitation': '城市管理与综合执法局环卫处',
    'Public Safety & Disaster Management': '应急管理局与公众安全委员会',
    'RESOLVED': '已办结',
    'IN_PROGRESS': '办理中',
    'ASSIGNED': '已派单',
    'ANALYZED': '已分析',
    'VERIFIED': '已核实',
  },
  'en-gb': {
    'Hospital Access Road Disruption & Flooding': 'Hospital Access Carriageway Subsidence & Waterlogging',
    'Major Road Pothole & Waterlogging': 'Major Carriageway Pothole & Surface Flooding',
    'Broken Municipal Water Main Burst': 'Fractured Municipal Potable Water Main',
    'Pedestrian Footbridge Structural Crack': 'Pedestrian Footbridge Structural Shear Crack',
    'Unlit Corridor & Broken Electrical Junction': 'Public Street Luminaire Failure & Exposed High-Voltage Wiring',
    'Solid Waste Accumulation Near School': 'Decomposing Municipal Refuse Accumulation Adjacent to School',
    'Ration Shop Food Stock Defect / Substandard PDS Grain': 'Substandard Public Distribution Essential Food Supplies',
    'Government School Ceiling Structural Damage': 'Classroom Ceiling Plaster Delamination & Structural Hazard',
    'CRITICAL': 'CRITICAL',
    'HIGH': 'HIGH PRIORITY',
    'MEDIUM': 'MEDIUM PRIORITY',
    'LOW': 'ROUTINE',
    'Transportation & Highways': 'Highways Authority & Transport for London / Local Council',
    'Water Supply & Sewerage Board': 'Thames Water & Regional Drainage Authority',
    'Healthcare & Public Health Authority': 'National Health Service (NHS) Estates & Public Health',
    'Food Safety & Civil Supplies / PDS Authority': 'Food Standards Agency & Public Nutrition Directorate',
    'Public Education & School Infrastructure': 'Department for Education (DfE) & School Estates',
    'State Electricity Distribution Board': 'National Grid & Regional Distribution Network',
    'Municipal Solid Waste & Sanitation': 'Council Environmental Services & Waste Management',
    'Public Safety & Disaster Management': 'Public Safety Directorate & Emergency Planning',
    'RESOLVED': 'RESOLVED',
    'IN_PROGRESS': 'UNDERWAY',
    'ASSIGNED': 'ALLOCATED',
    'ANALYZED': 'ASSESSED',
    'VERIFIED': 'VERIFIED',
  },
};

export function translateReport(
  report: {
    title: string;
    description: string;
    locationText: string;
    category: string;
    criticality: string;
    status: string;
    aiSummary?: string;
  },
  targetLangCode: string
): TranslatedCivicReport {
  const langConfig = SPEECH_LOCALES[targetLangCode] || SPEECH_LOCALES.en;
  const langMap = TRANSLATION_MAPS[targetLangCode] || {};

  const translatedTitle = langMap[report.title] || report.title;
  const translatedCategory = langMap[report.category] || report.category;
  const translatedCriticality = langMap[report.criticality] || report.criticality;
  const translatedStatus = langMap[report.status] || report.status;

  let translatedDescription = report.description;
  let aiVoiceScript = '';

  if (targetLangCode === 'ta') {
    translatedDescription = `[தமிழ் மொழியாக்கம்] ${translatedTitle}. இடம்: ${report.locationText}. வகை: ${translatedCategory}. இந்த பிரச்சனை பொதுமக்களுக்கு பெரும் பாதிப்பை ஏற்படுத்தியுள்ளது.`;
    aiVoiceScript = `கவனத்திற்கு: ${report.locationText} பகுதியில் ${translatedTitle} பதிவாகியுள்ளது. இதன் முன்னுரிமை நிலை: ${translatedCriticality}. பொறுப்பான துறை: ${translatedCategory}. தற்போதைய நிலை: ${translatedStatus}.`;
  } else if (targetLangCode === 'hi') {
    translatedDescription = `[हिन्दी अनुवाद] ${translatedTitle}। स्थान: ${report.locationText}। श्रेणी: ${translatedCategory}। यह समस्या नागरिकों की सुरक्षा को प्रभावित कर रही है।`;
    aiVoiceScript = `ध्यान दें: ${report.locationText} में ${translatedTitle} दर्ज किया गया है। प्राथमिकता स्तर: ${translatedCriticality}। संबंधित विभाग: ${translatedCategory}। वर्तमान स्थिति: ${translatedStatus}।`;
  } else if (targetLangCode === 'ml') {
    translatedDescription = `[മലയാളം വിവർത്തനം] ${translatedTitle}. സ്ഥലം: ${report.locationText}. വിഭാഗം: ${translatedCategory}.`;
    aiVoiceScript = `ശ്രദ്ധിക്കുക: ${report.locationText} പ്രദേശത്ത് ${translatedTitle} റിപ്പോർട്ട് ചെയ്തിരിക്കുന്നു. മുൻഗണന: ${translatedCriticality}. വകുപ്പ്: ${translatedCategory}. നിലവിലെ അവസ്ഥ: ${translatedStatus}.`;
  } else if (targetLangCode === 'te') {
    translatedDescription = `[తెలుగు అనువాదం] ${translatedTitle}. ప్రాంతం: ${report.locationText}. వర్గం: ${translatedCategory}.`;
    aiVoiceScript = `గమనిక: ${report.locationText} ప్రాంతంలో ${translatedTitle} నమోదైంది. ప్రాధాన్యత: ${translatedCriticality}. సంబంధిత శాఖ: ${translatedCategory}. ప్రస్తుత స్థితి: ${translatedStatus}.`;
  } else if (targetLangCode === 'es') {
    translatedDescription = `[Traducción al español] ${translatedTitle}. Ubicación: ${report.locationText}. Categoría: ${translatedCategory}.`;
    aiVoiceScript = `Atención: Se reporta ${translatedTitle} en ${report.locationText}. Nivel de criticidad: ${translatedCriticality}. Departamento responsable: ${translatedCategory}. Estado actual: ${translatedStatus}.`;
  } else if (targetLangCode === 'ru') {
    translatedDescription = `[Перевод на русский] ${translatedTitle}. Местоположение: ${report.locationText}. Категория: ${translatedCategory}.`;
    aiVoiceScript = `Внимание: Зафиксировано обращение по объекту: ${translatedTitle} в районе ${report.locationText}. Уровень критичности: ${translatedCriticality}. Ответственное ведомство: ${translatedCategory}. Статус: ${translatedStatus}.`;
  } else if (targetLangCode === 'zh') {
    translatedDescription = `[中文翻译] ${translatedTitle}。发生地点：${report.locationText}。分类：${translatedCategory}。`;
    aiVoiceScript = `请注意：在 ${report.locationText} 登记了 ${translatedTitle}。优先级：${translatedCriticality}。负责部门：${translatedCategory}。当前进度状态：${translatedStatus}。`;
  } else if (targetLangCode === 'en-gb') {
    translatedDescription = `[British English Dispatch] ${translatedTitle}. Locality: ${report.locationText}. Authority: ${translatedCategory}. Criticality: ${translatedCriticality}.`;
    aiVoiceScript = `Civic Intelligence Dispatch: ${translatedTitle} reported at ${report.locationText}. Priority level: ${translatedCriticality}. Routed to ${translatedCategory}. Current operational status: ${translatedStatus}.`;
  } else {
    translatedDescription = `${translatedTitle}. Location: ${report.locationText}. Category: ${translatedCategory}. Criticality: ${translatedCriticality}.`;
    aiVoiceScript = `Official Civic Alert: ${translatedTitle} in ${report.locationText}. Criticality level: ${translatedCriticality}. Managed by ${translatedCategory}. Status: ${translatedStatus}.`;
  }

  return {
    targetLanguageCode: targetLangCode,
    targetLanguageName: langConfig.name,
    title: translatedTitle,
    description: translatedDescription,
    locationText: report.locationText,
    category: translatedCategory,
    criticality: translatedCriticality,
    officialStatus: translatedStatus,
    aiVoiceScript,
    speechLocale: langConfig.locale,
  };
}

// Native Speech Synthesis playback delegated to SpeechSynthesisSingleton
export function stopSpeaking(): void {
  stopSingleVoice();
}

export async function speakCivicText(params: {
  text: string;
  langCode: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}): Promise<void> {
  return speakSingleVoice(
    params.text,
    params.langCode,
    params.onStart,
    params.onEnd,
    params.onError
  );
}

export function isSpeaking(): boolean {
  return isSingleVoiceSpeaking();
}
