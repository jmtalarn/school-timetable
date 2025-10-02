// src/pages/HelpPage.tsx
import { useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import { Link } from 'react-router-dom'
import { useConfig } from '../hooks/reactQueryHooks'
import styles from './HelpPage.module.css'

// Vite will bundle these; we load raw markdown strings on demand
const HELP_FILES = import.meta.glob('./help-content/*.md', { query: '?raw', import: 'default', eager: false })

function useLocale(): string {
	const { data: cfg } = useConfig()
	return cfg?.language || (navigator.language?.split('-')[0] ?? 'en')
}

export default function HelpPage() {
	const locale = useLocale()
	const [md, setMd] = useState<string | null>(null)
	const [err, setErr] = useState<string | null>(null)

	// pick best file: exact match → base lang → English
	const candidates = useMemo(() => {
		const base = locale.split('-')[0]
		return [
			`./help-content/${locale}.md`,
			`./help-content/${base}.md`,
			`./help-content/en.md`,
		]
	}, [locale])

	useEffect(() => {
		let cancelled = false
		setMd(null)
		setErr(null)

			; (async () => {
				for (const key of candidates) {
					if (HELP_FILES[key]) {
						try {
							const text = await HELP_FILES[key]() // load markdown string
							if (!cancelled) setMd(text as string)
							return
						} catch (e) {
							// try next candidate
						}
					}
				}
				if (!cancelled) setErr('Help content not found.')
			})()

		return () => { cancelled = true }
	}, [candidates])

	// Convert inline links: in-app routes use <Link>, external remain <a>, hashes stay <a>
	const components = useMemo(() => ({
		a: (props: any) => {
			const href: string = props.href || ''
			const isInternal = href.startsWith('/') && !href.startsWith('//')
			if (isInternal) {
				return <Link to={href}>{props.children}</Link>
			}
			return <a {...props} target={href.startsWith('#') ? undefined : '_blank'} rel="noopener noreferrer" />
		},
	}), [])

	return (
		<div className={styles.container}>
			{/* <h1 className={styles.title}>Help &amp; User Guide</h1> */}

			<div className={`${styles.card} ${styles.prose}`}>
				{err && <p className={styles.note}>{err}</p>}
				{!err && !md && <p className={styles.muted}>Loading…</p>}
				{md && (
					<ReactMarkdown
						remarkPlugins={[remarkGfm]}
						rehypePlugins={[rehypeSlug]}
						components={components}
					>
						{md}
					</ReactMarkdown>
				)}
			</div>
		</div>
	)
}
