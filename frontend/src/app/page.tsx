"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useI18n } from "@/i18n/provider";
import { api, parseApiError } from "@/lib/api";
import { Send, AlertCircle, RefreshCw, User, Bot, Clock } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function HomePage() {
  const { lang, t } = useI18n();
  const [input, setInput] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isSlow, setIsSlow] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const slowTimerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, isSlow]);

  useEffect(() => {
    return () => {
      if (slowTimerRef.current) {
        clearTimeout(slowTimerRef.current);
      }
    };
  }, []);

  const sendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    if (!textToSend) setInput("");
    setLoading(true);
    setIsSlow(false);
    setError(null);

    // 8-second slow network indicator
    slowTimerRef.current = setTimeout(() => {
      setIsSlow(true);
    }, 8000);

    try {
      const { data, error: apiError } = await api.POST("/api/chat", {
        body: {
          message: text,
          lang: lang,
          history: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        },
      });

      if (apiError) {
        const parsed = parseApiError(apiError);
        setError(parsed.message);
      } else if (data) {
        setMessages([...newMessages, { role: "assistant", content: data.reply }]);
      }
    } catch (err: unknown) {
      const parsed = parseApiError(err);
      setError(parsed.message);
    } finally {
      if (slowTimerRef.current) {
        clearTimeout(slowTimerRef.current);
      }
      setLoading(false);
      setIsSlow(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col min-h-[calc(100vh-160px)]">
      {/* 1. Hero: One plain sentence + main chat input action */}
      <section className="text-center mb-6">
        <h1
          className="text-2xl sm:text-3xl font-bold mb-2 tracking-tight"
          style={{ color: "var(--color-brown-900)" }}
        >
          {t("chat.hero")}
        </h1>
      </section>

      {/* 2. Chat UI container */}
      <div
        className="flex-1 rounded-xl p-4 sm:p-6 mb-4 flex flex-col justify-between"
        style={{
          backgroundColor: "var(--color-cream-dark)",
          border: "1px solid var(--color-brown-300)",
        }}
      >
        <div className="space-y-4 overflow-y-auto max-h-[500px] pr-1">
          {/* Empty state: helper text with 3 example questions */}
          {messages.length === 0 && !loading && !error && (
            <div className="text-center py-10 px-2">
              <div
                className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                style={{
                  backgroundColor: "var(--color-green-100)",
                  color: "var(--color-green-700)",
                }}
              >
                <Bot size={28} />
              </div>
              <h2
                className="text-lg font-bold mb-2"
                style={{ color: "var(--color-brown-900)" }}
              >
                {t("chat.empty_title")}
              </h2>
              <p className="text-sm text-stone-600 mb-6 max-w-lg mx-auto">
                {t("chat.empty_subtitle")}
              </p>

              <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2 max-w-2xl mx-auto">
                {[t("chat.example_1"), t("chat.example_2"), t("chat.example_3")].map(
                  (exampleQ, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => sendMessage(exampleQ)}
                      className="text-sm px-4 py-2.5 rounded text-left transition-colors font-medium cursor-pointer"
                      style={{
                        backgroundColor: "var(--color-cream)",
                        color: "var(--color-brown-900)",
                        border: "1px solid var(--color-yellow-500)",
                        minHeight: "44px",
                      }}
                    >
                      {exampleQ}
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* Messages list */}
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <div
                  className="w-9 h-9 rounded flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: "var(--color-green-700)",
                    color: "var(--color-white)",
                  }}
                >
                  <Bot size={20} />
                </div>
              )}
              <div
                className="max-w-[85%] sm:max-w-[78%] rounded-lg p-3 text-base"
                style={{
                  backgroundColor:
                    msg.role === "user"
                      ? "var(--color-green-700)"
                      : "var(--color-cream)",
                  color:
                    msg.role === "user"
                      ? "var(--color-white)"
                      : "var(--color-brown-900)",
                  border:
                    msg.role === "user"
                      ? "1px solid var(--color-green-900)"
                      : "1px solid var(--color-brown-300)",
                }}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                {/* 4. Visible note under AI answers */}
                {msg.role === "assistant" && (
                  <div className="text-xs text-stone-600 mt-2.5 pt-2 border-t border-stone-300">
                    <p>{t("chat.disclaimer")}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Link href="/privacy" className="underline hover:text-stone-900">
                        {t("footer.privacy")}
                      </Link>
                      <span>•</span>
                      <Link href="/terms" className="underline hover:text-stone-900">
                        {t("footer.terms")}
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              {msg.role === "user" && (
                <div
                  className="w-9 h-9 rounded flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: "var(--color-brown-700)",
                    color: "var(--color-white)",
                  }}
                >
                  <User size={20} />
                </div>
              )}
            </div>
          ))}

          {/* Loading state & slow network indicator */}
          {loading && (
            <div className="flex flex-col items-start gap-2">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: "var(--color-green-700)",
                    color: "var(--color-white)",
                  }}
                >
                  <Bot size={20} />
                </div>
                <div
                  className="rounded-lg p-3 text-base flex items-center gap-2"
                  style={{
                    backgroundColor: "var(--color-cream)",
                    color: "var(--color-brown-900)",
                    border: "1px solid var(--color-brown-300)",
                  }}
                >
                  <RefreshCw size={18} className="animate-spin text-stone-700" />
                  <span>{t("common.loading")}</span>
                </div>
              </div>

              {/* 3. Slow network state after 8 seconds */}
              {isSlow && (
                <div
                  className="ml-12 p-2.5 rounded text-xs sm:text-sm flex items-center gap-2"
                  style={{
                    backgroundColor: "#fef3c7",
                    border: "1px solid #d97706",
                    color: "#92400e",
                  }}
                >
                  <Clock size={16} className="shrink-0" />
                  <span>{t("chat.still_working")}</span>
                </div>
              )}
            </div>
          )}

          {/* Error state */}
          {error && (
            <div
              className="p-3.5 rounded-lg flex items-center justify-between gap-3"
              style={{
                backgroundColor: "#fdf2f2",
                border: "1px solid var(--color-red-600)",
                color: "var(--color-red-600)",
              }}
            >
              <div className="flex items-center gap-2">
                <AlertCircle size={20} className="shrink-0" />
                <span className="text-sm sm:text-base">{error}</span>
              </div>
              <button
                type="button"
                onClick={() => sendMessage()}
                className="px-3 py-1.5 rounded text-sm font-semibold flex items-center gap-1.5 cursor-pointer shrink-0"
                style={{
                  backgroundColor: "var(--color-red-600)",
                  color: "var(--color-white)",
                  minHeight: "44px",
                }}
              >
                <RefreshCw size={16} />
                <span>{t("common.retry")}</span>
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Action: Send input box */}
        <div className="mt-4 pt-3 border-t border-stone-300 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("chat.placeholder")}
            disabled={loading}
            aria-label={t("chat.placeholder")}
            className="flex-1 px-3.5 py-2.5 rounded text-base outline-none focus:ring-2 focus:ring-green-800"
            style={{
              backgroundColor: "var(--color-white)",
              color: "var(--color-brown-900)",
              border: "1px solid var(--color-brown-300)",
              minHeight: "44px",
            }}
          />
          <button
            type="button"
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="px-5 py-2.5 rounded font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            style={{
              backgroundColor: "var(--color-green-700)",
              color: "var(--color-white)",
              border: "1px solid var(--color-yellow-500)",
              minHeight: "44px",
            }}
          >
            <Send size={18} />
            <span>{t("chat.send")}</span>
          </button>
        </div>

        {/* Short links to legal pages near disclaimer */}
        <div className="mt-2 text-center text-xs text-stone-600 flex items-center justify-center gap-3">
          <Link href="/privacy" className="underline hover:text-stone-900 min-h-[44px] flex items-center">
            {t("footer.privacy")}
          </Link>
          <span>•</span>
          <Link href="/terms" className="underline hover:text-stone-900 min-h-[44px] flex items-center">
            {t("footer.terms")}
          </Link>
        </div>
      </div>
    </div>
  );
}
