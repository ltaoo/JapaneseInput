const API_BASE = (import.meta.env.VITE_ANALYSIS_API_BASE || "http://localhost:8280").replace(/\/$/, "");

export interface Segment {
  text: string;
  kana: string;
  start: number;
  end: number;
  meaning: string;
  desc: string;
  type: string;
  original: string;
  conjugation: string;
}
export interface AnalysisResponse {
  texts: Segment[];
  explain: string;
  tense: string;
  aspect: string;
  pattern: string;
  conclusion: string;
}
export interface Example { japanese: string; chinese: string; }
export interface ExamplesResponse { examples: Example[]; }
export interface LLMConfig { provider: string; model: string; models: string[]; }

async function request<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, body === undefined ? undefined : {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error((await response.text()) || `HTTP ${response.status}`);
  return response.json();
}
export async function analyze_paragraph(text: string, model?: string, provider?: string): Promise<AnalysisResponse> {
  const result = await request<AnalysisResponse>("/api/analysis", { text, model, provider });
  if (!Array.isArray(result.texts) || !result.texts.length || typeof result.explain !== "string") throw new Error("分析服务返回的数据格式无效");
  if (result.texts.some((segment) => segment.type === "错误")) throw new Error(result.explain);
  return result;
}
export async function get_examples(text: string, pattern: string): Promise<ExamplesResponse> {
  const result = await request<ExamplesResponse>("/api/examples", { text, pattern });
  if (!Array.isArray(result.examples)) throw new Error("例句服务返回的数据格式无效");
  return result;
}
export function get_llm_config(): Promise<LLMConfig> { return request("/api/config"); }
export function set_llm_config(provider: string, model: string): Promise<{ status: string; provider: string; model: string }> {
  return request("/api/config", { provider, model });
}
