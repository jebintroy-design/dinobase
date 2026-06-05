import { type Address } from 'viem'

export const LEADERBOARD_ADDRESS: Address =
  '0xea76d82900335c4bb946f43efe8b38f2c9896fd0'

export const leaderboardAbi = [
  { type: 'function', name: 'submitScore', stateMutability: 'nonpayable',
    inputs: [{ name: 'score', type: 'uint256' }], outputs: [] },
  { type: 'function', name: 'getLeaderboard', stateMutability: 'view', inputs: [],
    outputs: [{ name: '', type: 'tuple[10]', components: [
      { name: 'player', type: 'address' }, { name: 'score', type: 'uint256' } ] }] },
  { type: 'function', name: 'bestScore', stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'totalSubmissions', stateMutability: 'view', inputs: [],
    outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'startGame', stateMutability: 'nonpayable',
    inputs: [], outputs: [] },
  { type: 'function', name: 'gamesStarted', stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'totalGamesStarted', stateMutability: 'view', inputs: [],
    outputs: [{ name: '', type: 'uint256' }] },
  { type: 'event', name: 'ScoreSubmitted', inputs: [
    { name: 'player', type: 'address', indexed: true },
    { name: 'score', type: 'uint256', indexed: false },
    { name: 'newPersonalBest', type: 'bool', indexed: false } ] },
  { type: 'event', name: 'GameStarted', inputs: [
    { name: 'player', type: 'address', indexed: true },
    { name: 'gameNumber', type: 'uint256', indexed: false } ] },
] as const
