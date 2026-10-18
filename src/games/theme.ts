/** 每款遊戲的代表色（漸層兩端），用在遊戲卡片與遊戲畫面上方的色條 */
const GRADIENTS: Record<string, [string, string]> = {
  'guess-bomb': ['#ff6a5b', '#ffb347'],
  'draw-guess': ['#ff5fa2', '#ffa96b'],
  'liar-dice': ['#7b5cff', '#c08cff'],
  'take-six': ['#f7b733', '#fc6a1a'],
  'color-chain': ['#43cea2', '#3f7ee8'],
  'mind-meld': ['#c471f5', '#fa71cd'],
  'bulls-cows': ['#4facfe', '#2bd9e8'],
  reaction: ['#f9d423', '#ff4e50'],
  'tap-race': ['#ff7a18', '#ffcf3f'],
  rps: ['#2fd47e', '#22c1c3'],
  memory: ['#a18cd1', '#f3a6d8'],
  'dots-boxes': ['#30cfd0', '#5b4bdb'],
  othello: ['#0ba360', '#3cba92'],
  battleship: ['#2b5876', '#4e74c4'],
  'connect-four': ['#e8505b', '#f9b234'],
  'tic-tac-toe': ['#667eea', '#9b59d0'],
  undercover: ['#3a3d5c', '#7a6ad8'],
};

export function gameGradient(id: string): string {
  const [a, b] = GRADIENTS[id] ?? ['#7b5cff', '#ff5fa2'];
  return `linear-gradient(135deg, ${a}, ${b})`;
}
