import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// deterministic pseudo-random so demo data is stable
let s = 42;
const rand = () => (s = (s * 16807) % 2147483647) / 2147483647;
const ymd = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };

const firstNames = ["Rahim", "Karim", "Sumaiya", "Nusrat", "Tanvir", "Farhana", "Arif", "Jannat", "Sabbir", "Mim", "Rakib", "Sadia", "Hasan", "Tania", "Imran", "Lamia", "Shakil", "Afsana", "Nayeem", "Ritu", "Mahmud", "Sharmin", "Fahim", "Popy", "Rafi", "Nadia", "Sakib", "Mitu", "Jubayer", "Tisha"];
const lastNames = ["Hossain", "Ahmed", "Islam", "Akter", "Rahman", "Khatun", "Uddin", "Begum", "Khan", "Sultana"];

async function main() {
  await prisma.$transaction([
    prisma.comment.deleteMany(), prisma.notice.deleteMany(),
    prisma.mark.deleteMany(), prisma.examSubject.deleteMany(), prisma.exam.deleteMany(),
    prisma.attendanceRecord.deleteMany(), prisma.attendanceSession.deleteMany(),
    prisma.student.deleteMany(), prisma.batchTeacher.deleteMany(), prisma.batch.deleteMany(),
    prisma.syncOp.deleteMany(), prisma.auditLog.deleteMany(), prisma.user.deleteMany(),
    prisma.course.deleteMany(), prisma.subject.deleteMany(),
  ]);

  const hash = await bcrypt.hash("123456", 10);

  const subjectNames = ["Bangla", "English", "Math", "General Knowledge", "ICT", "Mental Ability"];
  const subjects = await Promise.all(subjectNames.map((name) => prisma.subject.create({ data: { name } })));
  const sub = (n: string) => subjects.find((x) => x.name === n)!;

  const admin = await prisma.user.create({ data: { name: "Md Rubel", phone: "01700000000", email: "admin@shikhon.com", passwordHash: hash, role: "ADMIN" } });
  const kamal = await prisma.user.create({ data: { name: "Kamal Sir", phone: "01711111111", passwordHash: hash, role: "TEACHER", subjectId: sub("Math").id } });
  const rina = await prisma.user.create({ data: { name: "Rina Madam", phone: "01722222222", passwordHash: hash, role: "TEACHER", subjectId: sub("English").id } });
  const hasan = await prisma.user.create({ data: { name: "Hasan Sir", phone: "01733333333", passwordHash: hash, role: "TEACHER", subjectId: sub("General Knowledge").id } });
  const nasrin = await prisma.user.create({ data: { name: "Nasrin Madam", phone: "01744444444", passwordHash: hash, role: "TEACHER", subjectId: sub("Bangla").id } });

  const courses = await Promise.all(["BCS", "Bank Job", "Primary Teacher"].map((name) => prisma.course.create({ data: { name } })));

  const start = daysAgo(70);
  const batches = [
    await prisma.batch.create({ data: { name: "BCS-47 Morning", shift: "Morning", startDate: start, courseId: courses[0].id,
      teachers: { create: [kamal, rina, hasan, nasrin].map((t) => ({ teacherId: t.id })) } } }),
    await prisma.batch.create({ data: { name: "Bank Evening-A", shift: "Evening", startDate: start, courseId: courses[1].id,
      teachers: { create: [kamal, rina, hasan].map((t) => ({ teacherId: t.id })) } } }),
    await prisma.batch.create({ data: { name: "Primary Friday", shift: "Morning", startDate: start, courseId: courses[2].id,
      teachers: { create: [kamal, nasrin, hasan].map((t) => ({ teacherId: t.id })) } } }),
  ];

  // 10 students per batch; each has a "skill" and "regularity"
  let n = 0;
  const studentsByBatch: Record<string, { id: string; skill: number; reg: number; weak: number }[]> = {};
  for (const b of batches) {
    studentsByBatch[b.id] = [];
    for (let i = 0; i < 10; i++, n++) {
      const name = `${firstNames[n % firstNames.length]} ${lastNames[n % lastNames.length]}`;
      const guardian = await prisma.user.create({
        data: { name: `${lastNames[n % lastNames.length] === "Begum" || lastNames[n % lastNames.length] === "Akter" ? "Abdul" : "Md"} ${lastNames[(n + 3) % lastNames.length]}`, phone: `0191${String(n).padStart(7, "0")}`, passwordHash: hash, role: "GUARDIAN" },
      });
      const u = await prisma.user.create({
        data: {
          name, phone: `0181${String(n).padStart(7, "0")}`, passwordHash: hash, role: "STUDENT",
          student: { create: {
            rollNo: `SC-2026-${1001 + n}`, batchId: b.id, address: "Dhaka", targetExam: b.name.split(" ")[0],
            guardianId: guardian.id, guardianRelation: "Father", guardianPinHash: hash,
            admissionDate: daysAgo(70 - n),
          } },
        },
        include: { student: true },
      });
      const skill = i === 0 ? 0.74 : i === 7 ? 0.38 : i === 4 ? 0.47 : 0.6 + rand() * 0.33;
      studentsByBatch[b.id].push({ id: u.student!.id, skill, reg: i === 7 ? 0.58 : 0.8 + rand() * 0.2, weak: i === 0 ? 2 : (n * 7) % 4 });
    }
  }

  // attendance: last 56 days except Fridays (Primary batch: only Fridays + Saturdays)
  const teacherFor = (b: (typeof batches)[number]) => (b.id === batches[1].id ? rina : kamal);
  for (const b of batches) {
    for (let d = 56; d >= 1; d--) {
      const day = daysAgo(d);
      const isPrimary = b.id === batches[2].id;
      if (!isPrimary && day.getDay() === 5) continue;
      if (isPrimary && ![5, 6].includes(day.getDay())) continue;
      const studs = studentsByBatch[b.id];
      const session = await prisma.attendanceSession.create({ data: { batchId: b.id, date: ymd(day), takenById: teacherFor(b).id } });
      await prisma.attendanceRecord.createMany({
        data: studs.map((st, idx) => {
          // the "at-risk" student (index 7) misses the last few classes in a row
          const forcedAbsent = idx === 7 && d <= 5;
          return { sessionId: session.id, studentId: st.id, status: forcedAbsent ? "ABSENT" : rand() < st.reg ? (rand() < 0.08 ? "LATE" : "PRESENT") : "ABSENT" };
        }),
      });
    }
  }

  // exams: 7 past + 1 upcoming per batch, 4 subjects each
  const examSubjects = [sub("Bangla"), sub("English"), sub("Math"), sub("General Knowledge")];
  const titles = ["Weekly Test 1", "Weekly Test 2", "Weekly Test 3", "Weekly Test 4", "Weekly Test 5", "Model Test 1", "Model Test 2"];
  for (const b of batches) {
    for (let e = 0; e < titles.length; e++) {
      const exam = await prisma.exam.create({
        data: {
          batchId: b.id, title: titles[e], date: ymd(daysAgo(52 - e * 7)), type: titles[e].startsWith("Model") ? "MODEL_TEST" : "WEEKLY",
          subjects: { create: examSubjects.map((x, i) => ({ subjectId: x.id, fullMarks: titles[e].startsWith("Model") ? 50 : 25 + (i % 2) * 25 })) },
        },
        include: { subjects: true },
      });
      // last model test: a few marks still pending for the Math teacher (demo "marks baki")
      const pendingMath = e === titles.length - 1;
      const rows: { studentId: string; examSubjectId: string; obtained: number }[] = [];
      for (const [si, st] of studentsByBatch[b.id].entries()) {
        for (const [i, es] of exam.subjects.entries()) {
          if (pendingMath && es.subjectId === sub("Math").id && si >= 7) continue;
          const trend = (st.skill > 0.55 ? 0.015 : -0.02) * e;
          let p = st.skill + trend + (rand() - 0.5) * 0.1 - (i === st.weak ? 0.18 : 0);
          p = Math.max(0.05, Math.min(0.98, p));
          rows.push({ studentId: st.id, examSubjectId: es.id, obtained: Math.round(p * es.fullMarks * 2) / 2 });
        }
      }
      await prisma.mark.createMany({ data: rows });
    }
    await prisma.exam.create({
      data: { batchId: b.id, title: "Model Test 3", date: ymd(daysAgo(-3)), type: "MODEL_TEST",
        subjects: { create: examSubjects.map((x) => ({ subjectId: x.id, fullMarks: 50 })) } },
    });
  }

  await prisma.notice.createMany({
    data: [
      { title: "Shukrobar bishesh model test", body: "Sokal 10 tay sobai ke upasthit thakte hobe. Admit card sathe anben.", icon: "📢", authorId: admin.id, createdAt: daysAgo(0) },
      { title: "Notun Math sheet upload hoyeche", body: "Shotokora ar labh-khoti er 200 ta proshno. Coaching office theke print copy niben.", icon: "📚", authorId: kamal.id, batchId: batches[0].id, createdAt: daysAgo(1) },
      { title: "Model Test 2 er merit list prokashito", body: "Result dashboard e dekhte paben. Top 3 ke puroskar deya hobe.", icon: "🏆", authorId: admin.id, createdAt: daysAgo(5) },
    ],
  });

  const first = studentsByBatch[batches[0].id];
  await prisma.comment.createMany({
    data: [
      { studentId: first[0].id, authorId: kamal.id, text: "Class e monojogi, proshno kore. Shotokora odhyay e aro onushilon dorkar — protidin 20 ta onko korle bhalo hoy.", createdAt: daysAgo(2) },
      { studentId: first[0].id, authorId: rina.id, text: "English e khub bhalo unnoti. Vocabulary shokto.", createdAt: daysAgo(6) },
      { studentId: first[7].id, authorId: kamal.id, text: "Shesh kodin class e ashche na. Guardian er sathe kotha bola dorkar.", createdAt: daysAgo(1) },
    ],
  });

  console.log("Seed done. Demo password / guardian PIN for every user: 123456");
}

main().finally(() => prisma.$disconnect());
