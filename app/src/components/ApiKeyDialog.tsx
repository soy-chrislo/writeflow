import { KeyRound } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApiKeyStore } from "@/store/api-key";

export function ApiKeyDialog() {
	const { apiKey, isValid, setApiKey } = useApiKeyStore();
	const [inputValue, setInputValue] = useState("");

	// Show dialog if no API key or if key was marked as invalid
	const isOpen = !apiKey || isValid === false;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (inputValue.trim()) {
			setApiKey(inputValue.trim());
			setInputValue("");
		}
	};

	return (
		<Dialog open={isOpen}>
			<DialogContent
				className="sm:max-w-md"
				onPointerDownOutside={(e) => e.preventDefault()}
				onEscapeKeyDown={(e) => e.preventDefault()}
			>
				<DialogHeader>
					<div className="flex items-center gap-2">
						<KeyRound className="h-5 w-5 text-primary" />
						<DialogTitle>API Key Required</DialogTitle>
					</div>
					<DialogDescription className="text-left space-y-2">
						{isValid === false ? (
							<span className="text-destructive">
								The API key you entered is invalid or has expired. Please enter
								a valid key.
							</span>
						) : (
							<>
								This is a demo instance of Writeflow. To use the application,
								you need a valid API key.
							</>
						)}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit}>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="api-key">API Key</Label>
							<Input
								id="api-key"
								type="password"
								placeholder="Enter your API key"
								value={inputValue}
								onChange={(e) => setInputValue(e.target.value)}
								autoFocus
							/>
						</div>

						<p className="text-xs text-muted-foreground">
							Don't have an API key? Contact the administrator to request
							access.
						</p>
					</div>

					<DialogFooter className="mt-4">
						<Button type="submit" disabled={!inputValue.trim()}>
							Save API Key
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
