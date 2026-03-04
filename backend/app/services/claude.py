"""
Claude API integration service
Uses Anthropic Claude API for title analysis and variation generation
"""
import json
import logging
import time
from typing import Optional
import anthropic
from pydantic import ValidationError

from app.config import get_settings
from app.prompts.templates import SYSTEM_PROMPT, SLIM_PROMPT, ANALYSIS_PROMPT, VARIATION_PROMPT, COMBINED_PROMPT, FULL_ICP_PROMPT, BULLETS_SLIM_PROMPT, BULLETS_COMBINED_PROMPT, DESCRIPTION_SLIM_PROMPT, DESCRIPTION_FULL_PROMPT, HERO_IMAGE_SLIM_PROMPT, HERO_IMAGE_FULL_PROMPT, PRICE_NARRATIVE_PROMPT
from app.services.types import AnalysisResult, VariationResult, VariationDetail, CombinedResult, ScoresOnlyResult, BulletsScoresOnlyResult, BulletsCombinedResult, DescScoresOnlyResult, DescCombinedResult, HeroImageScoresOnlyResult, HeroImageCombinedResult, PriceNarrativeResult

logger = logging.getLogger(__name__)


class ClaudeService:
    """Service for interacting with Claude API"""

    MAX_RETRIES = 3
    RETRY_DELAYS = [1, 2, 4]  # Exponential backoff: 1s, 2s, 4s

    # Token cost per million for claude-sonnet-4-6
    COST_INPUT_PER_M: float = 3.0    # $3.00 / 1M input tokens
    COST_OUTPUT_PER_M: float = 15.0  # $15.00 / 1M output tokens

    def __init__(self):
        settings = get_settings()
        self.client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.model = settings.CLAUDE_MODEL          # kept for backward compat
        self.model_basic = settings.CLAUDE_MODEL_BASIC
        self.model_full = settings.CLAUDE_MODEL_FULL
        self.max_tokens = settings.CLAUDE_MAX_TOKENS
        self.temperature = settings.CLAUDE_TEMPERATURE

    def _call_claude_with_retry(
        self,
        messages: list[dict],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        model: Optional[str] = None,
    ) -> tuple[str, dict]:
        """
        Call Claude API with retry logic and exponential backoff.
        Returns (response_text, usage_dict) where usage_dict has
        input_tokens, output_tokens, estimated_cost_usd.
        """
        temp = temperature if temperature is not None else self.temperature
        tokens = max_tokens if max_tokens is not None else self.max_tokens
        selected_model = model if model is not None else self.model

        for attempt in range(self.MAX_RETRIES):
            try:
                logger.debug(f"Claude API call attempt {attempt + 1}/{self.MAX_RETRIES}")

                message = self.client.messages.create(
                    model=selected_model,
                    max_tokens=tokens,
                    temperature=temp,
                    system=SYSTEM_PROMPT,
                    messages=messages,
                )

                response_text = message.content[0].text
                input_tokens = message.usage.input_tokens
                output_tokens = message.usage.output_tokens
                cost = (
                    (input_tokens / 1_000_000 * self.COST_INPUT_PER_M)
                    + (output_tokens / 1_000_000 * self.COST_OUTPUT_PER_M)
                )
                usage = {
                    "input_tokens": input_tokens,
                    "output_tokens": output_tokens,
                    "estimated_cost_usd": round(cost, 6),
                }
                logger.info(
                    f"Claude API call successful (attempt {attempt + 1}) "
                    f"in={input_tokens} out={output_tokens} cost=${cost:.4f}"
                )
                return response_text, usage

            except anthropic.RateLimitError as e:
                logger.warning(f"Rate limit error on attempt {attempt + 1}: {e}")
                if attempt < self.MAX_RETRIES - 1:
                    delay = self.RETRY_DELAYS[attempt]
                    logger.info(f"Retrying in {delay} seconds...")
                    time.sleep(delay)
                else:
                    logger.error("Max retries reached for rate limit")
                    raise

            except anthropic.APIConnectionError as e:
                logger.warning(f"API connection error on attempt {attempt + 1}: {e}")
                if attempt < self.MAX_RETRIES - 1:
                    delay = self.RETRY_DELAYS[attempt]
                    logger.info(f"Retrying in {delay} seconds...")
                    time.sleep(delay)
                else:
                    logger.error("Max retries reached for connection error")
                    raise

            except anthropic.APIError as e:
                logger.error(f"Claude API error: {e}")
                raise

            except Exception as e:
                logger.error(f"Unexpected error calling Claude: {e}")
                raise

        raise Exception("Failed to call Claude API after all retries")  # pragma: no cover

    def analyze_scores_only(
        self,
        title: str,
        asin: str,
    ) -> tuple[Optional[ScoresOnlyResult], dict]:
        """
        Slim single-call analysis for free-tier users.
        Returns (ScoresOnlyResult|None, usage_dict).
        Uses CLAUDE_MODEL_BASIC with max_tokens=2048 (~25-30s target).
        """
        empty_usage: dict = {"input_tokens": 0, "output_tokens": 0, "estimated_cost_usd": 0.0}
        try:
            prompt = SLIM_PROMPT.format(title=title, asin=asin)

            t0 = time.time()
            response_text, usage = self._call_claude_with_retry(
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=2048,
                model=self.model_basic,
            )
            elapsed = round(time.time() - t0, 2)
            logger.info(f"[PERF] Slim Claude call for ASIN {asin}: {elapsed}s")

            data = self._extract_json(response_text)
            if not data:
                logger.error("Could not extract JSON from slim response")
                return None, usage

            result = ScoresOnlyResult(**data)
            logger.info(
                f"Slim response validated: seo={result.seo_score} "
                f"rufus={result.rufus_score} conversion={result.conversion_score}"
            )
            return result, usage

        except ValidationError as e:
            logger.error(f"Slim response validation failed: {e}")
            return None, empty_usage
        except Exception as e:
            logger.error(f"Error in analyze_scores_only: {e}", exc_info=True)
            return None, empty_usage

    def analyze_title(
        self,
        title: str,
        asin: str,
        category: Optional[str] = None,
        brand: Optional[str] = None,
        price: Optional[str] = None,
        bullets: Optional[list[str]] = None,
        competitors: Optional[list[dict]] = None,
    ) -> Optional[AnalysisResult]:
        """
        Analyze a title using Claude API with structured prompts
        Returns AnalysisResult or None if parsing fails
        """
        try:
            # Format bullets
            bullets_str = self._format_bullets(bullets)

            # Format competitors
            competitors_str = self._format_competitors(competitors)

            # Build prompt from template
            prompt = ANALYSIS_PROMPT.format(
                title=title,
                asin=asin,
                category=category or "Unknown",
                brand=brand or "Unknown",
                price=price or "N/A",
                bullets=bullets_str,
                competitor_titles=competitors_str,
            )

            # Call Claude with retry logic
            response_text, _ = self._call_claude_with_retry(
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
            )

            logger.info(f"Claude analysis completed for ASIN: {asin}")

            # Parse and validate response
            return self._parse_and_validate_analysis(response_text)

        except Exception as e:
            logger.error(f"Error in analyze_title: {e}", exc_info=True)
            return None

    def generate_variations(
        self,
        title: str,
        asin: str,
        category: Optional[str] = None,
        brand: Optional[str] = None,
        bullets: Optional[list[str]] = None,
        seo_score: float = 0,
        rufus_score: float = 0,
        conversion_score: float = 0,
        main_issues: Optional[str] = None,
    ) -> Optional[VariationResult]:
        """
        Generate title variations using Claude API with structured prompts
        Returns VariationResult with 5 optimized variations or None if parsing fails
        """
        try:
            # Determine max characters based on category
            max_chars = self._get_max_chars(category)

            # Format bullets
            bullets_str = self._format_bullets(bullets)

            # Build prompt from template
            prompt = VARIATION_PROMPT.format(
                title=title,
                asin=asin,
                category=category or "Unknown",
                brand=brand or "Unknown",
                bullets=bullets_str,
                seo_score=seo_score,
                rufus_score=rufus_score,
                conversion_score=conversion_score,
                main_issues=main_issues or "None specified",
                max_chars=max_chars,
            )

            # Call Claude with retry logic (higher temperature for creativity)
            response_text, _ = self._call_claude_with_retry(
                messages=[{"role": "user", "content": prompt}],
                temperature=0.8,
            )

            logger.info(f"Claude variations generated for ASIN: {asin}")

            # Parse and validate response
            return self._parse_and_validate_variations(response_text)

        except Exception as e:
            logger.error(f"Error in generate_variations: {e}", exc_info=True)
            return None

    def analyze_and_generate(
        self,
        title: str,
        asin: str,
        category: Optional[str] = None,
        brand: Optional[str] = None,
        price: Optional[str] = None,
        bullets: Optional[list[str]] = None,
        competitors: Optional[list[dict]] = None,
    ) -> tuple[Optional[CombinedResult], dict]:
        """
        Analyze title AND generate 5 variations in a single Claude API call.
        Uses CLAUDE_MODEL_FULL. Returns (CombinedResult|None, usage_dict).
        """
        empty_usage: dict = {"input_tokens": 0, "output_tokens": 0, "estimated_cost_usd": 0.0}
        try:
            max_chars = self._get_max_chars(category)
            bullets_str = self._format_bullets(bullets)
            competitors_str = self._format_competitors(competitors)

            prompt = COMBINED_PROMPT.format(
                title=title,
                asin=asin,
                category=category or "Unknown",
                brand=brand or "Unknown",
                price=price or "N/A",
                bullets=bullets_str,
                competitor_titles=competitors_str,
                max_chars=max_chars,
            )

            t0 = time.time()
            response_text, usage = self._call_claude_with_retry(
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=8192,
                model=self.model_full,
            )
            elapsed = round(time.time() - t0, 2)
            logger.info(f"[PERF] Combined Claude call for ASIN {asin}: {elapsed}s")

            return self._parse_and_validate_combined(response_text), usage

        except Exception as e:
            logger.error(f"Error in analyze_and_generate: {e}", exc_info=True)
            return None, empty_usage

    def generate_full_icp(
        self,
        title: str,
        asin: str,
        category: Optional[str] = None,
        brand: Optional[str] = None,
        bullets: Optional[list[str]] = None,
        basic_icp: Optional[str] = None,
        seo_score: float = 0,
        rufus_score: float = 0,
        conversion_score: float = 0,
    ) -> Optional[dict]:
        """
        Generate deep ICP analysis for Pro users.
        Returns parsed JSON dict or None if parsing fails.
        """
        try:
            bullets_str = self._format_bullets(bullets)

            prompt = FULL_ICP_PROMPT.format(
                asin=asin,
                title=title,
                category=category or "Unknown",
                brand=brand or "Unknown",
                bullets=bullets_str,
                basic_icp=basic_icp or "Not determined",
                seo_score=seo_score,
                rufus_score=rufus_score,
                conversion_score=conversion_score,
            )

            response_text, _ = self._call_claude_with_retry(
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                model=self.model_full,
            )

            data = self._extract_json(response_text)
            if data:
                logger.info(f"Full ICP generated for ASIN: {asin}")
            return data

        except Exception as e:
            logger.error(f"Error in generate_full_icp: {e}", exc_info=True)
            return None

    def analyze_bullets_slim(
        self,
        asin: str,
        bullets: list[str],
    ) -> tuple[Optional[BulletsScoresOnlyResult], dict]:
        """
        Slim single-call bullet analysis for free-tier users.
        Returns (BulletsScoresOnlyResult|None, usage_dict).
        """
        empty_usage: dict = {"input_tokens": 0, "output_tokens": 0, "estimated_cost_usd": 0.0}
        try:
            bullet_count = len(bullets)
            bullets_str = self._format_bullets(bullets)
            prompt = BULLETS_SLIM_PROMPT.format(
                asin=asin,
                bullets=bullets_str,
                bullet_count=bullet_count,
            )

            t0 = time.time()
            response_text, usage = self._call_claude_with_retry(
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=2048 + (bullet_count - 5) * 200 if bullet_count > 5 else 2048,
                model=self.model_basic,
            )
            elapsed = round(time.time() - t0, 2)
            logger.info(f"[PERF] Slim bullets call for ASIN {asin}: {elapsed}s")

            data = self._extract_json(response_text)
            if not data:
                logger.error("Could not extract JSON from slim bullets response")
                return None, usage

            result = BulletsScoresOnlyResult(**data)
            returned_count = len(result.bullet_scores)
            if returned_count != bullet_count:
                logger.warning(
                    f"Slim bullets: requested {bullet_count} bullet scores, "
                    f"Claude returned {returned_count}"
                )
            logger.info(f"Slim bullets response validated: overall={result.overall_score}")
            return result, usage

        except Exception as e:
            logger.error(f"Error in analyze_bullets_slim: {e}", exc_info=True)
            return None, empty_usage

    def analyze_bullets_full(
        self,
        asin: str,
        title: str,
        bullets: list[str],
        category: Optional[str] = None,
        brand: Optional[str] = None,
    ) -> tuple[Optional[BulletsCombinedResult], dict]:
        """
        Full pro-tier bullet analysis: scores + 5 optimized variation sets.
        Returns (BulletsCombinedResult|None, usage_dict).
        """
        empty_usage: dict = {"input_tokens": 0, "output_tokens": 0, "estimated_cost_usd": 0.0}
        try:
            bullet_count = len(bullets)
            bullets_str = self._format_bullets(bullets)
            prompt = BULLETS_COMBINED_PROMPT.format(
                asin=asin,
                title=title,
                category=category or "Unknown",
                brand=brand or "Unknown",
                bullets=bullets_str,
                bullet_count=bullet_count,
            )

            t0 = time.time()
            response_text, usage = self._call_claude_with_retry(
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=8192 + (bullet_count - 5) * 500 if bullet_count > 5 else 8192,
                model=self.model_full,
            )
            elapsed = round(time.time() - t0, 2)
            logger.info(f"[PERF] Full bullets call for ASIN {asin}: {elapsed}s")

            data = self._extract_json(response_text)
            if not data:
                logger.error("Could not extract JSON from full bullets response")
                return None, usage

            result = BulletsCombinedResult(**data)
            returned_scores = len(result.bullet_scores)
            if returned_scores != bullet_count:
                logger.warning(
                    f"Full bullets: requested {bullet_count} bullet scores, "
                    f"Claude returned {returned_scores}"
                )
            for var in result.variations:
                if len(var.bullets) != bullet_count:
                    logger.warning(
                        f"Full bullets variation '{var.id}': expected {bullet_count} bullets, "
                        f"got {len(var.bullets)}"
                    )
            logger.info(
                f"Full bullets response validated: overall={result.overall_score} "
                f"variations={len(result.variations)}"
            )
            return result, usage

        except Exception as e:
            logger.error(f"Error in analyze_bullets_full: {e}", exc_info=True)
            return None, empty_usage

    def analyze_description_slim(
        self,
        asin: str,
        description: str,
        char_count: int,
        title: str = "",
        category: Optional[str] = None,
        brand: Optional[str] = None,
        icp_summary: Optional[str] = None,
    ) -> tuple[Optional[DescScoresOnlyResult], dict]:
        """
        Slim free-tier description analysis: 5-dimension scores + qualitative feedback.
        Returns (DescScoresOnlyResult|None, usage_dict).
        """
        empty_usage: dict = {"input_tokens": 0, "output_tokens": 0, "estimated_cost_usd": 0.0}
        try:
            icp_section = f', icp_summary="{icp_summary}"' if icp_summary else ""
            icp_used_str = "true" if icp_summary else "false"
            icp_scoring_note = (
                f'language/tone/pain-points match for target buyer: {icp_summary}'
                if icp_summary
                else "generic Amazon buyer fit — tone, pain-point clarity, purchase motivation signals"
            )

            prompt = DESCRIPTION_SLIM_PROMPT.format(
                asin=asin,
                description_plain=description,
                title=title or "Not provided",
                category=category or "Unknown",
                brand=brand or "Unknown",
                icp_section=icp_section,
                char_count=char_count,
                icp_used=icp_used_str,
                icp_scoring_note=icp_scoring_note,
            )

            t0 = time.time()
            response_text, usage = self._call_claude_with_retry(
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=2500,
                model=self.model_basic,
            )
            elapsed = round(time.time() - t0, 2)
            logger.info(f"[PERF] Slim description call for ASIN {asin}: {elapsed}s")

            data = self._extract_json(response_text)
            if not data:
                logger.error("Could not extract JSON from slim description response")
                return None, usage

            result = DescScoresOnlyResult(**data)
            logger.info(f"Slim description response validated: overall={result.overall_score}")
            return result, usage

        except Exception as e:
            logger.error(f"Error in analyze_description_slim: {e}", exc_info=True)
            return None, empty_usage

    def analyze_description_full(
        self,
        asin: str,
        description: str,
        char_count: int,
        structure_signals: str,
        title: str = "",
        category: Optional[str] = None,
        brand: Optional[str] = None,
        bullets: Optional[list[str]] = None,
        icp_data: Optional[dict] = None,
    ) -> tuple[Optional[DescCombinedResult], dict]:
        """
        Full pro-tier description analysis: 5-dimension scores + 3 rewrite variations.
        Returns (DescCombinedResult|None, usage_dict).
        """
        empty_usage: dict = {"input_tokens": 0, "output_tokens": 0, "estimated_cost_usd": 0.0}
        try:
            bullets_section = ""
            if bullets:
                bullets_str = self._format_bullets(bullets)
                bullets_section = f"- Existing Bullets (check for keyword overlap/gaps):\n{bullets_str}\n"

            icp_section = ""
            icp_used_str = "false"
            icp_scoring_note = "generic Amazon buyer fit — tone, pain-point clarity, purchase motivation signals"
            if icp_data:
                icp_summary = icp_data.get("recommended_tone", "") or str(icp_data)[:200]
                icp_section = f"- ICP Data: {icp_summary}\n"
                icp_used_str = "true"
                icp_scoring_note = "language/tone/pain-points match for the provided ICP persona"

            prompt = DESCRIPTION_FULL_PROMPT.format(
                asin=asin,
                title=title or "Not provided",
                category=category or "Unknown",
                brand=brand or "Unknown",
                bullets_section=bullets_section,
                icp_section=icp_section,
                description_plain=description,
                char_count=char_count,
                structure_signals=structure_signals,
                icp_used=icp_used_str,
                icp_scoring_note=icp_scoring_note,
            )

            t0 = time.time()
            response_text, usage = self._call_claude_with_retry(
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=8192,
                model=self.model_full,
            )
            elapsed = round(time.time() - t0, 2)
            logger.info(f"[PERF] Full description call for ASIN {asin}: {elapsed}s")

            data = self._extract_json(response_text)
            if not data:
                logger.error("Could not extract JSON from full description response")
                return None, usage

            result = DescCombinedResult(**data)
            logger.info(
                f"Full description response validated: overall={result.overall_score} "
                f"variations={len(result.variations)}"
            )
            return result, usage

        except Exception as e:
            logger.error(f"Error in analyze_description_full: {e}", exc_info=True)
            return None, empty_usage

    def analyze_hero_image_slim(
        self,
        asin: str,
        category: Optional[str],
        brand: Optional[str],
        title: Optional[str],
        zoom_eligible: bool,
        hero_hires_url: Optional[str],
        hero_alt: Optional[str],
        image_count: int,
        video_count: int,
        has_video: bool,
        has_360: bool,
        has_aplus: bool,
        gallery_alt_texts: list[str],
    ) -> tuple[Optional[HeroImageScoresOnlyResult], dict]:
        """
        Slim free-tier hero image analysis: 5-dimension scores + critical issues + 1 basic prompt.
        Returns (HeroImageScoresOnlyResult|None, usage_dict).
        """
        empty_usage: dict = {"input_tokens": 0, "output_tokens": 0, "estimated_cost_usd": 0.0}
        try:
            gallery_score = self._compute_gallery_score(image_count, has_video, has_360)
            hires_note = self._format_hires_note(zoom_eligible, hero_hires_url)
            gallery_alts_str = self._format_gallery_alts(gallery_alt_texts)
            video_note = f"{video_count} video thumbnail(s) detected in gallery" if video_count > 0 else "No video thumbnails detected in gallery"

            prompt = HERO_IMAGE_SLIM_PROMPT.format(
                asin=asin,
                title=title or "Not provided",
                category=category or "Unknown",
                brand=brand or "Unknown",
                zoom_eligible=zoom_eligible,
                hires_note=hires_note,
                hero_alt=hero_alt or "",
                image_count=image_count,
                video_count=video_count,
                video_note=video_note,
                has_video=has_video,
                has_360=has_360,
                has_aplus=has_aplus,
                gallery_alts_str=gallery_alts_str,
                gallery_score=gallery_score,
            )

            t0 = time.time()
            response_text, usage = self._call_claude_with_retry(
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=2500,
                model=self.model_basic,
            )
            elapsed = round(time.time() - t0, 2)
            logger.info(f"[PERF] Slim hero image call for ASIN {asin}: {elapsed}s")

            data = self._extract_json(response_text)
            if not data:
                logger.error("Could not extract JSON from slim hero image response")
                return None, usage

            result = HeroImageScoresOnlyResult(**data)
            # Recompute overall_score deterministically from dimension weights × scores.
            # Claude's arithmetic is unreliable; this ensures the displayed score always
            # matches: overall = Zoom×0.30 + Gallery×0.25 + AltText×0.20 + APlus×0.15 + Secondary×0.10
            if result.dimensions:
                computed = round(sum(d.score * d.weight for d in result.dimensions))
                result = result.model_copy(update={"overall_score": float(computed)})
            logger.info(f"Slim hero image response validated: overall={result.overall_score}")
            return result, usage

        except Exception as e:
            logger.error(f"Error in analyze_hero_image_slim: {e}", exc_info=True)
            return None, empty_usage

    def analyze_hero_image_full(
        self,
        asin: str,
        category: Optional[str],
        brand: Optional[str],
        title: Optional[str],
        zoom_eligible: bool,
        hero_hires_url: Optional[str],
        hero_alt: Optional[str],
        image_count: int,
        video_count: int,
        has_video: bool,
        has_360: bool,
        has_aplus: bool,
        gallery_alt_texts: list[str],
        icp_data: Optional[dict] = None,
    ) -> tuple[Optional[HeroImageCombinedResult], dict]:
        """
        Full pro-tier hero image analysis: scores + 3 variation prompts with nano_banana.
        Returns (HeroImageCombinedResult|None, usage_dict).
        """
        empty_usage: dict = {"input_tokens": 0, "output_tokens": 0, "estimated_cost_usd": 0.0}
        try:
            gallery_score = self._compute_gallery_score(image_count, has_video, has_360)
            hires_note = self._format_hires_note(zoom_eligible, hero_hires_url)
            gallery_alts_str = self._format_gallery_alts(gallery_alt_texts)
            video_note = f"{video_count} video thumbnail(s) detected in gallery" if video_count > 0 else "No video thumbnails detected in gallery"

            icp_section = ""
            lifestyle_hint = " Use category-appropriate demographic context for the lifestyle scenario."
            if icp_data:
                demo = (icp_data.get("demographics") or [""])[0]
                tone = icp_data.get("recommended_tone", "")[:120]
                icp_section = f"\n- ICP Data: {demo} | Tone: {tone}"
                if demo:
                    lifestyle_hint = f" Target buyer: {demo}."

            prompt = HERO_IMAGE_FULL_PROMPT.format(
                asin=asin,
                title=title or "Not provided",
                category=category or "Unknown",
                brand=brand or "Unknown",
                icp_section=icp_section,
                zoom_eligible=zoom_eligible,
                hires_note=hires_note,
                hero_alt=hero_alt or "",
                image_count=image_count,
                video_count=video_count,
                video_note=video_note,
                has_video=has_video,
                has_360=has_360,
                has_aplus=has_aplus,
                gallery_alts_str=gallery_alts_str,
                gallery_score=gallery_score,
                lifestyle_hint=lifestyle_hint,
            )

            t0 = time.time()
            response_text, usage = self._call_claude_with_retry(
                messages=[{"role": "user", "content": prompt}],
                temperature=0,
                max_tokens=8192,
                model=self.model_full,
            )
            elapsed = round(time.time() - t0, 2)
            logger.info(f"[PERF] Full hero image call for ASIN {asin}: {elapsed}s")

            data = self._extract_json(response_text)
            if not data:
                logger.error("Could not extract JSON from full hero image response")
                return None, usage

            result = HeroImageCombinedResult(**data)
            # Recompute overall_score deterministically — same formula as slim call.
            if result.dimensions:
                computed = round(sum(d.score * d.weight for d in result.dimensions))
                result = result.model_copy(update={"overall_score": float(computed)})
            logger.info(
                f"Full hero image response validated: overall={result.overall_score} "
                f"prompts={len(result.prompts)}"
            )
            return result, usage

        except Exception as e:
            logger.error(f"Error in analyze_hero_image_full: {e}", exc_info=True)
            return None, empty_usage

    def generate_price_narrative(
        self,
        asin: str,
        title: str | None,
        category: str | None,
        brand: str | None,
        current_price: float | None,
        price_percentile: float | None,
        market_median: float | None,
        buy_box_status: str,
        dimension_scores: dict,
        competitor_summary: list[dict],
        icp_data: dict | None = None,
        is_full: bool = False,
    ) -> tuple[Optional[PriceNarrativeResult], dict]:
        """
        Generate price narrative via Claude. All 4 dimension scores are pre-computed
        in Python; Claude writes the finding/recommendation text only.
        Returns (PriceNarrativeResult|None, usage_dict).
        """
        empty_usage: dict = {"input_tokens": 0, "output_tokens": 0, "estimated_cost_usd": 0.0}
        try:
            # ICP section
            icp_section = ""
            if icp_data:
                demo = (icp_data.get("demographics") or [""])[0]
                tone = icp_data.get("recommended_tone", "")[:120]
                parts = [p for p in [demo, tone] if p]
                if parts:
                    icp_section = f"\nICP: {' | '.join(parts)}"

            # Competitor table
            rows = []
            for c in competitor_summary[:10]:
                pos = c.get("position", "?")
                ct = (c.get("title") or "Unknown")[:40]
                pn = c.get("price_numeric")
                price_str = f"${pn:.2f}" if pn else "N/A"
                rating = c.get("rating")
                rating_str = str(rating) if rating else "N/A"
                reviews = c.get("review_count") or "N/A"
                rows.append(f"  {pos}. {ct} | {price_str} | {rating_str}★ | {reviews} reviews")
            competitor_table = "\n".join(rows) if rows else "No competitor data available"

            # Pro-only fields appended to JSON schema
            pro_fields = ""
            if is_full:
                pro_fields = (
                    ',\n  "psychological_tactics": ["specific tactic 1", "tactic 2", "tactic 3"],'
                    '\n  "price_recommendation": {"suggested_price": "$X.XX", "suggested_price_numeric": 0.0,'
                    ' "confidence": "medium", "rationale": "2-3 sentence rationale.", "expected_impact": "Expected impact."},'
                    '\n  "icp_price_perception": "ICP price perception narrative or null",'
                    '\n  "subscribe_save_strategy": "S&S recommendation or null"'
                )

            comp_score = dimension_scores.get("comp_score", 50)
            comp_raw_finding = dimension_scores.get("comp_raw_finding", "Insufficient data")
            pq_score = dimension_scores.get("pq_score", 50)
            pq_raw_finding = dimension_scores.get("pq_raw_finding", "Insufficient data")
            psych_score = dimension_scores.get("psych_score", 0)
            psych_issues = dimension_scores.get("psych_issues", [])
            psych_issues_str = ", ".join(psych_issues) if psych_issues else "none detected"
            bbox_score = dimension_scores.get("bbox_score", 40)
            bbox_raw_finding = dimension_scores.get("bbox_raw_finding", "Unknown status")

            prompt = PRICE_NARRATIVE_PROMPT.format(
                asin=asin,
                title=title or "Unknown",
                category=category or "Unknown",
                brand=brand or "Unknown",
                current_price=f"${current_price:.2f}" if current_price else "Unknown",
                market_median=f"${market_median:.2f}" if market_median else "N/A",
                percentile=f"{price_percentile:.0f}" if price_percentile is not None else "N/A",
                buy_box_status=buy_box_status,
                icp_section=icp_section,
                comp_score=comp_score,
                comp_raw_finding=comp_raw_finding,
                pq_score=pq_score,
                pq_raw_finding=pq_raw_finding,
                psych_score=psych_score,
                psych_issues=psych_issues_str,
                bbox_score=bbox_score,
                bbox_raw_finding=bbox_raw_finding,
                competitor_table=competitor_table,
                pro_fields=pro_fields,
            )

            selected_model = self.model_full if is_full else self.model_basic
            max_tok = 3500 if is_full else 1800

            t0 = time.time()
            response_text, usage = self._call_claude_with_retry(
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=max_tok,
                model=selected_model,
            )
            elapsed = round(time.time() - t0, 2)
            logger.info(f"[PERF] Price narrative call for ASIN {asin}: {elapsed}s (is_full={is_full})")

            data = self._extract_json(response_text)
            if not data:
                logger.error("Could not extract JSON from price narrative response")
                return None, usage

            result = PriceNarrativeResult(**data)
            logger.info(f"Price narrative response validated for ASIN: {asin}")
            return result, usage

        except Exception as e:
            logger.error(f"Error in generate_price_narrative: {e}", exc_info=True)
            return None, empty_usage

    # Helper methods

    def _format_bullets(self, bullets: Optional[list[str]]) -> str:
        """Format bullet points for prompt"""
        if not bullets:
            return "None provided"

        formatted = []
        for i, bullet in enumerate(bullets, 1):
            formatted.append(f"  {i}. {bullet}")
        return "\n".join(formatted)

    def _format_competitors(self, competitors: Optional[list[dict]]) -> str:
        """Format competitor titles for prompt"""
        if not competitors:
            return "None provided"

        formatted = []
        for comp in competitors[:5]:
            title = comp.get("title", "")
            position = comp.get("position", "?")
            formatted.append(f"  {position}. {title}")
        return "\n".join(formatted)

    def _get_max_chars(self, category: Optional[str]) -> int:
        """Get maximum character limit based on category"""
        if not category:
            return 200

        cat_lower = category.lower()
        if any(word in cat_lower for word in ["clothing", "apparel", "fashion", "shoes"]):
            return 80

        return 200

    def _compute_gallery_score(self, image_count: int, has_video: bool, has_360: bool) -> int:
        """Deterministic Gallery Completeness score per spec formula."""
        base = round(image_count / 9 * 70)
        score = base + (20 if has_video else 0) + (10 if has_360 else 0)
        return int(min(100, max(10, score)))

    def _format_hires_note(self, zoom_eligible: bool, hero_hires_url: Optional[str]) -> str:
        if hero_hires_url:
            return " (high-res URL confirmed)"
        if zoom_eligible:
            return " (zoom trigger detected, no confirmed high-res URL)"
        return " (no zoom trigger found)"

    def _format_gallery_alts(self, gallery_alt_texts: list[str]) -> str:
        if not gallery_alt_texts:
            return "None (no alt texts found in gallery)"
        items = [f'"{a}"' for a in gallery_alt_texts[:9] if a.strip()]
        return "; ".join(items) if items else "None (all empty)"

    def _dedup_variation_strategies(self, result):
        """
        If Claude returns duplicate strategy names in title variations, append ' 2', ' 3', etc.
        Works with VariationResult and CombinedResult (both have a .variations list with .strategy).
        """
        seen: dict[str, int] = {}
        for var in result.variations:
            name = var.strategy
            if name in seen:
                seen[name] += 1
                deduped = f"{name} {seen[name]}"
                logger.warning(f"Duplicate variation strategy '{name}' -> renamed to '{deduped}'")
                var.strategy = deduped
            else:
                seen[name] = 1
        return result

    def _extract_json(self, text: str) -> Optional[dict]:
        """Extract JSON from text that may contain markdown or extra content"""
        try:
            # Try to find JSON between curly braces
            start_idx = text.find("{")
            end_idx = text.rfind("}") + 1

            if start_idx >= 0 and end_idx > start_idx:
                json_str = text[start_idx:end_idx]
                return json.loads(json_str)

            logger.warning("No JSON found in response text")
            return None

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON: {e}")
            logger.debug(f"Response text: {text[:500]}...")
            return None

    def _parse_and_validate_analysis(self, response_text: str) -> Optional[AnalysisResult]:
        """Parse and validate analysis response using Pydantic"""
        try:
            data = self._extract_json(response_text)
            if not data:
                logger.error("Could not extract JSON from analysis response")
                return None

            # Validate with Pydantic
            result = AnalysisResult(**data)
            logger.info("Analysis response validated successfully")
            return result

        except ValidationError as e:
            logger.error(f"Analysis response validation failed: {e}")
            logger.debug(f"Response data: {data}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error parsing analysis: {e}")
            return None

    def _parse_and_validate_variations(self, response_text: str) -> Optional[VariationResult]:
        """Parse and validate variations response using Pydantic"""
        try:
            data = self._extract_json(response_text)
            if not data:
                logger.error("Could not extract JSON from variations response")
                return None

            # Validate with Pydantic
            result = VariationResult(**data)
            result = self._dedup_variation_strategies(result)
            logger.info(f"Variations response validated successfully ({len(result.variations)} variations)")
            return result

        except ValidationError as e:
            logger.error(f"Variations response validation failed: {e}")
            logger.debug(f"Response data: {data}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error parsing variations: {e}")
            return None

    def _parse_and_validate_combined(self, response_text: str) -> Optional[CombinedResult]:
        """Parse and validate combined analysis+variations response using Pydantic"""
        try:
            data = self._extract_json(response_text)
            if not data:
                logger.error("Could not extract JSON from combined response")
                return None

            result = CombinedResult(**data)
            result = self._dedup_variation_strategies(result)
            logger.info(
                f"Combined response validated: "
                f"seo={result.seo_score} rufus={result.rufus_score} "
                f"conversion={result.conversion_score} variations={len(result.variations)}"
            )
            return result

        except ValidationError as e:
            logger.error(f"Combined response validation failed: {e}")
            logger.debug(f"Response data: {data}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error parsing combined response: {e}")
            return None


# Singleton instance
_claude_service: Optional[ClaudeService] = None


def get_claude_service() -> ClaudeService:
    """Get or create Claude service instance"""
    global _claude_service
    if _claude_service is None:
        _claude_service = ClaudeService()
    return _claude_service
