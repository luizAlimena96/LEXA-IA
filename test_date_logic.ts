
function parseRelativeDate(dateStr: string, timeStr: string): Date {
    const now = new Date();
    // HARDCODE NOW to MONDAY 2025-12-08 for consistent testing
    // now.setFullYear(2025, 11, 8); // Month is 0-indexed (11 = Dec)
    // But better to use the actual logic and print result.

    let targetDate = new Date(now);

    const dateLower = dateStr.toLowerCase();

    // Handle "amanhã"
    if (dateLower.includes('amanhã') || dateLower.includes('amanha')) {
        targetDate.setDate(now.getDate() + 1);
    }
    // Handle "depois de amanhã"
    else if (dateLower.includes('depois')) {
        targetDate.setDate(now.getDate() + 2);
    }
    // Handle day of week
    else {
        const dayMap: Record<string, number> = {
            'domingo': 0, 'dom': 0,
            'segunda': 1, 'segunda-feira': 1, 'seg': 1,
            'terça': 2, 'terca': 2, 'terça-feira': 2, 'terca-feira': 2, 'ter': 2,
            'quarta': 3, 'quarta-feira': 3, 'qua': 3,
            'quinta': 4, 'quinta-feira': 4, 'qui': 4,
            'sexta': 5, 'sexta-feira': 5, 'sex': 5,
            'sábado': 6, 'sabado': 6, 'sábado-feira': 6, 'sab': 6, 'sáb': 6
        };

        let targetDay = -1;
        // Check strict matches first to avoid "seg" matching "segundo" if ever needed, though keys are specific enough
        for (const [dayName, dayIndex] of Object.entries(dayMap)) {
            // Use word boundary check or exact inclusion
            if (dateLower.includes(dayName)) {
                targetDay = dayIndex;
                break;
            }
        }

        if (targetDay !== -1) {
            const currentDay = now.getDay();
            let daysToAdd = targetDay - currentDay;
            if (daysToAdd <= 0) daysToAdd += 7; // Next week if today or passed
            targetDate.setDate(now.getDate() + daysToAdd);
        }
    }

    return targetDate;
}

// Test Cases
const now = new Date();
console.log(`Current Date (Simulated): ${now.toLocaleDateString('pt-BR')} (Day: ${now.getDay()})`);

const tests = [
    { input: 'amanhã', desc: 'Tomorrow' },
    { input: 'quinta', desc: 'Thursday (Target)' },
    { input: 'sexta', desc: 'Friday' },
    { input: 'segunda', desc: 'Monday' },
    { input: 'terca', desc: 'Tuesday (no accent)' },
    { input: 'terça', desc: 'Tuesday (accent)' },
    { input: 'qui', desc: 'Thursday (abbr)' }
];

tests.forEach(t => {
    const res = parseRelativeDate(t.input, '10:00');
    console.log(`Input: "${t.input}" -> Result: ${res.toLocaleDateString('pt-BR')} (Day: ${res.getDay()})`);
});
