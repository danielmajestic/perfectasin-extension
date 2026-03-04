"""
SEO and Rufus scoring logic
Calculates scores based on specific criteria and weights
"""
import re
import logging
from typing import Optional
from app.models.response import ScoreBreakdown

logger = logging.getLogger(__name__)


class ScoringService:
    """Service for calculating SEO and Rufus scores"""

    # SEO Score Weights
    SEO_WEIGHTS = {
        "length": 0.20,  # 20% - Length optimization (150-200 optimal)
        "keyword_placement": 0.25,  # 25% - Keywords in first 80 chars
        "readability": 0.15,  # 15% - Not keyword stuffed
        "compliance": 0.25,  # 25% - Follows Amazon guidelines
        "brand_position": 0.15,  # 15% - Brand at beginning
    }

    # Rufus Score Weights
    RUFUS_WEIGHTS = {
        "natural_language": 0.25,  # 25% - Natural language flow
        "long_tail": 0.25,  # 25% - Long-tail intent phrases
        "semantic_coverage": 0.25,  # 25% - Semantic keyword coverage
        "ai_parseability": 0.25,  # 25% - Easy for AI to parse
    }

    # Character limits by category
    CATEGORY_LIMITS = {
        "clothing": 80,
        "apparel": 80,
        "fashion": 80,
        "default": 200,
    }

    def calculate_seo_score(
        self,
        title: str,
        category: Optional[str] = None,
        brand: Optional[str] = None,
        compliance_issues: Optional[list] = None,
    ) -> tuple[float, list[ScoreBreakdown]]:
        """
        Calculate SEO score with detailed breakdown
        Returns (score, breakdown)
        """
        breakdown = []

        # 1. Length Score (20%)
        length_score, length_feedback = self._score_length(title, category)
        breakdown.append(
            ScoreBreakdown(
                category="Length Optimization",
                score=length_score,
                weight=self.SEO_WEIGHTS["length"],
                feedback=length_feedback,
            )
        )

        # 2. Keyword Placement Score (25%)
        keyword_score, keyword_feedback = self._score_keyword_placement(title, brand)
        breakdown.append(
            ScoreBreakdown(
                category="Keyword Placement",
                score=keyword_score,
                weight=self.SEO_WEIGHTS["keyword_placement"],
                feedback=keyword_feedback,
            )
        )

        # 3. Readability Score (15%)
        readability_score, readability_feedback = self._score_readability(title)
        breakdown.append(
            ScoreBreakdown(
                category="Readability",
                score=readability_score,
                weight=self.SEO_WEIGHTS["readability"],
                feedback=readability_feedback,
            )
        )

        # 4. Compliance Score (25%)
        compliance_score, compliance_feedback = self._score_compliance(compliance_issues)
        breakdown.append(
            ScoreBreakdown(
                category="Compliance",
                score=compliance_score,
                weight=self.SEO_WEIGHTS["compliance"],
                feedback=compliance_feedback,
            )
        )

        # 5. Brand Position Score (15%)
        brand_score, brand_feedback = self._score_brand_position(title, brand)
        breakdown.append(
            ScoreBreakdown(
                category="Brand Position",
                score=brand_score,
                weight=self.SEO_WEIGHTS["brand_position"],
                feedback=brand_feedback,
            )
        )

        # Calculate weighted total
        total_score = sum(item.score * item.weight for item in breakdown)

        return round(total_score, 1), breakdown

    def calculate_rufus_score(
        self,
        title: str,
        bullets: Optional[list[str]] = None,
    ) -> tuple[float, list[ScoreBreakdown]]:
        """
        Calculate Rufus AI compatibility score with detailed breakdown
        Returns (score, breakdown)
        """
        breakdown = []

        # 1. Natural Language Flow (25%)
        natural_score, natural_feedback = self._score_natural_language(title)
        breakdown.append(
            ScoreBreakdown(
                category="Natural Language Flow",
                score=natural_score,
                weight=self.RUFUS_WEIGHTS["natural_language"],
                feedback=natural_feedback,
            )
        )

        # 2. Long-tail Intent Phrases (25%)
        long_tail_score, long_tail_feedback = self._score_long_tail(title)
        breakdown.append(
            ScoreBreakdown(
                category="Long-tail Intent",
                score=long_tail_score,
                weight=self.RUFUS_WEIGHTS["long_tail"],
                feedback=long_tail_feedback,
            )
        )

        # 3. Semantic Keyword Coverage (25%)
        semantic_score, semantic_feedback = self._score_semantic_coverage(title, bullets)
        breakdown.append(
            ScoreBreakdown(
                category="Semantic Coverage",
                score=semantic_score,
                weight=self.RUFUS_WEIGHTS["semantic_coverage"],
                feedback=semantic_feedback,
            )
        )

        # 4. AI Parseability (25%)
        parseability_score, parseability_feedback = self._score_ai_parseability(title)
        breakdown.append(
            ScoreBreakdown(
                category="AI Parseability",
                score=parseability_score,
                weight=self.RUFUS_WEIGHTS["ai_parseability"],
                feedback=parseability_feedback,
            )
        )

        # Calculate weighted total
        total_score = sum(item.score * item.weight for item in breakdown)

        return round(total_score, 1), breakdown

    # SEO Scoring Methods

    def _score_length(self, title: str, category: Optional[str]) -> tuple[float, str]:
        """Score title length (optimal: 150-200 chars, or 80 for clothing)"""
        length = len(title)
        limit = self._get_category_limit(category)

        if limit == 80:
            # Clothing category
            if length <= 80:
                score = 100
                feedback = f"Perfect length for clothing category ({length} chars)"
            else:
                score = max(0, 100 - ((length - 80) * 2))
                feedback = f"Exceeds clothing limit ({length}/{limit} chars) - will be truncated"
        else:
            # Other categories (optimal: 150-200)
            if 150 <= length <= 200:
                score = 100
                feedback = f"Optimal length ({length} chars)"
            elif length < 150:
                score = 100 - ((150 - length) * 0.5)
                feedback = f"Could be longer for better SEO ({length}/150-200 chars)"
            else:
                score = max(0, 100 - ((length - 200) * 2))
                feedback = f"Too long ({length}/200 chars) - may be truncated"

        return round(score, 1), feedback

    def _score_keyword_placement(self, title: str, brand: Optional[str]) -> tuple[float, str]:
        """Score keyword placement in first 80 chars"""
        first_80 = title[:80].lower()
        words = first_80.split()

        if len(words) < 3:
            return 30.0, "Title is too short for effective keyword placement"

        # Check for key elements in first 80 chars
        score = 60  # Base score

        # Bonus for having brand in first 80
        if brand and brand.lower() in first_80:
            score += 20

        # Bonus for descriptive words (nouns, adjectives)
        descriptive_patterns = [
            r'\b(wireless|portable|premium|professional|compact|lightweight|heavy-duty)\b',
            r'\b(large|small|medium|extra|ultra|super|high|low)\b',
            r'\b(black|white|blue|red|green|silver|gold)\b',
        ]

        for pattern in descriptive_patterns:
            if re.search(pattern, first_80, re.IGNORECASE):
                score += 5

        score = min(100, score)
        feedback = f"First 80 chars contain {len(words)} words"
        if brand and brand.lower() in first_80:
            feedback += ", including brand name"

        return round(score, 1), feedback

    def _score_readability(self, title: str) -> tuple[float, str]:
        """Score readability - not keyword stuffed"""
        words = title.lower().split()
        if len(words) == 0:
            return 0.0, "Empty title"

        # Count repeated words
        word_counts = {}
        for word in words:
            if len(word) > 3:  # Only count meaningful words
                word_counts[word] = word_counts.get(word, 0) + 1

        max_repetition = max(word_counts.values()) if word_counts else 1
        total_words = len(words)

        # Penalize excessive repetition
        score = 100
        if max_repetition > 2:
            score -= (max_repetition - 2) * 15

        # Penalize if too many commas/dashes (indicates list-like structure)
        separators = title.count(',') + title.count('-') + title.count('|')
        if separators > 5:
            score -= (separators - 5) * 5

        # Check for proper spacing
        if '  ' in title:
            score -= 10

        score = max(0, score)

        if score >= 80:
            feedback = "Good readability - natural flow"
        elif score >= 60:
            feedback = "Moderate readability - some repetition detected"
        else:
            feedback = "Poor readability - excessive keyword stuffing"

        return round(score, 1), feedback

    def _score_compliance(self, compliance_issues: Optional[list]) -> tuple[float, str]:
        """Score compliance based on issues found"""
        if not compliance_issues:
            return 100.0, "No compliance issues found"

        error_count = len([i for i in compliance_issues if i.get("severity") == "error"])
        warning_count = len([i for i in compliance_issues if i.get("severity") == "warning"])

        score = 100 - (error_count * 20) - (warning_count * 5)
        score = max(0, score)

        feedback = f"{error_count} error(s), {warning_count} warning(s)"
        return round(score, 1), feedback

    def _score_brand_position(self, title: str, brand: Optional[str]) -> tuple[float, str]:
        """Score brand position (should be at beginning)"""
        if not brand:
            return 70.0, "Brand unknown - cannot verify position"

        brand_lower = brand.lower()
        title_lower = title.lower()

        if not brand_lower in title_lower:
            return 30.0, "Brand not found in title"

        # Check if brand is in first 20 characters
        first_20 = title_lower[:20]
        if brand_lower in first_20:
            return 100.0, f"Brand '{brand}' is well-positioned at the beginning"

        # Check if brand is in first half
        midpoint = len(title) // 2
        if brand_lower in title_lower[:midpoint]:
            return 70.0, f"Brand '{brand}' is in first half of title"

        return 40.0, f"Brand '{brand}' should be positioned earlier"

    # Rufus Scoring Methods

    def _score_natural_language(self, title: str) -> tuple[float, str]:
        """Score natural language flow for AI"""
        score = 70  # Base score

        # Bonus for complete phrases
        if any(word in title.lower() for word in ['with', 'for', 'and', 'plus']):
            score += 10

        # Penalty for all-caps words (except acronyms)
        all_caps_words = re.findall(r'\b[A-Z]{4,}\b', title)
        if len(all_caps_words) > 2:
            score -= 15

        # Penalty for excessive special characters
        special_chars = len(re.findall(r'[^\w\s-]', title))
        if special_chars > 3:
            score -= 10

        # Bonus for natural word order
        words = title.split()
        if len(words) >= 3:
            score += 10

        score = max(0, min(100, score))

        if score >= 80:
            feedback = "Excellent natural language flow"
        elif score >= 60:
            feedback = "Good flow with minor improvements possible"
        else:
            feedback = "Robotic or list-like structure - needs more natural phrasing"

        return round(score, 1), feedback

    def _score_long_tail(self, title: str) -> tuple[float, str]:
        """Score presence of long-tail intent phrases"""
        long_tail_indicators = [
            r'\bfor\s+\w+',  # "for home", "for gaming"
            r'\bwith\s+\w+',  # "with bluetooth", "with case"
            r'\b(compatible|designed|perfect|ideal)\s+for\b',
            r'\b(men|women|kids|boys|girls|adults)\b',
            r'\b(home|office|outdoor|indoor|kitchen|bedroom)\b',
            r'\b(professional|premium|heavy-duty|commercial)\b',
        ]

        matches = 0
        for pattern in long_tail_indicators:
            if re.search(pattern, title, re.IGNORECASE):
                matches += 1

        score = min(100, 40 + (matches * 15))

        if matches >= 4:
            feedback = "Excellent long-tail keyword coverage"
        elif matches >= 2:
            feedback = f"Good long-tail phrases ({matches} found)"
        else:
            feedback = "Limited long-tail keywords - add intent-based phrases"

        return round(score, 1), feedback

    def _score_semantic_coverage(self, title: str, bullets: Optional[list[str]]) -> tuple[float, str]:
        """Score semantic keyword coverage"""
        # Extract key concepts from title
        title_words = set(title.lower().split())
        title_words = {w for w in title_words if len(w) > 3}

        if not title_words:
            return 30.0, "Insufficient keywords in title"

        # Check semantic diversity
        semantic_categories = {
            'material': ['plastic', 'metal', 'wood', 'leather', 'fabric', 'silicone', 'steel'],
            'size': ['small', 'large', 'medium', 'compact', 'portable', 'mini', 'extra'],
            'color': ['black', 'white', 'blue', 'red', 'silver', 'gold', 'gray'],
            'quality': ['premium', 'professional', 'heavy-duty', 'lightweight', 'durable'],
            'feature': ['wireless', 'bluetooth', 'rechargeable', 'waterproof', 'adjustable'],
        }

        categories_covered = 0
        for category, keywords in semantic_categories.items():
            if any(kw in title.lower() for kw in keywords):
                categories_covered += 1

        score = 50 + (categories_covered * 10)
        score = min(100, score)

        feedback = f"{categories_covered} semantic categories covered"
        if categories_covered >= 3:
            feedback += " - excellent diversity"
        elif categories_covered >= 2:
            feedback += " - good coverage"
        else:
            feedback += " - add more descriptive attributes"

        return round(score, 1), feedback

    def _score_ai_parseability(self, title: str) -> tuple[float, str]:
        """Score how easy it is for AI to parse"""
        score = 80  # Base score

        # Proper capitalization (Title Case or sentence case)
        words = title.split()
        if words:
            capitalized = sum(1 for w in words if w[0].isupper() if w)
            if 0.5 <= (capitalized / len(words)) <= 0.9:
                score += 10
            else:
                score -= 10

        # Clear word boundaries (spaces, not run-together)
        if re.search(r'[a-z][A-Z]', title):  # CamelCase without spaces
            score -= 15

        # No excessive punctuation
        punct_count = len(re.findall(r'[^\w\s-]', title))
        if punct_count > 5:
            score -= 10

        # Logical structure
        if len(words) >= 5:
            score += 10

        score = max(0, min(100, score))

        if score >= 85:
            feedback = "Excellent AI parseability - clear structure"
        elif score >= 70:
            feedback = "Good AI parseability"
        else:
            feedback = "Difficult for AI to parse - improve formatting"

        return round(score, 1), feedback

    # Helper Methods

    def _get_category_limit(self, category: Optional[str]) -> int:
        """Get character limit for category"""
        if not category:
            return self.CATEGORY_LIMITS["default"]

        cat_lower = category.lower()
        for key, limit in self.CATEGORY_LIMITS.items():
            if key in cat_lower:
                return limit

        return self.CATEGORY_LIMITS["default"]


# Singleton instance
_scoring_service: Optional[ScoringService] = None


def get_scoring_service() -> ScoringService:
    """Get or create scoring service instance"""
    global _scoring_service
    if _scoring_service is None:
        _scoring_service = ScoringService()
    return _scoring_service
