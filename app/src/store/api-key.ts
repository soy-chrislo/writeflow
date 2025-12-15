import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ApiKeyState {
	apiKey: string | null;
	isValid: boolean | null; // null = not tested yet, true = valid, false = invalid
	setApiKey: (key: string) => void;
	setIsValid: (valid: boolean | null) => void;
	clearApiKey: () => void;
}

export const useApiKeyStore = create<ApiKeyState>()(
	persist(
		(set) => ({
			apiKey: null,
			isValid: null,
			setApiKey: (key) => set({ apiKey: key, isValid: null }),
			setIsValid: (valid) => set({ isValid: valid }),
			clearApiKey: () => set({ apiKey: null, isValid: null }),
		}),
		{
			name: "writeflow-api-key",
		},
	),
);
