/**
 * PERF-13 simple example: write a welcome line for each student.
 * Every line needs the school name, and the school name is the same for everyone.
 * Both versions return the same lines; they differ in how often they ask for the name.
 * Each function also writes what it did to `log`, so the screen can replay it step by step.
 */

const STUDENTS = ["Asha", "Bilal", "Chen", "Dev", "Ema", "Farah"];

const SCHOOL_NAME = "Sunrise School";

/** Pretend this asks the school office (slow). Same answer every time. */
function getSchoolName(log: string[]): string {
  log.push(`📞 getSchoolName() → "${SCHOOL_NAME}"`);
  return SCHOOL_NAME;
}

// ❌ Asks the office once per student, even though the answer never changes.
function greetInLoop(students: string[], log: string[]): string[] {
  return students.map((name) => {
    const school = getSchoolName(log);
    const line = `Hi ${name}, welcome to ${school}`;
    log.push(`👋 ${line}`);
    return line;
  });
}

// ✅ Asks the office once, before the loop, then reuses the answer.
function greetHoisted(students: string[], log: string[]): string[] {
  const school = getSchoolName(log);
  return students.map((name) => {
    const line = `Hi ${name}, welcome to ${school}`;
    log.push(`👋 ${line}`);
    return line;
  });
}

export { STUDENTS, greetHoisted, greetInLoop };
