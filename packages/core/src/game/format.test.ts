import { expect, test } from "vitest";
import { parseRoomCode, roomCodeAfterPaste } from "./format";

test("roomCodeAfterPaste", () => {
  expect(roomCodeAfterPaste("AB", "https://x.app/game/XY7QZ")).toBe("XY7QZ");
  expect(roomCodeAfterPaste("AB", "c-d")).toBe("ABCD");
  expect(roomCodeAfterPaste("", "hello world")).toBe("HELLO");
});

test("parseRoomCode", () => {
  expect(parseRoomCode(" abc23 ")).toBe("ABC23");
  expect(parseRoomCode("https://wordlock.app/game/XY7QZ?ref=share")).toBe("XY7QZ");
  expect(parseRoomCode("Join me! https://wordlock.app/game/XY7QZ")).toBe("XY7QZ");
  expect(parseRoomCode("hello world")).toBeNull();
  expect(parseRoomCode("ABCDEF")).toBeNull();
});
