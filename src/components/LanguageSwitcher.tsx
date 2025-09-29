import { useIntl } from 'react-intl';
import { useConfig, useUpdateConfig } from '../hooks/reactQueryHooks'

const LANGS = [
	{ code: 'en', label: 'English' },
	{ code: 'es', label: 'Español' },
	{ code: 'ca', label: 'Català' },
]

export default function LanguageSelect({ className }: { className?: string }) {
	const { data: cfg, isLoading } = useConfig()
	const updateConfig = useUpdateConfig()
	const intl = useIntl();
	console.log('Current language:', cfg?.language)
	const value = cfg?.language ?? 'en'

	return (
		<select
			className={className}
			aria-label={intl.formatMessage({ defaultMessage: "Language" })}
			value={value}
			onChange={(e) => {
				const locale = e.target.value as 'en' | 'es' | 'ca'
				updateConfig.mutate({ language: locale })
			}}
			disabled={isLoading || updateConfig.isPending}
		>
			{LANGS.map(l => (
				<option key={l.code} value={l.code}>
					{l.label}
				</option>
			))}
		</select>
	)
}
