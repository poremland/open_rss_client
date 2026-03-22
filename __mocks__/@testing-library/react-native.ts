import { mock } from "bun:test";
import React from "react";

// In-memory registry of elements for testing-library mocks to find
const elementRegistry = new Set<any>();

const register = (el: any) => {
	if (!el) return;
	
	if (typeof el === 'object' && el.props) {
		elementRegistry.add(el);
		if (el.props.children) {
			React.Children.forEach(el.props.children, register);
		}
	} else if (Array.isArray(el)) {
		el.forEach(register);
	}
};

const findInTree = (predicate: (el: any) => boolean) => {
	for (const el of elementRegistry) {
		if (predicate(el)) return el;
	}
	return null;
};

export const render = mock((element: any) => {
	elementRegistry.clear();
	
	// If it's a component function, call it to get the tree
	let tree = element;
	if (typeof element === 'function') {
		try {
			tree = element({});
		} catch (e) {
			// might be a class component or need props
		}
	} else if (React.isValidElement(element)) {
		// If it's a React element, we need to "render" it if it's a functional component
		if (typeof element.type === 'function') {
			try {
				// This is a very simplified "render" - only goes one level deep
				tree = (element.type as any)(element.props);
			} catch (e) {
				tree = element;
			}
		}
	}
	
	register(tree);

	return {
		getByPlaceholderText: mock((text: string) => {
			const el = findInTree(e => e.props?.placeholder === text);
			if (el) return el;
			throw new Error(`Could not find element with placeholder: ${text}`);
		}),
		getByText: mock((text: string) => {
			const el = findInTree(e => 
				e.props?.title === text || 
				e.props?.children === text || 
				(Array.isArray(e.props?.children) && e.props.children.includes(text))
			);
			if (el) return el;
			throw new Error(`Could not find element with text: ${text}`);
		}),
		queryByText: mock((text: string) => {
			return findInTree(e => 
				e.props?.title === text || 
				e.props?.children === text || 
				(Array.isArray(e.props?.children) && e.props.children.includes(text))
			);
		}),
		getByTestId: mock((id: string) => {
			const el = findInTree(e => e.props?.testID === id);
			if (el) return el;
			throw new Error(`Could not find element with testID: ${id}`);
		}),
		queryByTestId: mock((id: string) => {
			return findInTree(e => e.props?.testID === id);
		}),
		findByText: mock(async (text: string) => {
			const el = findInTree(e => e.props?.children === text);
			if (el) return el;
			throw new Error(`Could not find element with text: ${text}`);
		}),
		debug: mock(() => {
			console.log("Registered elements:", elementRegistry.size);
			for (const el of elementRegistry) {
				console.log("Element:", el.type?.name || el.type, "Props:", Object.keys(el.props || {}));
			}
		}),
	};
});

export const fireEvent = {
	changeText: mock((element: any, text: string) => {
		if (element && element.props?.onChangeText) {
			element.props.onChangeText(text);
		}
	}),
	press: mock((element: any) => {
		if (element && element.props?.onPress) {
			element.props.onPress();
		}
	}),
};

export const waitFor = mock(async (callback: any) => {
	const start = Date.now();
	while (Date.now() - start < 1000) {
		try {
			return await callback();
		} catch (e) {
			await new Promise(r => setTimeout(r, 50));
		}
	}
	return await callback();
});

export const act = mock((callback: any) => callback());

export default {
	render,
	fireEvent,
	waitFor,
	act,
};
