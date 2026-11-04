package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
)

type AnalysisRequest struct {
	Text     string `json:"text"`
	Model    string `json:"model"`
	Provider string `json:"provider"`
}

type Segment struct {
	Text        string `json:"text"`
	Kana        string `json:"kana"`
	Start       int    `json:"start"`
	End         int    `json:"end"`
	Meaning     string `json:"meaning"`
	Desc        string `json:"desc"`
	Type        string `json:"type"`
	Original    string `json:"original"`
	Conjugation string `json:"conjugation"`
}

type AnalysisResponse struct {
	Texts      []Segment `json:"texts"`
	Explain    string    `json:"explain"`
	Tense      string    `json:"tense"`
	Aspect     string    `json:"aspect"`
	Pattern    string    `json:"pattern"`
	Conclusion string    `json:"conclusion"`
}

type Config struct {
	Provider string
	Model    string
	APIKey   string
	BaseURL  string
}

var config_mutex sync.RWMutex

var default_config = Config{
	Provider: get_env("LLM_PROVIDER", "deepseek"),
	Model:    get_env("LLM_MODEL", "deepseek-v4-pro"),
	APIKey:   get_env("LLM_API_KEY", ""),
	BaseURL:  get_env("LLM_BASE_URL", ""),
}

func get_env(key, default_value string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return default_value
}

var providers = map[string]func(text string, cfg Config) AnalysisResponse{
	"openai":    call_open_ai,
	"anthropic": call_anthropic,
	"google":    call_google,
	"azure":     call_azure,
	"deepseek":  call_deepseek,
	"custom":    call_custom,
}

func cors_middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Max-Age", "3600")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func config_handler(w http.ResponseWriter, r *http.Request) {
	config_mutex.Lock()
	defer config_mutex.Unlock()
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	if r.Method == http.MethodGet {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"provider": default_config.Provider,
			"model":    default_config.Model,
			"models":   get_available_models(default_config.Provider),
		})
		return
	}

	if r.Method == http.MethodPost {
		var req struct {
			Provider string `json:"provider"`
			Model    string `json:"model"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request", http.StatusBadRequest)
			return
		}
		if req.Provider != "" {
			default_config.Provider = req.Provider
		}
		if req.Model != "" {
			default_config.Model = req.Model
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"status":   "ok",
			"provider": default_config.Provider,
			"model":    default_config.Model,
		})
		return
	}

	http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
}

func get_available_models(provider string) []string {
	switch provider {
	case "openai":
		return []string{"gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"}
	case "anthropic":
		return []string{"claude-3-5-sonnet-20241022", "claude-3-opus-20240229", "claude-3-haiku-20240307"}
	case "google":
		return []string{"gemini-1.5-pro", "gemini-1.5-flash", "gemini-1.0-pro"}
	case "azure":
		return []string{"gpt-4", "gpt-35-turbo"}
	case "deepseek":
		return []string{"deepseek-v4-pro", "deepseek-v4-flash"}
	default:
		return []string{}
	}
}

func analysis_handler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req AnalysisRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if strings.TrimSpace(req.Text) == "" {
		http.Error(w, "Text is required", http.StatusBadRequest)
		return
	}

	config_mutex.RLock()
	cfg := default_config
	config_mutex.RUnlock()
	if req.Provider != "" {
		cfg.Provider = req.Provider
	}
	if req.Model != "" {
		cfg.Model = req.Model
	}

	result := call_llm(req.Text, cfg)
	if len(result.Texts) == 0 || result.Texts[0].Type == "错误" {
		http.Error(w, "分析失败，请检查服务端 API 配置", http.StatusBadGateway)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(result); err != nil {
		log.Printf("Error encoding response: %v", err)
	}
}

func call_llm(text string, cfg Config) AnalysisResponse {
	if cfg.APIKey == "" {
		api_key := os.Getenv("OPENAI_API_KEY")
		if api_key == "" {
			return fallback_analysis(text)
		}
		cfg.APIKey = api_key
	}

	handler, ok := providers[cfg.Provider]
	if !ok {
		log.Printf("Unknown provider: %s, falling back to openai", cfg.Provider)
		handler = call_open_ai
	}

	return handler(text, cfg)
}

var system_prompt = `你是一个日语分析工具。请分析用户输入的日语文本，进行分词并解释每个词的含义，同时分析句式结构、时态、体态，并标注动词变形。

请按以下 JSON 格式返回结果，不要包含任何其他内容：
{
  "texts": [
    {
      "text": "词语",
      "kana": "假名",
      "start": 开始位置,
      "end": 结束位置,
      "meaning": "中文含义",
      "desc": "用法说明",
      "type": "词性(名词/动词/形容词/副词/助词/助动词/连体词/接续词/感叹词)",
      "original": "动词/形容词的原形(如果不是动词变形则为空)",
      "conjugation": "变形类型(如：连用形、连体形、终止形、命令形、意志形、可能形、被动态、使役态、て形、た形等，如果不是变形则为空)"
    }
  ],
  "explain": "整句的中文翻译",
  "tense": "时态(过去/现在/未来/无时态)",
  "aspect": "体态(完成体/进行体/持续体/习惯体/无)",
  "pattern": "句式结构分析(如：连用形+ています、形容词终止形+です、名词+として、ので表原因等)",
  "conclusion": "该句式的使用结论和使用场景说明"
}`

func call_open_ai(text string, cfg Config) AnalysisResponse {
	base_url := cfg.BaseURL
	if base_url == "" {
		base_url = "https://api.openai.com/v1"
	}

	url := strings.TrimRight(base_url, "/")
	if !strings.HasSuffix(url, "/chat/completions") {
		url += "/chat/completions"
	}

	payload := map[string]interface{}{
		"model": cfg.Model,
		"messages": []map[string]string{
			{"role": "system", "content": system_prompt},
			{"role": "user", "content": text},
		},
		"temperature": 0.3,
	}

	json_data, _ := json.Marshal(payload)
	req, err := http.NewRequest("POST", url, strings.NewReader(string(json_data)))
	if err != nil {
		return fallback_analysis(text)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+cfg.APIKey)

	client := &http.Client{Timeout: 90 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Request failed: %v", err)
		return fallback_analysis("")
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("API returned status: %d", resp.StatusCode)
		return fallback_analysis("")
	}

	body, _ := io.ReadAll(resp.Body)
	content, err := parse_open_ai_response(body)
	if err != nil {
		log.Printf("Parse failed: %v", err)
		return fallback_analysis("")
	}

	return parse_result(content)
}

func call_anthropic(text string, cfg Config) AnalysisResponse {
	base_url := cfg.BaseURL
	if base_url == "" {
		base_url = "https://api.anthropic.com/v1"
	}

	url := base_url + "/messages"

	payload := map[string]interface{}{
		"model":      cfg.Model,
		"max_tokens": 4096,
		"system":     system_prompt,
		"messages": []map[string]string{
			{"role": "user", "content": text},
		},
	}

	json_data, _ := json.Marshal(payload)
	req, err := http.NewRequest("POST", url, strings.NewReader(string(json_data)))
	if err != nil {
		return fallback_analysis(text)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", cfg.APIKey)
	req.Header.Set("anthropic-version", "2023-06-01")

	client := &http.Client{Timeout: 90 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Request failed: %v", err)
		return fallback_analysis("")
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("API returned status: %d", resp.StatusCode)
		return fallback_analysis("")
	}

	body, _ := io.ReadAll(resp.Body)
	content, err := parse_anthropic_response(body)
	if err != nil {
		log.Printf("Parse failed: %v", err)
		return fallback_analysis("")
	}

	return parse_result(content)
}

func call_google(text string, cfg Config) AnalysisResponse {
	base_url := cfg.BaseURL
	if base_url == "" {
		base_url = "https://generativelanguage.googleapis.com/v1beta"
	}

	url := base_url + "/models/" + cfg.Model + ":generateContent?key=" + cfg.APIKey

	payload := map[string]interface{}{
		"contents": []map[string]interface{}{
			{
				"parts": []map[string]string{
					{"text": system_prompt + "\n\n" + text},
				},
			},
		},
		"safetySettings": []map[string]string{
			{"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
		},
		"generationConfig": map[string]interface{}{
			"temperature":     0.3,
			"maxOutputTokens": 4096,
		},
	}

	json_data, _ := json.Marshal(payload)
	req, err := http.NewRequest("POST", url, strings.NewReader(string(json_data)))
	if err != nil {
		return fallback_analysis(text)
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 90 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Request failed: %v", err)
		return fallback_analysis("")
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("API returned status: %d", resp.StatusCode)
		return fallback_analysis("")
	}

	body, _ := io.ReadAll(resp.Body)
	content, err := parse_google_response(body)
	if err != nil {
		log.Printf("Parse failed: %v", err)
		return fallback_analysis("")
	}

	return parse_result(content)
}

func call_azure(text string, cfg Config) AnalysisResponse {
	base_url := cfg.BaseURL
	if base_url == "" {
		base_url = os.Getenv("AZURE_OPENAI_ENDPOINT")
	}

	url := base_url + "/openai/deployments/" + cfg.Model + "/chat/completions?api-version=2024-02-01"

	payload := map[string]interface{}{
		"messages": []map[string]string{
			{"role": "system", "content": system_prompt},
			{"role": "user", "content": text},
		},
		"temperature": 0.3,
	}

	json_data, _ := json.Marshal(payload)
	req, err := http.NewRequest("POST", url, strings.NewReader(string(json_data)))
	if err != nil {
		return fallback_analysis(text)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("api-key", cfg.APIKey)

	client := &http.Client{Timeout: 90 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Request failed: %v", err)
		return fallback_analysis("")
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("API returned status: %d", resp.StatusCode)
		return fallback_analysis("")
	}

	body, _ := io.ReadAll(resp.Body)
	content, err := parse_open_ai_response(body)
	if err != nil {
		log.Printf("Parse failed: %v", err)
		return fallback_analysis("")
	}

	return parse_result(content)
}

func call_deepseek(text string, cfg Config) AnalysisResponse {
	base_url := cfg.BaseURL
	if base_url == "" {
		base_url = "https://api.deepseek.com/v1"
	}

	url := base_url
	if !strings.HasSuffix(base_url, "/chat/completions") {
		url = base_url + "/chat/completions"
	}

	payload := map[string]interface{}{
		"model": cfg.Model,
		"messages": []map[string]string{
			{"role": "system", "content": system_prompt},
			{"role": "user", "content": text},
		},
		"temperature": 0.3,
	}

	json_data, _ := json.Marshal(payload)
	req, err := http.NewRequest("POST", url, strings.NewReader(string(json_data)))
	if err != nil {
		return fallback_analysis(text)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+cfg.APIKey)

	client := &http.Client{Timeout: 90 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("DeepSeek request failed: %v", err)
		return fallback_analysis("")
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("DeepSeek API returned status: %d", resp.StatusCode)
		return fallback_analysis("")
	}

	body, _ := io.ReadAll(resp.Body)
	content, err := parse_open_ai_response(body)
	if err != nil {
		log.Printf("DeepSeek parse failed: %v", err)
		return fallback_analysis("")
	}

	return parse_result(content)
}

func call_custom(text string, cfg Config) AnalysisResponse {
	base_url := cfg.BaseURL
	if base_url == "" {
		return fallback_analysis(text)
	}

	url := strings.TrimRight(base_url, "/")
	if !strings.HasSuffix(url, "/chat/completions") {
		url += "/chat/completions"
	}

	payload := map[string]interface{}{
		"model": cfg.Model,
		"messages": []map[string]string{
			{"role": "system", "content": system_prompt},
			{"role": "user", "content": text},
		},
		"temperature": 0.3,
	}

	json_data, _ := json.Marshal(payload)
	req, err := http.NewRequest("POST", url, strings.NewReader(string(json_data)))
	if err != nil {
		return fallback_analysis(text)
	}
	req.Header.Set("Content-Type", "application/json")
	if cfg.APIKey != "" {
		req.Header.Set("Authorization", "Bearer "+cfg.APIKey)
	}

	client := &http.Client{Timeout: 90 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Request failed: %v", err)
		return fallback_analysis("")
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("API returned status: %d", resp.StatusCode)
		return fallback_analysis("")
	}

	body, _ := io.ReadAll(resp.Body)
	content, err := parse_open_ai_response(body)
	if err != nil {
		log.Printf("Parse failed: %v", err)
		return fallback_analysis("")
	}

	return parse_result(content)
}

func parse_open_ai_response(body []byte) (string, error) {
	var response struct {
		Choices []struct{ Message struct{ Content string } }
	}
	if err := json.Unmarshal(body, &response); err != nil {
		return "", err
	}
	if len(response.Choices) == 0 || response.Choices[0].Message.Content == "" {
		return "", fmt.Errorf("empty completion")
	}
	return response.Choices[0].Message.Content, nil
}
func parse_anthropic_response(body []byte) (string, error) {
	var response struct{ Content []struct{ Text string } }
	if err := json.Unmarshal(body, &response); err != nil {
		return "", err
	}
	if len(response.Content) == 0 || response.Content[0].Text == "" {
		return "", fmt.Errorf("empty completion")
	}
	return response.Content[0].Text, nil
}
func parse_google_response(body []byte) (string, error) {
	var response struct {
		Candidates []struct {
			Content struct{ Parts []struct{ Text string } }
		}
	}
	if err := json.Unmarshal(body, &response); err != nil {
		return "", err
	}
	if len(response.Candidates) == 0 || len(response.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("empty completion")
	}
	return response.Candidates[0].Content.Parts[0].Text, nil
}

func parse_result(content string) AnalysisResponse {
	content = strings.TrimSpace(content)
	content = strings.TrimPrefix(content, "```json")
	content = strings.TrimPrefix(content, "```")
	content = strings.TrimSpace(strings.TrimSuffix(content, "```"))
	var result AnalysisResponse
	if err := json.Unmarshal([]byte(content), &result); err != nil {
		log.Printf("Parse result failed: %v", err)
		return fallback_analysis("")
	}
	return result
}

func fallback_analysis(text string) AnalysisResponse {
	segments := []Segment{
		{Text: text, Kana: "?", Start: 0, End: len([]rune(text)), Meaning: "分析失败", Desc: "请检查 API 配置", Type: "错误"},
	}
	return AnalysisResponse{
		Texts:   segments,
		Explain: "分析失败，请确保已配置 LLM_API_KEY 环境变量",
	}
}

type ExamplesRequest struct {
	Text     string `json:"text"`
	Pattern  string `json:"pattern"`
	Model    string `json:"model"`
	Provider string `json:"provider"`
}

type Example struct {
	Japanese string `json:"japanese"`
	Chinese  string `json:"chinese"`
}

type ExamplesResponse struct {
	Examples []Example `json:"examples"`
}

func examples_handler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req ExamplesRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if strings.TrimSpace(req.Text) == "" {
		http.Error(w, "Text is required", http.StatusBadRequest)
		return
	}

	config_mutex.RLock()
	cfg := default_config
	config_mutex.RUnlock()
	if req.Provider != "" {
		cfg.Provider = req.Provider
	}
	if req.Model != "" {
		cfg.Model = req.Model
	}

	result := call_llm_for_examples(req.Text, req.Pattern, cfg)
	if len(result.Examples) == 0 {
		http.Error(w, "例句生成失败，请检查服务端 API 配置", http.StatusBadGateway)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(result); err != nil {
		log.Printf("Error encoding response: %v", err)
	}
}

func call_llm_for_examples(text, pattern string, cfg Config) ExamplesResponse {
	prompt := `你是一个日语例句生成器。请根据用户给出的日语句子，生成3-5个相同句式的例句。

请按以下 JSON 格式返回结果，不要包含任何其他内容，不要使用 markdown 代码块：
{"examples": [{"japanese": "日文例句", "chinese": "中文翻译"}]}

用户给出的句子：` + text

	if pattern != "" && pattern != text {
		prompt += `
句式参考：` + pattern
	}

	if cfg.APIKey == "" {
		api_key := os.Getenv("OPENAI_API_KEY")
		if api_key == "" {
			log.Printf("No API key for examples")
			return ExamplesResponse{Examples: []Example{}}
		}
		cfg.APIKey = api_key
	}

	var analysis_resp AnalysisResponse
	switch cfg.Provider {
	case "anthropic":
		analysis_resp = call_anthropic_with_prompt(prompt, cfg)
	case "google":
		analysis_resp = call_google_with_prompt(prompt, cfg)
	default:
		analysis_resp = call_open_ai_with_prompt(prompt, cfg)
	}

	content := analysis_resp.Explain
	content = strings.TrimSpace(content)
	content = strings.TrimPrefix(content, "```json")
	content = strings.TrimPrefix(content, "```")
	content = strings.TrimSuffix(content, "```")
	content = strings.TrimSpace(content)

	var examples_resp ExamplesResponse
	if err := json.Unmarshal([]byte(content), &examples_resp); err != nil {
		log.Printf("Parse examples failed: %v, content: %s", err, content)
		return ExamplesResponse{Examples: []Example{}}
	}

	return examples_resp
}

func call_open_ai_with_prompt(prompt string, cfg Config) AnalysisResponse {
	base_url := cfg.BaseURL
	if base_url == "" {
		if cfg.Provider == "deepseek" {
			base_url = "https://api.deepseek.com/v1"
		} else {
			base_url = "https://api.openai.com/v1"
		}
	}

	url := base_url
	if !strings.HasSuffix(base_url, "/chat/completions") {
		url = base_url + "/chat/completions"
	}

	payload := map[string]interface{}{
		"model": cfg.Model,
		"messages": []map[string]string{
			{"role": "system", "content": "你是一个日语例句生成器，请按要求的JSON格式返回结果。"},
			{"role": "user", "content": prompt},
		},
		"temperature": 0.7,
	}

	json_data, _ := json.Marshal(payload)
	req, err := http.NewRequest("POST", url, strings.NewReader(string(json_data)))
	if err != nil {
		return AnalysisResponse{}
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+cfg.APIKey)

	client := &http.Client{Timeout: 90 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return AnalysisResponse{}
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	content, _ := parse_open_ai_response(body)

	return AnalysisResponse{Explain: content}
}

func call_anthropic_with_prompt(prompt string, cfg Config) AnalysisResponse {
	base_url := cfg.BaseURL
	if base_url == "" {
		base_url = "https://api.anthropic.com/v1"
	}

	url := base_url + "/messages"

	payload := map[string]interface{}{
		"model":      cfg.Model,
		"max_tokens": 4096,
		"messages": []map[string]string{
			{"role": "user", "content": prompt},
		},
	}

	json_data, _ := json.Marshal(payload)
	req, err := http.NewRequest("POST", url, strings.NewReader(string(json_data)))
	if err != nil {
		return AnalysisResponse{}
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", cfg.APIKey)
	req.Header.Set("anthropic-version", "2023-06-01")

	client := &http.Client{Timeout: 90 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return AnalysisResponse{}
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	content, _ := parse_anthropic_response(body)

	return AnalysisResponse{Explain: content}
}

func call_google_with_prompt(prompt string, cfg Config) AnalysisResponse {
	base_url := cfg.BaseURL
	if base_url == "" {
		base_url = "https://generativelanguage.googleapis.com/v1beta"
	}

	url := base_url + "/models/" + cfg.Model + ":generateContent?key=" + cfg.APIKey

	payload := map[string]interface{}{
		"contents": []map[string]interface{}{
			{
				"parts": []map[string]string{
					{"text": prompt},
				},
			},
		},
		"generationConfig": map[string]interface{}{
			"temperature":     0.7,
			"maxOutputTokens": 4096,
		},
	}

	json_data, _ := json.Marshal(payload)
	req, err := http.NewRequest("POST", url, strings.NewReader(string(json_data)))
	if err != nil {
		return AnalysisResponse{}
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 90 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return AnalysisResponse{}
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	content, _ := parse_google_response(body)

	return AnalysisResponse{Explain: content}
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/api/analysis", analysis_handler)
	mux.HandleFunc("/api/examples", examples_handler)
	mux.HandleFunc("/api/config", config_handler)

	handler := cors_middleware(mux)

	log.Printf("Server starting on :8280")
	log.Printf("Default provider: %s, model: %s", default_config.Provider, default_config.Model)
	if err := http.ListenAndServe(":8280", handler); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
