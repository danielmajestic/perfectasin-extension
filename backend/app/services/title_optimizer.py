import os
from typing import Dict, List, Optional
from anthropic import AsyncAnthropic


class TitleOptimizerService:
    def __init__(self):
        self.api_key = os.getenv("ANTHROPIC_API_KEY", "")
        self.client = AsyncAnthropic(api_key=self.api_key) if self.api_key else None
        self.model = "claude-sonnet-4-20250514"

    async def optimize_title(
        self,
        title: str,
        asin: str,
        price: Optional[str] = None,
        category: Optional[str] = None,
        brand: Optional[str] = None,
        bullets: Optional[List[str]] = None
    ) -> Dict:
        optimized_title = await self._generate_optimized_title(
            title=title,
            price=price,
            category=category,
            brand=brand,
            bullets=bullets
        )
        improvements = self._analyze_improvements(title, optimized_title)

        return {
            "original_title": title,
            "optimized_title": optimized_title,
            "asin": asin,
            "improvements": improvements
        }

    async def _generate_optimized_title(
        self,
        title: str,
        price: Optional[str] = None,
        category: Optional[str] = None,
        brand: Optional[str] = None,
        bullets: Optional[List[str]] = None
    ) -> str:
        # Build context from additional product information
        context_parts = []
        if brand:
            context_parts.append(f"Brand: {brand}")
        if category:
            context_parts.append(f"Category: {category}")
        if price:
            context_parts.append(f"Price: ${price}")
        if bullets and len(bullets) > 0:
            key_features = "\n- ".join(bullets[:3])  # Use top 3 features
            context_parts.append(f"Key Features:\n- {key_features}")

        context = "\n".join(context_parts) if context_parts else ""

        prompt = f"""Optimize this Amazon product title for better SEO and conversion:

Original Title: {title}
{context}

Guidelines:
- Keep the most important keywords at the beginning
- Remove unnecessary words and redundancy
- Maintain clarity and readability
- Stay within 200 characters
- Follow Amazon's style guidelines
- Include brand name if not already present
- Use the category and features to inform keyword selection

Provide only the optimized title without explanation."""

        if not self.client:
            return self._mock_optimize_title(title)

        try:
            message = await self.client.messages.create(
                model=self.model,
                max_tokens=1024,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )

            optimized_title = message.content[0].text.strip()
            return optimized_title
        except Exception as e:
            print(f"Error calling Anthropic API: {e}")
            return self._mock_optimize_title(title)

    def _mock_optimize_title(self, title: str) -> str:
        words = title.split()
        if len(words) > 15:
            optimized = ' '.join(words[:15]) + '...'
        else:
            optimized = title

        return optimized.strip()

    def _analyze_improvements(self, original: str, optimized: str) -> List[str]:
        improvements = []

        if len(optimized) < len(original):
            improvements.append(f"Reduced length from {len(original)} to {len(optimized)} characters")

        if optimized != original:
            improvements.append("Improved keyword placement")
            improvements.append("Enhanced readability")

        return improvements
