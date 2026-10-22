/**
 * Optional AI suggestion provider.
 *
 * Disabled by default. When the user enables it in Settings, ONLY the reel's
 * available text (caption/title/notes/creator) and the category names are sent
 * to the provider the user configured. The model is asked to SUGGEST 1-3
 * existing categories, optionally one new category name, and 3-5 tags.
 * Nothing is ever applied automatically — the user confirms every suggestion.
 */

export const AI_PRESETS = {
  openai: { kind: 'openai', label: 'OpenAI', baseUrl: 'https://api.openai.com/v1', model: '' },
  gemini: { kind: 'openai', label: 'Google Gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', model: '' },
  openrouter: { kind: 'openai', label: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', model: '' },
  anthropic: { kind: 'anthropic', label: 'Anthropic', baseUrl: 'https://api.anthropic.com/v1', model: '' },
  custom: { kind: 'openai', label: 'OpenAI-compatible', baseUrl: '', model: '' },
};

export function isAiConfigured(ai) {
  return Boolean(ai && ai.enabled && ai.apiKey && ai.model && ai.baseUrl);
}

export function buildPrompt(reel, categories, { suggestTags = true } = {}) {
  const lines = categories.map((c) => {
    const kw = (c.keywords || []).slice(0, 25).join(', ');
    return `- ${c.name}${kw ? ` (keywords: ${kw})` : ''}`;
  });
  const fields = [];
  if (reel.username) fields.push(`Creator: @${reel.username}`);
  if (reel.creatorName) fields.push(`Creator name: ${reel.creatorName}`);
  if (reel.title) fields.push(`Title: ${reel.title}`);
  if (reel.caption) fields.push(`Caption: ${reel.caption}`);
  if (reel.notes) fields.push(`User notes: ${reel.notes}`);
  if (reel.collection) fields.push(`Instagram collection: ${reel.collection}`);

  const system =
    'You help sort a user\'s saved Instagram Reels into the user\'s own categories. ' +
    'Use ONLY the text provided. Do not guess what the video shows beyond that text. ' +
    'Suggest 1 to 3 of the listed categories that fit (most fitting first), optionally ONE new category name ' +
    (suggestTags ? 'and 3 to 5 short tags (single words or #hashtags, from the text). ' : '') +
    'The user confirms everything; nothing you output is applied automatically. ' +
    'Reply with a single JSON object and nothing else: ' +
    `{"categories": ["<one to three names exactly as listed>"], "new_category": <name or null>, ${suggestTags ? '"tags": ["<tag>", ...], ' : ''}"confidence": <number 0..1>}`;
  const user = `Categories:\n${lines.join('\n')}\n\nReel:\n${fields.join('\n').slice(0, 4000)}`;
  return { system, user };
}

/** Extract {categories, newCategory, tags} from a model reply. */
export function parseAiReply(text, categories) {
  if (!text) return null;
  const m = String(text).match(/\{[\s\S]*\}/);
  if (!m) return null;
  let obj;
  try {
    obj = JSON.parse(m[0]);
  } catch {
    return null;
  }
  const lower = (s) => String(s || '').trim().toLocaleLowerCase();
  const ids = (Array.isArray(obj.categories) ? obj.categories : [])
    .map(lower)
    .map((n) => categories.find((c) => c.name.toLocaleLowerCase() === n))
    .filter(Boolean)
    .map((c) => c.id);
  const seen = new Set();
  const uniq = ids.filter((id) => (seen.has(id) ? false : (seen.add(id), true)));
  let confidence = Number(obj.confidence);
  if (!Number.isFinite(confidence)) confidence = 0.5;
  return {
    categoryIds: uniq.slice(0, 3),
    newCategory: typeof obj.new_category === 'string' && obj.new_category.trim() ? obj.new_category.trim().slice(0, 40) : null,
    tags: (Array.isArray(obj.tags) ? obj.tags : []).map((x) => String(x).trim().replace(/^#/, '').slice(0, 40)).filter(Boolean).slice(0, 6),
    confidence: Math.max(0, Math.min(1, confidence)),
  };
}

/**
 * Ask the configured provider to SUGGEST categories and tags for a reel.
 * Never auto-applied: the user confirms every suggestion.
 * @param {object} reel
 * @param {Array} categories
 * @param {object} ai settings {kind, baseUrl, apiKey, model, suggestTags}
 * @param {(url:string, headers:object, body:object)=>Promise<{status:number, data:any}>} post
 */
export async function aiSuggest(reel, categories, ai, post) {
  const { system, user } = buildPrompt(reel, categories, { suggestTags: ai.suggestTags !== false });
  const base = String(ai.baseUrl || '').replace(/\/+$/, '');
  let res;
  if (ai.kind === 'anthropic') {
    res = await post(
      `${base}/messages`,
      {
        'content-type': 'application/json',
        'x-api-key': ai.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      { model: ai.model, max_tokens: 200, system, messages: [{ role: 'user', content: user }] },
    );
  } else {
    res = await post(
      `${base}/chat/completions`,
      { 'content-type': 'application/json', authorization: `Bearer ${ai.apiKey}` },
      {
        model: ai.model,
        temperature: 0,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      },
    );
  }
  if (!res || res.status < 200 || res.status >= 300) {
    const msg = res && res.data && (res.data.error?.message || res.data.error || res.data.message);
    const err = new Error(typeof msg === 'string' ? msg : `HTTP ${res ? res.status : 'error'}`);
    err.status = res ? res.status : 0;
    throw err;
  }
  const d = typeof res.data === 'string' ? safeJson(res.data) : res.data;
  const text =
    ai.kind === 'anthropic'
      ? (d?.content || []).map((p) => p.text || '').join('')
      : d?.choices?.[0]?.message?.content || '';
  return parseAiReply(text, categories);
}

function safeJson(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
