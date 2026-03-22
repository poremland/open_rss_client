import { mock } from "bun:test";

export const useFonts = mock(() => [true, null]);
export const loadAsync = mock(async () => {});

export default {
	useFonts,
	loadAsync,
};
