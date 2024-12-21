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
