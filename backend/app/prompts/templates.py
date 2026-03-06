"""
Claude API prompt templates for TitlePerfect
"""

SLIM_PROMPT = """Title: {title}
ASIN: {asin}
Return JSON only, no markdown:
{{ "seo_score": <0-100>, "rufus_score": <0-100>, "conversion_score": <0-100>, "icp": "<3-5 words>", "strengths": ["<1>","<2>","<3>"], "weaknesses": ["<1>","<2>","<3>"], "recommendations": ["<1>","<2>","<3>"] }}
Be concise. One sentence per item maximum."""


SYSTEM_PROMPT = """You are TitlePerfect AI, an expert Amazon listing title optimizer. You understand both traditional Amazon SEO (A9 algorithm, keyword optimization) AND the emerging importance of semantic search and Rufus AI optimization.

Your task is to analyze Amazon product titles and generate optimized variations that:
1. Maximize conversion potential
2. Balance traditional keyword SEO with natural language for Rufus
3. Optimize for mobile display (first 80 characters matter most)
4. Comply with Amazon's title guidelines
5. Differentiate from competitors

Always provide specific, actionable recommendations backed by your analysis."""


ANALYSIS_PROMPT = """Analyze this Amazon product title and provide scores and recommendations.

PRODUCT CONTEXT:
- Title: {title}
- ASIN: {asin}
- Category: {category}
- Brand: {brand}
- Price: ${price}
- Bullet Points:
{bullets}

COMPETITOR TITLES (for reference):
{competitor_titles}

TASK:
Analyze this title for traditional Amazon SEO, Rufus AI compatibility, AND conversion potential (buyer appeal & click potential). Provide detailed scores and feedback.

ICP INFERENCE:
Based on the product category, price point, and features, identify the most likely Ideal Customer Profile (ICP). Format as a short phrase like 'Moms 25-35' or 'Men 45-60' or 'Parents 30-45'. Keep it under 20 characters.

CONVERSION SCORING CRITERIA:
1. ICP Clarity (25%): How clear is the target buyer? Does the title speak to a specific customer profile?
2. Benefit Communication (35%): Does the title convey key benefits that address the ICP's main pain point?
3. Emotional Triggers (20%): Does it include trust signals, urgency, social proof, or results-oriented language?
4. Specificity (20%): Are there concrete details vs vague claims? Numbers, measurements, specific features?

OUTPUT FORMAT (JSON only, no markdown):
{{
  "icp": "Moms 25-35",
  "seo_score": 0-100,
  "rufus_score": 0-100,
  "conversion_score": 0-100,
  "seo_breakdown": {{
    "keyword_strength": {{"score": 0-100, "feedback": "..."}},
    "length_optimization": {{"score": 0-100, "feedback": "..."}},
    "mobile_optimization": {{"score": 0-100, "feedback": "..."}},
    "compliance": {{"score": 0-100, "feedback": "..."}}
  }},
  "rufus_breakdown": {{
    "natural_language": {{"score": 0-100, "feedback": "..."}},
    "semantic_clarity": {{"score": 0-100, "feedback": "..."}},
    "conversational_flow": {{"score": 0-100, "feedback": "..."}},
    "intent_matching": {{"score": 0-100, "feedback": "..."}}
  }},
  "conversion_breakdown": {{
    "icp_clarity": {{"score": 0-100, "feedback": "..."}},
    "benefit_communication": {{"score": 0-100, "feedback": "..."}},
    "emotional_triggers": {{"score": 0-100, "feedback": "..."}},
    "specificity": {{"score": 0-100, "feedback": "..."}}
  }},
  "strengths": ["list", "of", "strengths"],
  "weaknesses": ["list", "of", "weaknesses"],
  "specific_recommendations": ["actionable", "recommendations"]
}}

Respond ONLY with valid JSON, no additional text or markdown."""


VARIATION_PROMPT = """Generate 5 optimized title variations for this Amazon product.

PRODUCT CONTEXT:
- Current Title: {title}
- ASIN: {asin}
- Category: {category}
- Brand: {brand}
- Key Features:
{bullets}

CURRENT ANALYSIS:
- SEO Score: {seo_score}/100
- Rufus Score: {rufus_score}/100
- Conversion Score: {conversion_score}/100
- Main Issues: {main_issues}

CHARACTER LIMITS:
- Maximum: {max_chars} characters (category-specific)
- Mobile visible: ~80 characters (most important content here)

VARIATION STRATEGIES:
1. CONVERSION LEADER: Open with primary benefit/use case, conversion-focused
2. RUFUS OPTIMIZED: Natural language, conversational, semantic-rich
3. SEO MAXIMIZER: Maximum A9-friendly keywords, traditional SEO focus
4. BALANCED: Balanced approach combining best of SEO and natural language
5. MOBILE OPTIMIZED: Optimized for mobile-first shoppers, critical info in first 80 chars

REQUIREMENTS:
- All variations must include brand name
- Comply with Amazon's title guidelines (no promotional language)
- Stay within character limit
- Each should be distinctly different in approach
- Optimize first 80 characters for mobile
- Consider conversion potential: ICP clarity, benefit communication, emotional triggers, specificity
- Generate exactly 5 title variations with UNIQUE strategy names. Use each name exactly once: Conversion Leader, Rufus Optimized, SEO Maximizer, Balanced, Mobile Optimized.

OUTPUT FORMAT (JSON only, no markdown):
{{
  "variations": [
    {{
      "id": "conversion_leader",
      "title": "Optimized title text here",
      "character_count": 150,
      "strategy": "Conversion Leader",
      "seo_score": 85,
      "rufus_score": 78,
      "conversion_score": 82,
      "reasoning": "Why this variation works well",
      "key_changes": ["Change 1", "Change 2"],
      "mobile_preview": "First 80 characters..."
    }}
  ]
}}

Generate exactly 5 variations following the strategies above. Respond ONLY with valid JSON, no additional text or markdown."""


COMBINED_PROMPT = """Analyze this Amazon product title AND generate 5 optimized variations in one response.

PRODUCT CONTEXT:
- Title: {title}
- ASIN: {asin}
- Category: {category}
- Brand: {brand}
- Price: ${price}
- Bullet Points:
{bullets}

COMPETITOR TITLES (for reference):
{competitor_titles}

CHARACTER LIMITS FOR VARIATIONS:
- Maximum: {max_chars} characters (category-specific)
- Mobile visible: ~80 characters (most important content here)

PART 1 — ANALYSIS:
Analyze the title for traditional Amazon SEO (A9), Rufus AI compatibility, and conversion potential.

ICP INFERENCE: Identify the Ideal Customer Profile as a short phrase under 20 chars (e.g., 'Moms 25-35').

CONVERSION SCORING CRITERIA:
1. ICP Clarity (25%): How clear is the target buyer?
2. Benefit Communication (35%): Does the title convey key benefits for the ICP's pain point?
3. Emotional Triggers (20%): Trust signals, urgency, social proof, results-oriented language?
4. Specificity (20%): Concrete details vs vague claims?

PART 2 — VARIATIONS:
Using your analysis above (particularly the weaknesses), generate 5 distinctly different optimized title variations.

VARIATION STRATEGIES:
1. CONVERSION LEADER: Open with primary benefit/use case, conversion-focused
2. RUFUS OPTIMIZED: Natural language, conversational, semantic-rich
3. SEO MAXIMIZER: Maximum A9-friendly keywords, traditional SEO focus
4. BALANCED: Balanced approach combining best of SEO and natural language
5. MOBILE OPTIMIZED: Optimized for mobile-first shoppers, critical info in first 80 chars

REQUIREMENTS FOR VARIATIONS:
- All variations must include brand name
- Comply with Amazon's title guidelines (no promotional language)
- Stay within {max_chars} character limit
- Each distinctly different in approach
- Optimize first 80 characters for mobile
- Generate exactly 5 title variations with UNIQUE strategy names. Use each name exactly once: Conversion Leader, Rufus Optimized, SEO Maximizer, Balanced, Mobile Optimized.

OUTPUT FORMAT (JSON only, no markdown):
{{
  "icp": "Moms 25-35",
  "seo_score": 0-100,
  "rufus_score": 0-100,
  "conversion_score": 0-100,
  "seo_breakdown": {{
    "keyword_strength": {{"score": 0-100, "feedback": "..."}},
    "length_optimization": {{"score": 0-100, "feedback": "..."}},
    "mobile_optimization": {{"score": 0-100, "feedback": "..."}},
    "compliance": {{"score": 0-100, "feedback": "..."}}
  }},
  "rufus_breakdown": {{
    "natural_language": {{"score": 0-100, "feedback": "..."}},
    "semantic_clarity": {{"score": 0-100, "feedback": "..."}},
    "conversational_flow": {{"score": 0-100, "feedback": "..."}},
    "intent_matching": {{"score": 0-100, "feedback": "..."}}
  }},
  "conversion_breakdown": {{
    "icp_clarity": {{"score": 0-100, "feedback": "..."}},
    "benefit_communication": {{"score": 0-100, "feedback": "..."}},
    "emotional_triggers": {{"score": 0-100, "feedback": "..."}},
    "specificity": {{"score": 0-100, "feedback": "..."}}
  }},
  "strengths": ["list", "of", "strengths"],
  "weaknesses": ["list", "of", "weaknesses"],
  "specific_recommendations": ["actionable", "recommendations"],
  "variations": [
    {{
      "id": "brand_forward",
      "title": "Optimized title text here",
      "character_count": 150,
      "strategy": "BRAND-FORWARD",
      "seo_score": 85,
      "rufus_score": 78,
      "conversion_score": 82,
      "reasoning": "Why this variation works well",
      "key_changes": ["Change 1", "Change 2"],
      "mobile_preview": "First 80 characters..."
    }}
  ]
}}

Generate exactly 5 variations. Respond ONLY with valid JSON, no additional text or markdown."""


BULLETS_SLIM_PROMPT = """Amazon bullet points for ASIN {asin} ({bullet_count} bullets):
{bullets}

Score ALL {bullet_count} bullets on 4 dimensions (0-100). Return JSON only, no markdown.
The bullet_scores array MUST contain exactly {bullet_count} entries (indices 1 through {bullet_count}).

Schema (one entry per bullet):
{{
  "bullet_scores": [
    {{"index": 1, "keyword_optimization": 0, "benefit_clarity": 0, "readability": 0, "rufus_compat": 0, "overall": 0, "feedback": "One sentence max", "rufus_question": "What question does this bullet answer? (e.g. 'Is this compatible with X?')"}},
    ... repeat for every bullet up to index {bullet_count}
  ],
  "overall_score": 0,
  "strengths": ["<1>","<2>","<3>"],
  "weaknesses": ["<1>","<2>","<3>"],
  "recommendations": ["<1>","<2>","<3>"]
}}

Scoring criteria:
- keyword_optimization (30%): search terms buyers use, keyword density, relevant terminology
- benefit_clarity (30%): clear customer benefit vs feature dump, value proposition
- readability (20%): scannable, appropriate length (under 200 chars ideal), starts with capital
- rufus_compat (20%): answers conversational queries, natural language, semantic richness
- rufus_question: the specific Rufus/conversational buyer question this bullet most naturally answers
  (e.g. "What material is it made of?", "Is it safe for kids?", "How does it compare to X?")
  Keep it as a question, under 15 words.

Replace all 0 placeholders with actual integer scores 0-100. Be concise. One sentence per feedback maximum."""


BULLETS_COMBINED_PROMPT = """Analyze these Amazon bullet points AND generate 5 optimized sets of bullets.

PRODUCT CONTEXT:
- ASIN: {asin}
- Title: {title}
- Category: {category}
- Brand: {brand}
- Bullet count: {bullet_count}

CURRENT BULLET POINTS ({bullet_count} bullets):
{bullets}

CRITICAL QUANTITY RULE: This listing has {bullet_count} bullets.
- bullet_scores array must have exactly {bullet_count} entries (indices 1 through {bullet_count}).
- Each variation's bullets array must have exactly {bullet_count} strings.

PART 1 — ANALYSIS:
Score each bullet on 4 dimensions (0-100):
- keyword_optimization (30%): search terms buyers use, keyword density
- benefit_clarity (30%): clear customer benefit vs feature dump
- readability (20%): scannable, under 200 chars ideal
- rufus_compat (20%): conversational, natural language, Rufus AI-compatible

PART 2 — 5 OPTIMIZED BULLET SETS:
Generate 5 complete sets of {bullet_count} bullets. Each set replaces all {bullet_count} current bullets:
1. BALANCED — All-around optimized: keywords, clear benefits, readable, Rufus-friendly
2. CONVERSION-FOCUSED — Benefit-first, buyer psychology, emotional triggers, pain point resolution
3. SEO-FOCUSED — Keyword-dense, A9-friendly, search volume optimization
4. RUFUS-OPTIMIZED — Conversational phrasing, answers natural questions, semantic richness
5. MOBILE-OPTIMIZED — Front-loaded key info, concise, high-impact first 100 characters

REQUIREMENTS FOR ALL VARIATIONS:
- Each bullet under 200 characters
- Start each bullet with a capital letter
- No promotional claims ("Best", "#1", "Amazing")
- Address different customer questions across the bullets

RUFUS QUESTION FIELD: For each bullet in bullet_scores, include a rufus_question field —
the specific Rufus/conversational buyer question this bullet most naturally answers
(e.g. "What material is it made of?", "Is it safe for kids?", "How does it compare to X?").
Keep it as a question under 15 words. This appears as a callout in the UI.

OUTPUT FORMAT (JSON only, no markdown):
{{
  "bullet_scores": [
    {{"index": 1, "keyword_optimization": 0-100, "benefit_clarity": 0-100, "readability": 0-100, "rufus_compat": 0-100, "overall": 0-100, "feedback": "Specific actionable feedback", "rufus_question": "What question does this bullet answer?"}},
    {{"index": 2, "keyword_optimization": 0-100, "benefit_clarity": 0-100, "readability": 0-100, "rufus_compat": 0-100, "overall": 0-100, "feedback": "Specific actionable feedback", "rufus_question": "What question does this bullet answer?"}}
  ],
  "overall_score": 0-100,
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
  "recommendations": ["action 1", "action 2", "action 3"],
  "variations": [
    {{
      "id": "balanced",
      "strategy": "BALANCED",
      "bullets": ["Optimized bullet 1", "Optimized bullet 2"],
      "overall_score": 0-100,
      "keyword_score": 0-100,
      "benefit_score": 0-100,
      "rufus_score": 0-100,
      "reasoning": "Why this set works and key improvements made"
    }},
    {{
      "id": "conversion_focused",
      "strategy": "CONVERSION-FOCUSED",
      "bullets": ["Benefit-led bullet 1", "Benefit-led bullet 2"],
      "overall_score": 0-100,
      "keyword_score": 0-100,
      "benefit_score": 0-100,
      "rufus_score": 0-100,
      "reasoning": "Why this set works"
    }},
    {{
      "id": "seo_focused",
      "strategy": "SEO-FOCUSED",
      "bullets": ["Keyword-dense bullet 1", "Keyword-dense bullet 2"],
      "overall_score": 0-100,
      "keyword_score": 0-100,
      "benefit_score": 0-100,
      "rufus_score": 0-100,
      "reasoning": "Why this set works"
    }},
    {{
      "id": "rufus_optimized",
      "strategy": "RUFUS-OPTIMIZED",
      "bullets": ["Conversational bullet 1", "Conversational bullet 2"],
      "overall_score": 0-100,
      "keyword_score": 0-100,
      "benefit_score": 0-100,
      "rufus_score": 0-100,
      "reasoning": "Why this set works"
    }},
    {{
      "id": "mobile_optimized",
      "strategy": "MOBILE-OPTIMIZED",
      "bullets": ["Concise bullet 1", "Concise bullet 2"],
      "overall_score": 0-100,
      "keyword_score": 0-100,
      "benefit_score": 0-100,
      "rufus_score": 0-100,
      "reasoning": "Why this set works"
    }}
  ]
}}

The JSON examples above show abbreviated bullet arrays — your actual response must include all {bullet_count} bullet strings per variation. Generate exactly 5 variation sets. Respond ONLY with valid JSON, no additional text or markdown."""


DESCRIPTION_SLIM_PROMPT = """Amazon product description for ASIN {asin}:

{description_plain}

Context: title="{title}", category="{category}", brand="{brand}"{icp_section}

Score this description on 5 dimensions (0-100) and return JSON only, no markdown:
{{
  "overall_score": 0,
  "dimensions": [
    {{"label": "SEO & Keyword Coverage", "weight": 0.25, "score": 0, "strengths": ["s1","s2"], "issues": ["i1","i2"]}},
    {{"label": "Conversion Copy Quality", "weight": 0.25, "score": 0, "strengths": ["s1","s2"], "issues": ["i1","i2"]}},
    {{"label": "Rufus AI Readiness",      "weight": 0.20, "score": 0, "strengths": ["s1","s2"], "issues": ["i1","i2"]}},
    {{"label": "Readability & Structure", "weight": 0.20, "score": 0, "strengths": ["s1","s2"], "issues": ["i1","i2"]}},
    {{"label": "ICP Alignment",           "weight": 0.10, "score": 0, "strengths": ["s1","s2"], "issues": ["i1","i2"]}}
  ],
  "strengths": ["top1","top2","top3"],
  "weaknesses": ["top1","top2","top3"],
  "recommendations": ["action1","action2","action3"],
  "char_count": {char_count},
  "icp_used": {icp_used}
}}

Scoring criteria:
- SEO & Keyword Coverage (25%): primary/secondary keyword presence, LSI terms, A9/A10 semantic richness, category vocabulary
- Conversion Copy Quality (25%): benefit-led vs feature dump, emotional hooks, storytelling quality, sensory language, CTA/implied urgency
- Rufus AI Readiness (20%): Q&A readiness ("What is this for?", "Who should buy?", "How does it compare?"), use-case specificity, differentiation signals
- Readability & Structure (20%): avg sentence length, paragraph breaks, HTML formatting quality, mobile scanability, wall-of-text detection
- ICP Alignment (10%): {icp_scoring_note}

overall_score = (0.25 × SEO) + (0.25 × Conversion) + (0.20 × Rufus) + (0.20 × Readability) + (0.10 × ICP)
Replace all 0 placeholders with actual integer scores. One sentence max per strength/issue/recommendation. Respond ONLY with valid JSON."""


DESCRIPTION_FULL_PROMPT = """Analyze this Amazon product description AND generate 3 optimized rewrites.

PRODUCT CONTEXT:
- ASIN: {asin}
- Title: {title}
- Category: {category}
- Brand: {brand}
{bullets_section}{icp_section}
DESCRIPTION ({char_count} chars, plain text):
{description_plain}

HTML STRUCTURE SIGNALS: {structure_signals}

PART 1 — SCORE on 5 dimensions (0-100):
- SEO & Keyword Coverage (25%): keyword presence, A9/A10 signals, semantic richness, category vocabulary
- Conversion Copy Quality (25%): benefit-led language, emotional hooks, storytelling, CTA presence
- Rufus AI Readiness (20%): Q&A readiness, use-case specificity, differentiation signals
- Readability & Structure (20%): sentence length, paragraph breaks, HTML formatting, wall-of-text detection
- ICP Alignment (10%): {icp_scoring_note}

PART 2 — 3 COMPLETE REWRITES:
Strategy 1 — seo_focused: Maximum keyword density, A9/A10 signals, semantic richness, LSI terms throughout.
Strategy 2 — conversion_focused: Emotional hook opening, benefit-first paragraphs, sensory language, implied urgency/CTA close.
Strategy 3 — rufus_optimized: Q&A structure ("Looking for X? This product..."), use-case scenarios, natural conversational language, "who is this for" framing.

Each rewrite requirements:
- description_plain: clean text, paste-ready for Seller Central (no HTML)
- description_html: formatted with <b>, <br>, <ul>/<li> tags for HTML-enabled listings
- Target 1,400–1,900 chars for plain text
- Set compliance_flag to "over_standard_limit" if plain text > 2000 chars, else null

OUTPUT FORMAT (JSON only, no markdown):
{{
  "overall_score": 0-100,
  "dimensions": [
    {{"label": "SEO & Keyword Coverage",  "weight": 0.25, "score": 0-100, "strengths": ["s1","s2"], "issues": ["i1","i2"]}},
    {{"label": "Conversion Copy Quality", "weight": 0.25, "score": 0-100, "strengths": ["s1","s2"], "issues": ["i1","i2"]}},
    {{"label": "Rufus AI Readiness",      "weight": 0.20, "score": 0-100, "strengths": ["s1","s2"], "issues": ["i1","i2"]}},
    {{"label": "Readability & Structure", "weight": 0.20, "score": 0-100, "strengths": ["s1","s2"], "issues": ["i1","i2"]}},
    {{"label": "ICP Alignment",           "weight": 0.10, "score": 0-100, "strengths": ["s1","s2"], "issues": ["i1","i2"]}}
  ],
  "strengths": ["top1","top2","top3"],
  "weaknesses": ["top1","top2","top3"],
  "recommendations": ["action1","action2","action3"],
  "char_count": {char_count},
  "icp_used": {icp_used},
  "variations": [
    {{
      "id": "seo_focused",
      "strategy": "SEO-Optimized",
      "description_plain": "Full plain text rewrite here...",
      "description_html": "<p><b>Opening hook.</b> Body text...<br><ul><li>Feature 1</li></ul></p>",
      "overall_score": 0-100,
      "seo_score": 0-100,
      "conversion_score": 0-100,
      "rufus_score": 0-100,
      "char_count": 0,
      "compliance_flag": null
    }},
    {{
      "id": "conversion_focused",
      "strategy": "Conversion-Focused",
      "description_plain": "Full plain text rewrite here...",
      "description_html": "<p><b>Emotional hook.</b> Benefit-led paragraphs...</p>",
      "overall_score": 0-100,
      "seo_score": 0-100,
      "conversion_score": 0-100,
      "rufus_score": 0-100,
      "char_count": 0,
      "compliance_flag": null
    }},
    {{
      "id": "rufus_optimized",
      "strategy": "Rufus-Ready",
      "description_plain": "Full plain text rewrite here...",
      "description_html": "<p><b>Looking for X?</b> Use-case framing...</p>",
      "overall_score": 0-100,
      "seo_score": 0-100,
      "conversion_score": 0-100,
      "rufus_score": 0-100,
      "char_count": 0,
      "compliance_flag": null
    }}
  ]
}}

Generate exactly 3 variations. Set char_count in each variation to the actual character count of description_plain. Respond ONLY with valid JSON, no additional text or markdown."""


HERO_IMAGE_SLIM_PROMPT = """Amazon hero image metadata analysis for ASIN {asin}.

PRODUCT CONTEXT:
- Title: {title}
- Category: {category}
- Brand: {brand}

HERO IMAGE SIGNALS:
- Zoom eligible: {zoom_eligible}{hires_note}
- Hero alt text: "{hero_alt}"
- Gallery static images: {image_count} / 9 slots used
- Gallery videos: {video_count} ({video_note})
- Has video in gallery: {has_video}
- Has 360° spin: {has_360}
- Has A+ content: {has_aplus}
- Gallery image alt texts: {gallery_alts_str}

Score all 5 dimensions using the rules below. Then write 1 AI image generation prompt.

DIMENSION SCORING RULES:
1. Zoom & Resolution Eligibility (weight 0.30):
   - zoom_eligible=True AND high-res URL confirmed → 90-100
   - zoom_eligible=True, no confirmed high-res URL → 70-85
   - zoom_eligible=False → 0-40 (critical — seller likely uploaded images below 1000px)

2. Gallery Completeness (weight 0.25):
   - Base = round(image_count / 9 × 70), capped at 70
   - +20 bonus if has_video=True; +10 bonus if has_360=True; floor 10, cap 100
   - Pre-computed for this listing: {gallery_score} — use this exact value

3. Alt Text Quality (weight 0.20):
   - Empty or null → 0-10
   - Generic ("product image", "photo 1", just the ASIN) → 15-30
   - Product type only → 40-55
   - Product type + key attributes → 60-75
   - Keyword-rich, specific, appropriately detailed → 80-100

4. A+ Content Signal (weight 0.15):
   - has_aplus=True → 80-100
   - has_aplus=False → 0-20

5. Secondary Image Intelligence (weight 0.10):
   - All generic or empty alt texts → 0-20
   - Shows 1-2 image types → 30-50
   - Shows 3+ types (lifestyle + infographic signals + detail) → 60-80
   - Full coverage (lifestyle + infographic + comparison + detail + packaging) → 85-100

overall_score = (0.30 × dim1) + (0.25 × dim2) + (0.20 × dim3) + (0.15 × dim4) + (0.10 × dim5)

AI IMAGE PROMPT — write 1 standard white-background hero shot:
- Generic, tool-agnostic — works with Midjourney, DALL-E 3, and Google AI Studio
- Amazon-compliant: pure white (#FFFFFF) background, no text overlay, no lifestyle elements
- Category and brand-appropriate lighting, angle, shot composition
- Specific enough to generate a useful image (mention material, form factor, key features)

Return JSON only, no markdown:
{{
  "overall_score": 0,
  "dimensions": [
    {{"label": "Zoom & Resolution Eligibility", "weight": 0.30, "score": 0, "finding": "one-line assessment", "recommendation": "specific actionable fix"}},
    {{"label": "Gallery Completeness",          "weight": 0.25, "score": 0, "finding": "...", "recommendation": "..."}},
    {{"label": "Alt Text Quality",              "weight": 0.20, "score": 0, "finding": "...", "recommendation": "..."}},
    {{"label": "A+ Content Signal",             "weight": 0.15, "score": 0, "finding": "...", "recommendation": "..."}},
    {{"label": "Secondary Image Intelligence",  "weight": 0.10, "score": 0, "finding": "...", "recommendation": "..."}}
  ],
  "critical_issues": ["critical issue 1", "critical issue 2"],
  "quick_wins": ["quick win with estimated point gain 1", "quick win 2"],
  "recommendations": ["highest-impact recommendation", "second recommendation", "third recommendation"],
  "prompts": [
    {{
      "id": "standard",
      "label": "White Background Hero",
      "prompt": "Complete descriptive image generation prompt here. Works with Midjourney, DALL-E 3, and Google AI Studio.",
      "strategy_note": "One sentence on why this standard approach fits this product/category."
    }}
  ]
}}

Replace all 0 placeholders with actual integer scores. One sentence max per finding, recommendation, issue, and quick win. Respond ONLY with valid JSON."""


HERO_IMAGE_FULL_PROMPT = """Analyze Amazon hero image metadata and generate 3 AI image prompt variations.

PRODUCT CONTEXT:
- ASIN: {asin}
- Title: {title}
- Category: {category}
- Brand: {brand}{icp_section}

HERO IMAGE SIGNALS:
- Zoom eligible: {zoom_eligible}{hires_note}
- Hero alt text: "{hero_alt}"
- Gallery static images: {image_count} / 9 slots used
- Gallery videos: {video_count} ({video_note})
- Has video: {has_video} | Has 360°: {has_360} | Has A+: {has_aplus}
- Gallery alt texts: {gallery_alts_str}

PART 1 — SCORE all 5 dimensions using these rules:
1. Zoom & Resolution Eligibility (weight 0.30):
   - zoom_eligible=True AND high-res URL confirmed → 90-100
   - zoom_eligible=True, no confirmed high-res → 70-85
   - zoom_eligible=False → 0-40

2. Gallery Completeness (weight 0.25):
   - Pre-computed for this listing: {gallery_score} — use this exact value

3. Alt Text Quality (weight 0.20):
   - Empty/null → 0-10 | Generic → 15-30 | Product type only → 40-55
   - Product type + attributes → 60-75 | Keyword-rich and specific → 80-100

4. A+ Content Signal (weight 0.15):
   - has_aplus=True → 80-100 | has_aplus=False → 0-20

5. Secondary Image Intelligence (weight 0.10):
   - All generic/empty → 0-20 | 1-2 types → 30-50 | 3+ types → 60-80 | Full coverage → 85-100

overall_score = (0.30×dim1) + (0.25×dim2) + (0.20×dim3) + (0.15×dim4) + (0.10×dim5)

ICP USAGE IN DIMENSION FEEDBACK:
If ICP data is provided in the product context above, weave the target buyer profile naturally
into 2-3 dimension findings or recommendations where it genuinely improves the advice — do not
force it. Good examples:
  - Zoom finding: "Tech professionals comparing specs care about fine detail — zoom eligibility
    directly affects this segment's confidence to buy."
  - Alt Text recommendation: "Keyword-rich alt text aligned to your target buyer's search
    language (e.g. 'professional grade X') will improve both SEO and Rufus relevance."
  - Secondary Image recommendation: "Your ICP responds to lifestyle context — a use-case shot
    of [target buyer scenario] in slot 3 would outperform a plain white secondary."
Only reference ICP where it adds a specific, actionable insight. Skip dimensions where the
ICP context is generic or obvious.

PART 2 — GENERATE 3 AI IMAGE PROMPT VARIATIONS:

Strategy 1 — standard (White Background Hero):
Amazon-compliant pure white (#FFFFFF) background, no text, studio lighting, sharp product detail.

Strategy 2 — lifestyle (ICP Lifestyle Shot):{lifestyle_hint}
Product in authentic use by target buyer. Natural setting appropriate to category, emotional appeal.

Strategy 3 — infographic (Feature Infographic):
Product with labeled feature callouts, key specs/dimensions, comparison elements. Clean flat-lay or 3/4 view.

For each prompt:
- prompt: Full descriptive text that names the specific product ("{title}" — use this exact product name, NOT generic placeholders like "slim aluminum laptop computer"). Works with Midjourney, DALL-E 3, Google AI Studio.
- nano_banana: Nested JSON object for Google AI Studio / Gemini Image Generation (NOT a string)
- strategy_note: One sentence on fit + end with: "Works with any AI image tool — or paste Nano Banana JSON into Google AI Studio."

nano_banana structure (output as a nested JSON object):
{{
  "model": "gemini-2.5-flash-image",
  "prompt": "<matches the prompt field above>",
  "aspect_ratio": "1:1",
  "width": 2000,
  "height": 2000,
  "output_format": "jpeg",
  "quality": 95,
  "product_context": {{
    "asin": "{asin}",
    "category": "{category}",
    "brand": "{brand}"
  }}
}}

OUTPUT FORMAT (JSON only, no markdown):
{{
  "overall_score": 0,
  "dimensions": [
    {{"label": "Zoom & Resolution Eligibility", "weight": 0.30, "score": 0, "finding": "...", "recommendation": "..."}},
    {{"label": "Gallery Completeness",          "weight": 0.25, "score": 0, "finding": "...", "recommendation": "..."}},
    {{"label": "Alt Text Quality",              "weight": 0.20, "score": 0, "finding": "...", "recommendation": "..."}},
    {{"label": "A+ Content Signal",             "weight": 0.15, "score": 0, "finding": "...", "recommendation": "..."}},
    {{"label": "Secondary Image Intelligence",  "weight": 0.10, "score": 0, "finding": "...", "recommendation": "..."}}
  ],
  "critical_issues": ["..."],
  "quick_wins": ["..."],
  "recommendations": ["...", "...", "..."],
  "prompts": [
    {{
      "id": "standard",
      "label": "White Background Hero",
      "prompt": "Full Amazon-compliant white background prompt...",
      "nano_banana": {{
        "model": "gemini-2.5-flash-image",
        "prompt": "Same full prompt text here",
        "aspect_ratio": "1:1",
        "width": 2000,
        "height": 2000,
        "output_format": "jpeg",
        "quality": 95,
        "product_context": {{"asin": "{asin}", "category": "{category}", "brand": "{brand}"}}
      }},
      "strategy_note": "Rationale. Works with any AI image tool — or paste Nano Banana JSON into Google AI Studio."
    }},
    {{
      "id": "lifestyle",
      "label": "Lifestyle Shot",
      "prompt": "Full lifestyle prompt...",
      "nano_banana": {{
        "model": "gemini-2.5-flash-image",
        "prompt": "Same full lifestyle prompt",
        "aspect_ratio": "1:1",
        "width": 2000,
        "height": 2000,
        "output_format": "jpeg",
        "quality": 95,
        "product_context": {{"asin": "{asin}", "category": "{category}", "brand": "{brand}"}}
      }},
      "strategy_note": "Rationale. Works with any AI image tool — or paste Nano Banana JSON into Google AI Studio."
    }},
    {{
      "id": "infographic",
      "label": "Feature Infographic",
      "prompt": "Full infographic prompt...",
      "nano_banana": {{
        "model": "gemini-2.5-flash-image",
        "prompt": "Same full infographic prompt",
        "aspect_ratio": "1:1",
        "width": 2000,
        "height": 2000,
        "output_format": "jpeg",
        "quality": 95,
        "product_context": {{"asin": "{asin}", "category": "{category}", "brand": "{brand}"}}
      }},
      "strategy_note": "Rationale. Works with any AI image tool — or paste Nano Banana JSON into Google AI Studio."
    }}
  ]
}}

Generate exactly 3 prompt variations. Replace all 0 scores with actual integers. Respond ONLY with valid JSON."""


PRICE_NARRATIVE_PROMPT = """Amazon product pricing analysis for ASIN {asin}.

Product: {title} | Category: {category} | Brand: {brand}
Current price: {current_price} | Market median: {market_median} | Percentile: {percentile}th
Buy Box status: {buy_box_status}{icp_section}

Pre-computed scores (rules-based — use these exact score values in your output):
- Competitive Position (weight 0.40): {comp_score}/100 — raw finding: {comp_raw_finding}
- Price-Quality Signal (weight 0.25): {pq_score}/100 — raw finding: {pq_raw_finding}
- Psychological Pricing (weight 0.20): {psych_score}/100 — missing checks: {psych_issues}
- Buy Box & Visibility (weight 0.15): {bbox_score}/100 — raw finding: {bbox_raw_finding}

Top organic competitors (position | price | rating | reviews):
{competitor_table}

Write seller-friendly narrative for each dimension. Be specific, actionable, and commercially minded.

CHARM PRICING RULE — apply this when writing the Psychological Pricing recommendation:
When suggesting a charm price ending (.99/.97/.95), check whether a significant left-digit
threshold is within ~2% of the current price. If so, present BOTH options and their tradeoff
so the seller can decide — do NOT pick one for them. Format the recommendation like:
  "Option A: $X,X08.99 — minimal margin impact (~$0.02/unit), adds .99 charm.
   Option B: $X,X99.99 — crosses the $X,X00 threshold for a stronger left-digit effect
   at ~$9 more margin cost; converts shoppers anchored on round-number budgets."
Only invoke this dual-option format when a left-digit threshold is genuinely nearby.
When no threshold is nearby, give a single clear recommendation as usual.

Return JSON only, no markdown:
{{
  "dimension_findings": [
    {{"label": "Competitive Position",  "score": {comp_score},  "weight": 0.40, "finding": "2-sentence market position narrative", "recommendation": "Specific pricing action to take"}},
    {{"label": "Price-Quality Signal",  "score": {pq_score},    "weight": 0.25, "finding": "Assessment of price vs quality signal alignment", "recommendation": "Specific action"}},
    {{"label": "Psychological Pricing", "score": {psych_score}, "weight": 0.20, "finding": "Assessment of current psychological pricing elements", "recommendation": "Top tactic to add"}},
    {{"label": "Buy Box & Visibility",  "score": {bbox_score},  "weight": 0.15, "finding": "Buy Box status assessment and impact", "recommendation": "Action to improve or protect"}}
  ],
  "quick_wins": ["Specific quick win with estimated impact 1", "Quick win 2", "Quick win 3"],
  "recommendations": ["Highest-impact recommendation", "Second recommendation", "Third recommendation"]{pro_fields}
}}

Keep each finding and recommendation to 1-2 sentences. Be specific — use actual prices and percentages when available. Respond ONLY with valid JSON."""


FULL_ICP_PROMPT = """You are a consumer psychology and Amazon marketplace expert. Generate a comprehensive Ideal Customer Profile (ICP) analysis for this product.

PRODUCT CONTEXT:
- ASIN: {asin}
- Title: {title}
- Category: {category}
- Brand: {brand}
- Bullet Points:
{bullets}

BASIC ICP FROM INITIAL ANALYSIS:
{basic_icp}

ANALYSIS SCORES:
- SEO: {seo_score}/100
- Rufus: {rufus_score}/100
- Conversion: {conversion_score}/100

TASK:
Build a deep, actionable ICP profile. Think about WHO buys this product, WHY they buy it, and WHAT language converts them.

OUTPUT FORMAT (JSON only, no markdown):
{{
  "demographics": [
    "Age 25-45, predominantly female (70%)",
    "Middle income ($50K-$90K household)",
    "College-educated",
    "Suburban US, health-conscious metro areas"
  ],
  "psychographics": [
    "Health-conscious and convenience-driven",
    "Busy professional or parent balancing wellness with packed schedule",
    "Interested in fitness, nutrition, and self-improvement",
    "Skeptical of quality — needs social proof before buying"
  ],
  "purchase_motivations": [
    "Solves a specific problem they've struggled with",
    "Peace of mind and feeling of control",
    "Recommended by peers or trusted community",
    "Replaces an inferior product they've already tried"
  ],
  "emotional_triggers": [
    "Fear of missing out on a better option",
    "Aspires to become a healthier version of themselves",
    "Frustrated that current solutions don't work",
    "Wants to provide the best for their family"
  ],
  "recommended_tone": "Confident and benefit-forward with specificity. This ICP responds to concrete claims over vague promises — lead with the primary benefit, follow with proof points.",
  "best_converting_keywords": [
    {{"keyword": "example keyword", "search_volume": 12000, "relevance": 0.95}},
    {{"keyword": "another keyword", "search_volume": 8500, "relevance": 0.88}},
    {{"keyword": "long tail phrase", "search_volume": 3200, "relevance": 0.75}}
  ]
}}

Rules:
- demographics, psychographics, purchase_motivations, emotional_triggers MUST be JSON arrays of strings (4-6 items each)
- recommended_tone MUST be a plain string
- best_converting_keywords: use "search_volume" (integer) and "relevance" (float 0.0-1.0)
- Provide 10-15 keywords ordered by search_volume descending
- Respond ONLY with valid JSON, no additional text or markdown."""
