import * as React from "react";

import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type IssueType =
  | "seo-issues"
  | "missing-title"
  | "missing-meta-description"
  | "missing-h1"
  | "slow-performance";

type SessionSearchRead = {
  session_id: number;
  query: string;
  issues: IssueType[];
  max_results_requested: number;
  checked_websites_count: number;
  last_search_cursor: string | null;
  is_completed: boolean;
};

type SessionSearchFormState = {
  query: string;
  issues: IssueType[];
  max_results: number;
};

type SessionSearchFormErrors = {
  query?: string;
  issues?: string;
  max_results?: string;
};

type SessionResult = {
  id: number;
  created_at: string;
  session_id: number;
  url: string;
  domain: string;
  page_count: number;
  tier: number;
  issues_detected: IssueType[];
  lighthouse_json: string | null;
  contact_email: string | null;
  status: string;
};

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "/api";

const ALL_ISSUES: { value: IssueType; label: string }[] = [
  { value: "seo-issues", label: "SEO issues" },
  { value: "missing-title", label: "Missing <title>" },
  { value: "missing-meta-description", label: "Missing meta description" },
  { value: "missing-h1", label: "Missing H1" },
  { value: "slow-performance", label: "Slow performance" },
];

export default function Page() {
  const { selectedSessionId } = useSidebar();
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<SessionSearchFormState | null>(null);
  const [formErrors, setFormErrors] = React.useState<SessionSearchFormErrors>(
    {},
  );
  const [showResults, setShowResults] = React.useState(false);
  const [results, setResults] = React.useState<SessionResult[]>([]);
  const [resultsLoading, setResultsLoading] = React.useState(false);
  const [resultsError, setResultsError] = React.useState<string | null>(null);

  const loadResults = React.useCallback(async (currentSessionId: number) => {
    try {
      setResultsLoading(true);
      setResultsError(null);
      const response = await fetch(
        `${BACKEND_URL}/sessions/${currentSessionId}/results`,
      );
      if (!response.ok) {
        throw new Error("Failed to load results");
      }
      const data = (await response.json()) as SessionResult[];
      setResults(data);
    } catch (err) {
      console.error(err);
      setResultsError("Could not load results");
    } finally {
      setResultsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (selectedSessionId === null) {
      setForm(null);
      setFormErrors({});
      setShowResults(false);
      setResults([]);
      return;
    }

    let cancelled = false;

    async function load(currentSessionId: number) {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${BACKEND_URL}/sessions/${currentSessionId}/search`,
        );

        if (response.status === 404) {
          if (!cancelled) {
            setForm({
              query: "",
              issues: [],
              max_results: 0,
            });
            setFormErrors({});
            setShowResults(false);
            setResults([]);
          }
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to load session search");
        }

        const data = (await response.json()) as SessionSearchRead;

        if (!cancelled) {
          setForm({
            query: data.query,
            issues: data.issues,
            max_results: data.max_results_requested,
          });
          setFormErrors({});
          setShowResults(true);
          void loadResults(currentSessionId);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError("Could not load session");
          setForm(null);
          setShowResults(false);
          setResults([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load(selectedSessionId);

    return () => {
      cancelled = true;
    };
  }, [selectedSessionId, loadResults]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedSessionId === null || form === null) {
      return;
    }

    const nextErrors: SessionSearchFormErrors = {};

    if (!form.query.trim()) {
      nextErrors.query = "Please enter a search query.";
    }
    if (form.max_results <= 0) {
      nextErrors.max_results = "Max results must be greater than 0.";
    }
    if (form.issues.length === 0) {
      nextErrors.issues = "Select at least one issue to check.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      return;
    }

    setFormErrors({});

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(
        `${BACKEND_URL}/sessions/${selectedSessionId}/search`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: form.query,
            issues: form.issues,
            max_results: form.max_results,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to save session");
      }

      const data = (await response.json()) as SessionSearchRead;
      setForm({
        query: data.query,
        issues: data.issues,
        max_results: data.max_results_requested,
      });
      setShowResults(true);
      await loadResults(selectedSessionId);
    } catch (err) {
      console.error(err);
      setError("Could not save session");
    } finally {
      setSaving(false);
    }
  }

  function toggleIssue(issue: IssueType) {
    if (!form) return;
    const isSelected = form.issues.includes(issue);
    const nextIssues = isSelected
      ? form.issues.filter((value) => value !== issue)
      : [...form.issues, issue];
    setForm({
      ...form,
      issues: nextIssues,
    });
    setFormErrors((current) => ({
      ...current,
      issues: undefined,
    }));
  }

  if (selectedSessionId === null) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Select a session in the sidebar to get started.
      </div>
    );
  }

  if (loading || form === null) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading session…
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 px-4">
      <header className="flex items-center justify-between">
        <h1 className="text-base font-semibold sm:text-lg">
          Session {selectedSessionId}
        </h1>
      </header>

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <FieldGroup className="gap-3 md:flex-row md:items-end">
          <Field
            className="flex-1"
            data-invalid={formErrors.query ? "true" : undefined}
          >
            <FieldLabel htmlFor="query">Query</FieldLabel>
            <Input
              id="query"
              value={form.query}
              onChange={(event) => {
                setForm({
                  ...form,
                  query: event.target.value,
                });
                setFormErrors((current) => ({
                  ...current,
                  query: undefined,
                }));
              }}
              aria-invalid={formErrors.query ? "true" : "false"}
              placeholder="Search query"
            />
            {formErrors.query && <FieldError>{formErrors.query}</FieldError>}
          </Field>

          <Field
            className="w-32"
            data-invalid={formErrors.max_results ? "true" : undefined}
          >
            <FieldLabel htmlFor="max-results">Max results</FieldLabel>
            <Input
              id="max-results"
              type="number"
              min={0}
              value={form.max_results}
              onChange={(event) => {
                setForm({
                  ...form,
                  max_results: Number(event.target.value) || 0,
                });
                setFormErrors((current) => ({
                  ...current,
                  max_results: undefined,
                }));
              }}
              aria-invalid={formErrors.max_results ? "true" : "false"}
            />
            {formErrors.max_results && (
              <FieldError>{formErrors.max_results}</FieldError>
            )}
          </Field>

          <Field
            className="w-56"
            data-invalid={formErrors.issues ? "true" : undefined}
          >
            <FieldLabel>Issues</FieldLabel>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between"
                  aria-invalid={formErrors.issues ? "true" : "false"}
                >
                  {form.issues.length > 0
                    ? `${form.issues.length} selected`
                    : "Select issues"}
                  <span className="ml-2 text-xs text-muted-foreground">▼</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {ALL_ISSUES.map((issue) => (
                  <DropdownMenuCheckboxItem
                    key={issue.value}
                    checked={form.issues.includes(issue.value)}
                    onCheckedChange={() => toggleIssue(issue.value)}
                  >
                    {issue.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {formErrors.issues && <FieldError>{formErrors.issues}</FieldError>}
          </Field>

          <Field orientation="horizontal" className="pt-2 md:pt-0">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Apply"}
            </Button>
          </Field>
        </FieldGroup>
      </form>

      {showResults && (
        <div className="mt-2 flex-1 overflow-auto">
          {resultsLoading ? (
            <div className="text-xs text-muted-foreground">
              Loading results…
            </div>
          ) : resultsError ? (
            <div className="text-xs text-destructive">{resultsError}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>URL</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Pages</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Issues</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-xs text-muted-foreground"
                    >
                      No results yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  results.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell className="max-w-[260px] truncate">
                        {result.url}
                      </TableCell>
                      <TableCell>{result.domain}</TableCell>
                      <TableCell>{result.page_count}</TableCell>
                      <TableCell>{result.tier}</TableCell>
                      <TableCell className="max-w-[260px] truncate">
                        {result.issues_detected.join(", ")}
                      </TableCell>
                      <TableCell className="capitalize">
                        {result.status}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </div>
  );
}
