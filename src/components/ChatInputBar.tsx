import React, { useRef, useState, useEffect } from 'react';
import { Paperclip, ImagePlus, ArrowUp, Loader2 } from 'lucide-react';

interface ChatInputBarProps {
  onSendMessage: (text: string) => Promise<void>;
  onTriggerFileUpload: () => void;
  onTriggerImageUpload: () => void;
  isLoading: boolean;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  onSendMessage,
  onTriggerFileUpload,
  onTriggerImageUpload,
  isLoading
}) => {
  const [inputText, setInputText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputText]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;
    const msg = inputText;
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    await onSendMessage(msg);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 mt-6 mb-8">
      {/* ChatGPT-style Floating Container matching screenshot */}
      <div className="relative bg-white rounded-3xl border border-slate-200/90 shadow-xs focus-within:border-slate-300 focus-within:ring-2 focus-within:ring-[#007A78]/10 p-4 transition-all">
        {/* Top Textarea */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe the patient or ask SepsisSense..."
          className="w-full bg-transparent resize-none border-0 p-0 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0 leading-relaxed font-sans"
        />

        {/* Bottom Actions Row */}
        <div className="flex items-center justify-between mt-3 pt-1">
          {/* Left upload icons */}
          <div className="flex items-center gap-2 text-slate-400">
            <button
              type="button"
              onClick={onTriggerFileUpload}
              className="p-1.5 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="Upload Hospital Records (PDF, CSV, TXT)"
              aria-label="Upload File"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onTriggerImageUpload}
              className="p-1.5 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="Upload Medical Image / Scan"
              aria-label="Upload Image"
            >
              <ImagePlus className="w-5 h-5" />
            </button>
          </div>

          {/* Right circular teal send button */}
          <button
            type="button"
            disabled={isLoading || !inputText.trim()}
            onClick={handleSend}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              inputText.trim() && !isLoading
                ? 'bg-[#56A8A4] text-white hover:bg-[#439692] shadow-sm hover:scale-105 active:scale-95'
                : 'bg-[#67B5B1]/50 text-white cursor-not-allowed'
            }`}
            title="Send or ask SepsisSense"
            aria-label="Send"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <ArrowUp className="w-4 h-4 stroke-[2.8]" />
            )}
          </button>
        </div>
      </div>

      {/* Centered Caption */}
      <p className="text-center text-xs text-slate-400 mt-3 font-normal">
        SepsisSense is a decision-support tool and does not replace clinical judgment.
      </p>
    </div>
  );
};
