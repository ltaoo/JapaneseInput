package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestAnalysisAndExamples(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/chat/completions" {
			t.Errorf("incorrect URL: %s", r.URL.Path)
		}
		if r.Header.Get("Authorization") != "Bearer test-key" {
			t.Error("missing authorization")
		}
		var body struct{ Messages []struct{ Content string } }
		json.NewDecoder(r.Body).Decode(&body)
		content := `{"texts":[{"text":"食べた","kana":"たべた","type":"动词","original":"食べる","conjugation":"た形"}],"explain":"吃过了","pattern":"动词た形"}`
		if strings.Contains(body.Messages[0].Content, "例句生成器") {
			content = "```json\n{\"examples\":[{\"japanese\":\"飲んだ\",\"chinese\":\"喝过了\"}]}\n```"
		}
		json.NewEncoder(w).Encode(map[string]interface{}{"choices": []interface{}{map[string]interface{}{"message": map[string]string{"content": content}}}})
	}))
	defer upstream.Close()
	saved := default_config
	default_config = Config{Provider: "deepseek", Model: "test", APIKey: "test-key", BaseURL: upstream.URL}
	defer func() { default_config = saved }()
	for _, route := range []string{"analysis", "examples"} {
		recorder := httptest.NewRecorder()
		request := httptest.NewRequest("POST", "/api/"+route, strings.NewReader(`{"text":"食べた","pattern":"动词た形"}`))
		if route == "analysis" {
			analysis_handler(recorder, request)
		} else {
			examples_handler(recorder, request)
		}
		if recorder.Code != http.StatusOK {
			t.Fatalf("%s: %d %s", route, recorder.Code, recorder.Body.String())
		}
		if !strings.Contains(recorder.Body.String(), "た") && !strings.Contains(recorder.Body.String(), "飲んだ") {
			t.Fatal("missing result")
		}
	}
}

func TestInvalidInputAndUpstreamFailure(t *testing.T) {
	for _, handler := range []http.HandlerFunc{analysis_handler, examples_handler} {
		for _, body := range []string{`{"text":"  "}`, `{`} {
			recorder := httptest.NewRecorder()
			handler(recorder, httptest.NewRequest("POST", "/", strings.NewReader(body)))
			if recorder.Code != http.StatusBadRequest {
				t.Fatalf("expected 400, got %d", recorder.Code)
			}
		}
	}
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { http.Error(w, "failed", 502) }))
	defer upstream.Close()
	saved := default_config
	default_config = Config{Provider: "deepseek", APIKey: "test", BaseURL: upstream.URL}
	defer func() { default_config = saved }()
	for _, handler := range []http.HandlerFunc{analysis_handler, examples_handler} {
		recorder := httptest.NewRecorder()
		handler(recorder, httptest.NewRequest("POST", "/", strings.NewReader(`{"text":"雨"}`)))
		if recorder.Code != http.StatusBadGateway {
			t.Fatalf("expected 502, got %d", recorder.Code)
		}
	}
}

func TestMalformedCompletion(t *testing.T) {
	for _, body := range []string{`{`, `{"choices":[null]}`, `{"choices":[{"message":"invalid"}]}`} {
		if _, err := parse_open_ai_response([]byte(body)); err == nil {
			t.Errorf("accepted malformed result: %s", body)
		}
	}
}
