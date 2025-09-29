// src/i18n/IntlAppProvider.tsx
import { type PropsWithChildren, useEffect, useMemo } from 'react'
import { IntlProvider } from 'react-intl'
import { useConfig } from '../hooks/reactQueryHooks'
import en from './compiled/en.json'
import es from './compiled/es.json'
import ca from './compiled/ca.json'

const ALL_MESSAGES: Record<string, any> = { en, es, ca }

export default function IntlAppProvider({ children }: PropsWithChildren) {
	const { data: cfg } = useConfig()
	const locale = cfg?.language || navigator.language?.split('-')[0] || 'en'
	const messages = useMemo(() => ALL_MESSAGES[locale] ?? en, [locale])

	useEffect(() => {
		document.documentElement.lang = locale
		const isRTL = ['ar', 'he', 'fa', 'ur'].some(code => locale.startsWith(code))
		document.documentElement.dir = isRTL ? 'rtl' : 'ltr'
	}, [locale])

	return (
		<IntlProvider
			locale={locale}
			messages={messages}
			defaultLocale="en"
			onError={(err) => {
				// Silence missing translation warnings in dev if desired
				if (err.code === 'MISSING_TRANSLATION') return
				console.warn(err)
			}}
		>
			{children}
		</IntlProvider>
	)
}
