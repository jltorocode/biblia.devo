// Marca un usuario como admin (rol = 'admin').
//
// Uso:
//   tsx prisma/seed/promover-admin.ts <email>
//   tsx prisma/seed/promover-admin.ts tu-email@ejemplo.com

import { prisma } from "@/lib/db/prisma";

async function main(): Promise<void> {
  const email = process.argv[2];
  if (!email) {
    console.error("Uso: tsx prisma/seed/promover-admin.ts <email>");
    process.exit(1);
  }

  const u = await prisma.usuario.findUnique({ where: { email } });
  if (!u) {
    console.error(`No existe usuario con email ${email}. Registralo primero en /signup.`);
    process.exit(1);
  }

  if (u.rol === "admin") {
    console.log(`${email} ya es admin.`);
    return;
  }

  await prisma.usuario.update({ where: { id: u.id }, data: { rol: "admin" } });
  console.log(`✓ ${email} promovido a admin.`);
  console.log(`  Logueate y andá a /admin para gestionar biblias/usuarios.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
