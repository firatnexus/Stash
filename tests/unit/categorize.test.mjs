import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fold, tokenize, hashtags, cleanKeywords } from '../../www/src/categorize/normalize.js';
import { keywordScores, collectionScores } from '../../www/src/categorize/keyword.js';
import { buildCreatorStats } from '../../www/src/categorize/creator.js';
import { classifyLocal, classify } from '../../www/src/categorize/engine.js';
import { buildPrompt, parseAiReply, aiSuggest, isAiConfigured, AI_PRESETS } from '../../www/src/categorize/ai.js';
import { STARTERS } from '../../www/src/categorize/starters.js';

const cats = STARTERS.map((s) => ({ id: s.key, name: s.name.en, keywords: s.keywords }));

test('normalisation folds Turkish characters and case', () => {
  assert.equal(fold('TARİF Çorba Işık'), 'tarif corba isik');
  assert.deepEqual(tokenize('Kahvaltı, tatlı & kek!'), ['kahvalti', 'tatli', 'kek']);
  assert.deepEqual(hashtags('#GameDev #easy_recipe'), ['gamedev', 'game', 'dev', 'easyrecipe', 'easy', 'recipe']);
  assert.deepEqual(cleanKeywords([' #Pasta', 'pasta', '', 'Çorba', 'corba']), ['Pasta', 'Çorba']);
});

test('keyword classifier matches words, hashtags, phrases and prefixes', () => {
  const s = keywordScores({ caption: 'Quick dinner: creamy pasta #recipe' }, cats);
  assert.equal(s[0].id, 'recipes');
  assert.ok(s[0].reasons.includes('#recipe'));
  const tr = keywordScores({ caption: 'Akşam yemeği için pratik çorba tarifi' }, cats);
  assert.equal(tr[0].id, 'recipes');
  assert.ok(tr[0].reasons.includes('aksam yemegi'));
  assert.deepEqual(keywordScores({ caption: '' }, cats), []);
});

test('confident, uncertain and none outcomes', () => {
  const confident = classifyLocal({ caption: 'Easy pasta recipe for dinner #cooking' }, cats);
  assert.equal(confident.status, 'confident');
  assert.equal(confident.categoryId, 'recipes');

  const uncertain = classifyLocal({ caption: 'cooking game' }, cats);
  assert.equal(uncertain.status, 'uncertain');
  assert.equal(uncertain.categoryId, null);
  assert.ok(uncertain.candidates.length >= 2);

  const none = classifyLocal({ caption: 'zzz qqq' }, cats);
  assert.equal(none.status, 'none');
  const noText = classifyLocal({}, cats);
  assert.equal(noText.status, 'none');
  assert.equal(noText.hasText, false);
  assert.equal(classifyLocal({ caption: 'pasta' }, []).status, 'none');
});

test('Instagram collection names and creator history count as signals', () => {
  assert.deepEqual(collectionScores('recipes', cats).map((c) => c.id), ['recipes']);
  const r = classifyLocal({ collection: 'Travel' }, cats);
  assert.equal(r.categoryId, 'travel');

  const history = [
    { username: 'chef.anna', categoryId: 'recipes', categorySource: 'manual' },
    { username: 'chef.anna', categoryId: 'recipes', categorySource: 'manual' },
    { username: 'chef.anna', categoryId: 'games', categorySource: 'keyword' }, // automatic → ignored
  ];
  const stats = buildCreatorStats(history);
  const byCreator = classifyLocal({ username: 'Chef.Anna' }, cats, { creatorStats: stats });
  assert.equal(byCreator.status, 'confident');
  assert.equal(byCreator.categoryId, 'recipes');
  assert.equal(byCreator.method, 'creator');
});

test('AI reply parsing is strict about category names', () => {
  assert.deepEqual(parseAiReply('{"categories":["Travel"],"new_category":null,"tags":[],"confidence":0.9}', cats), { categoryIds: ['travel'], newCategory: null, tags: [], confidence: 0.9 });
  assert.deepEqual(parseAiReply('Sure! ```json\n{"categories": ["game ideas"], "confidence": 2}\n```', cats), { categoryIds: ['games'], newCategory: null, tags: [], confidence: 1 });
  assert.deepEqual(parseAiReply('{"categories":null,"confidence":0.2}', cats), { categoryIds: [], newCategory: null, tags: [], confidence: 0.2 });
  // a category that is not in the list is ignored (it may come back as a new_category suggestion instead)
  assert.deepEqual(parseAiReply('{"categories":["Cars"],"new_category":"Cars","confidence":0.9}', cats), { categoryIds: [], newCategory: 'Cars', tags: [], confidence: 0.9 });
  assert.deepEqual(parseAiReply('{"categories":[],"new_category":null,"tags":["#cat", "funny", "cat", ""],"confidence":0.5}', cats), { categoryIds: [], newCategory: null, tags: ['cat', 'funny', 'cat'], confidence: 0.5 });
  assert.equal(parseAiReply('no json here', cats), null);
  const { system, user } = buildPrompt({ caption: 'hello', username: 'x' }, cats);
  assert.match(user, /Caption: hello/);
  assert.match(user, /@x/);
  assert.match(system, /1 to 3/);
  const noTags = buildPrompt({ caption: 'hello' }, cats, { suggestTags: false });
  assert.doesNotMatch(noTags.system, /tags/);
  assert.equal(isAiConfigured({ enabled: true, apiKey: 'k', model: 'm', baseUrl: 'u' }), true);
  assert.equal(isAiConfigured({ enabled: false, apiKey: 'k', model: 'm', baseUrl: 'u' }), false);
  assert.ok(AI_PRESETS.openai && AI_PRESETS.anthropic);
});

const ai = { enabled: true, kind: 'openai', baseUrl: 'https://api.example.com/v1/', apiKey: 'sk-test', model: 'm' };

test('AI provider is only called when local result is unsure, and requests are well formed', async () => {
  const calls = [];
  const post = async (url, headers, body) => {
    calls.push({ url, headers, body });
    return { status: 200, data: { choices: [{ message: { content: '{"categories":["Funny Videos"],"new_category":null,"tags":["cat","funny"],"confidence":0.8}' } }] } };
  };
  const sure = await classify({ caption: 'Easy pasta recipe for dinner #cooking' }, cats, { ai, post });
  assert.equal(sure.method, 'keyword');
  assert.equal(calls.length, 0);

  const noText = await classify({}, cats, { ai, post });
  assert.equal(noText.status, 'none');
  assert.equal(calls.length, 0, 'never asks AI without real text');

  const r = await classify({ caption: 'my cat did this again' }, cats, { ai, post });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.example.com/v1/chat/completions');
  assert.equal(calls[0].headers.authorization, 'Bearer sk-test');
  assert.match(calls[0].body.messages[0].content, /1 to 3/);
  // AI results are never auto-applied, even at high confidence: the pick
  // sheet always asks the user (item 5 rule).
  assert.notEqual(r.status, 'confident');
  assert.equal(r.categoryId, null);
  assert.equal(r.method, null);
  assert.equal(r.candidates[0].id, 'funny');
  assert.deepEqual(r.aiTags, ['cat', 'funny']); // suggestions only, never auto-applied
});

test('Anthropic request shape and error handling', async () => {
  let seen;
  const post = async (url, headers, body) => {
    seen = { url, headers, body };
    return { status: 200, data: { content: [{ type: 'text', text: '{"categories":["Learning"],"new_category":null,"tags":[],"confidence":0.4}' }] } };
  };
  const res = await aiSuggest({ caption: 'x' }, cats, { ...ai, kind: 'anthropic', baseUrl: 'https://api.anthropic.com/v1' }, post);
  assert.equal(seen.url, 'https://api.anthropic.com/v1/messages');
  assert.equal(seen.headers['x-api-key'], 'sk-test');
  assert.deepEqual(res.categoryIds, ['learning']);

  const low = await classify({ caption: 'my cat did this again' }, cats, { ai: { ...ai, kind: 'anthropic' }, post });
  assert.notEqual(low.status, 'confident');
  assert.equal(low.categoryId, null, 'low AI confidence is only a suggestion');
  assert.equal(low.candidates[0].id, 'learning');

  const failing = async () => ({ status: 401, data: { error: { message: 'Invalid API key' } } });
  const f = await classify({ caption: 'my cat did this again' }, cats, { ai, post: failing });
  assert.equal(f.aiError, 'Invalid API key');
  assert.equal(f.categoryId, null);
});
