import { readDB } from "./db";
import { createKid } from "./kids";
import { createMatter } from "./matters";
import { addBlock } from "./timetables";

export function seedExample() {
	if (readDB().kids.length) return;
	const math = createMatter({ name: 'Math', color: '#10b981' });
	const eng = createMatter({ name: 'English', color: '#3b82f6' });
	const art = createMatter({ name: 'Art', color: '#f59e0b' });

	const alice = createKid({ name: 'Alice' });
	const bob = createKid({ name: 'Bob' });

	addBlock({
		kidId: alice.id,
		day: 'mon',
		input: { matterId: math.id, start: '09:00', end: '10:00' },
	});
	addBlock({
		kidId: alice.id,
		day: 'mon',
		input: { matterId: eng.id, start: '10:15', end: '11:15' },
	});
	addBlock({
		kidId: bob.id,
		day: 'tue',
		input: { matterId: art.id, start: '11:00', end: '12:00' },
	});
}
