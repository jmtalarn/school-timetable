import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollManager() {
	const { pathname, hash, key } = useLocation()

	useLayoutEffect(() => {
		// If there’s a hash (#section), scroll to that element.
		if (hash) {
			const id = hash.slice(1)
			const el = document.getElementById(id)
			if (el) {
				el.scrollIntoView({ block: 'start' }) // offset handled via CSS scroll-margin-top
				return
			}
		}
		// Otherwise go to top on page change
		window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
	}, [pathname, hash, key])

	return null
}
