import { describe, expect, it } from 'vitest';
import * as rs from './roomState';
import type { RoomRecord } from './types';

const rand = () => 0.5;

function roomWith(...ids: string[]): RoomRecord {
  let r = rs.newRoom(ids[0], ids[0], 0);
  ids.slice(1).forEach((id, i) => (r = rs.join(r, id, id, i + 1)));
  return r;
}

describe('roomState', () => {
  it('第一個在線的玩家是房主，房主離線時交給下一位', () => {
    const r = roomWith('a', 'b', 'c');
    expect(rs.hostOf(r)).toBe('a');
    r.players!.a.online = false;
    expect(rs.hostOf(r)).toBe('b');
  });

  it('重新加入時保留原本的加入順序與分數', () => {
    let r = roomWith('a', 'b');
    r.scores!.b = 3;
    r.players!.b.online = false;
    r = rs.join(r, 'b', 'B2', 99);
    expect(r.players!.b).toEqual({ name: 'B2', joinedAt: 1, online: true });
    expect(r.scores!.b).toBe(3);
  });

  it('房間滿 4 人時拒絕加入，但會清掉離線玩家騰出位子', () => {
    const r = roomWith('a', 'b', 'c', 'd');
    expect(() => rs.join(r, 'e', 'e', 10)).toThrow('房間已滿');
    r.players!.c.online = false;
    const r2 = rs.join(r, 'e', 'e', 10);
    expect(Object.keys(r2.players!).sort()).toEqual(['a', 'b', 'd', 'e']);
  });

  it('不會清掉還在進行中對局裡的離線玩家', () => {
    let r = roomWith('a', 'b', 'c', 'd');
    r = rs.startMatch(r, 'a', 'guess-bomb', rand, 5);
    r.players!.c.online = false;
    expect(() => rs.join(r, 'e', 'e', 10)).toThrow('房間已滿');
  });

  it('最後一個人離開時房間刪除', () => {
    const r = roomWith('a', 'b');
    const r2 = rs.leave(r, 'a')!;
    expect(rs.hostOf(r2)).toBe('b');
    expect(rs.leave(r2, 'b')).toBeNull();
  });

  it('只有房主能開始，而且人數要符合遊戲限制', () => {
    const r = roomWith('a', 'b', 'c');
    expect(() => rs.startMatch(r, 'b', 'guess-bomb', rand, 0)).toThrow('只有房主');
    expect(() => rs.startMatch(r, 'a', 'tic-tac-toe', rand, 0)).toThrow('2 人');
    const started = rs.startMatch(r, 'a', 'guess-bomb', rand, 0);
    expect(rs.decodeMatch(started)!.playerIds).toEqual(['a', 'b', 'c']);
    expect(() => rs.startMatch(started, 'a', 'guess-bomb', rand, 0)).toThrow('正在進行');
  });

  it('對局結束時累計分數並寫入紀錄', () => {
    let r = rs.startMatch(roomWith('a', 'b'), 'a', 'tic-tac-toe', () => 0, 0);
    const { players } = rs.decodeMatch(r)!.state as { players: [string, string] };
    const [first, second] = players;
    for (const [who, cell] of [[first, 0], [second, 3], [first, 1], [second, 4], [first, 2]] as const) {
      r = rs.applyMove(r, who, { cell }, 1, rand);
    }
    expect(rs.decodeMatch(r)!.result).not.toBeNull();
    expect(r.scores![first]).toBe(1);
    expect(r.scores![second]).toBe(0);
    expect(rs.decodeHistory(r)).toHaveLength(1);
    expect(() => rs.applyMove(r, second, { cell: 5 }, 2, rand)).toThrow('已經結束');
  });

  it('觀戰者不能下棋', () => {
    let r = rs.startMatch(roomWith('a', 'b'), 'a', 'guess-bomb', rand, 0);
    r = rs.join(r, 'c', 'c', 5);
    expect(() => rs.applyMove(r, 'c', { value: 50 }, 1, rand)).toThrow('沒有參加');
  });

  it('懲罰模式：對局結束時抽懲罰卡給沒得分的人，平手不懲罰', () => {
    let r = rs.setPunish(roomWith('a', 'b'), 'a', true);
    expect(() => rs.setPunish(r, 'b', false)).toThrow('只有房主');
    r = rs.startMatch(r, 'a', 'tic-tac-toe', () => 0, 0);
    const [first, second] = (rs.decodeMatch(r)!.state as { players: [string, string] }).players;
    for (const [who, cell] of [[first, 0], [second, 3], [first, 1], [second, 4], [first, 2]] as const) {
      r = rs.applyMove(r, who, { cell }, 1, () => 0);
    }
    expect(rs.decodeMatch(r)!.punishment).toEqual({ losers: [second], text: expect.any(String) });

    let draw = rs.startMatch(rs.backToLobby(r, 'a'), 'a', 'tic-tac-toe', () => 0, 0);
    const [x, o] = (rs.decodeMatch(draw)!.state as { players: [string, string] }).players;
    const moves = [[x, 0], [o, 1], [x, 2], [o, 4], [x, 3], [o, 5], [x, 7], [o, 6], [x, 8]] as const;
    for (const [who, cell] of moves) draw = rs.applyMove(draw, who, { cell }, 1, () => 0);
    expect(rs.decodeMatch(draw)!.punishment).toBeNull();
  });

  it('房主只能移除離線玩家', () => {
    const r = roomWith('a', 'b', 'c');
    expect(() => rs.removeOffline(r, 'a', 'b')).toThrow('離線');
    r.players!.b.online = false;
    expect(() => rs.removeOffline(r, 'c', 'b')).toThrow('只有房主');
    const r2 = rs.removeOffline(r, 'a', 'b');
    expect(Object.keys(r2.players!)).toEqual(['a', 'c']);
    expect(r2.scores!.b).toBeUndefined();
  });

  it('聊天訊息會修剪長度並只保留最近 50 則', () => {
    let r = roomWith('a', 'b');
    expect(() => rs.addChat(r, 'x', 'hi', 0, 'm0')).toThrow('不在這個房間');
    expect(() => rs.addChat(r, 'a', '   ', 0, 'm0')).toThrow('空的');
    for (let i = 0; i < 55; i++) r = rs.addChat(r, 'a', `訊息${i}`, i, `m${i}`);
    const chat = rs.decodeChat(r);
    expect(chat).toHaveLength(50);
    expect(chat[49].text).toBe('訊息54');
    r = rs.addChat(r, 'b', 'x'.repeat(200), 99, 'long');
    expect(rs.decodeChat(r)[49].text).toHaveLength(rs.CHAT_MAX_LENGTH);
  });
});
