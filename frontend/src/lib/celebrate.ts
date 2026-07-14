import confetti from 'canvas-confetti'

// Brand palette: teal primary + gold secondary.
const COLORS = ['#14b8a6', '#2dd4bf', '#ffc107', '#fbbf24', '#0d7377']

/** Full-screen confetti for finishing a session (or acing a quiz). */
export function celebrate() {
	confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 }, colors: COLORS })
	setTimeout(() => {
		confetti({ particleCount: 45, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors: COLORS })
		confetti({ particleCount: 45, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors: COLORS })
	}, 200)
}

/** Small burst for hitting an in-session streak milestone. */
export function streakBurst() {
	confetti({
		particleCount: 30,
		spread: 55,
		startVelocity: 28,
		scalar: 0.75,
		origin: { y: 0.65 },
		colors: COLORS,
	})
}
