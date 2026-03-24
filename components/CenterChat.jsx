"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Mail,
  Users,
  Calendar,
  FileText,
  Briefcase,
  Loader2,
  ChevronDown,
} from "lucide-react";

const transport = new DefaultChatTransport({ api: "/api/center" });

const QUICK_ACTIONS = [
  { icon: Users, label: "Subscriber stats", prompt: "Show me our subscriber stats — how many members, breakdown by major and subgroup." },
  { icon: Calendar, label: "Upcoming events", prompt: "What events do we have coming up in the next 2 weeks?" },
  { icon: Mail, label: "Draft newsletter", prompt: "Help me draft a newsletter email for our subscribers about upcoming events and AI news." },
  { icon: FileText, label: "AI news", prompt: "Fetch the latest AI in business news for our social media." },
  { icon: Briefcase, label: "Recent jobs", prompt: "Show me the most recent job postings on our board." },
];

// Tool display name mapping
const TOOL_LABELS = {
  listAudiences: "Listing audiences",
  countSubscribers: "Counting subscribers",
  sendEmailCampaign: "Sending email",
  querySubscribers: "Searching subscribers",
  getSubscriberStats: "Pulling stats",
  getUpcomingEvents: "Checking calendar",
  createCalendarEvent: "Creating event",
  fetchAiNews: "Fetching AI news",
  queryJobs: "Searching jobs",
};

function ToolPart({ part }) {
  // v6: tool parts have state: 'input-streaming' | 'input-available' | 'output-available'
  const toolName = part.type.replace("tool-", "");
  const isDone = part.state === "output-available";
  return (
    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500">
      {isDone ? (
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-100 text-green-600 text-[10px]">
          ✓
        </span>
      ) : (
        <Loader2 size={14} className="animate-spin text-[color:var(--byu-blue)]" />
      )}
      <span className="font-mono">
        {TOOL_LABELS[toolName] || toolName}
      </span>
      {!isDone && (
        <span className="animate-pulse text-gray-400">running...</span>
      )}
    </div>
  );
}

function MarkdownText({ text }) {
  if (!text) return null;
  // Split into blocks and render safely without dangerouslySetInnerHTML
  const lines = text.split("\n");
  const elements = [];
  let listItems = [];

  function flushList() {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="ml-4 list-disc space-y-0.5 text-sm">
          {listItems.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Headers
    if (line.startsWith("### ")) {
      flushList();
      elements.push(<h3 key={i} className="mt-3 mb-1 text-base font-bold text-[color:var(--byu-blue)]">{renderInline(line.slice(4))}</h3>);
    } else if (line.startsWith("## ")) {
      flushList();
      elements.push(<h2 key={i} className="mt-4 mb-1 text-lg font-bold text-[color:var(--byu-blue)]">{renderInline(line.slice(3))}</h2>);
    } else if (line.startsWith("# ")) {
      flushList();
      elements.push(<h1 key={i} className="mt-4 mb-2 text-xl font-bold text-[color:var(--byu-blue)]">{renderInline(line.slice(2))}</h1>);
    }
    // List items
    else if (/^[-•*] /.test(line)) {
      listItems.push(line.replace(/^[-•*] /, ""));
    }
    // Table separator — skip
    else if (/^\|[\s-:|]+\|$/.test(line)) {
      continue;
    }
    // Table rows
    else if (line.startsWith("|") && line.endsWith("|")) {
      flushList();
      const cells = line.split("|").filter(Boolean).map((c) => c.trim());
      elements.push(
        <div key={i} className="flex gap-px">
          {cells.map((cell, ci) => (
            <span key={ci} className="flex-1 border border-gray-200 bg-gray-50 px-2 py-1 text-xs">
              {renderInline(cell)}
            </span>
          ))}
        </div>
      );
    }
    // Empty line
    else if (line.trim() === "") {
      flushList();
    }
    // Paragraph text
    else {
      flushList();
      elements.push(<p key={i} className="text-sm leading-relaxed">{renderInline(line)}</p>);
    }
  }
  flushList();

  return <div className="space-y-1.5">{elements}</div>;
}

function renderInline(text) {
  if (!text) return null;
  // Split on bold, italic, code, and link patterns
  const parts = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // Inline code
    const codeMatch = remaining.match(/`([^`]+)`/);
    // Link
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);

    // Find the earliest match
    const matches = [
      boldMatch && { type: "bold", index: boldMatch.index, match: boldMatch },
      codeMatch && { type: "code", index: codeMatch.index, match: codeMatch },
      linkMatch && { type: "link", index: linkMatch.index, match: linkMatch },
    ].filter(Boolean).sort((a, b) => a.index - b.index);

    if (matches.length === 0) {
      parts.push(remaining);
      break;
    }

    const first = matches[0];
    // Text before match
    if (first.index > 0) {
      parts.push(remaining.slice(0, first.index));
    }

    if (first.type === "bold") {
      parts.push(<strong key={key++}>{first.match[1]}</strong>);
      remaining = remaining.slice(first.index + first.match[0].length);
    } else if (first.type === "code") {
      parts.push(
        <code key={key++} className="rounded bg-gray-100 px-1 py-0.5 text-xs font-mono">
          {first.match[1]}
        </code>
      );
      remaining = remaining.slice(first.index + first.match[0].length);
    } else if (first.type === "link") {
      parts.push(
        <a key={key++} href={first.match[2]} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
          {first.match[1]}
        </a>
      );
      remaining = remaining.slice(first.index + first.match[0].length);
    }
  }

  return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : parts;
}

function MessageContent({ message }) {
  const parts = message.parts || [];
  return (
    <div className="space-y-2">
      {parts.map((part, i) => {
        if (part.type === "text") {
          return <MarkdownText key={i} text={part.text} />;
        }
        // v6: tool parts are named tool-<toolName>
        if (part.type.startsWith("tool-")) {
          return <ToolPart key={i} part={part} />;
        }
        return null;
      })}
    </div>
  );
}

export default function CenterChat() {
  const { messages, sendMessage, status, stop } = useChat({ transport });
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const isLoading = status === "streaming" || status === "submitted";

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input.trim() });
    setInput("");
  }

  function handleQuickAction(prompt) {
    if (isLoading) return;
    sendMessage({ text: prompt });
  }

  return (
    <div className="flex h-[calc(100vh-2rem)] flex-col rounded-xl border border-gray-200 bg-white shadow-sm md:h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3 sm:px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--byu-blue)] text-white">
          <Bot size={20} />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-900">
            ABS Website Center
          </h2>
          <p className="text-xs text-gray-500">
            AI command center — email, events, members, content, jobs
          </p>
        </div>
        {isLoading && (
          <div className="ml-auto flex items-center gap-1.5 text-xs text-[color:var(--byu-blue)]">
            <Loader2 size={14} className="animate-spin" />
            Thinking...
          </div>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-6">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--byu-blue)]/10 text-[color:var(--byu-blue)]">
                <Bot size={28} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Welcome to the ABS Center
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Your AI-powered command center for managing aiinbusinesssociety.org
              </p>
            </div>

            {/* Quick actions */}
            <div className="grid w-full max-w-lg gap-2 sm:grid-cols-2">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleQuickAction(action.prompt)}
                  className="flex items-center gap-2.5 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-left text-sm text-gray-700 shadow-sm transition-all hover:border-[color:var(--byu-blue)] hover:bg-[color:var(--byu-blue)]/5 hover:text-[color:var(--byu-blue)]"
                >
                  <action.icon size={16} className="shrink-0 text-gray-400" />
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[color:var(--byu-blue)]/10 text-[color:var(--byu-blue)]">
                    <Bot size={16} />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-xl px-4 py-2.5 ${
                    message.role === "user"
                      ? "bg-[color:var(--byu-blue)] text-white"
                      : "border border-gray-200 bg-white text-gray-800"
                  }`}
                >
                  {message.role === "user" ? (
                    <p className="text-sm whitespace-pre-wrap">
                      {message.parts
                        ?.filter((p) => p.type === "text")
                        .map((p) => p.text)
                        .join("") || message.content}
                    </p>
                  ) : (
                    <MessageContent message={message} />
                  )}
                </div>
                {message.role === "user" && (
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                    <User size={16} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 px-4 py-3 sm:px-6">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the Center anything..."
            disabled={isLoading}
            className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[color:var(--byu-blue)] focus:outline-none focus:ring-1 focus:ring-[color:var(--byu-blue)] disabled:opacity-50"
          />
          {isLoading ? (
            <button
              type="button"
              onClick={stop}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50"
            >
              <div className="h-3 w-3 rounded-sm bg-gray-500" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-[color:var(--byu-blue)] text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <Send size={16} />
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
