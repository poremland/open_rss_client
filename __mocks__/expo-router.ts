import { mock } from "bun:test";

export const useRouter = mock(() => ({
	push: mock(),
	replace: mock(),
	back: mock(),
	dismissAll: mock(),
	setParams: mock(),
}));

export const useNavigation = mock(() => ({
	setOptions: mock(),
	goBack: mock(),
}));

export const useLocalSearchParams = mock(() => ({}));

export default {
	useRouter,
	useNavigation,
	useLocalSearchParams,
};
