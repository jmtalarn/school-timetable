import React, { useId, useMemo, useRef } from 'react'
import Avatar from 'boring-avatars'
import styles from './KidSelect.module.css'

export type KidOption = { id: string; name: string }

type Props = {
	value: string | null
	onChange: (id: string | null) => void
	kids?: KidOption[]
	label?: string
	disabled?: boolean
	/** Avatar size in px (visual only) */
	avatarSize?: number
	className?: string
}

export default function KidSelect({
	value,
	onChange,
	kids = [],
	label = 'Kid',
	disabled = false,
	avatarSize = 64,
	className,
}: Props) {
	const groupId = useId()
	const btnRefs = useRef<Array<HTMLButtonElement | null>>([])

	const selectedIndex = useMemo(
		() => kids.findIndex(k => k.id === value),
		[kids, value]
	)

	const onKeyDown = (e: React.KeyboardEvent, idx: number) => {
		if (!kids.length) return
		let next = idx
		const cols = computeColumns(e.currentTarget.parentElement)
		switch (e.key) {
			case 'ArrowRight':
				next = (idx + 1) % kids.length
				break
			case 'ArrowLeft':
				next = (idx - 1 + kids.length) % kids.length
				break
			case 'ArrowDown':
				next = Math.min(idx + cols, kids.length - 1)
				break
			case 'ArrowUp':
				next = Math.max(idx - cols, 0)
				break
			case ' ':
			case 'Enter':
				e.preventDefault()
				onChange(kids[idx].id)
				return
			default:
				return
		}
		e.preventDefault()
		onChange(kids[next].id)
		btnRefs.current[next]?.focus()
	}

	// crude columns guess from computed style (good enough for keyboard nav)
	function computeColumns(container: Element | null) {
		if (!container) return 1
		const style = getComputedStyle(container as HTMLElement)
		const track = style.gridTemplateColumns || ''
		return Math.max(1, track.split(' ').length)
	}

	return (
		<div className={[styles.wrap, className].filter(Boolean).join(' ')}>
			<div className={styles.headerRow}>
				<label className={styles.label} id={groupId}>
					{label}
				</label>
			</div>

			{kids.length === 0 ? (
				<div className={styles.empty}>No kids yet.</div>
			) : (
				<div
					className={styles.grid}
					role="radiogroup"
					aria-labelledby={groupId}
					aria-disabled={disabled || undefined}
				>
					{kids.map((k, i) => {
						const isSelected = k.id === value
						return (
							<button
								key={k.id}
								type="button"
								role="radio"
								aria-checked={isSelected}
								aria-label={k.name}
								disabled={disabled}
								className={[
									styles.card,
									isSelected ? styles.cardSelected : styles.cardIdle,
								].join(' ')}
								onClick={() => onChange(k.id)}
								onKeyDown={e => onKeyDown(e, i)}
								ref={el => (btnRefs.current[i] = el)}
							>
								<span className={styles.avatar} aria-hidden="true">
									<Avatar
										name={k.name}
										size={avatarSize}
										variant="beam"
										colors={['#2f2e30', '#e84b2c', '#e6d839', '#7cd164', '#2eb8ac']}
									/>
								</span>
								<span className={styles.name}>{k.name}</span>
								{isSelected && <span className={styles.check} aria-hidden>✓</span>}
							</button>
						)
					})}
				</div>
			)}
		</div>
	)
}
