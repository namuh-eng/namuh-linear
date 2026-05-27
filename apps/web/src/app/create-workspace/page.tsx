"use client";

import { ExponentialMark } from "@/components/exponential-mark";
import {
  apiErrorMessage,
  createBrowserApiClient,
} from "@/lib/browser-api-client";
import {
  MAX_WORKSPACE_NAME_LENGTH,
  MAX_WORKSPACE_SLUG_LENGTH,
  sanitizeWorkspaceSlug,
} from "@/lib/workspace-creation";
import { workspaceUrlHost } from "@/lib/workspace-url";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const apiClient = createBrowserApiClient();
const URL_HOST = workspaceUrlHost();

export default function CreateWorkspacePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [urlSlug, setUrlSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  function handleNameChange(value: string) {
    setName(value);
    setError("");
    setUrlSlug(sanitizeWorkspaceSlug(value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !urlSlug.trim()) return;

    setLoading(true);
    setError("");

    try {
      const { data, error } = await apiClient.POST("/workspaces", {
        body: { name: name.trim(), urlSlug: urlSlug.trim() },
      });

      if (error || !data) {
        if (mountedRef.current) {
          setError(apiErrorMessage(error, "Failed to create workspace"));
        }
        return;
      }

      if (!mountedRef.current) {
        return;
      }

      // Redirect to invite team members step
      const inviteParams = new URLSearchParams({
        workspaceId: data.workspace.id,
        teamKey: data.team.key,
      });
      router.push(`/onboarding/invite?${inviteParams.toString()}`);
    } catch {
      if (mountedRef.current) {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#090909]">
      <div className="w-full max-w-[400px] px-4">
        {/* Logo */}
        <div className="mb-10 flex flex-col items-center">
          <ExponentialMark size={48} className="mb-5 text-white" />

          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-white">
            Create your workspace
          </h1>
          <p className="mt-2 text-sm text-[#6b6f76]">
            Workspaces are shared environments where teams can work on issues,
            cycles, and projects.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Workspace Name */}
          <div>
            <label
              htmlFor="workspace-name"
              className="mb-1.5 block text-[13px] font-medium text-[#b0b5c0]"
            >
              Workspace name
            </label>
            <input
              id="workspace-name"
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="My Workspace"
              required
              maxLength={MAX_WORKSPACE_NAME_LENGTH}
              // biome-ignore lint/a11y/noAutofocus: workspace name should be focused on page load
              autoFocus
              className="w-full rounded-md border border-[#26262a] bg-[#18181b] px-3.5 py-[10px] text-[13px] text-white placeholder-[#555] outline-none transition-colors focus:border-[#5E6AD2]"
            />
          </div>

          {/* URL Slug */}
          <div>
            <label
              htmlFor="workspace-url"
              className="mb-1.5 block text-[13px] font-medium text-[#b0b5c0]"
            >
              Workspace URL
            </label>
            <div className="flex items-center rounded-md border border-[#26262a] bg-[#18181b] transition-colors focus-within:border-[#5E6AD2]">
              <span className="pl-3.5 text-[13px] text-[#555]">
                {URL_HOST}/
              </span>
              <input
                id="workspace-url"
                type="text"
                value={urlSlug}
                onChange={(e) => {
                  setError("");
                  setUrlSlug(sanitizeWorkspaceSlug(e.target.value));
                }}
                placeholder="my-workspace"
                required
                maxLength={MAX_WORKSPACE_SLUG_LENGTH}
                className="w-full bg-transparent px-1 py-[10px] text-[13px] text-white placeholder-[#555] outline-none"
              />
            </div>
          </div>

          {error && <p className="text-center text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading || !name.trim() || !urlSlug.trim()}
            className="w-full rounded-md bg-[#5E6AD2] px-4 py-[10px] text-[13px] font-medium text-white transition-colors hover:bg-[#4F5ABF] disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create workspace"}
          </button>
        </form>
      </div>
    </div>
  );
}
