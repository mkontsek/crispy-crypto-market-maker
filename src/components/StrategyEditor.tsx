"use client";

import dynamic from "next/dynamic";
import { useBotStore } from "@/stores/botStore";
import { Button } from "@/components/ui/button";
import { EXAMPLE_STRATEGY_CODE } from "@/lib/mockData";
import { Play, Square, RotateCcw } from "lucide-react";
import { useState, useCallback } from "react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-slate-950">
      <span className="font-mono text-xs text-slate-500">
        Loading editor...
      </span>
    </div>
  ),
});

export function StrategyEditor() {
  const { editorStatus, setEditorStatus } = useBotStore();
  const [code, setCode] = useState(EXAMPLE_STRATEGY_CODE);

  const isRunning = editorStatus === "running";

  const handleCodeChange = useCallback((v: string | undefined) => {
    setCode(v ?? "");
  }, []);

  function handleRunStop() {
    setEditorStatus(isRunning ? "stopped" : "running");
  }

  function handleReset() {
    setCode(EXAMPLE_STRATEGY_CODE);
    setEditorStatus("idle");
  }

  return (
    <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-200">
            Custom Strategy Editor
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-[10px] font-medium ${
              isRunning
                ? "bg-neon-green/10 text-neon-green"
                : editorStatus === "stopped"
                  ? "bg-neon-red/10 text-neon-red"
                  : "bg-slate-800 text-slate-500"
            }`}
          >
            <span
              className={`inline-block size-1.5 rounded-full ${
                isRunning
                  ? "animate-pulse bg-neon-green"
                  : editorStatus === "stopped"
                    ? "bg-neon-red"
                    : "bg-slate-600"
              }`}
            />
            {isRunning ? "RUNNING" : editorStatus === "stopped" ? "STOPPED" : "IDLE"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 border-slate-700 text-slate-400 hover:text-slate-200"
            onClick={handleReset}
          >
            <RotateCcw className="size-3" />
            Reset
          </Button>
          <Button
            size="sm"
            className={`h-7 font-mono text-xs font-bold ${
              isRunning
                ? "border-neon-red/50 bg-neon-red/10 text-neon-red hover:bg-neon-red/20"
                : "border-neon-green/50 bg-neon-green/10 text-neon-green hover:bg-neon-green/20"
            }`}
            variant="outline"
            onClick={handleRunStop}
          >
            {isRunning ? (
              <>
                <Square className="size-3" /> Stop
              </>
            ) : (
              <>
                <Play className="size-3" /> Run
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="h-72">
        <MonacoEditor
          height="100%"
          language="typescript"
          theme="vs-dark"
          value={code}
          onChange={handleCodeChange}
          options={{
            fontSize: 12,
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: "on",
            tabSize: 2,
            wordWrap: "on",
            padding: { top: 12, bottom: 12 },
            automaticLayout: true,
            bracketPairColorization: { enabled: true },
          }}
        />
      </div>
    </div>
  );
}
