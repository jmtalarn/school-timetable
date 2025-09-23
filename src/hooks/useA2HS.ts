import { useEffect, useState } from 'react'

// Type definition for BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
	readonly platforms: string[];
	readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed', platform: string }>;
	prompt(): Promise<void>;
}

export function useA2HS() {
	const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
	const [canInstall, setCanInstall] = useState(false)

	useEffect(() => {
		const handler = (e: Event) => {
			const event = e as BeforeInstallPromptEvent
			event.preventDefault()
			setDeferredPrompt(event)
			setCanInstall(true)
		}
		window.addEventListener('beforeinstallprompt', handler)
		return () => window.removeEventListener('beforeinstallprompt', handler)
	}, [])

	const promptInstall = async () => {
		if (!deferredPrompt) return
		deferredPrompt.prompt()
		await deferredPrompt.userChoice
		setDeferredPrompt(null)
		setCanInstall(false)
	}

	return { canInstall, promptInstall }
}
