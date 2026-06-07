"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiClient = exports.ApiClient = void 0;
class ApiClient {
    async execute(settings, request) {
        const { apiKey, apiUrl, model } = settings.cloud;
        if (!apiKey) {
            throw new Error('Cloud API key is not configured.');
        }
        if (!model) {
            throw new Error('Cloud model is not configured.');
        }
        const url = apiUrl || 'https://api.openai.com/v1/chat/completions';
        if (url.includes('anthropic.com')) {
            return this.executeAnthropic(url, apiKey, model, request);
        }
        if (url.includes('generativelanguage.googleapis.com') || url.includes('/v1beta/models/')) {
            return this.executeGemini(url, apiKey, model, request);
        }
        return this.executeOpenAICompatible(url, apiKey, model, request);
    }
    buildGeminiUrl(url, model) {
        if (url.includes(':generateContent')) {
            return url;
        }
        const baseUrl = url.replace(/\/$/, '');
        if (baseUrl.endsWith(`/models/${model}`)) {
            return `${baseUrl}:generateContent`;
        }
        if (baseUrl.endsWith('/models')) {
            return `${baseUrl}/${encodeURIComponent(model)}:generateContent`;
        }
        return `${baseUrl}/models/${encodeURIComponent(model)}:generateContent`;
    }
    async executeGemini(url, apiKey, model, request) {
        const response = await fetch(this.buildGeminiUrl(url, model), {
            method: 'POST',
            headers: {
                'x-goog-api-key': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...(request.systemPrompt
                    ? { systemInstruction: { parts: [{ text: request.systemPrompt }] } }
                    : {}),
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: request.userPrompt }],
                    },
                ],
                generationConfig: {
                    temperature: request.temperature ?? 0.3,
                    maxOutputTokens: request.maxTokens ?? 4096,
                },
            }),
        });
        const body = await response.text();
        if (!response.ok) {
            throw new Error(`Gemini API request failed (${response.status}): ${body.slice(0, 500)}`);
        }
        const data = JSON.parse(body);
        const text = data?.candidates?.[0]?.content?.parts
            ?.map((part) => part?.text || '')
            .join('')
            .trim();
        if (!text) {
            throw new Error('Gemini API returned an empty response.');
        }
        return text;
    }
    async executeOpenAICompatible(url, apiKey, model, request) {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                messages: [
                    ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
                    { role: 'user', content: request.userPrompt },
                ],
                temperature: request.temperature ?? 0.3,
                max_tokens: request.maxTokens ?? 4096,
            }),
        });
        const body = await response.text();
        if (!response.ok) {
            throw new Error(`Cloud API request failed (${response.status}): ${body.slice(0, 500)}`);
        }
        const data = JSON.parse(body);
        const text = data?.choices?.[0]?.message?.content;
        if (!text) {
            throw new Error('Cloud API returned an empty response.');
        }
        return String(text);
    }
    async executeAnthropic(url, apiKey, model, request) {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                system: request.systemPrompt || undefined,
                messages: [{ role: 'user', content: request.userPrompt }],
                temperature: request.temperature ?? 0.3,
                max_tokens: request.maxTokens ?? 4096,
            }),
        });
        const body = await response.text();
        if (!response.ok) {
            throw new Error(`Anthropic API request failed (${response.status}): ${body.slice(0, 500)}`);
        }
        const data = JSON.parse(body);
        const text = data?.content?.map((part) => part?.text || '').join('').trim();
        if (!text) {
            throw new Error('Anthropic API returned an empty response.');
        }
        return text;
    }
}
exports.ApiClient = ApiClient;
exports.apiClient = new ApiClient();
