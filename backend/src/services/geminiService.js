const { GoogleGenerativeAI } = require('@google/generative-ai');

function getModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set. Add it to .env.');
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.0-flash' });
}

const SYSTEM_INSTRUCTION = `You are a calm, practical financial coach for university students managing money sent by a parent or sponsor.
You will be given a JSON object of spending by category (in XLM, Stellar's native asset) and a monthly budget.
Respond ONLY with a JSON object matching exactly this shape, no markdown fences, no extra text:
{
  "summary": "2-3 sentence plain-English summary of their spending pattern",
  "recommendations": ["short actionable tip", "short actionable tip", "short actionable tip"],
  "riskLevel": "low" | "medium" | "high"
}
Keep recommendations specific to the actual category breakdown given, not generic advice. Be encouraging, never preachy.`;

function generateFallbackAnalysis({ categoryBreakdown, monthlyBudget }) {
  const categories = Object.keys(categoryBreakdown);
  let totalSpent = 0;
  let topCategory = 'other';
  let maxAmount = 0;

  for (const cat of categories) {
    const amt = categoryBreakdown[cat] || 0;
    totalSpent += amt;
    if (amt > maxAmount) {
      maxAmount = amt;
      topCategory = cat;
    }
  }

  const budget = monthlyBudget || 1000;
  const utilization = (totalSpent / budget) * 100;

  let riskLevel = 'low';
  let summary = '';
  const recommendations = [];

  if (utilization > 90) {
    riskLevel = 'high';
    summary = `You have spent ${totalSpent.toFixed(2)} XLM, utilizing ${utilization.toFixed(1)}% of your monthly budget (${budget} XLM). Your budget is almost exhausted, with your highest spending in the ${topCategory} category (${maxAmount.toFixed(2)} XLM).`;
  } else if (utilization > 60) {
    riskLevel = 'medium';
    summary = `You have spent ${totalSpent.toFixed(2)} XLM, utilizing ${utilization.toFixed(1)}% of your monthly budget (${budget} XLM). You are on track but should monitor further expenses, especially in ${topCategory} which is your largest expense source (${maxAmount.toFixed(2)} XLM).`;
  } else {
    riskLevel = 'low';
    summary = `You have spent ${totalSpent.toFixed(2)} XLM, utilizing only ${utilization.toFixed(1)}% of your monthly budget (${budget} XLM). Your spending is well within limits, with ${topCategory} being your main expense category (${maxAmount.toFixed(2)} XLM).`;
  }

  // Recommendations
  if (topCategory === 'food') {
    recommendations.push('Explore campus dining options or cook in groups to lower your food bill.');
  } else if (topCategory === 'books') {
    recommendations.push('Look for second-hand textbooks or digital library copies before buying brand new books.');
  } else if (topCategory === 'transport') {
    recommendations.push('Consider buying a weekly or monthly public transit pass to optimize transport costs.');
  } else if (topCategory === 'rent') {
    recommendations.push('Look for room-share or campus accommodation discounts for upcoming semesters.');
  } else if (topCategory === 'fees') {
    recommendations.push('Check if the university offers install-based fee payment plans to manage large outlays.');
  } else {
    recommendations.push('Review miscellaneous and other small expenses; they can accumulate quickly.');
  }

  if (utilization > 80) {
    recommendations.push('Pause non-essential subscriptions or purchases until the next budget cycle begins.');
    recommendations.push('Create a daily spending cap for the remaining days of the month to avoid overdrafts.');
  } else {
    recommendations.push('Keep tracking your daily expenses to maintain this healthy financial baseline.');
    recommendations.push('Consider setting aside a small percentage of your unused budget for future emergency funds.');
  }

  return {
    summary,
    recommendations,
    riskLevel,
    rawModelResponse: JSON.stringify({ summary, recommendations, riskLevel })
  };
}

/**
 * Sends a student's category-level spending to Gemini and returns a
 * structured budget report. Falls back to a local rules-based analyzer
 * if the API key is missing or calls fail.
 */
async function analyzeBudget({ categoryBreakdown, monthlyBudget }) {
  const apiKey = process.env.GEMINI_API_KEY;
  const isKeyPlaceholder = !apiKey || apiKey.includes('your-gemini-api-key') || apiKey === '';

  if (!isKeyPlaceholder) {
    try {
      const model = getModel();

      const prompt = `${SYSTEM_INSTRUCTION}

Monthly budget: ${monthlyBudget} XLM
Spending by category: ${JSON.stringify(categoryBreakdown)}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      const cleaned = text.replace(/```json|```/g, '').trim();

      const parsed = JSON.parse(cleaned);

      if (parsed.summary && Array.isArray(parsed.recommendations)) {
        return {
          summary: parsed.summary,
          recommendations: parsed.recommendations,
          riskLevel: parsed.riskLevel || 'medium',
          rawModelResponse: text,
        };
      }
    } catch (aiErr) {
      console.warn('[geminiService] Gemini API call failed. Falling back to local smart advisor. Error:', aiErr.message);
    }
  } else {
    console.info('[geminiService] Gemini API key not configured. Using local smart advisor.');
  }

  // Fallback
  return generateFallbackAnalysis({ categoryBreakdown, monthlyBudget });
}

module.exports = { analyzeBudget };
