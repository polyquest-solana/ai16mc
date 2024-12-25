export function calculateWinPercentage(
  win: number,
  draw: number,
  opponentWin: number
): {
  winPercentage: number;
  opponentWinPercentage: number;
  drawPercentage: number;
} {
  const winProbability = 1 / win;
  const drawProbability = 1 / draw;
  const opponentWinProbability = 1 / opponentWin;

  const totalProbability =
    winProbability + drawProbability + opponentWinProbability;

  const winPercentage = (winProbability / totalProbability) * 100;
  const drawPercentage = (drawProbability / totalProbability) * 100;
  const opponentWinPercentage = 100 - winPercentage - drawPercentage;

  return {
    winPercentage,
    drawPercentage,
    opponentWinPercentage,
  };
}

/**
 * Formats a number as currency.
 * @param amount - The numeric value to format.
 * @param currency - The currency code (e.g., "USD", "EUR").
 * @param locale - The locale for formatting (default is "en-US").
 * @returns A string representing the formatted currency.
 */
export function formatCurrency(
  amount: number | string,
  currency: string = "USD",
  locale: string = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
  }).format(Number(amount));
}

/**
 * Formats a number with specified locale and options.
 * @param value - The numeric value to format.
 * @param locale - The locale for formatting (default is "en-US").
 * @param options - Additional options for formatting (e.g., maximumFractionDigits).
 * @returns A string representing the formatted number.
 */
export function formatNumber(
  value: number,
  locale: string = "en-US",
  options: Intl.NumberFormatOptions = {}
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}
