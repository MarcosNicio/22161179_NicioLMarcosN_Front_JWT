const bcrypt = require("bcrypt");
const db = require("./postgres.database");

(async () => {
  const hash = await bcrypt.hash("Admin12345", 12);
  const { rows } = await db.query(
    `INSERT INTO users (username, email, password_hash, role_id)
     VALUES ($1, $2, $3, (SELECT id FROM roles WHERE name = 'admin'))
     ON CONFLICT (username) DO UPDATE
       SET password_hash = EXCLUDED.password_hash,
           is_active = TRUE, failed_attempts = 0, locked_until = NULL
     RETURNING id, username`,
    ["admin", "admin@example.com", hash]
  );
  console.log("Admin listo:", rows[0]);
  await db.cerrarConexion();
})().catch((e) => { console.error(e.message); process.exit(1); });