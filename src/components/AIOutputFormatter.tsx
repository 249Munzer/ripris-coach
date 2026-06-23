import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  ChevronRight, 
  ShieldAlert, 
  Activity, 
  Droplets, 
  Dumbbell, 
  Scale, 
  Flame, 
  TrendingUp, 
  Clock, 
  Info, 
  Clipboard, 
  Check, 
  CornerDownRight, 
  Volume2, 
  Languages,
  BookOpen,
  Apple,
  HeartPulse,
  BrainCircuit,
  Lock
} from 'lucide-react';

interface AIOutputFormatterProps {
  text: string;
  lang?: 'en' | 'ar';
}

interface ParsedBlock {
  title: string;
  items: Array<{
    type: 'p' | 'li' | 'quote' | 'title';
    text: string;
    raw: string;
  }>;
}

export const AIOutputFormatter: React.FC<AIOutputFormatterProps> = ({ text, lang = 'en' }) => {
  const [activeTab, setActiveTab] = useState<'en' | 'ar' | null>(null);
  const [copied, setCopied] = useState(false);
  const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>({});

  // 1. Clean and separate Bilingual English and Arabic Content
  const bilingualData = useMemo(() => {
    if (!text) return { en: '', ar: '', hasBoth: false };

    const lines = text.split('\n');
    const arLines: string[] = [];
    const enLines: string[] = [];
    
    // Standard heuristic to track active language block
    let currentLang: 'en' | 'ar' = 'en';
    let hasArabicLetters = /[\u0600-\u06FF]/.test(text);
    let hasEnglishLetters = /[a-zA-Z]/.test(text);

    // If there's only one dominant script, do not split
    if (!hasArabicLetters) return { en: text, ar: '', hasBoth: false };
    if (!hasEnglishLetters) return { en: '', ar: text, hasBoth: false };

    // Set initial standard based on the very first substantial text line
    for (const line of lines) {
      if (line.trim().length > 10) {
        const isAr = /[\u0600-\u06FF]/.test(line) && !/[a-zA-Z]/.test(line);
        currentLang = isAr ? 'ar' : 'en';
        break;
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      const lower = trimmed.toLowerCase();
      const isHeader = trimmed.startsWith('#');

      // Explicit section divider detections
      if (isHeader) {
        if (
          lower.includes('arabic') || 
          lower.includes('العربية') || 
          lower.includes('بالعربية') || 
          lower.includes('الترجمة') ||
          lower.includes('عربي') ||
          lower.includes('القسم العربي')
        ) {
          currentLang = 'ar';
          continue;
        } else if (
          lower.includes('english') || 
          lower.includes('en version')
        ) {
          currentLang = 'en';
          continue;
        }
      }

      // Implicit script switches
      if (currentLang === 'en' && /[\u0600-\u06FF]/.test(line) && !/[a-zA-Z]/.test(line) && trimmed.length > 20) {
        // Switch to Arabic block
        currentLang = 'ar';
      } else if (currentLang === 'ar' && /[a-zA-Z]/.test(line) && !/[\u0600-\u06FF]/.test(line) && trimmed.length > 20) {
        // Switch to English block
        currentLang = 'en';
      }

      if (currentLang === 'ar') {
        arLines.push(line);
      } else {
        enLines.push(line);
      }
    }

    const enText = enLines.join('\n').trim();
    const arText = arLines.join('\n').trim();

    return {
      en: enText,
      ar: arText,
      hasBoth: enText.length > 10 && arText.length > 10
    };
  }, [text]);

  // Determine active tab context on initialization/change
  const resolvedLanguage = useMemo(() => {
    if (activeTab) return activeTab;
    if (bilingualData.hasBoth) {
      return lang; // Match current application general language translation state
    }
    return bilingualData.ar ? 'ar' : 'en';
  }, [bilingualData, lang, activeTab]);

  const activeText = useMemo(() => {
    if (resolvedLanguage === 'ar') return bilingualData.ar || text;
    return bilingualData.en || text;
  }, [bilingualData, resolvedLanguage, text]);

  // 2. Parse text into structured card blocks based on Headings / Numbers
  const parsedBlocks = useMemo(() => {
    if (!activeText) return [];

    const lines = activeText.split('\n');
    const blocks: ParsedBlock[] = [];
    let currentBlock: ParsedBlock = { title: '', items: [] };

    // Standard title detection patterns
    const isHeading = (line: string) => {
      const trimmed = line.trim();
      return (
        trimmed.startsWith('#') ||
        trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length < 80 ||
        /^\d+\.\s+/.test(trimmed) && trimmed.includes(':') ||
        /^\d+\\\.\s+/.test(trimmed)
      );
    };

    const cleanTitle = (titleLine: string) => {
      return titleLine
        .replace(/^[#\s*\\.-]+/, '')
        .replace(/\*\*+/g, '')
        .trim();
    };

    for (let line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (isHeading(line)) {
        if (currentBlock.title || currentBlock.items.length > 0) {
          blocks.push(currentBlock);
        }
        currentBlock = {
          title: cleanTitle(line),
          items: []
        };
      } else {
        // Identify line type inside active block
        let type: 'p' | 'li' | 'quote' | 'title' = 'p';
        let cleanText = trimmed;

        if (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('+')) {
          type = 'li';
          cleanText = trimmed.replace(/^[-*+]\s*/, '');
        } else if (trimmed.startsWith('>')) {
          type = 'quote';
          cleanText = trimmed.replace(/^>\s*/, '');
        }

        // Subtitle check
        if (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length < 120) {
          type = 'title';
          cleanText = trimmed.replace(/\*\*/g, '');
        }

        currentBlock.items.push({
          type,
          text: cleanText,
          raw: trimmed
        });
      }
    }

    if (currentBlock.title || currentBlock.items.length > 0) {
      blocks.push(currentBlock);
    }

    // Fallback block if no headers found
    if (blocks.length === 0 && activeText) {
      blocks.push({
        title: resolvedLanguage === 'en' ? 'Diagnostic Summary' : 'ملخص التحليل الفني',
        items: lines.filter(l => l.trim()).map(line => {
          let type: 'p' | 'li' | 'quote' = 'p';
          let cleanText = line.trim();
          if (cleanText.startsWith('-') || cleanText.startsWith('*')) {
            type = 'li';
            cleanText = cleanText.replace(/^[-*]\s*/, '');
          }
          return { type, text: cleanText, raw: line };
        })
      });
    }

    return blocks;
  }, [activeText, resolvedLanguage]);

  // Handle Clipboard Copy
  const handleCopy = () => {
    navigator.clipboard.writeText(activeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Assign beautifully colored physical icons dynamically to block titles
  const getBlockIcon = (title: string, isAr: boolean) => {
    const textToMatch = title.toLowerCase();
    
    // English/Arabic Keyword Matchers
    const isImbalance = textToMatch.includes('imbalan') || textToMatch.includes('weak') || textToMatch.includes('limit') || textToMatch.includes('limitations') || textToMatch.includes('injury') || textToMatch.includes('خلل') || textToMatch.includes('إصابة') || textToMatch.includes('ضعف');
    const isWater = textToMatch.includes('water') || textToMatch.includes('fluid') || textToMatch.includes('ecw') || textToMatch.includes('ماء') || textToMatch.includes('سوائل') || textToMatch.includes('رطوبة');
    const isMetabolic = textToMatch.includes('metabol') || textToMatch.includes('bmr') || textToMatch.includes('tdee') || textToMatch.includes('visceral') || textToMatch.includes('أيض') || textToMatch.includes('الحرق') || textToMatch.includes('السعرات');
    const isPattern = textToMatch.includes('pattern') || textToMatch.includes('class') || textToMatch.includes('shape') || textToMatch.includes('نمط') || textToMatch.includes('شكل') || textToMatch.includes('تصنيف');
    const isAction = textToMatch.includes('action') || textToMatch.includes('directive') || textToMatch.includes('recommend') || textToMatch.includes('progression') || textToMatch.includes('توصيات') || textToMatch.includes('خطوات') || textToMatch.includes('توجيه');
    const isMuscle = textToMatch.includes('muscle') || textToMatch.includes('smm') || textToMatch.includes('strength') || textToMatch.includes('split') || textToMatch.includes('عضل') || textToMatch.includes('تقسيم') || textToMatch.includes('القوة');
    const isCardio = textToMatch.includes('cardio') || textToMatch.includes('aerobic') || textToMatch.includes('كارديو') || textToMatch.includes('هوائي');
    const isRecovery = textToMatch.includes('recover') || textToMatch.includes('sleep') || textToMatch.includes('sleep quality') || textToMatch.includes('stress') || textToMatch.includes('استشفاء') || textToMatch.includes('نوم') || textToMatch.includes('إجهاد');

    if (isImbalance) return <ShieldAlert className="w-4.5 h-4.5 text-red-500 shrink-0" />;
    if (isWater) return <Droplets className="w-4.5 h-4.5 text-sky-400 shrink-0" />;
    if (isMetabolic) return <Flame className="w-4.5 h-4.5 text-orange-500 shrink-0" />;
    if (isPattern) return <Scale className="w-4.5 h-4.5 text-teal-400 shrink-0" />;
    if (isAction) return <TrendingUp className="w-4.5 h-4.5 text-purple-400 shrink-0" />;
    if (isMuscle) return <Dumbbell className="w-4.5 h-4.5 text-[#FF4D00] shrink-0" />;
    if (isCardio) return <Activity className="w-4.5 h-4.5 text-[#16C47F] shrink-0" />;
    if (isRecovery) return <HeartPulse className="w-4.5 h-4.5 text-[#FF3B30] shrink-0" />;

    return <Sparkles className="w-4.5 h-4.5 text-neutral-400 shrink-0" />;
  };

  // Convert Bold markdown text like **word** to styled inline nodes with rich contrast
  const formatBoldText = (textStr: string) => {
    const parts = textStr.split(/(\*\*[^*]+\*\*)/);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const word = part.slice(2, -2);
        return (
          <strong key={index} className="text-[#FF4D00] font-sans font-semibold border-b border-transparent hover:border-[#FF4D00]/30 transition-colors mx-0.5">
            {word}
          </strong>
        );
      }
      return part;
    });
  };

  const isRtl = resolvedLanguage === 'ar';

  return (
    <div 
      className={`space-y-4 text-xs font-sans ${isRtl ? 'dir-rtl text-right' : 'dir-ltr text-left'}`} 
      style={{ direction: isRtl ? 'rtl' : 'ltr' }}
      id="ai-output-formatter-root"
    >
      {/* 1. Header Toolbar (Bilingual Language Switcher + Quick Actions) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-neutral-950 p-2.5 rounded-xl border border-neutral-850" id="ai-formatter-toolbar">
        <div className="flex items-center gap-1.5" id="ai-formatter-bilingual-tabs">
          {bilingualData.hasBoth ? (
            <>
              <button
                id="btn-switch-en-ai"
                onClick={() => setActiveTab('en')}
                className={`px-3 py-1.5 rounded-lg font-medium text-[11px] transition-all cursor-pointer flex items-center gap-1.5 ${
                  resolvedLanguage === 'en' 
                    ? 'bg-[#FF4D00] text-white font-bold shadow-md' 
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                <Languages className="w-3.5 h-3.5" />
                <span>English Diagnostics</span>
              </button>
              <button
                id="btn-switch-ar-ai"
                onClick={() => setActiveTab('ar')}
                className={`px-3 py-1.5 rounded-lg font-medium text-[11px] transition-all cursor-pointer flex items-center gap-1.5 ${
                  resolvedLanguage === 'ar' 
                    ? 'bg-[#FF4D00] text-white font-bold shadow-md' 
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                <Languages className="w-3.5 h-3.5" />
                <span>التقرير العربي</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-1.5 px-1.5 py-0.5 text-neutral-400 font-mono text-[10px]">
              <Sparkles className="w-3.5 h-3.5 text-[#FF4D00]" />
              <span>AI COMPILATION MODE</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto" id="ai-formatter-actions-group">
          {/* Copy Report Button */}
          <button
            id="btn-copy-ai-output"
            onClick={handleCopy}
            title="Copy Report to Clipboard"
            className="p-2 bg-neutral-900 rounded-lg hover:bg-neutral-850 text-neutral-400 hover:text-white transition-all cursor-pointer border border-neutral-800 flex items-center gap-1.5 text-[10px]"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-teal-400" />
                <span className="text-teal-400 font-mono">Copied</span>
              </>
            ) : (
              <>
                <Clipboard className="w-3.5 h-3.5" />
                <span className="font-mono">Copy Code</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Structured Layout Cards (Bento style listing) */}
      <div className="space-y-3.5" id="ai-formatter-grid-blocks">
        {parsedBlocks.map((block, idx) => {
          const isBlockExpanded = expandedBlocks[block.title] !== false;
          const toggleBlock = () => {
            setExpandedBlocks(prev => ({
              ...prev,
              [block.title]: !isBlockExpanded
            }));
          };

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.05 }}
              className="bg-[#141414] border border-[#222222] hover:border-neutral-800 rounded-xl overflow-hidden transition-all duration-300 shadow-lg group/block"
              id={`ai-diagnostic-block-${idx}`}
            >
              {/* Header Cell of Block */}
              {block.title ? (
                <div 
                  onClick={toggleBlock}
                  className="flex items-center justify-between p-3.5 bg-neutral-950/80 border-b border-[#1f1f1f] cursor-pointer hover:bg-neutral-900 transition-all select-none"
                >
                  <div className="flex items-center gap-2.5">
                    {getBlockIcon(block.title, isRtl)}
                    <h4 className="text-white font-bold font-sans tracking-wide uppercase text-[11.5px] group-hover/block:text-[#FF4D00] transition-colors">
                      {block.title}
                    </h4>
                  </div>
                  <ChevronRight 
                    className={`w-4 h-4 text-neutral-500 transition-transform duration-300 ${isBlockExpanded ? 'rotate-90 text-white' : ''}`} 
                  />
                </div>
              ) : null}

              {/* Block Content list body */}
              <AnimatePresence initial={false}>
                {isBlockExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="p-4"
                  >
                    <div className="space-y-3">
                      {block.items.map((item, itemIdx) => {
                        if (item.type === 'li') {
                          return (
                            <div 
                              key={itemIdx} 
                              className={`flex items-start gap-2.5 leading-relaxed text-neutral-300 pl-1.5 group/item ${isRtl ? 'pr-1.5' : ''}`}
                            >
                              <div className="mt-1 flex items-center justify-center text-[#FF4D00] group-hover/item:scale-125 transition-transform shrink-0">
                                {isRtl ? (
                                  <CornerDownRight className="w-3.5 h-3.5 opacity-80" />
                                ) : (
                                  <CornerDownRight className="w-3.5 h-3.5 opacity-80" />
                                )}
                              </div>
                              <p className="text-neutral-300 text-[11px] leading-relaxed">
                                {formatBoldText(item.text)}
                              </p>
                            </div>
                          );
                        }

                        if (item.type === 'quote') {
                          return (
                            <div 
                              key={itemIdx} 
                              className={`p-3 bg-neutral-900/40 rounded-lg border-l-2 border-[#FF4D00] text-neutral-300 leading-relaxed italic ${isRtl ? 'border-l-0 border-r-2 text-right' : ''}`}
                            >
                              <p className="text-[11px]">{formatBoldText(item.text)}</p>
                            </div>
                          );
                        }

                        if (item.type === 'title') {
                          return (
                            <h5 
                              key={itemIdx} 
                              className="text-neutral-200 font-bold border-b border-neutral-900 pb-1 mt-3 mb-1.5 text-[10.5px] uppercase flex items-center gap-1.5"
                            >
                              <BookOpen className="w-3 h-3 text-[#FF4D00]" />
                              {item.text}
                            </h5>
                          );
                        }

                        // Regular paragraph paragraphs
                        return (
                          <p 
                            key={itemIdx} 
                            className="text-neutral-300 text-[11px] leading-relaxed relative"
                          >
                            {formatBoldText(item.text)}
                          </p>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Ambient watermark/footer log */}
      <div className="flex items-center justify-between text-[9px] text-neutral-600 font-mono px-1 py-1" id="ai-formatter-watermark">
        <span>GENAI MODEL: GEMINI-3.5-FLASH</span>
        <span className="flex items-center gap-1">
          <BrainCircuit className="w-3 h-3 text-[#FF4D00]" />
          PRECISION DIAGNOSTICS SYSTEM
        </span>
      </div>
    </div>
  );
};
